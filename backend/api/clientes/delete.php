<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('DELETE');
$input = get_json_input();
require_fields($input, ['id']);

$usuarioId = resolve_user_id($input);
$id = (int) $input['id'];
sync_log('clientes/delete', $input, 'request');

try {
    $stmt = db()->prepare('DELETE FROM clientes WHERE id = :id AND usuario_id = :usuario_id');
    $stmt->execute([
        ':id' => $id,
        ':usuario_id' => $usuarioId,
    ]);
} catch (Throwable $e) {
    sync_log('clientes/delete', ['usuario_id' => $usuarioId, 'id' => $id, 'error' => $e->getMessage()], 'error');
    json_response(500, ['success' => false, 'error' => 'Falha ao excluir cliente', 'details' => $e->getMessage()]);
}

$deleted = $stmt->rowCount();
sync_log('clientes/delete', ['usuario_id' => $usuarioId, 'id' => $id, 'deleted' => $deleted], 'success');
json_response(200, ['success' => true, 'deleted' => $deleted]);
