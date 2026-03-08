<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['email', 'senha_atual', 'nova_senha']);

$email = strtolower(trim((string) $input['email']));
$senhaAtual = (string) $input['senha_atual'];
$novaSenha = (string) $input['nova_senha'];

if (strlen($novaSenha) < 6) {
    json_response(422, ['success' => false, 'error' => 'Nova senha deve ter pelo menos 6 caracteres']);
}

$stmt = db()->prepare('SELECT id, senha_hash FROM usuarios WHERE email = :email LIMIT 1');
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();
if (!$user) {
    json_response(404, ['success' => false, 'error' => 'Usuario nao encontrado']);
}

if (!password_verify($senhaAtual, (string) $user['senha_hash'])) {
    json_response(401, ['success' => false, 'error' => 'Senha atual incorreta']);
}

$novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);
$up = db()->prepare('UPDATE usuarios SET senha_hash = :senha_hash, atualizado_em = NOW() WHERE id = :id');
$up->execute([
    ':id' => (int) $user['id'],
    ':senha_hash' => $novoHash,
]);

json_response(200, ['success' => true]);

