<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('GET');
$usuarioId = resolve_user_id($_GET);

$stmt = db()->prepare(
    'SELECT
        cf.id,
        cf.usuario_id,
        cf.fornecedor_id,
        f.nome AS fornecedor_nome,
        ic.produto_id,
        p.nome AS produto_nome,
        ic.quantidade,
        ic.preco_unitario AS custo_unitario,
        ic.subtotal,
        cf.total_compra,
        cf.status,
        cf.data_compra,
        cf.numero_nota
     FROM compras_fornecedor cf
     LEFT JOIN fornecedores f ON f.id = cf.fornecedor_id
     LEFT JOIN itens_compra ic ON ic.compra_id = cf.id
     LEFT JOIN produtos p ON p.id = ic.produto_id
     WHERE cf.usuario_id = :usuario_id
     ORDER BY cf.data_compra DESC, cf.id DESC'
);
$stmt->execute([':usuario_id' => $usuarioId]);

$items = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
json_response(200, ['success' => true, 'data' => $items]);
