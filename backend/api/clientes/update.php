<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('PUT');
$input = get_json_input();
require_fields($input, ['id', 'nome']);

$usuarioId = resolve_user_id($input);
$id = (int) $input['id'];
$nome = trim((string) $input['nome']);
$telefone = to_nullable_string($input['telefone'] ?? null);
$email = to_nullable_string($input['email'] ?? null);

$stmt = db()->prepare(
    'UPDATE clientes
     SET nome = :nome, telefone = :telefone, email = :email, atualizado_em = NOW()
     WHERE id = :id AND usuario_id = :usuario_id'
);
$stmt->execute([
    ':id' => $id,
    ':usuario_id' => $usuarioId,
    ':nome' => $nome,
    ':telefone' => $telefone,
    ':email' => $email,
]);

json_response(200, ['success' => true, 'updated' => $stmt->rowCount()]);

