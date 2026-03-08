<?php
declare(strict_types=1);
require_once dirname(dirname(__DIR__)) . '/_bootstrap.php';

require_method('DELETE');
$input = get_json_input();
require_fields($input, ['id']);

if (!table_exists('marketing_templates')) {
    json_response(500, ['success' => false, 'error' => 'Tabela marketing_templates nao existe. Execute a migracao v2.']);
}

$usuarioId = resolve_user_id($input);
$id = (int) $input['id'];

$stmt = db()->prepare('DELETE FROM marketing_templates WHERE id = :id AND usuario_id = :usuario_id');
$stmt->execute([
    ':id' => $id,
    ':usuario_id' => $usuarioId,
]);

json_response(200, ['success' => true, 'deleted' => $stmt->rowCount()]);

