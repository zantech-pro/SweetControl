-- ==========================
-- Na minha hospedagem, não tenho permissão para criar banco de dados, então o código abaixo deve ser executado apenas se no seu servidor você tiver permissão para criar bancos de dados. 
-- Caso contrario, basta criar o banco de dados manualmente e depois executar o restante do código para criar as tabelas.
-- ==========================
-- CREATE DATABASE IF NOT EXISTS sweet_control
-- CHARACTER SET utf8mb4
-- COLLATE utf8mb4_unicode_ci;

-- USE sweet_control;

-- =========================
-- USUARIOS
-- =========================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    status ENUM('ativo','inativo') DEFAULT 'ativo',
    ultimo_login DATETIME,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- FORNECEDORES
-- =========================

CREATE TABLE fornecedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,

    nome VARCHAR(150) NOT NULL,
    razao_social VARCHAR(150),
    cnpj_cpf VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(150),

    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(50),

    observacoes TEXT,
    status ENUM('ativo','inativo') DEFAULT 'ativo',

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_fornecedor_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- CATEGORIAS PRODUTOS
-- =========================

CREATE TABLE categorias_produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,

    nome VARCHAR(100) NOT NULL,
    descricao TEXT,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_categoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- CLIENTES
-- =========================

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,

    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(150),
    data_nascimento DATE,

    observacoes TEXT,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- PRODUTOS
-- =========================

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,
    categoria_id INT,
    fornecedor_id INT,

    nome VARCHAR(150) NOT NULL,
    descricao TEXT,

    codigo_barras VARCHAR(50),
    sku VARCHAR(50),

    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2),

    quantidade_estoque INT DEFAULT 0,
    estoque_minimo INT DEFAULT 0,

    unidade_medida VARCHAR(20),

    imagem_url VARCHAR(255),

    status ENUM('ativo','inativo') DEFAULT 'ativo',

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_produto_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias_produtos(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_produto_fornecedor
        FOREIGN KEY (fornecedor_id)
        REFERENCES fornecedores(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================
-- VENDAS
-- =========================

CREATE TABLE vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,
    cliente_id INT,

    total_bruto DECIMAL(10,2),
    desconto DECIMAL(10,2),
    total_liquido DECIMAL(10,2),

    metodo_pagamento ENUM('pix','dinheiro','cartao','transferencia'),

    status_venda ENUM('pendente','pago','cancelado') DEFAULT 'pago',

    observacoes TEXT,

    data_venda DATETIME,

    status_sincronizacao ENUM('offline','sincronizado') DEFAULT 'sincronizado',

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_venda_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_venda_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================
-- ITENS VENDA
-- =========================

CREATE TABLE itens_venda (
    id INT AUTO_INCREMENT PRIMARY KEY,

    venda_id INT NOT NULL,
    produto_id INT NOT NULL,

    quantidade INT NOT NULL,

    preco_unitario DECIMAL(10,2),
    preco_custo_no_momento DECIMAL(10,2),

    subtotal DECIMAL(10,2),

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_venda
        FOREIGN KEY (venda_id)
        REFERENCES vendas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
) ENGINE=InnoDB;

-- =========================
-- MOVIMENTAÇÕES ESTOQUE
-- =========================

CREATE TABLE movimentacoes_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,

    produto_id INT NOT NULL,
    usuario_id INT NOT NULL,

    tipo_movimento ENUM('entrada','saida','ajuste'),

    quantidade INT,

    motivo VARCHAR(255),

    referencia_tipo ENUM('venda','compra','ajuste'),
    referencia_id INT,

    data_movimento DATETIME,

    CONSTRAINT fk_mov_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id),

    CONSTRAINT fk_mov_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================
-- COMPRAS
-- =========================

CREATE TABLE compras_fornecedor (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,
    fornecedor_id INT NOT NULL,

    numero_nota VARCHAR(50),

    total_compra DECIMAL(10,2),

    status ENUM('pendente','pago') DEFAULT 'pago',

    data_compra DATETIME,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_compra_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_compra_fornecedor
        FOREIGN KEY (fornecedor_id)
        REFERENCES fornecedores(id)
) ENGINE=InnoDB;

-- =========================
-- ITENS COMPRA
-- =========================

CREATE TABLE itens_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,

    compra_id INT NOT NULL,
    produto_id INT NOT NULL,

    quantidade INT,
    preco_unitario DECIMAL(10,2),

    subtotal DECIMAL(10,2),

    CONSTRAINT fk_item_compra
        FOREIGN KEY (compra_id)
        REFERENCES compras_fornecedor(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_compra_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
) ENGINE=InnoDB;

-- =========================
-- GASTOS EXTRAS
-- =========================

CREATE TABLE gastos_extras (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    categoria VARCHAR(100),
    descricao TEXT,

    valor DECIMAL(10,2),

    metodo_pagamento ENUM('pix','dinheiro','cartao','transferencia'),

    data_gasto DATE,

    observacoes TEXT,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gasto_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;