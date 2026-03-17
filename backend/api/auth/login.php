<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['email', 'senha']);

$email = strtolower(trim((string) $input['email']));
$senha = (string) $input['senha'];

$stmt = db()->prepare(
    'SELECT id, nome, email, senha_hash, status, avatar_url
     FROM usuarios
     WHERE email = :email
     LIMIT 1'
);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    json_response(401, ['success' => false, 'error' => 'Credenciais invalidas']);
}
if (($user['status'] ?? 'ativo') !== 'ativo') {
    json_response(403, ['success' => false, 'error' => 'Usuario inativo']);
}

$ok = password_verify($senha, (string) $user['senha_hash']);
if (!$ok) {
    json_response(401, ['success' => false, 'error' => 'Credenciais invalidas']);
}

$token = bin2hex(random_bytes(24));

$up = db()->prepare('UPDATE usuarios SET ultimo_login = NOW(), atualizado_em = NOW() WHERE id = :id');
$up->execute([':id' => (int) $user['id']]);

json_response(200, [
    'success' => true,
    'token' => $token,
    'user' => [
        'id' => (int) $user['id'],
        'nome' => (string) $user['nome'],
        'email' => (string) $user['email'],
        'avatar_url' => $user['avatar_url'] ?? null,
    ],
]);
