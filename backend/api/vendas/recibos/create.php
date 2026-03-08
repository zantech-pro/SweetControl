<?php
declare(strict_types=1);
require_once dirname(dirname(__DIR__)) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['conteudo']);

if (!table_exists('recibos_digitais')) {
    json_response(500, ['success' => false, 'error' => 'Tabela recibos_digitais nao existe. Execute a migracao v2.']);
}

$usuarioId = resolve_user_id($input);
$conteudo = trim((string) $input['conteudo']);

$stmt = db()->prepare(
    'INSERT INTO recibos_digitais (usuario_id, conteudo, gerado_em, criado_em)
     VALUES (:usuario_id, :conteudo, NOW(), NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':conteudo' => $conteudo,
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

