<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('PUT');
$input = get_json_input();
require_fields($input, ['id', 'status']);

if (!table_exists('pedidos_online')) {
    json_response(500, ['success' => false, 'error' => 'Tabela pedidos_online nao existe. Execute a migracao v2.']);
}

$usuarioId = resolve_user_id($input);
$id = (int) $input['id'];
$status = trim((string) $input['status']);

$stmt = db()->prepare(
    'UPDATE pedidos_online SET status = :status, atualizado_em = NOW() WHERE id = :id AND usuario_id = :usuario_id'
);
$stmt->execute([
    ':id' => $id,
    ':usuario_id' => $usuarioId,
    ':status' => $status,
]);

json_response(200, ['success' => true, 'updated' => $stmt->rowCount()]);

