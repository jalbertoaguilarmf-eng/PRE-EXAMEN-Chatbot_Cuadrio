<?php

namespace App\Http\Controllers;

use App\Services\OpenRouterAssistant;
use App\Services\ReadOnlyDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;
use Throwable;

class ClientDirectoryController extends Controller
{
    public function __construct(
        private readonly ReadOnlyDatabase $database,
        private readonly OpenRouterAssistant $assistant
    ) {}

    public function index(): View
    {
        return view('dashboard');
    }

    public function health(): JsonResponse
    {
        try {
            $this->database->select('SELECT 1 AS ok');

            return response()->json(['ok' => true, 'database' => 'connected']);
        } catch (Throwable $error) {
            Log::warning('Health check de base de datos falló.', ['exception' => class_basename($error)]);

            return response()->json(['ok' => false, 'error' => 'No se pudo conectar con la base de datos.'], 503);
        }
    }

    public function dashboard(): JsonResponse
    {
        try {
            $clients = $this->database->select(
                'SELECT id_cliente, razon_social, nombre_comercial, rfc, tipo_persona, giro,
                        clave_regimen, regimen, regimen_nombre, contador_asignado, puesto_contador,
                        estatus, activo, municipio, empleados, honorario_mensual, fecha_alta,
                        proxima_obligacion, periodo_proxima_obligacion, fecha_proxima_obligacion,
                        dias_para_vencer, vencimiento_urgente, estado_documental, docs_cargados,
                        docs_validados, docs_total, pendientes_subir, detalle_documental,
                        saldo_por_cobrar, saldo_vencido, max_dias_atraso
                 FROM v_clientes_resumen
                 WHERE activo = 1
                 ORDER BY razon_social',
                [],
                250
            );
            $indicators = $this->database->select('SELECT * FROM v_indicadores LIMIT 1')[0] ?? (object) [];
            $businessDate = $this->database->operationDate();
            $businessDate ??= $this->database->select('SELECT CURDATE() AS fecha_operacion')[0]->fecha_operacion ?? null;

            return response()->json([
                'clients' => $clients,
                'indicators' => $indicators,
                'businessDate' => $businessDate,
            ]);
        } catch (Throwable $error) {
            Log::error('No se pudo cargar el directorio.', ['exception' => class_basename($error)]);

            return response()->json([
                'error' => 'No se pudo cargar el directorio. Verifica la conexión a la base de datos.',
            ], 503);
        }
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'history' => ['sometimes', 'array', 'max:12'],
            'history.*.role' => ['required', 'in:user,assistant'],
            'history.*.content' => ['required', 'string', 'max:3000'],
            'context' => ['nullable', 'string', 'max:8000'],
        ]);

        try {
            $reply = $this->assistant->reply(
                trim($validated['message']),
                $validated['history'] ?? [],
                $validated['context'] ?? 'Sin contexto de pantalla.'
            );

            return response()->json(['reply' => $reply]);
        } catch (Throwable $error) {
            Log::error('No se pudo procesar la pregunta del asistente.', [
                'exception' => class_basename($error),
            ]);

            $status = match (true) {
                str_contains($error->getMessage(), 'no está configurado') => 503,
                $error->getCode() === 429 => 429,
                default => 502,
            };

            return response()->json([
                'error' => match ($status) {
                    503 => 'El asistente no está configurado. Revisa OPENROUTER_API_KEY.',
                    429 => 'OpenRouter alcanzó el límite de uso del modelo. Revisa tu cuota/créditos o inténtalo cuando se restablezca.',
                    default => 'No se pudo procesar la pregunta. Inténtalo de nuevo en un momento.',
                },
            ], $status);
        }
    }
}
