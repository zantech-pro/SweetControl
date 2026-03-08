<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['nome']);

$usuarioId = resolve_user_id($input);
$nome = trim((string) $input['nome']);
$telefone = to_nullable_string($input['telefone'] ?? null);
$email = to_nullable_string($input['email'] ?? null);

$stmt = db()->prepare(
    'INSERT INTO clientes (usuario_id, nome, telefone, email, criado_em, atualizado_em)
     VALUES (:usuario_id, :nome, :telefone, :email, NOW(), NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':nome' => $nome,
    ':telefone' => $telefone,
    ':email' => $email,
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

