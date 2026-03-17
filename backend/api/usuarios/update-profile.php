<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('PUT');
$input = get_json_input();

$usuarioId = resolve_user_id($input);
$nome = to_nullable_string($input['nome'] ?? null);
$avatarUrl = to_nullable_string($input['avatar_url'] ?? null);

if ($nome === null && $avatarUrl === null) {
    json_response(422, ['success' => false, 'error' => 'Nada para atualizar']);
}

$fields = [];
$params = [':id' => $usuarioId];

if ($nome !== null) {
    $fields[] = 'nome = :nome';
    $params[':nome'] = $nome;
}
if ($avatarUrl !== null) {
    $fields[] = 'avatar_url = :avatar_url';
    $params[':avatar_url'] = $avatarUrl;
}

$sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ', atualizado_em = NOW() WHERE id = :id';
$stmt = db()->prepare($sql);
$stmt->execute($params);

json_response(200, ['success' => true]);
