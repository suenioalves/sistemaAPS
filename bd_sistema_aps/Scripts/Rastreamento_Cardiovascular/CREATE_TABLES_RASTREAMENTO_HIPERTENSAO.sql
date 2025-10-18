-- =========================================================================
-- MÓDULO: Rastreamento Cardiovascular - Hipertensão
-- Data: 2025-10-17
-- Objetivo: Rastreamento domiciliar de hipertensão arterial
-- =========================================================================

-- -------------------------------------------------------------------------
-- TABELA: tb_rastreamento_familias
-- Armazena informações sobre famílias selecionadas para rastreamento
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sistemaaps.tb_rastreamento_familias (
    cod_seq_rastreamento_familia SERIAL PRIMARY KEY,
    co_seq_cds_domicilio_familia BIGINT NOT NULL,
    co_seq_cds_cad_domiciliar BIGINT NOT NULL,
    equipe VARCHAR(100),
    microarea VARCHAR(10),
    data_inicio_rastreamento DATE NOT NULL DEFAULT CURRENT_DATE,
    data_finalizacao_rastreamento DATE,
    status_rastreamento VARCHAR(20) DEFAULT 'INICIADO',
    responsavel_rastreamento VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rast_familia_domicilio ON sistemaaps.tb_rastreamento_familias(co_seq_cds_cad_domiciliar);
CREATE INDEX IF NOT EXISTS idx_rast_familia_status ON sistemaaps.tb_rastreamento_familias(status_rastreamento);

-- -------------------------------------------------------------------------
-- TABELA: tb_rastreamento_cidadaos
-- Cidadãos incluídos no rastreamento (>= 20 anos, não diagnosticados)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sistemaaps.tb_rastreamento_cidadaos (
    cod_seq_rastreamento_cidadao SERIAL PRIMARY KEY,
    cod_rastreamento_familia INTEGER REFERENCES sistemaaps.tb_rastreamento_familias(cod_seq_rastreamento_familia) ON DELETE CASCADE,
    co_seq_cds_cad_individual BIGINT NOT NULL,
    nome_cidadao VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    idade_no_rastreamento INTEGER,
    sexo VARCHAR(20),
    tem_diagnostico_hipertensao BOOLEAN DEFAULT FALSE,
    elegivel_rastreamento BOOLEAN DEFAULT TRUE,
    fase_rastreamento VARCHAR(50) DEFAULT 'MRPA_INICIAL',
    resultado_rastreamento VARCHAR(50),
    data_resultado DATE,
    decisao_profissional VARCHAR(20),
    justificativa_decisao TEXT,
    data_proximo_rastreamento DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rast_cidadao_familia ON sistemaaps.tb_rastreamento_cidadaos(cod_rastreamento_familia);
CREATE INDEX IF NOT EXISTS idx_rast_cidadao_fase ON sistemaaps.tb_rastreamento_cidadaos(fase_rastreamento);

-- -------------------------------------------------------------------------
-- TABELA: tb_rastreamento_afericoes_mrpa
-- Aferições MRPA: 1x por dia por 3-5 dias
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sistemaaps.tb_rastreamento_afericoes_mrpa (
    cod_seq_afericao_mrpa SERIAL PRIMARY KEY,
    cod_rastreamento_cidadao INTEGER REFERENCES sistemaaps.tb_rastreamento_cidadaos(cod_seq_rastreamento_cidadao) ON DELETE CASCADE,
    dia_medicao INTEGER NOT NULL,
    data_afericao DATE NOT NULL,
    hora_afericao TIME,
    pressao_sistolica INTEGER NOT NULL CHECK (pressao_sistolica BETWEEN 50 AND 300),
    pressao_diastolica INTEGER NOT NULL CHECK (pressao_diastolica BETWEEN 30 AND 200),
    frequencia_cardiaca INTEGER,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mrpa_cidadao ON sistemaaps.tb_rastreamento_afericoes_mrpa(cod_rastreamento_cidadao);

-- -------------------------------------------------------------------------
-- TABELA: tb_rastreamento_afericoes_mapa
-- Aferições MAPA: 3x manhã + 3x noite por 5 dias
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sistemaaps.tb_rastreamento_afericoes_mapa (
    cod_seq_afericao_mapa SERIAL PRIMARY KEY,
    cod_rastreamento_cidadao INTEGER REFERENCES sistemaaps.tb_rastreamento_cidadaos(cod_seq_rastreamento_cidadao) ON DELETE CASCADE,
    dia_medicao INTEGER NOT NULL,
    periodo VARCHAR(10) NOT NULL CHECK (periodo IN ('MANHA', 'NOITE')),
    numero_afericao INTEGER NOT NULL CHECK (numero_afericao BETWEEN 1 AND 3),
    data_afericao DATE NOT NULL,
    hora_afericao TIME,
    pressao_sistolica INTEGER NOT NULL CHECK (pressao_sistolica BETWEEN 50 AND 300),
    pressao_diastolica INTEGER NOT NULL CHECK (pressao_diastolica BETWEEN 30 AND 200),
    frequencia_cardiaca INTEGER,
    excluir_calculo BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mapa_cidadao ON sistemaaps.tb_rastreamento_afericoes_mapa(cod_rastreamento_cidadao);

-- -------------------------------------------------------------------------
-- TABELA: tb_rastreamento_resultado_manual
-- Para aferições em outros formatos
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sistemaaps.tb_rastreamento_resultado_manual (
    cod_seq_resultado_manual SERIAL PRIMARY KEY,
    cod_rastreamento_cidadao INTEGER REFERENCES sistemaaps.tb_rastreamento_cidadaos(cod_seq_rastreamento_cidadao) ON DELETE CASCADE,
    media_pas INTEGER NOT NULL,
    media_pad INTEGER NOT NULL,
    tipo_medicao VARCHAR(100),
    origem_medicao VARCHAR(200),
    numero_afericoes INTEGER,
    classificacao_profissional VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- VIEW: Resumo de cidadãos com médias calculadas
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW sistemaaps.vw_rastreamento_cidadaos_resumo AS
SELECT
    rc.cod_seq_rastreamento_cidadao,
    rc.cod_rastreamento_familia,
    rc.nome_cidadao,
    rc.idade_no_rastreamento,
    rc.sexo,
    rc.fase_rastreamento,
    rc.resultado_rastreamento,
    rf.equipe,
    rf.microarea,

    -- Contadores
    (SELECT COUNT(*) FROM sistemaaps.tb_rastreamento_afericoes_mrpa
     WHERE cod_rastreamento_cidadao = rc.cod_seq_rastreamento_cidadao) as total_afericoes_mrpa,

    -- Médias MRPA
    (SELECT ROUND(AVG(pressao_sistolica))
     FROM sistemaaps.tb_rastreamento_afericoes_mrpa
     WHERE cod_rastreamento_cidadao = rc.cod_seq_rastreamento_cidadao) as media_mrpa_pas,
    (SELECT ROUND(AVG(pressao_diastolica))
     FROM sistemaaps.tb_rastreamento_afericoes_mrpa
     WHERE cod_rastreamento_cidadao = rc.cod_seq_rastreamento_cidadao) as media_mrpa_pad,

    -- Médias MAPA (excluindo dia 1)
    (SELECT ROUND(AVG(pressao_sistolica))
     FROM sistemaaps.tb_rastreamento_afericoes_mapa
     WHERE cod_rastreamento_cidadao = rc.cod_seq_rastreamento_cidadao
       AND excluir_calculo = FALSE) as media_mapa_pas,
    (SELECT ROUND(AVG(pressao_diastolica))
     FROM sistemaaps.tb_rastreamento_afericoes_mapa
     WHERE cod_rastreamento_cidadao = rc.cod_seq_rastreamento_cidadao
       AND excluir_calculo = FALSE) as media_mapa_pad,

    rc.created_at,
    rc.updated_at

FROM sistemaaps.tb_rastreamento_cidadaos rc
LEFT JOIN sistemaaps.tb_rastreamento_familias rf
    ON rc.cod_rastreamento_familia = rf.cod_seq_rastreamento_familia;
