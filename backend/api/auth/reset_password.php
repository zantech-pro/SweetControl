<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['email', 'codigo', 'nova_senha']);

if (!table_exists('password_reset_tokens')) {
    json_response(500, ['success' => false, 'error' => 'Tabela password_reset_tokens nao existe. Execute a migracao v3.']);
}

$email = strtolower(trim((string) $input['email']));
$codigo = trim((string) $input['codigo']);
$novaSenha = (string) $input['nova_senha'];

if (strlen($novaSenha) < 6) {
    json_response(422, ['success' => false, 'error' => 'Nova senha deve ter pelo menos 6 caracteres']);
}

$stmt = db()->prepare(
    'SELECT id, usuario_id, expires_at, usado
     FROM password_reset_tokens
     WHERE email = :email AND codigo = :codigo
     ORDER BY id DESC
     LIMIT 1'
);
$stmt->execute([
    ':email' => $email,
    ':codigo' => $codigo,
]);
$token = $stmt->fetch();

if (!$token) {
    json_response(400, ['success' => false, 'error' => 'Codigo invalido']);
}
if ((int) $token['usado'] === 1) {
    json_response(400, ['success' => false, 'error' => 'Codigo ja utilizado']);
}
if (new DateTimeImmutable((string) $token['expires_at']) < new DateTimeImmutable('now')) {
    json_response(400, ['success' => false, 'error' => 'Codigo expirado']);
}

$novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);
$pdo = db();
$pdo->beginTransaction();
try {
    $upUser = $pdo->prepare('UPDATE usuarios SET senha_hash = :senha_hash, atualizado_em = NOW() WHERE id = :id');
    $upUser->execute([
        ':id' => (int) $token['usuario_id'],
        ':senha_hash' => $novoHash,
    ]);

    $upToken = $pdo->prepare('UPDATE password_reset_tokens SET usado = 1 WHERE id = :id');
    $upToken->execute([':id' => (int) $token['id']]);

    $pdo->commit();
    json_response(200, ['success' => true]);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_response(500, ['success' => false, 'error' => 'Falha ao redefinir senha', 'details' => $e->getMessage()]);
}

