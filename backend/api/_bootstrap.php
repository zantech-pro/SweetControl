<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_response(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response(405, ['success' => false, 'error' => 'Metodo nao permitido']);
    }
}

function get_json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_response(400, ['success' => false, 'error' => 'JSON invalido']);
    }

    return $decoded;
}

function require_fields(array $input, array $fields): void
{
    foreach ($fields as $field) {
        if (!array_key_exists($field, $input)) {
            json_response(422, ['success' => false, 'error' => "Campo obrigatorio ausente: {$field}"]);
        }
    }
}

function to_nullable_string($value): ?string
{
    if ($value === null) {
        return null;
    }
    $trimmed = trim((string) $value);
    return $trimmed === '' ? null : $trimmed;
}

function to_nullable_int($value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }
    return (int) $value;
}

function to_nullable_float($value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }
    return (float) $value;
}

function app_config(): array
{
    $candidates = [
        dirname(__DIR__) . '/config.php',
        dirname(dirname(__DIR__)) . '/config.php',
        dirname(__DIR__, 2) . '/config.php',
    ];

    $path = null;
    foreach ($candidates as $candidate) {
        if (file_exists($candidate)) {
            $path = $candidate;
            break;
        }
    }

    if ($path === null) {
        json_response(500, [
            'success' => false,
            'error' => 'Arquivo config.php nao encontrado (backend/config.php ou raiz).',
        ]);
    }

    $config = require $path;
    if (!is_array($config)) {
        json_response(500, ['success' => false, 'error' => 'Configuracao invalida em config.php']);
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = app_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $config['db_host'] ?? 'localhost',
        $config['db_name'] ?? '',
        $config['db_charset'] ?? 'utf8mb4'
    );

    try {
        $pdo = new PDO($dsn, $config['db_user'] ?? '', $config['db_pass'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (Throwable $e) {
        json_response(500, ['success' => false, 'error' => 'Falha de conexao com banco', 'details' => $e->getMessage()]);
    }

    return $pdo;
}

function resolve_user_id(array $input): int
{
    if (!empty($input['usuario_id'])) {
        return (int) $input['usuario_id'];
    }
    $config = app_config();
    return (int) ($config['default_user_id'] ?? 1);
}

function table_exists(string $tableName): bool
{
    $stmt = db()->prepare('SHOW TABLES LIKE :table_name');
    $stmt->execute([':table_name' => $tableName]);
    return (bool) $stmt->fetchColumn();
}

function column_exists(string $tableName, string $columnName): bool
{
    $stmt = db()->prepare("SHOW COLUMNS FROM `{$tableName}` LIKE :column_name");
    $stmt->execute([':column_name' => $columnName]);
    return (bool) $stmt->fetchColumn();
}
