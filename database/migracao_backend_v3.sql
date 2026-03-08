-- SweetControl - Migracao backend v3
-- Recuperacao de senha por codigo temporario

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    email VARCHAR(150) NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_reset_email_codigo (email, codigo),
    INDEX idx_reset_expires (expires_at)
) ENGINE=InnoDB;

