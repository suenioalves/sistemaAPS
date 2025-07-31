-- Criação das tabelas para acompanhamento de pacientes diabéticos
-- Baseado na estrutura do acompanhamento de hipertensão

-- 1. Criação da tabela de acompanhamento para pacientes diabéticos
-- Equivale à tb_hiperdia_has_acompanhamento
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_dm_acompanhamento CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_dm_acompanhamento (
    -- Chave primária da tabela, com autoincremento para garantir um código único para cada registro de acompanhamento.
    cod_acompanhamento SERIAL PRIMARY KEY,

    -- Código do cidadão, que fará a ligação com a lista de pacientes diabéticos.
    -- É recomendado criar um índice nesta coluna para otimizar as buscas.
    cod_cidadao BIGINT NOT NULL,

    -- Código que descreve o tipo desta ação/evento.
    -- Usa a mesma tabela tb_hiperdia_tipos_acao, utilizando cod_acao 10 (Solicitar MRG) e 11 (Avaliar MRG)
    cod_acao INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_tipos_acao(cod_acao),

    -- Status da ação, para saber se está pendente, foi realizada, cancelada, etc.
    status_acao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status_acao IN ('PENDENTE', 'REALIZADA', 'CANCELADA')),

    -- Data em que a ação está agendada para acontecer. Para ações já realizadas, pode ser a mesma que data_realizacao.
    data_agendamento DATE,

    -- Data em que a ação foi efetivamente realizada. Fica NULO para ações pendentes.
    data_realizacao DATE,

    -- Campo para observações gerais sobre a ação.
    observacoes TEXT,

    -- Responsável pela ação
    responsavel_pela_acao VARCHAR(100),

    -- Opcional, mas poderoso: Referência à ação que originou esta.
    cod_acao_origem INTEGER REFERENCES sistemaaps.tb_hiperdia_dm_acompanhamento(cod_acompanhamento),

    -- Campos de auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adiciona um comentário explicando a relação com a view materializada.
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_acompanhamento.cod_cidadao IS 'Referencia o campo cod_paciente da view materializada para pacientes diabéticos.';

-- Cria um índice na coluna cod_cidadao para acelerar as consultas que filtram por paciente.
CREATE INDEX idx_dm_acompanhamento_cod_cidadao ON sistemaaps.tb_hiperdia_dm_acompanhamento (cod_cidadao);

-- 2. Criação da tabela para medicamentos de pacientes diabéticos
-- Equivale à tb_hiperdia_has_medicamentos
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_dm_medicamentos CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_dm_medicamentos (
    cod_seq_medicamento SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    nome_medicamento VARCHAR(200) NOT NULL,
    dose INTEGER DEFAULT 1, -- Dose em unidades
    frequencia INTEGER DEFAULT 1, -- Frequência por dia
    posologia VARCHAR(100),
    data_inicio DATE,
    data_fim DATE,
    motivo_interrupcao TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cria índice para melhor performance nas consultas por paciente
CREATE INDEX idx_tb_hiperdia_dm_medicamentos_codcidadao ON sistemaaps.tb_hiperdia_dm_medicamentos(codcidadao);

-- Cria índice para consultas de medicamentos ativos
CREATE INDEX idx_tb_hiperdia_dm_medicamentos_ativo ON sistemaaps.tb_hiperdia_dm_medicamentos(codcidadao, data_fim) WHERE data_fim IS NULL;

-- Adiciona comentários para documentação
COMMENT ON TABLE sistemaaps.tb_hiperdia_dm_medicamentos IS 'Tabela para gerenciamento manual de medicamentos dos pacientes diabéticos';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.cod_seq_medicamento IS 'Chave primária sequencial';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.codcidadao IS 'Código do cidadão (referência ao paciente diabético)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.nome_medicamento IS 'Nome do medicamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.dose IS 'Dose do medicamento em unidades';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.frequencia IS 'Frequência de uso por dia';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.posologia IS 'Posologia completa do medicamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.data_inicio IS 'Data de início do tratamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_medicamentos.data_fim IS 'Data de fim do tratamento (NULL = ativo)';

-- 3. Criação da tabela de tratamento para pacientes diabéticos
-- Equivale à tb_hiperdia_tratamento
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_dm_tratamento CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_dm_tratamento (
    cod_tratamento SERIAL PRIMARY KEY,
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_dm_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    tipo_ajuste VARCHAR(50), -- Ex: 'Aumento de dose', 'Troca de medicamento', etc.
    medicamentos_atuais TEXT,
    medicamentos_novos TEXT,
    data_modificacao DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cria um índice na chave estrangeira para otimizar as consultas.
CREATE INDEX idx_dm_tratamento_cod_acompanhamento ON sistemaaps.tb_hiperdia_dm_tratamento (cod_acompanhamento);

COMMENT ON TABLE sistemaaps.tb_hiperdia_dm_tratamento IS 'Tabela para armazenar detalhes das modificações de tratamento para pacientes diabéticos';

-- 4. Criação da tabela para Monitorização Residencial da Glicemia (MRG)
-- Nova tabela específica para diabetes, equivale à tb_hiperdia_mrpa mas para glicemia
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_mrg CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_mrg (
    -- Chave primária da tabela, com autoincremento para cada novo registro de MRG.
    cod_mrg SERIAL PRIMARY KEY,
    
    -- Chave estrangeira que liga este registro de MRG ao registro de acompanhamento geral do paciente.
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_dm_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    
    -- Data em que o exame de MRG foi realizado ou finalizado.
    data_mrg DATE,
    
    -- Valores de glicemia em diferentes momentos do dia
    g_jejum INTEGER, -- Glicemia em jejum
    g_apos_cafe INTEGER, -- Glicemia após café da manhã
    g_antes_almoco INTEGER, -- Glicemia antes do almoço
    g_apos_almoco INTEGER, -- Glicemia após almoço
    g_antes_jantar INTEGER, -- Glicemia antes do jantar
    g_ao_deitar INTEGER, -- Glicemia ao deitar
    
    -- Campo de texto para a análise ou laudo do resultado do MRG.
    analise_mrg TEXT,
    
    -- Campos de auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cria um índice na chave estrangeira para otimizar as consultas que juntam as duas tabelas.
CREATE INDEX idx_mrg_cod_acompanhamento ON sistemaaps.tb_hiperdia_mrg (cod_acompanhamento);

COMMENT ON TABLE sistemaaps.tb_hiperdia_mrg IS 'Tabela para armazenar resultados da Monitorização Residencial da Glicemia (MRG)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.g_jejum IS 'Glicemia em jejum (mg/dL)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.g_apos_cafe IS 'Glicemia após café da manhã (mg/dL)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.g_antes_almoco IS 'Glicemia antes do almoço (mg/dL)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.g_apos_almoco IS 'Glicemia após almoço (mg/dL)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.g_antes_jantar IS 'Glicemia antes do jantar (mg/dL)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.g_ao_deitar IS 'Glicemia ao deitar (mg/dL)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrg.analise_mrg IS 'Análise ou laudo do resultado do MRG';

-- 5. Inserir novos tipos de ação específicos para diabetes na tabela existente
-- cod_acao 10 - Solicitar MRG
-- cod_acao 11 - Avaliar MRG

INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
(10, 'Solicitar MRG', 'Solicitação para que o paciente diabético realize a Monitorização Residencial da Glicemia.'),
(11, 'Avaliar MRG', 'Análise dos resultados da MRG enviada pelo paciente diabético.')
ON CONFLICT (cod_acao) DO UPDATE SET
    dsc_acao = EXCLUDED.dsc_acao,
    dsc_detalhada = EXCLUDED.dsc_detalhada;

-- Comentários finais
COMMENT ON SCHEMA sistemaaps IS 'Schema do sistema APS contendo tabelas para acompanhamento de hipertensão e diabetes';

-- 6. Executar script para criar a view materializada de diabetes
-- Este comando executa o script da view, assumindo que está no mesmo diretório
\i 'CREATE VIEW HIPERDIA - DIABETES.sql'

-- Script concluído
-- Este script cria toda a estrutura necessária para o acompanhamento de pacientes diabéticos
-- seguindo o mesmo padrão usado para hipertensão, mas com adaptações específicas para diabetes.

-- Para executar este script completo no PostgreSQL:
-- 1. Conecte-se ao banco de dados
-- 2. Execute: \i 'CRIA_TABELAS_DIABETES.sql'
-- 3. A view será criada automaticamente junto com as tabelas
-- 4. Para atualizar os dados da view: REFRESH MATERIALIZED VIEW sistemaaps.mv_hiperdia_diabetes;