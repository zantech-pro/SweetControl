-- SweetControl - Migracao backend v2
-- Execute apos o modelagem.sql principal

SET @db_name := DATABASE();
SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'produtos'
      AND COLUMN_NAME = 'data_validade'
);
SET @sql := IF(
    @column_exists = 0,
    'ALTER TABLE produtos ADD COLUMN data_validade DATE NULL AFTER estoque_minimo',
    'SELECT ''coluna data_validade ja existe'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS marketing_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo ENUM('promocao','whatsapp','oferta') NOT NULL DEFAULT 'promocao',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_marketing_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cliente_id INT NOT NULL,
    observacao TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crm_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_crm_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos_online (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cliente_nome VARCHAR(150) NOT NULL,
    itens_resumo TEXT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    status ENUM('novo','aceito','cancelado') NOT NULL DEFAULT 'novo',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recibos_digitais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    conteudo TEXT NOT NULL,
    gerado_em DATETIME NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recibos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
