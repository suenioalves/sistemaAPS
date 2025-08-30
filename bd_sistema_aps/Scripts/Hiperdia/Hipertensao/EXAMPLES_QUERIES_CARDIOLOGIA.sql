-- Exemplos de consultas SQL para a funcionalidade de Cardiologia no módulo HIPERDIA - Hipertensos
-- Este arquivo contém consultas úteis para relatórios e análises dos dados de cardiologia
-- Data de criação: 2024-12-19
-- Autor: Sistema APS - Módulo HIPERDIA

-- ===================================================================================
-- 1. CONSULTA GERAL: Histórico completo de cardiologia de um paciente específico
-- ===================================================================================
/*
SELECT 
    c.cod_cardiologia,
    c.cod_cidadao,
    c.tipo_acao,
    ta.dsc_acao as acao_descricao,
    c.data_acao,
    c.profissional_responsavel,
    c.observacoes,
    c.consulta_cardiologia,
    c.recomendacoes_cardiologia,
    c.tipo_consulta,
    c.created_at as data_registro
FROM sistemaaps.tb_hiperdia_has_cardiologia c
LEFT JOIN sistemaaps.tb_hiperdia_tipos_acao ta ON c.tipo_acao = ta.cod_acao
WHERE c.cod_cidadao = :cod_cidadao_parametro
ORDER BY c.data_acao DESC, c.created_at DESC;
*/

-- ===================================================================================
-- 2. RELATÓRIO: Encaminhamentos para cardiologia pendentes de retorno
-- ===================================================================================
/*
SELECT DISTINCT
    enc.cod_cidadao,
    enc.data_acao as data_encaminhamento,
    enc.profissional_responsavel as prof_encaminhou,
    enc.observacoes as motivo_encaminhamento,
    CASE 
        WHEN reg.cod_cidadao IS NULL THEN 'PENDENTE'
        ELSE 'REALIZADA'
    END as status_consulta,
    reg.data_acao as data_consulta_realizada
FROM sistemaaps.tb_hiperdia_has_cardiologia enc
LEFT JOIN sistemaaps.tb_hiperdia_has_cardiologia reg 
    ON enc.cod_cidadao = reg.cod_cidadao 
    AND reg.tipo_acao = 11 
    AND reg.data_acao >= enc.data_acao
WHERE enc.tipo_acao = 10  -- Encaminhamentos
ORDER BY enc.data_acao DESC;
*/

-- ===================================================================================
-- 3. DASHBOARD: Resumo estatístico dos encaminhamentos e consultas
-- ===================================================================================
/*
SELECT 
    COUNT(*) FILTER (WHERE tipo_acao = 10) as total_encaminhamentos,
    COUNT(*) FILTER (WHERE tipo_acao = 11) as total_consultas_registradas,
    COUNT(DISTINCT cod_cidadao) as pacientes_unicos,
    COUNT(*) FILTER (WHERE tipo_acao = 10 AND data_acao >= CURRENT_DATE - INTERVAL '30 days') as encaminhamentos_ultimo_mes,
    COUNT(*) FILTER (WHERE tipo_acao = 11 AND data_acao >= CURRENT_DATE - INTERVAL '30 days') as consultas_ultimo_mes,
    COUNT(*) FILTER (WHERE tipo_consulta = 'Telemedicina') as consultas_telemedicina,
    COUNT(*) FILTER (WHERE tipo_consulta = 'Presencial') as consultas_presenciais
FROM sistemaaps.tb_hiperdia_has_cardiologia;
*/

-- ===================================================================================
-- 4. RELATÓRIO: Pacientes com encaminhamento mas sem registro de consulta
-- ===================================================================================
/*
SELECT 
    enc.cod_cidadao,
    MIN(enc.data_acao) as primeira_data_encaminhamento,
    MAX(enc.data_acao) as ultima_data_encaminhamento,
    COUNT(enc.cod_cardiologia) as total_encaminhamentos,
    CURRENT_DATE - MAX(enc.data_acao) as dias_desde_ultimo_encaminhamento
FROM sistemaaps.tb_hiperdia_has_cardiologia enc
WHERE enc.tipo_acao = 10  -- Apenas encaminhamentos
AND NOT EXISTS (
    SELECT 1 
    FROM sistemaaps.tb_hiperdia_has_cardiologia reg 
    WHERE reg.cod_cidadao = enc.cod_cidadao 
    AND reg.tipo_acao = 11  -- Registro de consulta
)
GROUP BY enc.cod_cidadao
ORDER BY ultima_data_encaminhamento DESC;
*/

-- ===================================================================================
-- 5. ANÁLISE: Tempo médio entre encaminhamento e realização da consulta
-- ===================================================================================
/*
WITH encaminhamentos_com_consulta AS (
    SELECT 
        enc.cod_cidadao,
        enc.data_acao as data_encaminhamento,
        MIN(reg.data_acao) as data_primeira_consulta
    FROM sistemaaps.tb_hiperdia_has_cardiologia enc
    INNER JOIN sistemaaps.tb_hiperdia_has_cardiologia reg 
        ON enc.cod_cidadao = reg.cod_cidadao 
        AND reg.tipo_acao = 11  -- Registro de consulta
        AND reg.data_acao >= enc.data_acao
    WHERE enc.tipo_acao = 10  -- Encaminhamentos
    GROUP BY enc.cod_cidadao, enc.data_acao
)
SELECT 
    COUNT(*) as total_casos,
    ROUND(AVG(data_primeira_consulta - data_encaminhamento), 1) as dias_medio_espera,
    MIN(data_primeira_consulta - data_encaminhamento) as menor_tempo_espera,
    MAX(data_primeira_consulta - data_encaminhamento) as maior_tempo_espera,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY data_primeira_consulta - data_encaminhamento) as mediana_espera
FROM encaminhamentos_com_consulta;
*/

-- ===================================================================================
-- 6. LISTA: Pacientes com múltiplos encaminhamentos ou consultas
-- ===================================================================================
/*
SELECT 
    cod_cidadao,
    COUNT(*) FILTER (WHERE tipo_acao = 10) as total_encaminhamentos,
    COUNT(*) FILTER (WHERE tipo_acao = 11) as total_consultas,
    MIN(data_acao) as primeira_data,
    MAX(data_acao) as ultima_data,
    STRING_AGG(DISTINCT profissional_responsavel, ', ' ORDER BY profissional_responsavel) as profissionais_envolvidos
FROM sistemaaps.tb_hiperdia_has_cardiologia
GROUP BY cod_cidadao
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, ultima_data DESC;
*/

-- ===================================================================================
-- 7. RELATÓRIO: Atividade por profissional na cardiologia
-- ===================================================================================
/*
SELECT 
    profissional_responsavel,
    COUNT(*) as total_acoes,
    COUNT(*) FILTER (WHERE tipo_acao = 10) as encaminhamentos_feitos,
    COUNT(*) FILTER (WHERE tipo_acao = 11) as registros_feitos,
    COUNT(DISTINCT cod_cidadao) as pacientes_diferentes,
    MIN(data_acao) as primeira_acao,
    MAX(data_acao) as ultima_acao
FROM sistemaaps.tb_hiperdia_has_cardiologia
WHERE profissional_responsavel IS NOT NULL 
AND profissional_responsavel != ''
GROUP BY profissional_responsavel
ORDER BY total_acoes DESC;
*/

-- ===================================================================================
-- 8. VISTA: Integração com dados do acompanhamento geral
-- ===================================================================================
/*
SELECT 
    a.cod_acompanhamento,
    a.cod_cidadao,
    a.data_agendamento as data_acompanhamento,
    a.status_acao as status_acompanhamento,
    c.tipo_acao as tipo_acao_cardiologia,
    ta.dsc_acao as descricao_acao_cardiologia,
    c.data_acao as data_acao_cardiologia,
    c.profissional_responsavel,
    c.consulta_cardiologia,
    c.recomendacoes_cardiologia
FROM sistemaaps.tb_hiperdia_has_acompanhamento a
INNER JOIN sistemaaps.tb_hiperdia_has_cardiologia c 
    ON a.cod_acompanhamento = c.cod_acompanhamento
LEFT JOIN sistemaaps.tb_hiperdia_tipos_acao ta 
    ON c.tipo_acao = ta.cod_acao
WHERE a.cod_acao IN (10, 11)  -- Apenas acompanhamentos relacionados à cardiologia
ORDER BY a.cod_cidadao, c.data_acao DESC;
*/

-- ===================================================================================
-- 9. PROCEDIMENTO: Buscar último encaminhamento/consulta de um paciente
-- ===================================================================================
/*
CREATE OR REPLACE FUNCTION sistemaaps.get_ultima_acao_cardiologia(p_cod_cidadao BIGINT)
RETURNS TABLE (
    cod_cardiologia INTEGER,
    tipo_acao INTEGER,
    descricao_acao VARCHAR(100),
    data_acao DATE,
    profissional_responsavel VARCHAR(100),
    observacoes TEXT,
    consulta_cardiologia TEXT,
    recomendacoes_cardiologia TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.cod_cardiologia,
        c.tipo_acao,
        ta.dsc_acao,
        c.data_acao,
        c.profissional_responsavel,
        c.observacoes,
        c.consulta_cardiologia,
        c.recomendacoes_cardiologia
    FROM sistemaaps.tb_hiperdia_has_cardiologia c
    LEFT JOIN sistemaaps.tb_hiperdia_tipos_acao ta ON c.tipo_acao = ta.cod_acao
    WHERE c.cod_cidadao = p_cod_cidadao
    ORDER BY c.data_acao DESC, c.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT * FROM sistemaaps.get_ultima_acao_cardiologia(123456);
*/