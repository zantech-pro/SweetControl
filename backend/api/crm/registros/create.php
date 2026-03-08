<?php
declare(strict_types=1);
require_once dirname(dirname(__DIR__)) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['cliente_id', 'observacao']);

if (!table_exists('crm_registros')) {
    json_response(500, ['success' => false, 'error' => 'Tabela crm_registros nao existe. Execute a migracao v2.']);
}

$usuarioId = resolve_user_id($input);
$clienteId = (int) $input['cliente_id'];
$observacao = trim((string) $input['observacao']);

$stmt = db()->prepare(
    'INSERT INTO crm_registros (usuario_id, cliente_id, observacao, criado_em)
     VALUES (:usuario_id, :cliente_id, :observacao, NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':cliente_id' => $clienteId,
    ':observacao' => $observacao,
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

