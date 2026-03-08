<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('GET');
$usuarioId = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : resolve_user_id([]);

$hasDataValidade = column_exists('produtos', 'data_validade');
$validadeField = $hasDataValidade ? 'p.data_validade' : 'NULL as data_validade';

$sql = "
SELECT p.id, p.usuario_id, p.categoria_id, p.nome, p.preco_venda, p.quantidade_estoque, p.estoque_minimo,
       {$validadeField},
       p.status, c.nome as categoria_nome
FROM produtos p
LEFT JOIN categorias_produtos c ON c.id = p.categoria_id
WHERE p.usuario_id = :usuario_id
ORDER BY p.nome ASC
";

$stmt = db()->prepare($sql);
$stmt->execute([':usuario_id' => $usuarioId]);

json_response(200, ['success' => true, 'items' => $stmt->fetchAll()]);

