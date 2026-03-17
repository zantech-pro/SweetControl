<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['fornecedor_id', 'produto_id', 'quantidade', 'custo_unitario']);

$usuarioId = resolve_user_id($input);
$fornecedorId = (int) $input['fornecedor_id'];
$produtoId = (int) $input['produto_id'];
$quantidade = (int) $input['quantidade'];
$custoUnitario = (float) $input['custo_unitario'];
$totalCompra = isset($input['total_compra']) ? (float) $input['total_compra'] : $quantidade * $custoUnitario;
$status = to_nullable_string($input['status'] ?? null) ?? 'pendente';
$dataCompra = to_nullable_string($input['data_compra'] ?? date('Y-m-d')) ?? date('Y-m-d');
$numeroNota = to_nullable_string($input['numero_nota'] ?? null);

if ($quantidade <= 0 || $custoUnitario <= 0) {
    json_response(422, ['success' => false, 'error' => 'Quantidade ou custo invalido']);
}

$pdo = db();

$fornecedorStmt = $pdo->prepare('SELECT id FROM fornecedores WHERE id = :id LIMIT 1');
$fornecedorStmt->execute([':id' => $fornecedorId]);
if (!$fornecedorStmt->fetchColumn()) {
    json_response(422, ['success' => false, 'error' => 'Fornecedor nao encontrado']);
}

$produtoStmt = $pdo->prepare('SELECT id FROM produtos WHERE id = :id LIMIT 1');
$produtoStmt->execute([':id' => $produtoId]);
if (!$produtoStmt->fetchColumn()) {
    json_response(422, ['success' => false, 'error' => 'Produto nao encontrado']);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO compras_fornecedor
        (usuario_id, fornecedor_id, numero_nota, total_compra, status, data_compra, criado_em)
        VALUES
        (:usuario_id, :fornecedor_id, :numero_nota, :total_compra, :status, :data_compra, NOW())'
    );
    $stmt->execute([
        ':usuario_id' => $usuarioId,
        ':fornecedor_id' => $fornecedorId,
        ':numero_nota' => $numeroNota,
        ':total_compra' => $totalCompra,
        ':status' => $status,
        ':data_compra' => $dataCompra,
    ]);

    $compraId = (int) $pdo->lastInsertId();
    $itemStmt = $pdo->prepare(
        'INSERT INTO itens_compra (compra_id, produto_id, quantidade, preco_unitario, subtotal)
         VALUES (:compra_id, :produto_id, :quantidade, :preco_unitario, :subtotal)'
    );
    $itemStmt->execute([
        ':compra_id' => $compraId,
        ':produto_id' => $produtoId,
        ':quantidade' => $quantidade,
        ':preco_unitario' => $custoUnitario,
        ':subtotal' => $quantidade * $custoUnitario,
    ]);

    $pdo->commit();
    json_response(201, ['success' => true, 'id' => $compraId]);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_response(500, ['success' => false, 'error' => 'Falha ao registrar compra', 'details' => $e->getMessage()]);
}
