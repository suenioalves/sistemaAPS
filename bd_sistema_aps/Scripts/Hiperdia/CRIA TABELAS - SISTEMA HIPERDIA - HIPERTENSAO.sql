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
    
    -- Código para identificar a última ação realizada no acompanhamento (ex: 1 = consulta, 2 = exame, 3 = MRPA).
    cod_acao_atual INTEGER REFERENCES sistemaaps.tb_hiperdia_tipos_acao(cod_acao),
       
    -- Data em que a última ação foi realizada.
    data_acao_atual DATE,
    
    -- Código para identificar a próxima ação planejada para o paciente.
    cod_proxima_acao INTEGER REFERENCES sistemaaps.tb_hiperdia_tipos_acao(cod_acao),
    
    -- Data em que a próxima ação está agendada.
    data_proxima_acao DATE
); -- <<< CORREÇÃO: Adicionado ponto e vírgula para finalizar o comando CREATE TABLE.

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
