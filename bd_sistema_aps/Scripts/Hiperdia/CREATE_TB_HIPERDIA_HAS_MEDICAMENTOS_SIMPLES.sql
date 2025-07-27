-- Cria a tabela tb_hiperdia_has_medicamentos com estrutura mínima
-- Esta tabela permite adicionar, editar e interromper medicamentos manualmente

CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_has_medicamentos (
    cod_seq_medicamento SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    nome_medicamento VARCHAR(200) NOT NULL,
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