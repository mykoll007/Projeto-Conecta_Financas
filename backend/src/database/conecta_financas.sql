CREATE DATABASE IF NOT EXISTS conecta_financas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE conecta_financas;


-- =====================================================
-- USUÁRIOS
-- =====================================================

CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(120) NOT NULL,

    email VARCHAR(160) NOT NULL UNIQUE,

    senha VARCHAR(255) NOT NULL,

    telefone VARCHAR(30) NULL,

    profissao VARCHAR(120) NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =====================================================
-- CATEGORIAS
-- =====================================================

CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL,

    nome VARCHAR(80) NOT NULL,

    cor VARCHAR(20) DEFAULT '#168a52',

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_categoria_usuario_nome
        UNIQUE (usuario_id, nome)
);


-- =====================================================
-- FIXOS MENSAIS
-- =====================================================

CREATE TABLE fixos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL,

    categoria_id INT UNSIGNED NULL,

    descricao VARCHAR(180) NOT NULL,

    tipo ENUM(
        'income',
        'expense'
    ) NOT NULL,

    valor DECIMAL(12,2) NOT NULL,

    dia_vencimento TINYINT UNSIGNED NOT NULL,

    forma_pagamento VARCHAR(80) NULL,

    status_padrao ENUM(
        'paid',
        'pending'
    ) DEFAULT 'pending',

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_fixo_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_fixo_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_dia_vencimento
        CHECK (
            dia_vencimento >= 1
            AND dia_vencimento <= 31
        )
);


-- =====================================================
-- MOVIMENTAÇÕES
-- =====================================================

CREATE TABLE movimentacoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL,

    categoria_id INT UNSIGNED NULL,

    fixo_id INT UNSIGNED NULL,

    descricao VARCHAR(180) NOT NULL,

    tipo ENUM(
        'income',
        'expense'
    ) NOT NULL,

    valor DECIMAL(12,2) NOT NULL,

    data_movimentacao DATE NOT NULL,

    status ENUM(
        'paid',
        'pending'
    ) DEFAULT 'paid',

    forma_pagamento VARCHAR(80) NULL,

    observacao TEXT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_movimentacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_movimentacao_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_movimentacao_fixo
        FOREIGN KEY (fixo_id)
        REFERENCES fixos(id)
        ON DELETE SET NULL
);


-- =====================================================
-- CONFIGURAÇÕES
-- =====================================================

CREATE TABLE configuracoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL UNIQUE,

    orcamento_mensal DECIMAL(12,2) DEFAULT 0,

    moeda VARCHAR(10) DEFAULT 'BRL',

    tema ENUM(
        'light',
        'dark',
        'system'
    ) DEFAULT 'light',

    forma_pagamento_padrao VARCHAR(80)
        DEFAULT 'Pix',

    inicio_mes TINYINT UNSIGNED DEFAULT 1,

    incluir_pendencias BOOLEAN DEFAULT TRUE,

    confirmar_exclusao BOOLEAN DEFAULT TRUE,

    animacoes BOOLEAN DEFAULT TRUE,

    modo_compacto BOOLEAN DEFAULT FALSE,

    atualizado_em TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_configuracao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_inicio_mes
        CHECK (
            inicio_mes >= 1
            AND inicio_mes <= 31
        )
);


-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_movimentacoes_usuario_data
ON movimentacoes (
    usuario_id,
    data_movimentacao
);

CREATE INDEX idx_movimentacoes_categoria
ON movimentacoes (
    categoria_id
);

CREATE INDEX idx_movimentacoes_status
ON movimentacoes (
    usuario_id,
    status
);

CREATE INDEX idx_fixos_usuario
ON fixos (
    usuario_id
);