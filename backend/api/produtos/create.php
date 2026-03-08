<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['nome']);

$usuarioId = resolve_user_id($input);
$nome = trim((string) $input['nome']);
$categoriaId = to_nullable_int($input['categoria_id'] ?? null);
$precoVenda = to_nullable_float($input['preco_venda'] ?? null);
$quantidadeEstoque = to_nullable_int($input['quantidade_estoque'] ?? 0) ?? 0;
$estoqueMinimo = to_nullable_int($input['estoque_minimo'] ?? 0) ?? 0;
$dataValidade = to_nullable_string($input['data_validade'] ?? null);
$status = to_nullable_string($input['status'] ?? 'ativo') ?? 'ativo';

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}

$hasDataValidade = column_exists('produtos', 'data_validade');

if ($hasDataValidade) {
    $stmt = db()->prepare(
        'INSERT INTO produtos
        (usuario_id, categoria_id, nome, preco_venda, quantidade_estoque, estoque_minimo, data_validade, status, criado_em, atualizado_em)
        VALUES
        (:usuario_id, :categoria_id, :nome, :preco_venda, :quantidade_estoque, :estoque_minimo, :data_validade, :status, NOW(), NOW())'
    );
    $stmt->execute([
        ':usuario_id' => $usuarioId,
        ':categoria_id' => $categoriaId,
        ':nome' => $nome,
        ':preco_venda' => $precoVenda,
        ':quantidade_estoque' => $quantidadeEstoque,
        ':estoque_minimo' => $estoqueMinimo,
        ':data_validade' => $dataValidade,
        ':status' => $status,
    ]);
} else {
    $stmt = db()->prepare(
        'INSERT INTO produtos
        (usuario_id, categoria_id, nome, preco_venda, quantidade_estoque, estoque_minimo, status, criado_em, atualizado_em)
        VALUES
        (:usuario_id, :categoria_id, :nome, :preco_venda, :quantidade_estoque, :estoque_minimo, :status, NOW(), NOW())'
    );
    $stmt->execute([
        ':usuario_id' => $usuarioId,
        ':categoria_id' => $categoriaId,
        ':nome' => $nome,
        ':preco_venda' => $precoVenda,
        ':quantidade_estoque' => $quantidadeEstoque,
        ':estoque_minimo' => $estoqueMinimo,
        ':status' => $status,
    ]);
}

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);
