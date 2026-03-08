<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('GET');
$usuarioId = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : resolve_user_id([]);

$stmt = db()->prepare(
    'SELECT v.id, v.usuario_id, v.cliente_id, c.nome AS cliente_nome, v.total_bruto, v.desconto, v.total_liquido,
            v.metodo_pagamento, v.status_venda, v.data_venda, v.status_sincronizacao
     FROM vendas v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     WHERE v.usuario_id = :usuario_id
     ORDER BY v.data_venda DESC'
);
$stmt->execute([':usuario_id' => $usuarioId]);

json_response(200, ['success' => true, 'items' => $stmt->fetchAll()]);

