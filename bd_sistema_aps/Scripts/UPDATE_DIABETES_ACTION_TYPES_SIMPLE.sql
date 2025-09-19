-- Script simplificado para atualizar tipos de ação para diabetes
-- Evita conflitos de constraint unique

-- 1. Atualizar registros existentes primeiro (se houver)
UPDATE sistemaaps.tb_hiperdia_dm_acompanhamento
SET cod_acao = 3 WHERE cod_acao = 10; -- Solicitar MRG -> Solicitar Mapeamento

UPDATE sistemaaps.tb_hiperdia_dm_acompanhamento
SET cod_acao = 4 WHERE cod_acao = 11; -- Avaliar MRG -> Avaliar Tratamento

UPDATE sistemaaps.tb_hiperdia_dm_acompanhamento
SET cod_acao = 6 WHERE cod_acao = 12; -- Finalizar -> Finalizar

-- 2. Inserir novos tipos de ação apenas se não existirem
-- Usar uma abordagem mais segura com verificação

DO $$
BEGIN
    -- Tipo 1: Agendar Novo Acompanhamento
    IF NOT EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 1) THEN
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
        (1, 'Agendar Novo Acompanhamento DM', 'Agendamento de um novo acompanhamento para o paciente diabético.');
    ELSE
        UPDATE sistemaaps.tb_hiperdia_tipos_acao
        SET dsc_acao = 'Agendar Novo Acompanhamento DM',
            dsc_detalhada = 'Agendamento de um novo acompanhamento para o paciente diabético.'
        WHERE cod_acao = 1;
    END IF;

    -- Tipo 2: Solicitar Exames
    IF NOT EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 2) THEN
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
        (2, 'Solicitar Exames Laboratoriais DM', 'Solicitação de exames laboratoriais específicos para monitoramento da diabetes: Hemoglobina Glicada, Glicemia Média e Glicemia de Jejum.');
    ELSE
        UPDATE sistemaaps.tb_hiperdia_tipos_acao
        SET dsc_acao = 'Solicitar Exames Laboratoriais DM',
            dsc_detalhada = 'Solicitação de exames laboratoriais específicos para monitoramento da diabetes: Hemoglobina Glicada, Glicemia Média e Glicemia de Jejum.'
        WHERE cod_acao = 2;
    END IF;

    -- Tipo 3: Solicitar Mapeamento (atualizar o existente se necessário)
    IF NOT EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 3) THEN
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
        (3, 'Solicitar Mapeamento Residencial de Glicemias', 'Solicitação para que o paciente diabético realize a Monitorização Residencial da Glicemia.');
    ELSE
        UPDATE sistemaaps.tb_hiperdia_tipos_acao
        SET dsc_acao = 'Solicitar Mapeamento Residencial de Glicemias',
            dsc_detalhada = 'Solicitação para que o paciente diabético realize a Monitorização Residencial da Glicemia.'
        WHERE cod_acao = 3;
    END IF;

    -- Tipo 4: Avaliar Tratamento
    IF NOT EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 4) THEN
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
        (4, 'Avaliar Tratamento DM', 'Análise dos resultados da MRG e avaliação do tratamento do paciente diabético, incluindo possível ajuste de medicação.');
    ELSE
        UPDATE sistemaaps.tb_hiperdia_tipos_acao
        SET dsc_acao = 'Avaliar Tratamento DM',
            dsc_detalhada = 'Análise dos resultados da MRG e avaliação do tratamento do paciente diabético, incluindo possível ajuste de medicação.'
        WHERE cod_acao = 4;
    END IF;

    -- Tipo 5: Modificar Tratamento
    IF NOT EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 5) THEN
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
        (5, 'Modificar Tratamento DM', 'Ajuste na medicação ou terapia do paciente diabético.');
    ELSE
        UPDATE sistemaaps.tb_hiperdia_tipos_acao
        SET dsc_acao = 'Modificar Tratamento DM',
            dsc_detalhada = 'Ajuste na medicação ou terapia do paciente diabético.'
        WHERE cod_acao = 5;
    END IF;

    -- Tipo 6: Finalizar Acompanhamento
    IF NOT EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 6) THEN
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
        (6, 'Finalizar Acompanhamento DM', 'Finalização do acompanhamento diabético - Diabetes compensada/controlada.');
    ELSE
        UPDATE sistemaaps.tb_hiperdia_tipos_acao
        SET dsc_acao = 'Finalizar Acompanhamento DM',
            dsc_detalhada = 'Finalização do acompanhamento diabético - Diabetes compensada/controlada.'
        WHERE cod_acao = 6;
    END IF;

END $$;

-- 3. Criar tabela para armazenar dados de exames laboratoriais
CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_dm_exames (
    cod_exame SERIAL PRIMARY KEY,
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_dm_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    hemoglobina_glicada DECIMAL(4,2), -- Valor da Hemoglobina Glicada (ex: 7.5%)
    glicemia_media INTEGER, -- Glicemia Média (mg/dL)
    glicemia_jejum INTEGER, -- Glicemia de Jejum (mg/dL)
    data_exame DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para performance (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_dm_exames_cod_acompanhamento'
    ) THEN
        CREATE INDEX idx_dm_exames_cod_acompanhamento ON sistemaaps.tb_hiperdia_dm_exames (cod_acompanhamento);
    END IF;
END $$;

-- 4. Modificar tabela de MRG para suportar múltiplos mapeamentos por acompanhamento
-- Adicionar colunas apenas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'sistemaaps'
        AND table_name = 'tb_hiperdia_mrg'
        AND column_name = 'periodo_mapeamento'
    ) THEN
        ALTER TABLE sistemaaps.tb_hiperdia_mrg
        ADD COLUMN periodo_mapeamento VARCHAR(50) DEFAULT 'Período 1';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'sistemaaps'
        AND table_name = 'tb_hiperdia_mrg'
        AND column_name = 'dias_mapeamento'
    ) THEN
        ALTER TABLE sistemaaps.tb_hiperdia_mrg
        ADD COLUMN dias_mapeamento INTEGER DEFAULT 7;
    END IF;
END $$;

-- Adicionar comentários
COMMENT ON TABLE sistemaaps.tb_hiperdia_dm_exames IS 'Tabela para armazenar dados de exames laboratoriais específicos para diabetes';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_exames.hemoglobina_glicada IS 'Valor da Hemoglobina Glicada em porcentagem';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_exames.glicemia_media IS 'Valor da Glicemia Média em mg/dL';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_exames.glicemia_jejum IS 'Valor da Glicemia de Jejum em mg/dL';

COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.periodo_mapeamento IS 'Identificação do período do mapeamento (ex: Período 1, Período 2, etc.)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.dias_mapeamento IS 'Número de dias mapeados neste período';

-- Script finalizado com sucesso
SELECT 'Script executado com sucesso! Tipos de ação para diabetes atualizados.' as resultado;