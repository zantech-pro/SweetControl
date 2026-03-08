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

$stmt = db()->prepare(
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

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

