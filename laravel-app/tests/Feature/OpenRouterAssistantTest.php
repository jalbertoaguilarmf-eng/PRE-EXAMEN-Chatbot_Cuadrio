<?php

namespace Tests\Feature;

use App\Services\OpenRouterAssistant;
use App\Services\ReadOnlyDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

class OpenRouterAssistantTest extends TestCase
{
    public function test_it_reports_when_openrouter_rate_limit_is_reached(): void
    {
        Config::set('services.openrouter.key', 'test-key');
        Config::set('services.openrouter.model', 'test/model');

        $database = Mockery::mock(ReadOnlyDatabase::class);
        $database->shouldReceive('operationDate')
            ->once()
            ->andReturn('2026-10-26');
        $this->app->instance(ReadOnlyDatabase::class, $database);

        Http::fake([
            'https://openrouter.ai/api/v1/chat/completions' => Http::response([
                'error' => ['message' => 'Rate limit exceeded'],
            ], 429),
        ]);

        $this->postJson('/api/chat', [
            'message' => 'Prueba de conexión',
            'context' => 'Contexto sintético, sin registros reales.',
        ])
            ->assertStatus(429)
            ->assertJsonPath('error', 'OpenRouter alcanzó el límite de uso del modelo. Revisa tu cuota/créditos o inténtalo cuando se restablezca.');
    }

    public function test_it_executes_a_read_only_tool_and_returns_the_assistant_answer(): void
    {
        Config::set('services.openrouter.key', 'test-key');
        Config::set('services.openrouter.model', 'test/model');

        $database = Mockery::mock(ReadOnlyDatabase::class);
        $database->shouldReceive('operationDate')
            ->once()
            ->andReturn('2026-10-26');
        $database->shouldReceive('select')
            ->once()
            ->with('SELECT * FROM v_indicadores LIMIT 1', [])
            ->andReturn([(object) ['total_clientes_activos' => 114]]);
        $this->app->instance(ReadOnlyDatabase::class, $database);

        Http::fake([
            'https://openrouter.ai/api/v1/chat/completions' => Http::sequence()
                ->push([
                    'choices' => [[
                        'message' => [
                            'role' => 'assistant',
                            'content' => null,
                            'tool_calls' => [[
                                'id' => 'call_summary',
                                'type' => 'function',
                                'function' => [
                                    'name' => 'resumen_cartera',
                                    'arguments' => '{}',
                                ],
                            ]],
                        ],
                    ]],
                ])
                ->push([
                    'choices' => [[
                        'message' => ['role' => 'assistant', 'content' => 'Hay 114 clientes activos.'],
                    ]],
                ]),
        ]);

        $answer = app(OpenRouterAssistant::class)->reply('Resume la cartera', [], '{}');

        $this->assertSame('Hay 114 clientes activos.', $answer);
        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request) => $request->url() === 'https://openrouter.ai/api/v1/chat/completions');
    }
}
