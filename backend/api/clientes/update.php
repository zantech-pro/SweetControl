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
sync_log('clientes/update', $input, 'request');

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
} catch (Throwable $e) {
    sync_log('clientes/update', ['usuario_id' => $usuarioId, 'id' => $id, 'error' => $e->getMessage()], 'error');
    json_response(500, ['success' => false, 'error' => 'Falha ao atualizar cliente', 'details' => $e->getMessage()]);
}

$updated = $stmt->rowCount();
sync_log('clientes/update', ['usuario_id' => $usuarioId, 'id' => $id, 'updated' => $updated], 'success');
json_response(200, ['success' => true, 'updated' => $updated]);
