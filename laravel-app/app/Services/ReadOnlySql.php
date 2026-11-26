<?php

namespace App\Services;

use InvalidArgumentException;

class ReadOnlySql
{
    private const ALLOWED_OBJECTS = [
        'v_clientes_resumen',
        'v_clientes_por_giro',
        'v_clientes_por_regimen',
        'v_carga_por_contador',
        'v_cobranza_detalle',
        'v_documentos_pendientes',
        'v_indicadores',
        'v_vencimientos_detalle',
    ];

    public static function sanitize(string $input, string $database, int $maxRows = 50): string
    {
        $sql = trim($input);
        $lexicalSql = preg_replace('/\'(?:\'\'|\\\\.|[^\'])*\'|"(?:\"\"|\\\\.|[^"])*"/s', ' ', $sql);

        if ($sql === '' || strlen($sql) > 4000 || ! preg_match('/^(select|with)\b/i', $sql)) {
            throw new InvalidArgumentException('Solo se permiten consultas SELECT de hasta 4000 caracteres.');
        }

        if (preg_match('/[;#]|--|\/\*|\*\//', $lexicalSql)) {
            throw new InvalidArgumentException('No se permiten consultas múltiples ni comentarios SQL.');
        }

        if (
            preg_match('/\b(insert|update|delete|replace|drop|alter|truncate|create|grant|revoke|set|call|do|handler|load|into|outfile|dumpfile|lock|unlock|procedure|sleep|benchmark|get_lock|release_lock|information_schema|performance_schema|mysql|sys)\b/i', $lexicalSql)
            || preg_match('/\bfor\s+(update|share)\b/i', $lexicalSql)
        ) {
            throw new InvalidArgumentException('La consulta contiene una operación o cláusula no permitida.');
        }

        preg_match_all('/(?:\bwith\b|,)\s*(?:recursive\s+)?`?([a-zA-Z_][a-zA-Z0-9_$]*)`?\s*(?:\([^)]*\))?\s+as\s*\(/i', $lexicalSql, $cteMatches);
        $cteNames = array_map('strtolower', $cteMatches[1] ?? []);
        preg_match_all('/\b(?:from|join)\s+((?:`[^`]+`|[a-zA-Z0-9_$]+)(?:\s*\.\s*(?:`[^`]+`|[a-zA-Z0-9_$]+))?)/i', $lexicalSql, $sourceMatches);

        foreach ($sourceMatches[1] ?? [] as $source) {
            $parts = array_map('trim', explode('.', str_replace('`', '', $source)));
            $name = strtolower(end($parts));
            $schema = count($parts) === 2 ? strtolower($parts[0]) : null;

            if (
                ($schema !== null && $schema !== strtolower($database))
                || (! in_array($name, self::ALLOWED_OBJECTS, true) && ! in_array($name, $cteNames, true) && $name !== 'dual')
            ) {
                throw new InvalidArgumentException('La consulta solo puede leer objetos autorizados de la base del sistema.');
            }
        }

        return self::capRows($sql, max(1, min($maxRows, 250)));
    }

    private static function capRows(string $sql, int $maxRows): string
    {
        if (! preg_match('/\blimit\s+(\d+)(?:\s*,\s*(\d+)|\s+offset\s+(\d+))?\s*$/i', $sql, $matches)) {
            return $sql.' LIMIT '.$maxRows;
        }

        $limit = (int) (($matches[2] ?? '') !== '' ? $matches[2] : $matches[1]);
        if ($limit <= $maxRows) {
            return $sql;
        }

        if (($matches[2] ?? '') !== '') {
            return preg_replace('/\blimit\s+\d+\s*,\s*\d+\s*$/i', 'LIMIT '.$matches[1].', '.$maxRows, $sql);
        }

        if (($matches[3] ?? '') !== '') {
            return preg_replace('/\blimit\s+\d+\s+offset\s+\d+\s*$/i', 'LIMIT '.$maxRows.' OFFSET '.$matches[3], $sql);
        }

        return preg_replace('/\blimit\s+\d+\s*$/i', 'LIMIT '.$maxRows, $sql);
    }
}
