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
$contato = to_nullable_string($input['contato'] ?? null);
$prazoEntrega = to_nullable_int($input['prazo_entrega_dias'] ?? null);
$observacoes = to_nullable_string($input['observacoes'] ?? null);

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}
if ($telefone !== null && preg_replace('/\D+/', '', $telefone) === '') {
    json_response(422, ['success' => false, 'error' => 'Telefone invalido']);
}
if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['success' => false, 'error' => 'Email invalido']);
}
if ($prazoEntrega !== null && $prazoEntrega < 0) {
    json_response(422, ['success' => false, 'error' => 'Prazo de entrega invalido']);
}

$hasContato = column_exists('fornecedores', 'contato');
$hasPrazoEntrega = column_exists('fornecedores', 'prazo_entrega_dias');

$setParts = [
    'nome = :nome',
    'telefone = :telefone',
    'email = :email',
    'observacoes = :observacoes',
    'atualizado_em = NOW()',
];
if ($hasContato) {
    $setParts[] = 'contato = :contato';
}
if ($hasPrazoEntrega) {
    $setParts[] = 'prazo_entrega_dias = :prazo_entrega_dias';
}

$stmt = db()->prepare(
    'UPDATE fornecedores SET ' . implode(', ', $setParts) . ' WHERE id = :id AND usuario_id = :usuario_id'
);
$params = [
    ':id' => $id,
    ':usuario_id' => $usuarioId,
    ':nome' => $nome,
    ':telefone' => $telefone,
    ':email' => $email,
    ':observacoes' => $observacoes,
];
if ($hasContato) {
    $params[':contato'] = $contato;
}
if ($hasPrazoEntrega) {
    $params[':prazo_entrega_dias'] = $prazoEntrega;
}

$stmt->execute($params);

json_response(200, ['success' => true, 'updated' => $stmt->rowCount()]);
