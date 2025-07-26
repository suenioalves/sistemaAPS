-- Criação da tabela de tipos de ação para o acompanhamento do HiperDia
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_tipos_acao CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_tipos_acao (
    cod_acao SERIAL PRIMARY KEY,
    dsc_acao VARCHAR(100) NOT NULL UNIQUE,
    dsc_detalhada TEXT
);

-- Inserção dos tipos de ação para o Hiperdia
-- Limpa a tabela antes de inserir para garantir que os códigos estejam corretos.
DELETE FROM sistemaaps.tb_hiperdia_tipos_acao;
ALTER SEQUENCE sistemaaps.tb_hiperdia_tipos_acao_cod_acao_seq RESTART WITH 1;

INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
(1, 'Solicitar MRPA', 'Solicitação para que o paciente realize a Monitorização Residencial da Pressão Arterial.'),
(2, 'Avaliar MRPA', 'Análise dos resultados da MRPA enviada pelo paciente.'),
(3, 'Modificar tratamento', 'Ajuste na medicação ou terapia do paciente.'),
(4, 'Solicitar Exames', 'Solicitação de exames laboratoriais ou de imagem (ECG).'),
(5, 'Avaliar Exames', 'Análise dos resultados dos exames solicitados.'),
(6, 'Avaliar RCV', 'Avaliação do Risco Cardiovascular do paciente.'),
(7, 'Encaminhar para nutrição', 'Encaminhamento do paciente para consulta com nutricionista.'),
(8, 'Registrar consulta nutrição', 'Registro dos dados e orientações da consulta nutricional.'),
(9, 'Agendar novo acompanhamento', 'Agendamento de uma nova ação ou consulta de rotina.');

-- Criação da tabela de acompanhamento geral para os pacientes do HiperDia
-- O comando 'DROP TABLE' garante que o script possa ser executado várias vezes sem erro, removendo a tabela antiga antes de criar a nova.
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_has_acompanhamento CASCADE;

CREATE TABLE sistemaaps.tb_hiperdia_has_acompanhamento (
    -- Chave primária da tabela, com autoincremento para garantir um código único para cada registro de acompanhamento.
    cod_acompanhamento SERIAL PRIMARY KEY,

    -- Código do cidadão, que fará a ligação com a lista de pacientes hipertensos.
    -- É recomendado criar um índice nesta coluna para otimizar as buscas.
    cod_cidadao BIGINT NOT NULL,

    -- Código que descreve o tipo desta ação/evento.
    cod_acao INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_tipos_acao(cod_acao),

    -- Status da ação, para saber se está pendente, foi realizada, cancelada, etc.
    status_acao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status_acao IN ('PENDENTE', 'REALIZADA', 'CANCELADA')),

    -- Data em que a ação está agendada para acontecer. Para ações já realizadas, pode ser a mesma que data_realizacao.
    data_agendamento DATE,

    -- Data em que a ação foi efetivamente realizada. Fica NULO para ações pendentes.
    data_realizacao DATE,

    -- Campo para observações gerais sobre a ação.
    observacoes TEXT,

    -- Opcional, mas poderoso: Referência à ação que originou esta.
    cod_acao_origem INTEGER REFERENCES sistemaaps.tb_hiperdia_has_acompanhamento(cod_acompanhamento)
);

-- Adiciona um comentário explicando a relação com a view materializada.
COMMENT ON COLUMN sistemaaps.tb_hiperdia_has_acompanhamento.cod_cidadao IS 'Referencia o campo cod_paciente da view materializada sistemaaps.mv_hiperdia_hipertensao.';

-- Cria um índice na coluna cod_cidadao para acelerar as consultas que filtram por paciente.
CREATE INDEX idx_acompanhamento_cod_cidadao ON sistemaaps.tb_hiperdia_has_acompanhamento (cod_cidadao);


-- Criação da tabela para armazenar os resultados dos exames de MRPA
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_mrpa;

CREATE TABLE sistemaaps.tb_hiperdia_mrpa (
    -- Chave primária da tabela, com autoincremento para cada novo registro de MRPA.
    cod_mrpa SERIAL PRIMARY KEY,
    
    -- Chave estrangeira que liga este registro de MRPA ao registro de acompanhamento geral do paciente.
    -- A cláusula ON DELETE CASCADE garante que se o acompanhamento for deletado, os registros de MRPA associados também serão.
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_has_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    
    -- Data em que o exame de MRPA foi realizado ou finalizado.
    data_mrpa DATE,
    
    -- Valor médio da pressão arterial sistólica aferida no exame.
    media_pa_sistolica INTEGER,
    
    -- Valor médio da pressão arterial diastólica aferida no exame.
    media_pa_diastolica INTEGER,
    
    -- Campo de texto para a análise ou laudo do resultado do MRPA.
    analise_mrpa TEXT
);

-- Cria um índice na chave estrangeira para otimizar as consultas que juntam as duas tabelas.
CREATE INDEX idx_mrpa_cod_acompanhamento ON sistemaaps.tb_hiperdia_mrpa (cod_acompanhamento);

-- Criação da tabela para armazenar os detalhes das modificações de tratamento
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_tratamento;

CREATE TABLE sistemaaps.tb_hiperdia_tratamento (
    cod_tratamento SERIAL PRIMARY KEY,
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_has_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    tipo_ajuste VARCHAR(50), -- Ex: 'Aumento de dose', 'Troca de medicamento', etc.
    medicamentos_atuais TEXT,
    medicamentos_novos TEXT,
    data_modificacao DATE NOT NULL
);

-- Cria um índice na chave estrangeira para otimizar as consultas.
CREATE INDEX idx_tratamento_cod_acompanhamento ON sistemaaps.tb_hiperdia_tratamento (cod_acompanhamento);

-- Criação da tabela para armazenar os resultados dos exames laboratoriais
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_resultados_exames;

CREATE TABLE sistemaaps.tb_hiperdia_resultados_exames (
    cod_resultado_exame SERIAL PRIMARY KEY,
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_has_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    data_avaliacao DATE NOT NULL,
    colesterol_total INTEGER,
    hdl INTEGER,
    ldl INTEGER,
    triglicerideos INTEGER,
    glicemia_jejum INTEGER,
    hemoglobina_glicada NUMERIC(4, 2),
    ureia INTEGER,
    creatinina NUMERIC(4, 2),
    sodio INTEGER,
    potassio NUMERIC(3, 1),
    acido_urico NUMERIC(4, 2)
);

-- Cria um índice na chave estrangeira para otimizar as consultas.
CREATE INDEX idx_resultados_exames_cod_acompanhamento ON sistemaaps.tb_hiperdia_resultados_exames (cod_acompanhamento);

-- Criação da tabela para armazenar os resultados da avaliação de Risco Cardiovascular
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_risco_cv;

CREATE TABLE sistemaaps.tb_hiperdia_risco_cv (
    cod_risco_cv SERIAL PRIMARY KEY,
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_has_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    data_avaliacao DATE NOT NULL,
    idade INTEGER,
    sexo VARCHAR(10), -- 'Masculino' ou 'Feminino'
    tabagismo BOOLEAN,
    diabetes BOOLEAN,
    colesterol_total INTEGER,
    pressao_sistolica INTEGER
);

-- Cria um índice na chave estrangeira para otimizar as consultas.
CREATE INDEX idx_risco_cv_cod_acompanhamento ON sistemaaps.tb_hiperdia_risco_cv (cod_acompanhamento);

-- Criação da tabela para armazenar os detalhes da consulta de nutrição
DROP TABLE IF EXISTS sistemaaps.tb_hiperdia_nutricao;

CREATE TABLE sistemaaps.tb_hiperdia_nutricao (
    cod_nutricao SERIAL PRIMARY KEY,
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_has_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    data_avaliacao DATE NOT NULL,
    peso NUMERIC(5, 2),
    imc NUMERIC(4, 2),
    circunferencia_abdominal INTEGER,
    orientacoes_nutricionais TEXT
);

-- Cria um índice na chave estrangeira para otimizar as consultas.
CREATE INDEX idx_nutricao_cod_acompanhamento ON sistemaaps.tb_hiperdia_nutricao (cod_acompanhamento);
