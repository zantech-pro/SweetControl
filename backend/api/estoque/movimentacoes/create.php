<?php
declare(strict_types=1);
require_once dirname(dirname(__DIR__)) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['produto_id', 'tipo_movimento', 'quantidade']);

$usuarioId = resolve_user_id($input);
$produtoId = (int) $input['produto_id'];
$tipo = to_nullable_string($input['tipo_movimento'] ?? null) ?? 'ajuste';
$quantidade = (int) $input['quantidade'];
$motivo = to_nullable_string($input['motivo'] ?? null) ?? 'Movimento';
$referenciaTipo = to_nullable_string($input['referencia_tipo'] ?? null);
$referenciaId = to_nullable_int($input['referencia_id'] ?? null);

$pdo = db();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO movimentacoes_estoque
        (produto_id, usuario_id, tipo_movimento, quantidade, motivo, referencia_tipo, referencia_id, data_movimento)
        VALUES
        (:produto_id, :usuario_id, :tipo_movimento, :quantidade, :motivo, :referencia_tipo, :referencia_id, NOW())'
    );
    $stmt->execute([
        ':produto_id' => $produtoId,
        ':usuario_id' => $usuarioId,
        ':tipo_movimento' => $tipo,
        ':quantidade' => $quantidade,
        ':motivo' => $motivo,
        ':referencia_tipo' => $referenciaTipo,
        ':referencia_id' => $referenciaId,
    ]);

    if ($tipo === 'saida') {
        $up = $pdo->prepare('UPDATE produtos SET quantidade_estoque = GREATEST(0, quantidade_estoque - :qtd), atualizado_em = NOW() WHERE id = :id');
        $up->execute([':qtd' => $quantidade, ':id' => $produtoId]);
    } elseif ($tipo === 'entrada' || $tipo === 'ajuste') {
        $up = $pdo->prepare('UPDATE produtos SET quantidade_estoque = quantidade_estoque + :qtd, atualizado_em = NOW() WHERE id = :id');
        $up->execute([':qtd' => $quantidade, ':id' => $produtoId]);
    }

    $pdo->commit();
    json_response(201, ['success' => true, 'id' => (int) $pdo->lastInsertId()]);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_response(500, ['success' => false, 'error' => 'Falha ao registrar movimentacao', 'details' => $e->getMessage()]);
}

