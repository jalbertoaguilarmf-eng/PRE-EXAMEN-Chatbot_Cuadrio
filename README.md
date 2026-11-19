# Práctica 7: Chatbot de IA para Cuadrio (Clientes y Contribuyentes)

Asistente que responde preguntas sobre la cartera de clientes de un despacho contable.
Los datos salen de MySQL; el modelo de IA (OpenRouter) interpreta la pregunta, llama a herramientas y redacta la respuesta.

```
Navegador (ai-frontend) → ai-backend (Node.js) → OpenRouter (IA) ⇄ MySQL "cuadrio"
```

## Requisitos
- Node.js 18+
- XAMPP (MySQL/MariaDB y phpMyAdmin)
- API key de OpenRouter

## Base de datos
1. En phpMyAdmin, importar `database/cuadrio-schema.sql` y después `database/cuadrio-seed-38.sql`.
2. Crear el usuario de solo lectura:
   ```sql
   CREATE USER 'agente_cuadrio'@'localhost' IDENTIFIED BY 'tu_password';
   GRANT SELECT ON cuadrio.* TO 'agente_cuadrio'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Backend
```
cd ai-backend
npm install
# copiar .env.example a .env y completar la API key y la contraseña
node server.js
```
Debe mostrar `✅ Conectado a MySQL (base: cuadrio)`.

## Frontend
Abrir `ai-frontend/index.html` en el navegador.

## Herramientas del agente
`resumen_cartera`, `buscar_cliente`, `clientes_en_mora`, `vencimientos_proximos`, `clientes_por_contador`,
`query_database` (SELECT de solo lectura), `write_file` y `read_file` (limitadas a `workspace/`).

## Notas
- Todos los datos son ficticios.
- El chatbot usa la `fecha_operacion` de la tabla `parametro` (2026-10-26) como "hoy".
