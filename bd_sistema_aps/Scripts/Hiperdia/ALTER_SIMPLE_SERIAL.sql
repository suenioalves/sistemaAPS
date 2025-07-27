-- Script simples para tornar cod_seq_medicamentos uma chave primária SERIAL

-- Método 1: Se a tabela estiver vazia ou você puder recriar
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_has_medicamentos CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_has_medicamentos (
    cod_seq_medicamentos SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    nome_medicamento VARCHAR(200) NOT NULL,
    dose INTEGER NOT NULL,
    frequencia INTEGER NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    cod_acao INTEGER,
    codmedicamento INTEGER,
    observacao VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX idx_tb_hiperdia_has_medicamentos_codcidadao 
ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao);

CREATE INDEX idx_tb_hiperdia_has_medicamentos_ativo 
ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao, data_fim) 
WHERE data_fim IS NULL;

-- Comentários para documentação
COMMENT ON TABLE sistemaaps.tb_hiperdia_has_medicamentos IS 'Tabela para gerenciamento manual de medicamentos dos pacientes hipertensos';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.cod_seq_medicamentos IS 'Chave primária sequencial auto-incrementável';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.codcidadao IS 'Código do cidadão (referência ao paciente)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.nome_medicamento IS 'Nome do medicamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.dose IS 'Número de comprimidos por dose (1, 2, 3...)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.frequencia IS 'Frequência de uso por dia (1, 2, 3, 4...)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.data_inicio IS 'Data de início do tratamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.data_fim IS 'Data de fim do tratamento (NULL = ativo)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_medicamentos.observacao IS 'Observações adicionais sobre o medicamento';