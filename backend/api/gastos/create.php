<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['categoria', 'valor', 'metodo_pagamento']);

$usuarioId = resolve_user_id($input);
$categoria = trim((string) $input['categoria']);
$descricao = to_nullable_string($input['descricao'] ?? null);
$valor = (float) $input['valor'];
$metodo = trim((string) $input['metodo_pagamento']);
$dataGasto = to_nullable_string($input['data_gasto'] ?? date('Y-m-d')) ?? date('Y-m-d');

$stmt = db()->prepare(
    'INSERT INTO gastos_extras (usuario_id, categoria, descricao, valor, metodo_pagamento, data_gasto, criado_em)
     VALUES (:usuario_id, :categoria, :descricao, :valor, :metodo_pagamento, :data_gasto, NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':categoria' => $categoria,
    ':descricao' => $descricao,
    ':valor' => $valor,
    ':metodo_pagamento' => $metodo,
    ':data_gasto' => $dataGasto,
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

