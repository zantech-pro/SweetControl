<?php
declare(strict_types=1);
require_once dirname(dirname(__DIR__)) . '/_bootstrap.php';

require_method('POST');
$input = get_json_input();
require_fields($input, ['titulo', 'conteudo', 'tipo']);

if (!table_exists('marketing_templates')) {
    json_response(500, ['success' => false, 'error' => 'Tabela marketing_templates nao existe. Execute a migracao v2.']);
}

$usuarioId = resolve_user_id($input);
$titulo = trim((string) $input['titulo']);
$conteudo = trim((string) $input['conteudo']);
$tipo = trim((string) $input['tipo']);

$stmt = db()->prepare(
    'INSERT INTO marketing_templates (usuario_id, titulo, conteudo, tipo, criado_em, atualizado_em)
     VALUES (:usuario_id, :titulo, :conteudo, :tipo, NOW(), NOW())'
);
$stmt->execute([
    ':usuario_id' => $usuarioId,
    ':titulo' => $titulo,
    ':conteudo' => $conteudo,
    ':tipo' => $tipo,
]);

json_response(201, ['success' => true, 'id' => (int) db()->lastInsertId()]);

