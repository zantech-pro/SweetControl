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
sync_log('clientes/create', $input, 'request');

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}
if (($telefone === null || preg_replace('/\D+/', '', $telefone) === '') && $email === null) {
    json_response(422, ['success' => false, 'error' => 'Informe telefone ou email']);
}
if ($telefone !== null && preg_replace('/\D+/', '', $telefone) === '') {
    json_response(422, ['success' => false, 'error' => 'Telefone invalido']);
}
if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['success' => false, 'error' => 'Email invalido']);
}

try {
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
} catch (Throwable $e) {
    sync_log('clientes/create', ['usuario_id' => $usuarioId, 'error' => $e->getMessage()], 'error');
    json_response(500, ['success' => false, 'error' => 'Falha ao criar cliente', 'details' => $e->getMessage()]);
}

$id = (int) db()->lastInsertId();
sync_log('clientes/create', ['usuario_id' => $usuarioId, 'id' => $id], 'success');
json_response(201, ['success' => true, 'id' => $id]);
