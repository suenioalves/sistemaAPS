-- Criação da tabela para funcionalidade de Cardiologia no módulo HIPERDIA - Hipertensos
-- Script SQL para implementar as funcionalidades de encaminhamento e registro de consulta cardiológica
-- Data de criação: 2024-12-19
-- Autor: Sistema APS - Módulo HIPERDIA

-- Primeiro, vamos adicionar os novos tipos de ação para Cardiologia na tabela existente
-- Inserção dos novos códigos de ação 10 e 11 para funcionalidades de Cardiologia
INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
(10, 'Encaminhar Cardiologia', 'Encaminhamento do paciente hipertenso para consulta especializada em cardiologia.'),
(11, 'Registrar Cardiologia', 'Registro dos dados, avaliação e recomendações da consulta cardiológica realizada.')
ON CONFLICT (cod_acao) DO UPDATE SET
    dsc_acao = EXCLUDED.dsc_acao,
    dsc_detalhada = EXCLUDED.dsc_detalhada;

-- Criação da tabela para armazenar os dados das consultas de cardiologia
-- Esta tabela seguirá o mesmo padrão das outras tabelas do módulo (tb_hiperdia_mrpa, tb_hiperdia_nutricao, etc.)
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_has_cardiologia CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_has_cardiologia (
    -- Chave primária da tabela, com autoincremento para cada novo registro de cardiologia
    cod_cardiologia SERIAL PRIMARY KEY,
    
    -- Chave estrangeira que liga este registro de cardiologia ao registro de acompanhamento geral do paciente
    -- A cláusula ON DELETE CASCADE garante que se o acompanhamento for deletado, os registros de cardiologia associados também serão
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_has_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    
    -- Código do cidadão para facilitar consultas diretas (redundante mas útil para performance)
    -- Referencia o mesmo cod_cidadao da tabela de acompanhamento
    cod_cidadao BIGINT NOT NULL,
    
    -- Tipo de ação realizada (10 = Encaminhar, 11 = Registrar)
    -- Permite identificar se é um encaminhamento ou o registro de uma consulta realizada
    tipo_acao INTEGER NOT NULL CHECK (tipo_acao IN (10, 11)),
    
    -- Data em que a ação foi realizada (encaminhamento ou registro da consulta)
    data_acao DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Profissional responsável pela ação (encaminhamento ou registro)
    profissional_responsavel VARCHAR(100),
    
    -- Observações gerais sobre o encaminhamento ou a consulta
    observacoes TEXT,
    
    -- Campos específicos para quando tipo_acao = 11 (Registrar Cardiologia)
    -- Relatório detalhado da consulta cardiológica realizada
    consulta_cardiologia TEXT,
    
    -- Recomendações específicas do cardiologista
    recomendacoes_cardiologia TEXT,
    
    -- Tipo de consulta realizada (Presencial, Telemedicina, etc.)
    tipo_consulta VARCHAR(20) CHECK (tipo_consulta IN ('Presencial', 'Telemedicina', 'Outro') OR tipo_consulta IS NULL),
    
    -- Timestamps para auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria índices para otimizar as consultas mais comuns
CREATE INDEX idx_cardiologia_cod_acompanhamento ON sistemaaps.tb_hiperdia_has_cardiologia (cod_acompanhamento);
CREATE INDEX idx_cardiologia_cod_cidadao ON sistemaaps.tb_hiperdia_has_cardiologia (cod_cidadao);
CREATE INDEX idx_cardiologia_tipo_acao ON sistemaaps.tb_hiperdia_has_cardiologia (tipo_acao);
CREATE INDEX idx_cardiologia_data_acao ON sistemaaps.tb_hiperdia_has_cardiologia (data_acao);

-- Adiciona comentários explicativos para documentação
COMMENT ON TABLE sistemaaps.tb_hiperdia_has_cardiologia IS 'Tabela para gerenciar encaminhamentos e registros de consultas cardiológicas no módulo HIPERDIA - Hipertensos';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.cod_cardiologia IS 'Chave primária única para cada registro de cardiologia';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.cod_acompanhamento IS 'Referencia o acompanhamento geral do paciente na tb_hiperdia_has_acompanhamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.cod_cidadao IS 'Código do paciente, referencia o mesmo cod_cidadao da tabela de acompanhamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.tipo_acao IS 'Tipo de ação: 10=Encaminhar Cardiologia, 11=Registrar Cardiologia';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.data_acao IS 'Data da ação realizada (encaminhamento ou registro da consulta)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.profissional_responsavel IS 'Nome do profissional que realizou a ação';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.observacoes IS 'Observações gerais sobre o encaminhamento ou consulta';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.consulta_cardiologia IS 'Relatório detalhado da consulta cardiológica (usado quando tipo_acao=11)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.recomendacoes_cardiologia IS 'Recomendações específicas do cardiologista (usado quando tipo_acao=11)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_cardiologia.tipo_consulta IS 'Modalidade da consulta: Presencial, Telemedicina, etc.';

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION sistemaaps.update_tb_hiperdia_has_cardiologia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tb_hiperdia_has_cardiologia_updated_at
    BEFORE UPDATE ON sistemaaps.tb_hiperdia_has_cardiologia
    FOR EACH ROW
    EXECUTE FUNCTION sistemaaps.update_tb_hiperdia_has_cardiologia_updated_at();

-- Exemplos de uso da tabela:

-- Exemplo 1: Registrar um encaminhamento para cardiologia
/*
INSERT INTO sistemaaps.tb_hiperdia_has_cardiologia (
    cod_acompanhamento, cod_cidadao, tipo_acao, data_acao, 
    profissional_responsavel, observacoes
) VALUES (
    123, 456789, 10, '2024-12-19',
    'Dr. João Silva', 'Paciente com HAS descompensada, necessita avaliação cardiológica para ajuste terapêutico.'
);
*/

-- Exemplo 2: Registrar o resultado de uma consulta cardiológica
/*
INSERT INTO sistemaaps.tb_hiperdia_has_cardiologia (
    cod_acompanhamento, cod_cidadao, tipo_acao, data_acao,
    profissional_responsavel, observacoes, consulta_cardiologia, 
    recomendacoes_cardiologia, tipo_consulta
) VALUES (
    124, 456789, 11, '2024-12-20',
    'Dr. Maria Santos', 'Consulta cardiológica realizada conforme encaminhamento.',
    'Paciente apresenta hipertensão arterial sistêmica grau II. ECG normal. Ecocardiograma mostra discreta hipertrofia ventricular esquerda.',
    'Manter medicação atual (Losartana 50mg). Retorno em 3 meses. Orientado exercícios físicos regulares.',
    'Presencial'
);
*/

-- Query para consultar encaminhamentos e registros de cardiologia de um paciente:
/*
SELECT 
    c.cod_cardiologia,
    c.cod_cidadao,
    c.tipo_acao,
    CASE 
        WHEN c.tipo_acao = 10 THEN 'Encaminhamento'
        WHEN c.tipo_acao = 11 THEN 'Registro de Consulta'
    END as tipo_acao_desc,
    c.data_acao,
    c.profissional_responsavel,
    c.observacoes,
    c.consulta_cardiologia,
    c.recomendacoes_cardiologia,
    c.tipo_consulta,
    c.created_at
FROM sistemaaps.tb_hiperdia_has_cardiologia c
WHERE c.cod_cidadao = 456789
ORDER BY c.data_acao DESC, c.created_at DESC;
*/