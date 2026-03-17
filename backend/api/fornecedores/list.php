<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('GET');
$usuarioId = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : resolve_user_id([]);

$hasContato = column_exists('fornecedores', 'contato');
$hasPrazoEntrega = column_exists('fornecedores', 'prazo_entrega_dias');
$contatoField = $hasContato ? 'contato' : 'NULL as contato';
$prazoField = $hasPrazoEntrega ? 'prazo_entrega_dias' : 'NULL as prazo_entrega_dias';

$sql = "
SELECT id, usuario_id, nome, telefone, email, {$contatoField}, {$prazoField}, observacoes, status, criado_em, atualizado_em
FROM fornecedores
WHERE usuario_id = :usuario_id
ORDER BY nome ASC
";

$stmt = db()->prepare($sql);
$stmt->execute([':usuario_id' => $usuarioId]);

json_response(200, ['success' => true, 'items' => $stmt->fetchAll()]);
