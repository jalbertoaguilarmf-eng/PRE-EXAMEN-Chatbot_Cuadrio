<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Throwable;

class ReadOnlyDatabase
{
    public function select(string $sql, array $bindings = [], int $maxRows = 50): array
    {
        $connection = DB::connection();
        $safeSql = ReadOnlySql::sanitize($sql, $connection->getDatabaseName(), $maxRows);

        return $this->executeReadOnly($safeSql, $bindings, $maxRows);
    }

    public function operationDate(): ?string
    {
        $rows = $this->executeReadOnly(
            'SELECT valor AS fecha_operacion
             FROM parametros_sistema
             WHERE clave = ?
             LIMIT 1',
            ['fecha_operacion'],
            1
        );

        return $rows[0]->fecha_operacion ?? null;
    }

    private function executeReadOnly(string $sql, array $bindings, int $maxRows): array
    {
        $connection = DB::connection();
        $pdo = $connection->getPdo();
        $transactionStarted = false;

        try {
            $pdo->exec('START TRANSACTION READ ONLY');
            $transactionStarted = true;
            $rows = $connection->select($sql, $bindings);
            $pdo->commit();
            $transactionStarted = false;

            return array_slice($rows, 0, $maxRows);
        } catch (Throwable $error) {
            if ($transactionStarted && $pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $error;
        }
    }
}
