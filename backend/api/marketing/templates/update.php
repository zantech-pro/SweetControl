<?php
declare(strict_types=1);
require_once dirname(dirname(__DIR__)) . '/_bootstrap.php';

require_method('PUT');
$input = get_json_input();
require_fields($input, ['id', 'titulo', 'conteudo', 'tipo']);

if (!table_exists('marketing_templates')) {
    json_response(500, ['success' => false, 'error' => 'Tabela marketing_templates nao existe. Execute a migracao v2.']);
}

$usuarioId = resolve_user_id($input);
$id = (int) $input['id'];

$stmt = db()->prepare(
    'UPDATE marketing_templates
     SET titulo = :titulo, conteudo = :conteudo, tipo = :tipo, atualizado_em = NOW()
     WHERE id = :id AND usuario_id = :usuario_id'
);
$stmt->execute([
    ':id' => $id,
    ':usuario_id' => $usuarioId,
    ':titulo' => trim((string) $input['titulo']),
    ':conteudo' => trim((string) $input['conteudo']),
    ':tipo' => trim((string) $input['tipo']),
]);

json_response(200, ['success' => true, 'updated' => $stmt->rowCount()]);

