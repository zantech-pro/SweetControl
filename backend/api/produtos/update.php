<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('PUT');
$input = get_json_input();
require_fields($input, ['id', 'nome', 'preco_venda', 'data_validade']);

$usuarioId = resolve_user_id($input);
$id = (int) $input['id'];
$nome = trim((string) $input['nome']);
$categoriaId = to_nullable_int($input['categoria_id'] ?? null);
$precoVenda = to_nullable_float($input['preco_venda'] ?? null);
$quantidadeEstoque = to_nullable_int($input['quantidade_estoque'] ?? null);
$estoqueMinimo = to_nullable_int($input['estoque_minimo'] ?? null);
$dataValidade = to_nullable_string($input['data_validade'] ?? null);

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}
if ($precoVenda === null || $precoVenda <= 0) {
    json_response(422, ['success' => false, 'error' => 'Preco de venda invalido']);
}
if ($dataValidade === null || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataValidade)) {
    json_response(422, ['success' => false, 'error' => 'Data de validade invalida. Use YYYY-MM-DD']);
}

$hasDataValidade = column_exists('produtos', 'data_validade');

if ($hasDataValidade) {
    $stmt = db()->prepare(
        'UPDATE produtos
         SET nome = :nome,
             categoria_id = :categoria_id,
             preco_venda = :preco_venda,
             quantidade_estoque = :quantidade_estoque,
             estoque_minimo = :estoque_minimo,
             data_validade = :data_validade,
             atualizado_em = NOW()
         WHERE id = :id AND usuario_id = :usuario_id'
    );
    $stmt->execute([
        ':id' => $id,
        ':usuario_id' => $usuarioId,
        ':nome' => $nome,
        ':categoria_id' => $categoriaId,
        ':preco_venda' => $precoVenda,
        ':quantidade_estoque' => $quantidadeEstoque,
        ':estoque_minimo' => $estoqueMinimo,
        ':data_validade' => $dataValidade,
    ]);
} else {
    $stmt = db()->prepare(
        'UPDATE produtos
         SET nome = :nome,
             categoria_id = :categoria_id,
             preco_venda = :preco_venda,
             quantidade_estoque = :quantidade_estoque,
             estoque_minimo = :estoque_minimo,
             atualizado_em = NOW()
         WHERE id = :id AND usuario_id = :usuario_id'
    );
    $stmt->execute([
        ':id' => $id,
        ':usuario_id' => $usuarioId,
        ':nome' => $nome,
        ':categoria_id' => $categoriaId,
        ':preco_venda' => $precoVenda,
        ':quantidade_estoque' => $quantidadeEstoque,
        ':estoque_minimo' => $estoqueMinimo,
    ]);
}

json_response(200, ['success' => true, 'updated' => $stmt->rowCount()]);
