<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('PUT');
$input = get_json_input();
require_fields($input, ['id', 'nome', 'descricao']);

$usuarioId = resolve_user_id($input);
$id = (int) $input['id'];
$nome = trim((string) $input['nome']);
$descricao = to_nullable_string($input['descricao'] ?? null);

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}
if ($descricao === null || trim($descricao) === '') {
    json_response(422, ['success' => false, 'error' => 'Descricao e obrigatoria']);
}

$stmt = db()->prepare(
    'UPDATE categorias_produtos
     SET nome = :nome, descricao = :descricao, atualizado_em = NOW()
     WHERE id = :id AND usuario_id = :usuario_id'
);
$stmt->execute([
    ':id' => $id,
    ':usuario_id' => $usuarioId,
    ':nome' => $nome,
    ':descricao' => $descricao,
]);

json_response(200, ['success' => true, 'updated' => $stmt->rowCount()]);
