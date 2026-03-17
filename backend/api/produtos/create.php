<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['nome', 'preco_venda', 'data_validade']);

$usuarioId = resolve_user_id($input);
$nome = trim((string) $input['nome']);
$categoriaId = to_nullable_int($input['categoria_id'] ?? null);
$precoCusto = to_nullable_float($input['preco_custo'] ?? null);
$precoVenda = to_nullable_float($input['preco_venda'] ?? null);
$quantidadeEstoque = to_nullable_int($input['quantidade_estoque'] ?? 0) ?? 0;
$estoqueMinimo = to_nullable_int($input['estoque_minimo'] ?? 0) ?? 0;
$dataValidade = to_nullable_string($input['data_validade'] ?? null);
$status = to_nullable_string($input['status'] ?? 'ativo') ?? 'ativo';

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
}
if ($precoVenda === null || $precoVenda <= 0) {
    json_response(422, ['success' => false, 'error' => 'Preco de venda invalido']);
}
if ($dataValidade === null || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataValidade)) {
    json_response(422, ['success' => false, 'error' => 'Data de validade invalida. Use YYYY-MM-DD']);
}

if ($categoriaId !== null) {
    $checkCategoria = db()->prepare(
        'SELECT id FROM categorias_produtos WHERE id = :id AND usuario_id = :usuario_id LIMIT 1'
    );
    $checkCategoria->execute([
        ':id' => $categoriaId,
        ':usuario_id' => $usuarioId,
    ]);
    if (!$checkCategoria->fetch()) {
        // Categoria inexistente para o usuario (comum em sync fora de ordem). Salva sem categoria.
        $categoriaId = null;
    }
}

$hasDataValidade = column_exists('produtos', 'data_validade');
$hasPrecoCusto = column_exists('produtos', 'preco_custo');

try {
    $fields = 'usuario_id, categoria_id, nome, preco_venda, quantidade_estoque, estoque_minimo';
    $values = ':usuario_id, :categoria_id, :nome, :preco_venda, :quantidade_estoque, :estoque_minimo';
    if ($hasPrecoCusto) {
        $fields .= ', preco_custo';
        $values .= ', :preco_custo';
    }
    if ($hasDataValidade) {
        $fields .= ', data_validade';
        $values .= ', :data_validade';
    }
    $fields .= ', status, criado_em, atualizado_em';
    $values .= ', :status, NOW(), NOW()';

    $stmt = db()->prepare(
        sprintf('INSERT INTO produtos (%s) VALUES (%s)', $fields, $values)
    );
    $params = [
        ':usuario_id' => $usuarioId,
        ':categoria_id' => $categoriaId,
        ':nome' => $nome,
        ':preco_venda' => $precoVenda,
        ':quantidade_estoque' => $quantidadeEstoque,
        ':estoque_minimo' => $estoqueMinimo,
        ':status' => $status,
    ];
    if ($hasPrecoCusto) {
        $params[':preco_custo'] = $precoCusto;
    }
    if ($hasDataValidade) {
        $params[':data_validade'] = $dataValidade;
    }
    $stmt->execute($params);
} catch (Throwable $e) {
    json_response(500, [
        'success' => false,
        'error' => 'Falha ao criar produto',
        'details' => $e->getMessage(),
    ]);
}

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);
