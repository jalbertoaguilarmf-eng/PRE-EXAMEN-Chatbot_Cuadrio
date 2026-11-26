<?php

namespace Tests\Unit;

use App\Services\ReadOnlySql;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ReadOnlySqlTest extends TestCase
{
    public function test_it_allows_selects_and_joins_on_business_views(): void
    {
        $sql = ReadOnlySql::sanitize(
            'SELECT c.razon_social, v.fecha_limite FROM v_clientes_resumen c JOIN v_vencimientos_detalle v ON v.id_cliente = c.id_cliente',
            'cuadrio_db'
        );

        $this->assertStringEndsWith('LIMIT 50', $sql);
    }

    public function test_it_allows_ctes_that_use_approved_sources(): void
    {
        $sql = ReadOnlySql::sanitize(
            'WITH activos AS (SELECT id_cliente FROM v_clientes_resumen WHERE activo = 1) SELECT id_cliente FROM activos',
            'cuadrio_db'
        );

        $this->assertStringEndsWith('FROM activos LIMIT 50', $sql);
    }

    public function test_it_caps_the_result_size(): void
    {
        $this->assertSame(
            'SELECT id_cliente FROM v_clientes_resumen LIMIT 50',
            ReadOnlySql::sanitize('SELECT id_cliente FROM v_clientes_resumen LIMIT 500', 'cuadrio_db')
        );
    }

    #[DataProvider('unsafeQueries')]
    public function test_it_rejects_unsafe_queries(string $query): void
    {
        $this->expectException(InvalidArgumentException::class);
        ReadOnlySql::sanitize($query, 'cuadrio_db');
    }

    public static function unsafeQueries(): array
    {
        return [
            ['DELETE FROM clientes'],
            ['SELECT * FROM clientes; DROP TABLE clientes'],
            ['SELECT * FROM clientes -- comment'],
            ['SELECT * FROM clientes FOR UPDATE'],
            ['SELECT * FROM clientes'],
            ['SELECT * FROM usuarios'],
            ['SELECT * FROM mysql.user'],
        ];
    }
}
