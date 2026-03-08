<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['nome', 'email', 'senha']);

$nome = trim((string) $input['nome']);
$email = strtolower(trim((string) $input['email']));
$senha = (string) $input['senha'];
$telefone = to_nullable_string($input['telefone'] ?? null);

if ($nome === '' || $email === '' || $senha === '') {
    json_response(422, ['success' => false, 'error' => 'Nome, email e senha sao obrigatorios']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['success' => false, 'error' => 'Email invalido']);
}
if (strlen($senha) < 6) {
    json_response(422, ['success' => false, 'error' => 'Senha deve ter pelo menos 6 caracteres']);
}

$check = db()->prepare('SELECT id FROM usuarios WHERE email = :email LIMIT 1');
$check->execute([':email' => $email]);
if ($check->fetch()) {
    json_response(409, ['success' => false, 'error' => 'Email ja cadastrado']);
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

$stmt = db()->prepare(
    'INSERT INTO usuarios (nome, email, senha_hash, telefone, status, ultimo_login, criado_em, atualizado_em)
     VALUES (:nome, :email, :senha_hash, :telefone, :status, NOW(), NOW(), NOW())'
);
$stmt->execute([
    ':nome' => $nome,
    ':email' => $email,
    ':senha_hash' => $senhaHash,
    ':telefone' => $telefone,
    ':status' => 'ativo',
]);

$userId = (int) db()->lastInsertId();
$token = bin2hex(random_bytes(24));

json_response(201, [
    'success' => true,
    'token' => $token,
    'user' => [
        'id' => $userId,
        'nome' => $nome,
        'email' => $email,
    ],
]);

