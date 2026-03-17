<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['nome']);

$usuarioId = resolve_user_id($input);
$nome = trim((string) $input['nome']);
$telefone = to_nullable_string($input['telefone'] ?? null);
$email = to_nullable_string($input['email'] ?? null);
$contato = to_nullable_string($input['contato'] ?? null);
$prazoEntrega = to_nullable_int($input['prazo_entrega_dias'] ?? null);
$observacoes = to_nullable_string($input['observacoes'] ?? null);
$status = to_nullable_string($input['status'] ?? 'ativo') ?? 'ativo';

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}
if ($telefone !== null && preg_replace('/\D+/', '', $telefone) === '') {
    json_response(422, ['success' => false, 'error' => 'Telefone invalido']);
}
if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['success' => false, 'error' => 'Email invalido']);
}
if ($prazoEntrega !== null && $prazoEntrega < 0) {
    json_response(422, ['success' => false, 'error' => 'Prazo de entrega invalido']);
}

$hasContato = column_exists('fornecedores', 'contato');
$hasPrazoEntrega = column_exists('fornecedores', 'prazo_entrega_dias');

try {
    $fields = 'usuario_id, nome, telefone, email, observacoes, status, criado_em, atualizado_em';
    $values = ':usuario_id, :nome, :telefone, :email, :observacoes, :status, NOW(), NOW()';
    if ($hasContato) {
        $fields .= ', contato';
        $values .= ', :contato';
    }
    if ($hasPrazoEntrega) {
        $fields .= ', prazo_entrega_dias';
        $values .= ', :prazo_entrega_dias';
    }

    $stmt = db()->prepare(
        sprintf('INSERT INTO fornecedores (%s) VALUES (%s)', $fields, $values)
    );
    $params = [
        ':usuario_id' => $usuarioId,
        ':nome' => $nome,
        ':telefone' => $telefone,
        ':email' => $email,
        ':observacoes' => $observacoes,
        ':status' => $status,
    ];
    if ($hasContato) {
        $params[':contato'] = $contato;
    }
    if ($hasPrazoEntrega) {
        $params[':prazo_entrega_dias'] = $prazoEntrega;
    }

    $stmt->execute($params);
} catch (Throwable $e) {
    json_response(500, ['success' => false, 'error' => 'Falha ao criar fornecedor', 'details' => $e->getMessage()]);
}

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);
