<?php
declare(strict_types=1);
require_once dirname(dirname(__DIR__)) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['venda_id', 'produto_id', 'quantidade']);

$vendaId = (int) $input['venda_id'];
$produtoId = (int) $input['produto_id'];
$quantidade = (int) $input['quantidade'];
$precoUnitario = to_nullable_float($input['preco_unitario'] ?? null);
$subtotal = to_nullable_float($input['subtotal'] ?? null);

$pdo = db();

if ($quantidade <= 0) {
    json_response(422, ['success' => false, 'error' => 'Quantidade invalida']);
}

$vendaStmt = $pdo->prepare('SELECT id FROM vendas WHERE id = :id LIMIT 1');
$vendaStmt->execute([':id' => $vendaId]);
if (!$vendaStmt->fetchColumn()) {
    json_response(422, ['success' => false, 'error' => "Venda nao encontrada para venda_id={$vendaId}"]);
}

$produtoStmt = $pdo->prepare('SELECT id FROM produtos WHERE id = :id LIMIT 1');
$produtoStmt->execute([':id' => $produtoId]);
if (!$produtoStmt->fetchColumn()) {
    json_response(422, ['success' => false, 'error' => "Produto nao encontrado para produto_id={$produtoId}"]);
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal, criado_em)
         VALUES (:venda_id, :produto_id, :quantidade, :preco_unitario, :subtotal, NOW())'
    );
    $stmt->execute([
        ':venda_id' => $vendaId,
        ':produto_id' => $produtoId,
        ':quantidade' => $quantidade,
        ':preco_unitario' => $precoUnitario,
        ':subtotal' => $subtotal,
    ]);
} catch (Throwable $e) {
    json_response(500, ['success' => false, 'error' => 'Falha ao registrar item da venda', 'details' => $e->getMessage()]);
}

json_response(201, ['success' => true, 'id' => (int) $pdo->lastInsertId()]);
