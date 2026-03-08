<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['email']);

if (!table_exists('password_reset_tokens')) {
    json_response(500, ['success' => false, 'error' => 'Tabela password_reset_tokens nao existe. Execute a migracao v3.']);
}

$email = strtolower(trim((string) $input['email']));
$stmt = db()->prepare('SELECT id, email FROM usuarios WHERE email = :email LIMIT 1');
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    json_response(200, ['success' => true, 'message' => 'Se o email existir, um codigo foi gerado.']);
}

$codigo = (string) random_int(100000, 999999);
$expiresAt = (new DateTimeImmutable('+15 minutes'))->format('Y-m-d H:i:s');

$ins = db()->prepare(
    'INSERT INTO password_reset_tokens (usuario_id, email, codigo, expires_at, usado, criado_em)
     VALUES (:usuario_id, :email, :codigo, :expires_at, 0, NOW())'
);
$ins->execute([
    ':usuario_id' => (int) $user['id'],
    ':email' => $email,
    ':codigo' => $codigo,
    ':expires_at' => $expiresAt,
]);

json_response(200, [
    'success' => true,
    'message' => 'Codigo de recuperacao gerado.',
    'codigo_debug' => $codigo,
]);

