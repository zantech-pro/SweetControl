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
$fornecedorId = to_nullable_int($input['fornecedor_id'] ?? null);
$precoCusto = to_nullable_float($input['preco_custo'] ?? null);
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
$hasPrecoCusto = column_exists('produtos', 'preco_custo');

$setParts = [
    'nome = :nome',
    'categoria_id = :categoria_id',
    'fornecedor_id = :fornecedor_id',
    'preco_venda = :preco_venda',
    'quantidade_estoque = :quantidade_estoque',
    'estoque_minimo = :estoque_minimo',
];
if ($hasPrecoCusto) {
    $setParts[] = 'preco_custo = :preco_custo';
}
if ($hasDataValidade) {
    $setParts[] = 'data_validade = :data_validade';
}
$setParts[] = 'atualizado_em = NOW()';

$stmt = db()->prepare(
    'UPDATE produtos SET ' . implode(', ', $setParts) . ' WHERE id = :id AND usuario_id = :usuario_id'
);
$params = [
    ':id' => $id,
    ':usuario_id' => $usuarioId,
    ':nome' => $nome,
    ':categoria_id' => $categoriaId,
    ':fornecedor_id' => $fornecedorId,
    ':preco_venda' => $precoVenda,
    ':quantidade_estoque' => $quantidadeEstoque,
    ':estoque_minimo' => $estoqueMinimo,
];
if ($hasPrecoCusto) {
    $params[':preco_custo'] = $precoCusto;
}
if ($hasDataValidade) {
    $params[':data_validade'] = $dataValidade;
}

$stmt->execute($params);

json_response(200, ['success' => true, 'updated' => $stmt->rowCount()]);
