<?php
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

echo "SweetControl - Teste de conexao MySQL\n";
echo "Data/Hora: " . date('Y-m-d H:i:s') . "\n\n";

$candidates = [
    __DIR__ . '/config.php',
    __DIR__ . '/backend/config.php',
    __DIR__ . '/../backend/config.php',
];

$configPath = null;
foreach ($candidates as $candidate) {
    if (file_exists($candidate)) {
        $configPath = $candidate;
        break;
    }
}

if ($configPath === null) {
    echo "ERRO: Arquivo config.php nao encontrado.\n";
    echo "Verifique se existe em um destes caminhos:\n";
    echo "- " . __DIR__ . "/config.php\n";
    echo "- " . __DIR__ . "/backend/config.php\n";
    exit(1);
}

$config = require $configPath;
if (!is_array($config)) {
    echo "ERRO: backend/config.php invalido (nao retornou array).\n";
    exit(1);
}

$host = (string)($config['db_host'] ?? 'localhost');
$db   = (string)($config['db_name'] ?? '');
$user = (string)($config['db_user'] ?? '');
$pass = (string)($config['db_pass'] ?? '');
$charset = (string)($config['db_charset'] ?? 'utf8mb4');

echo "Config carregada de: {$configPath}\n";
echo "Host: {$host}\n";
echo "Banco: {$db}\n";
echo "Usuario: {$user}\n\n";

if ($db === '' || $user === '') {
    echo "ERRO: db_name ou db_user vazio no config.php\n";
    exit(1);
}

$dsn = "mysql:host={$host};dbname={$db};charset={$charset}";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $ok = $pdo->query('SELECT 1 AS ok')->fetch();
    echo "OK: Conexao com MySQL estabelecida.\n";
    echo "SELECT 1: " . ($ok['ok'] ?? 'n/a') . "\n";

    $tables = $pdo->query('SHOW TABLES')->fetchAll();
    echo "Total de tabelas no banco: " . count($tables) . "\n";

    if (count($tables) > 0) {
        echo "Primeiras tabelas:\n";
        $limit = min(10, count($tables));
        for ($i = 0; $i < $limit; $i++) {
            $row = array_values($tables[$i]);
            echo "- " . ($row[0] ?? 'n/a') . "\n";
        }
    }
} catch (Throwable $e) {
    echo "ERRO DE CONEXAO:\n";
    echo $e->getMessage() . "\n";
    exit(1);
}
