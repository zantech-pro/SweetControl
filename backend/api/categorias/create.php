<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['nome']);

$usuarioId = resolve_user_id($input);
$nome = trim((string) $input['nome']);
$descricao = to_nullable_string($input['descricao'] ?? null);

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}

$stmt = db()->prepare(
    'INSERT INTO categorias_produtos (usuario_id, nome, descricao, criado_em, atualizado_em)
     VALUES (:usuario_id, :nome, :descricao, NOW(), NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':nome' => $nome,
    ':descricao' => $descricao,
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

