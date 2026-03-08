<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['cliente_nome', 'itens_resumo', 'valor_total', 'status']);

if (!table_exists('pedidos_online')) {
    json_response(500, ['success' => false, 'error' => 'Tabela pedidos_online nao existe. Execute a migracao v2.']);
}

$usuarioId = resolve_user_id($input);

$stmt = db()->prepare(
    'INSERT INTO pedidos_online (usuario_id, cliente_nome, itens_resumo, valor_total, status, criado_em, atualizado_em)
     VALUES (:usuario_id, :cliente_nome, :itens_resumo, :valor_total, :status, NOW(), NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':cliente_nome' => trim((string) $input['cliente_nome']),
    ':itens_resumo' => trim((string) $input['itens_resumo']),
    ':valor_total' => (float) $input['valor_total'],
    ':status' => trim((string) $input['status']),
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

