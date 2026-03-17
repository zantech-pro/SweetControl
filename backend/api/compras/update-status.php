<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('PUT');
$input = get_json_input();
require_fields($input, ['id', 'status']);

$usuarioId = resolve_user_id($input);
$compraId = (int) $input['id'];
$status = trim((string) $input['status']);

$pdo = db();
$stmt = $pdo->prepare(
    'UPDATE compras_fornecedor SET status = :status WHERE id = :id AND usuario_id = :usuario_id'
);
$stmt->execute([
    ':status' => $status,
    ':id' => $compraId,
    ':usuario_id' => $usuarioId,
]);

json_response(200, ['success' => true]);
