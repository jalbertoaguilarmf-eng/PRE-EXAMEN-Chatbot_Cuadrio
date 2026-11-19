const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const { OpenAI } = require('openai');

if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
  console.error('❌ OPENROUTER_API_KEY está vacía o no parece válida. Revisa tu archivo .env');
}

const app = express();
app.use(express.json());
app.use(cors());

// ---------- 1. Clientes: OpenRouter y MySQL ----------
const MODEL = process.env.MODEL || 'openai/gpt-4o-mini';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://tu-sitio-web.com',
    'X-Title': 'Asistente Cuadrio',
  },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cuadrio',
  waitForConnections: true,
  connectionLimit: 5,
  dateStrings: true, // las fechas llegan como 'YYYY-MM-DD', sin desfase de zona horaria
});

// ---------- 2. Herramientas (funciones físicas) ----------
const MAX_ROWS = 50;

// Ejecuta una consulta con parámetros (?) y devuelve JSON o el error para que la IA lo corrija
async function runQuery(sql, params = []) {
  try {
    const [rows] = await pool.query({ sql, timeout: 10000 }, params);
    if (Array.isArray(rows) && rows.length === 0) return 'Sin resultados.';
    return JSON.stringify(rows.slice(0, MAX_ROWS));
  } catch (e) {
    return `Error SQL: ${e.message}`;
  }
}

// 2.1 Resumen general de la cartera (los contadores de las pestañas de la pantalla)
async function resumen_cartera() {
  return runQuery(`
    SELECT
      COUNT(*)                                              AS total_clientes,
      CAST(SUM(situacion = 'Al corriente') AS UNSIGNED)     AS al_corriente,
      CAST(SUM(situacion = 'Por vencer') AS UNSIGNED)       AS por_vencer,
      CAST(SUM(situacion = 'En mora') AS UNSIGNED)          AS en_mora,
      CAST(SUM(dias_para_vencer BETWEEN 0 AND 5) AS UNSIGNED) AS con_vencimientos_urgentes,
      CAST(SUM(saldo_vencido > 0) AS UNSIGNED)              AS con_saldo_pendiente_vencido,
      SUM(saldo_pendiente)                                  AS total_por_cobrar_mxn,
      SUM(saldo_vencido)                                    AS total_vencido_mxn
    FROM v_directorio_clientes`);
}

// 2.2 Buscar un cliente por razón social o RFC
async function buscar_cliente({ texto }) {
  const like = `%${String(texto || '').trim()}%`;
  return runQuery(
    `SELECT * FROM v_directorio_clientes
     WHERE razon_social LIKE ? OR rfc LIKE ?
     ORDER BY razon_social LIMIT 10`,
    [like, like]
  );
}

// 2.3 Clientes en mora o con saldo vencido
async function clientes_en_mora() {
  return runQuery(`
    SELECT razon_social, rfc, contador, situacion, saldo_vencido, dias_mora,
           saldo_pendiente, estado_documental, proxima_obligacion, fecha_proxima_obligacion
    FROM v_directorio_clientes
    WHERE situacion = 'En mora' OR saldo_vencido > 0
    ORDER BY dias_mora DESC`);
}

// 2.4 Obligaciones que vencen en los próximos N días (a partir de la fecha de operación)
async function vencimientos_proximos({ dias } = {}) {
  const n = Math.min(Math.max(parseInt(dias, 10) || 7, 1), 90);
  return runQuery(
    `SELECT c.razon_social, o.nombre AS obligacion, o.fecha_vencimiento,
            ct.nombre AS contador, ed.estado AS estado_documental
     FROM obligacion o
     JOIN cliente c  ON c.cliente_id = o.cliente_id
     JOIN contador ct ON ct.contador_id = c.contador_id
     LEFT JOIN estado_documental ed ON ed.cliente_id = c.cliente_id
     WHERE o.presentada = 0 AND c.activo = 1
       AND o.fecha_vencimiento BETWEEN (SELECT hoy FROM v_hoy)
                                   AND DATE_ADD((SELECT hoy FROM v_hoy), INTERVAL ? DAY)
     ORDER BY o.fecha_vencimiento, c.razon_social`,
    [n]
  );
}

// 2.5 Clientes asignados a un contador
async function clientes_por_contador({ nombre }) {
  const like = `%${String(nombre || '').trim()}%`;
  return runQuery(
    `SELECT razon_social, rfc, situacion, proxima_obligacion, fecha_proxima_obligacion,
            estado_documental, saldo_pendiente, contador, puesto_contador
     FROM v_directorio_clientes
     WHERE contador LIKE ?
     ORDER BY razon_social`,
    [like]
  );
}

// 2.6 Respaldo: SQL libre de SOLO LECTURA para preguntas que las otras herramientas no cubren
async function query_database({ sql }) {
  const clean = String(sql || '').trim().replace(/;+\s*$/, '');

  if (!/^(select|with)\s/i.test(clean) || clean.includes(';')) {
    return 'Error: solo se permite UNA consulta SELECT.';
  }
  if (/\b(insert|update|delete|drop|alter|truncate|create|grant|outfile|dumpfile)\b/i.test(clean)) {
    return 'Error: la consulta contiene palabras no permitidas.';
  }
  return runQuery(clean);
}

// 2.7 Archivos (herramientas del profesor), limitados a la carpeta workspace/
const WORKSPACE = path.join(__dirname, 'workspace');

function safePath(filePath) {
  const full = path.resolve(WORKSPACE, String(filePath || ''));
  if (!full.startsWith(WORKSPACE + path.sep)) {
    throw new Error('Ruta no permitida: solo se puede usar la carpeta workspace');
  }
  return full;
}

async function write_file({ file_path, content }) {
  try {
    const full = safePath(file_path);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, String(content ?? ''), 'utf-8');
    return `Éxito: Archivo '${file_path}' creado correctamente.`;
  } catch (e) {
    return `Error al escribir el archivo: ${e.message}`;
  }
}

async function read_file({ file_path }) {
  try {
    return await fs.readFile(safePath(file_path), 'utf-8');
  } catch (e) {
    return `Error al leer el archivo: ${e.message}`;
  }
}

const toolFunctions = {
  resumen_cartera,
  buscar_cliente,
  clientes_en_mora,
  vencimientos_proximos,
  clientes_por_contador,
  query_database,
  write_file,
  read_file,
};

// ---------- 3. Manual de instrucciones para la IA (Tool Schema) ----------
const tools = [
  {
    type: 'function',
    function: {
      name: 'resumen_cartera',
      description:
        'Devuelve los contadores generales de la cartera: total de clientes, al corriente, por vencer, en mora, con vencimientos urgentes, con saldo vencido y totales en MXN.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_cliente',
      description:
        'Busca clientes por razón social o RFC (coincidencia parcial) y devuelve su ficha: contador, próxima obligación, estado documental y saldos.',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string', description: 'Parte del nombre o RFC. Ej. "Espiga"' } },
        required: ['texto'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clientes_en_mora',
      description: 'Lista los clientes en mora o con saldo vencido, con monto y días de mora.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'vencimientos_proximos',
      description:
        'Lista las obligaciones fiscales pendientes que vencen en los próximos N días contados desde la fecha de operación.',
      parameters: {
        type: 'object',
        properties: { dias: { type: 'integer', description: 'Número de días hacia adelante (1 a 90). Por defecto 7.' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clientes_por_contador',
      description: 'Lista los clientes asignados a un contador (búsqueda parcial por nombre).',
      parameters: {
        type: 'object',
        properties: { nombre: { type: 'string', description: 'Nombre del contador. Ej. "Mariana" o "Carlos"' } },
        required: ['nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_database',
      description:
        'Respaldo: ejecuta UNA consulta SELECT (solo lectura) en la base cuadrio cuando ninguna otra herramienta cubre la pregunta. Preferir la vista v_directorio_clientes.',
      parameters: {
        type: 'object',
        properties: { sql: { type: 'string', description: 'Consulta SQL SELECT completa con LIMIT.' } },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Crea o sobrescribe un archivo con el código o texto especificado (por ejemplo, un reporte).',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Nombre y extensión del archivo (ej. reporte.txt)' },
          content: { type: 'string', description: 'El contenido a escribir dentro del archivo' },
        },
        required: ['file_path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lee el contenido de un archivo existente para verificarlo.',
      parameters: {
        type: 'object',
        properties: { file_path: { type: 'string', description: 'Nombre del archivo a leer' } },
        required: ['file_path'],
      },
    },
  },
];

// ---------- 4. Prompt de sistema (se arma en cada petición con la fecha de operación) ----------
async function buildSystemPrompt() {
  let fecha = '2026-10-26';
  try {
    const [r] = await pool.query("SELECT valor FROM parametro WHERE clave = 'fecha_operacion'");
    if (r[0]) fecha = r[0].valor;
  } catch (e) {
    console.error('No se pudo leer fecha_operacion:', e.message);
  }

  return `Eres el asistente de Cuadrio, el sistema de gestión del despacho contable "Solís y Asociados S.C." (Mérida, Yucatán).
Respondes SIEMPRE en español, de forma clara, breve y profesional, a contadores del despacho.
Solo puedes responder con datos obtenidos de tus herramientas; nunca inventes clientes, RFC, fechas ni montos.
Si una herramienta no devuelve resultados, dilo claramente. Si la pregunta no tiene relación con la cartera de clientes, indícalo con amabilidad.

FECHA DE OPERACIÓN (la "fecha de hoy" del sistema): ${fecha}. Úsala como "hoy". No uses la fecha real del calendario.

HERRAMIENTAS: usa primero las específicas (resumen_cartera, buscar_cliente, clientes_en_mora, vencimientos_proximos, clientes_por_contador). Usa query_database solo si ninguna cubre la pregunta.

BASE DE DATOS "cuadrio" (para query_database, prefiere la vista v_directorio_clientes):
v_directorio_clientes(cliente_id, razon_social, giro, tipo_persona [PM/PF], rfc, regimen, situacion, contador, puesto_contador, proxima_obligacion, fecha_proxima_obligacion, dias_para_vencer, docs_validados, docs_requeridos, estado_documental, saldo_pendiente, saldo_vencido, dias_mora)
Tablas: despacho, contador(contador_id, nombre, puesto), cliente, obligacion(cliente_id, nombre, fecha_vencimiento, presentada), estado_documental(cliente_id, docs_validados, docs_requeridos, estado), cobro(cliente_id, concepto, monto, fecha_vencimiento, pagado), parametro.

DEFINICIONES DE NEGOCIO (respétalas exactamente):
- situacion: 'Al corriente', 'Por vencer' (documentación incompleta, sin mora) o 'En mora' (tiene cobro vencido sin pagar).
- Vencimiento urgente: próxima obligación pendiente que vence en los siguientes 5 días desde la fecha de operación (dias_para_vencer entre 0 y 5).
- saldo_pendiente = total por cobrar (incluye cobros aún no vencidos). saldo_vencido = parte ya vencida. "Con saldo pendiente" en la pantalla significa saldo_vencido > 0.
- Documentos: docs_validados de docs_requeridos (ej. 5/6).
- Montos en pesos mexicanos; escríbelos como $18,500.00 MXN. Fechas en formato "martes 27 de octubre de 2026" o "27/10/2026".
- Puestos: Titular, Contador Sénior, Auxiliar Contable.

Siempre agrega LIMIT en consultas SQL libres. Si una consulta da error, corrígela y reintenta.
Al responder, incluye los datos clave (cliente, monto, fecha, contador) y, si aporta valor, una recomendación breve de acción (por ejemplo, a quién cobrar primero).`;
}

// ---------- 5. Bucle del agente ----------
async function runAgent(messages) {
  for (let i = 0; i < 8; i++) {
    const completion = await openrouter.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0,
    });

    const msg = completion.choices[0].message;

    // Si no pide herramientas, esta es la respuesta final
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content;
    }

    messages.push(msg); // la IA pidió herramientas

    for (const call of msg.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        args = {};
      }

      const fn = toolFunctions[call.function.name];
      console.log(`🔧 Herramienta: ${call.function.name}`, args);
      const result = fn ? await fn(args) : 'Error: herramienta desconocida.';

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: String(result),
      });
    }
  }
  return 'Se alcanzó el límite de pasos sin una respuesta final. Intenta reformular la pregunta.';
}

// ---------- 6. Endpoints ----------
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Solo roles user/assistant desde el cliente; últimos 20 mensajes
    const safeHistory = (Array.isArray(history) ? history : [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20);

    const messages = [
      { role: 'system', content: await buildSystemPrompt() },
      ...safeHistory,
      { role: 'user', content: String(message || '') },
    ];

    const reply = await runAgent(messages);
    res.json({ reply });
  } catch (error) {
    console.error('Error en el agente:', error);
    res.status(500).json({
      error: error.message || 'Error interno al procesar la solicitud con la IA',
    });
  }
});

// ---------- 7. Arranque ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conectado a MySQL (base: ' + (process.env.DB_NAME || 'cuadrio') + ')');
  } catch (e) {
    console.error('❌ No se pudo conectar a MySQL:', e.message);
  }
});
