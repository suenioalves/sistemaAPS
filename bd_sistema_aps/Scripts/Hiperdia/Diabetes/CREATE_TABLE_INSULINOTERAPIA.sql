-- Tabela para registro da Jornada da Insulinoterapia
-- Armazena o acompanhamento detalhado do processo de ajuste de insulina

CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_dm_insulinoterapia (
    cod_seq_acompanhamento SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    cod_seq_insulina INTEGER,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fase_tratamento VARCHAR(50) NOT NULL,
    tipo_glicemia VARCHAR(50),
    valor_glicemia INTEGER,
    sugestao_sistema TEXT,
    acao_realizada TEXT,
    observacoes TEXT,
    responsavel_registro VARCHAR(100),

    -- Campos adicionais para controle
    status_fase VARCHAR(20) DEFAULT 'EM_ANDAMENTO', -- EM_ANDAMENTO, CONCLUIDA, CANCELADA
    meta_alcancada BOOLEAN DEFAULT FALSE,
    dose_nph_manha INTEGER,
    dose_nph_noite INTEGER,
    dose_regular_cafe INTEGER,
    dose_regular_almoco INTEGER,
    dose_regular_jantar INTEGER,

    -- Constraints
    -- Foreign key para cidadao removida para compatibilidade com schema atual
    CONSTRAINT fk_insulina_tratamento FOREIGN KEY (cod_seq_insulina)
        REFERENCES sistemaaps.tb_hiperdia_dm_insulina(cod_seq_insulina) ON DELETE SET NULL,
    CONSTRAINT check_valor_glicemia CHECK (valor_glicemia IS NULL OR valor_glicemia >= 0),
    CONSTRAINT check_status_fase CHECK (status_fase IN ('EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_insulinoterapia_cidadao ON sistemaaps.tb_hiperdia_dm_insulinoterapia(codcidadao);
CREATE INDEX IF NOT EXISTS idx_insulinoterapia_fase ON sistemaaps.tb_hiperdia_dm_insulinoterapia(fase_tratamento);
CREATE INDEX IF NOT EXISTS idx_insulinoterapia_data ON sistemaaps.tb_hiperdia_dm_insulinoterapia(data_registro DESC);

-- Comentários
COMMENT ON TABLE sistemaaps.tb_hiperdia_dm_insulinoterapia IS 'Registro da Jornada da Insulinoterapia - acompanhamento do processo de ajuste de insulina';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulinoterapia.fase_tratamento IS 'Fase atual: Preparacao, Fase1_Jejum, Fase2_Mapeamento, Fase3_Pos_Refeicoes, Manutencao';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulinoterapia.tipo_glicemia IS 'Tipo: Jejum, Antes_Almoco, 2h_Apos_Almoco, Antes_Jantar, 2h_Apos_Jantar, Ao_Deitar';
