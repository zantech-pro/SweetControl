<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();

$usuarioId = resolve_user_id($input);
$clienteId = to_nullable_int($input['cliente_id'] ?? null);
$totalBruto = to_nullable_float($input['total_bruto'] ?? null) ?? 0;
$desconto = to_nullable_float($input['desconto'] ?? null) ?? 0;
$totalLiquido = to_nullable_float($input['total_liquido'] ?? null) ?? 0;
$metodoPagamento = to_nullable_string($input['metodo_pagamento'] ?? 'pix') ?? 'pix';
$statusVenda = to_nullable_string($input['status_venda'] ?? 'pago') ?? 'pago';
$statusSync = to_nullable_string($input['status_sincronizacao'] ?? 'offline') ?? 'offline';

$stmt = db()->prepare(
    'INSERT INTO vendas
    (usuario_id, cliente_id, total_bruto, desconto, total_liquido, metodo_pagamento, status_venda, data_venda, status_sincronizacao, criado_em, atualizado_em)
    VALUES
    (:usuario_id, :cliente_id, :total_bruto, :desconto, :total_liquido, :metodo_pagamento, :status_venda, NOW(), :status_sync, NOW(), NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':cliente_id' => $clienteId,
    ':total_bruto' => $totalBruto,
    ':desconto' => $desconto,
    ':total_liquido' => $totalLiquido,
    ':metodo_pagamento' => $metodoPagamento,
    ':status_venda' => $statusVenda,
    ':status_sync' => $statusSync,
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

