-- Cria a tabela tb_hiperdia_has_medicamentos para gerenciamento manual de medicamentos
-- Esta tabela permite adicionar, editar e interromper medicamentos manualmente

CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_has_medicamentos (
    cod_seq_medicamento SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    nome_medicamento VARCHAR(200) NOT NULL,
    posologia VARCHAR(100),
    frequencia VARCHAR(50),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    motivo_interrupcao TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cria índice para melhor performance nas consultas por paciente
CREATE INDEX IF NOT EXISTS idx_tb_hiperdia_has_medicamentos_codcidadao ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao);

-- Cria índice para consultas de medicamentos ativos
CREATE INDEX IF NOT EXISTS idx_tb_hiperdia_has_medicamentos_ativo ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao, data_fim) WHERE data_fim IS NULL;

-- Adiciona comentários para documentação
COMMENT ON TABLE sistemaaps.tb_hiperdia_has_medicamentos IS 'Tabela para gerenciamento manual de medicamentos dos pacientes';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.cod_seq_medicamento IS 'Chave primária sequencial';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.codcidadao IS 'Código do cidadão (referência ao paciente)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.nome_medicamento IS 'Nome do medicamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.posologia IS 'Posologia do medicamento (ex: 10mg)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.frequencia IS 'Frequência de uso (ex: 1x ao dia)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.data_inicio IS 'Data de início do tratamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.data_fim IS 'Data de fim do tratamento (NULL = ativo)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.motivo_interrupcao IS 'Motivo da interrupção do medicamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.observacoes IS 'Observações adicionais sobre o medicamento';