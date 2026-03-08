<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

require_method('GET');
$usuarioId = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : resolve_user_id([]);

$stmt = db()->prepare(
    'SELECT id, usuario_id, nome, telefone, email, criado_em, atualizado_em
     FROM clientes
     WHERE usuario_id = :usuario_id
     ORDER BY nome ASC'
);
$stmt->execute([':usuario_id' => $usuarioId]);

json_response(200, ['success' => true, 'items' => $stmt->fetchAll()]);

