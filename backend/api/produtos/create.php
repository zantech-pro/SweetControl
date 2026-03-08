<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['nome']);

$usuarioId = resolve_user_id($input);
$nome = trim((string) $input['nome']);
$categoriaId = to_nullable_int($input['categoria_id'] ?? null);
$precoVenda = to_nullable_float($input['preco_venda'] ?? null);
$quantidadeEstoque = to_nullable_int($input['quantidade_estoque'] ?? 0) ?? 0;
$estoqueMinimo = to_nullable_int($input['estoque_minimo'] ?? 0) ?? 0;
$dataValidade = to_nullable_string($input['data_validade'] ?? null);
$status = to_nullable_string($input['status'] ?? 'ativo') ?? 'ativo';

if ($nome === '') {
    json_response(422, ['success' => false, 'error' => 'Nome e obrigatorio']);
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

try {
    if ($hasDataValidade) {
        $stmt = db()->prepare(
            'INSERT INTO produtos
            (usuario_id, categoria_id, nome, preco_venda, quantidade_estoque, estoque_minimo, data_validade, status, criado_em, atualizado_em)
            VALUES
            (:usuario_id, :categoria_id, :nome, :preco_venda, :quantidade_estoque, :estoque_minimo, :data_validade, :status, NOW(), NOW())'
        );
        $stmt->execute([
            ':usuario_id' => $usuarioId,
            ':categoria_id' => $categoriaId,
            ':nome' => $nome,
            ':preco_venda' => $precoVenda,
            ':quantidade_estoque' => $quantidadeEstoque,
            ':estoque_minimo' => $estoqueMinimo,
            ':data_validade' => $dataValidade,
            ':status' => $status,
        ]);
    } else {
        $stmt = db()->prepare(
            'INSERT INTO produtos
            (usuario_id, categoria_id, nome, preco_venda, quantidade_estoque, estoque_minimo, status, criado_em, atualizado_em)
            VALUES
            (:usuario_id, :categoria_id, :nome, :preco_venda, :quantidade_estoque, :estoque_minimo, :status, NOW(), NOW())'
        );
        $stmt->execute([
            ':usuario_id' => $usuarioId,
            ':categoria_id' => $categoriaId,
            ':nome' => $nome,
            ':preco_venda' => $precoVenda,
            ':quantidade_estoque' => $quantidadeEstoque,
            ':estoque_minimo' => $estoqueMinimo,
            ':status' => $status,
        ]);
    }
} catch (Throwable $e) {
    json_response(500, [
        'success' => false,
        'error' => 'Falha ao criar produto',
        'details' => $e->getMessage(),
    ]);
}

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);
