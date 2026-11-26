# Instrucciones para probar Cuadrio

## Requisitos

- PHP 8.2 o superior con `pdo_mysql`
- Composer
- Node.js y npm
- MySQL/MariaDB con la base `cuadrio_db` que exponga `v_clientes_resumen`, `v_indicadores`, `v_vencimientos_detalle` y la tabla `parametros_sistema`
- Una API key propia de OpenRouter

La base de datos no se incluye en este repositorio. No ejecutes migraciones: la aplicación consulta una base existente.

## Preparar el entorno

Desde la carpeta del repositorio, ejecuta en PowerShell:

```powershell
Set-Location .\laravel-app
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Edita `laravel-app/.env` con los datos de conexión MySQL disponibles en tu equipo y tu propia clave:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=cuadrio_db
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
OPENROUTER_API_KEY=tu_clave
OPENROUTER_MODEL=openrouter/free
```

`openrouter/free` permite que OpenRouter seleccione un modelo gratuito disponible compatible con herramientas. La disponibilidad y las cuotas gratuitas dependen de OpenRouter. No subas el archivo `.env`; el repositorio incluye `.env.example` sin credenciales.

## Compilar e iniciar

Desde `laravel-app`:

```powershell
npm install
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

Abre <http://127.0.0.1:8000>.

## Probar la aplicación

- Usa el buscador y los filtros del directorio.
- Cambia entre tabla y tarjetas, abre una ficha y prueba la paginación.
- Abre el asistente y pregunta por clientes, saldos, documentos o vencimientos.

Para verificar la instalación:

```powershell
php artisan test
npm run build
```

Si el directorio no carga, revisa la conexión MySQL y que existan las vistas requeridas. Si OpenRouter responde con un límite `429`, revisa la cuota de modelos gratuitos de tu cuenta.
