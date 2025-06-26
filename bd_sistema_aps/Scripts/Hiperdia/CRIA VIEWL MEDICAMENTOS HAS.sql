-- Remove a view materializada se ela já existir, para evitar erros ao recriar.
DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_hiperdia_hipertensao_medicamentos;

-- Cria a nova view materializada no schema 'sistemaaps'
CREATE MATERIALIZED VIEW sistemaaps.mv_hiperdia_hipertensao_medicamentos AS

-- Inicia os Common Table Expressions (CTEs)
WITH 
-- CTE 1: Identifica todos os pacientes com diagnóstico ativo de Hipertensão.
PacientesHipertensos AS (
    SELECT DISTINCT
        tprob.co_prontuario
    FROM
        tb_problema tprob
    JOIN
        tb_problema_evolucao tprobevol
        ON tprobevol.co_seq_problema_evolucao = tprob.co_ultimo_problema_evolucao
    WHERE
        tprobevol.co_situacao_problema IN (0, 1) -- Problema Ativo ou Compensado
        AND (
            tprob.co_ciap IN (178, 179)
            OR (tprob.co_cid10 BETWEEN 3184 AND 3197)
            OR (tprob.co_cid10 BETWEEN 12969 AND 12972)
        )
),
-- CTE 2: Encontra a DATA MAIS RECENTE em que um medicamento anti-hipertensivo DE USO CONTÍNUO foi prescrito para cada paciente.
UltimaDataPrescricaoContinua AS (
    SELECT
        ta.co_prontuario,
        MAX(trm.dt_inicio_tratamento) as ultima_data
    FROM
        tb_receita_medicamento trm
    JOIN
        tb_atend ta ON trm.co_atend_prof = ta.co_atend_prof
    WHERE
        ta.co_prontuario IN (SELECT co_prontuario FROM PacientesHipertensos)
        -- NOVO FILTRO: Garante que estamos considerando apenas medicamentos de uso contínuo.
        AND trm.st_uso_continuo = 1
        -- Filtra para garantir que a data seja de uma prescrição que contenha um anti-hipertensivo.
        AND (
            trm.co_medicamento BETWEEN 195 AND 196 OR
            trm.co_medicamento BETWEEN 222 AND 224 OR
            trm.co_medicamento BETWEEN 276 AND 288 OR
            trm.co_medicamento BETWEEN 317 AND 323 OR
            trm.co_medicamento BETWEEN 372 AND 374 OR
            trm.co_medicamento BETWEEN 429 AND 431 OR
            trm.co_medicamento BETWEEN 454 AND 457 OR
            trm.co_medicamento BETWEEN 471 AND 472 OR
            trm.co_medicamento BETWEEN 542 AND 547 OR
            trm.co_medicamento BETWEEN 551 AND 554 OR
            trm.co_medicamento BETWEEN 600 AND 603 OR
            trm.co_medicamento BETWEEN 700 AND 702 OR
            trm.co_medicamento BETWEEN 787 AND 790 OR
            trm.co_medicamento BETWEEN 848 AND 850 OR
            trm.co_medicamento BETWEEN 1027 AND 1035 OR
            trm.co_medicamento BETWEEN 1114 AND 1118 OR
            trm.co_medicamento BETWEEN 1169 AND 1172 OR
            trm.co_medicamento BETWEEN 1228 AND 1229 OR
            trm.co_medicamento BETWEEN 1362 AND 1367 OR
            trm.co_medicamento BETWEEN 1479 AND 1484 OR
            trm.co_medicamento BETWEEN 1572 AND 1573 OR
            trm.co_medicamento BETWEEN 1614 AND 1617 OR
            trm.co_medicamento BETWEEN 1682 AND 1683 OR
            trm.co_medicamento BETWEEN 1768 AND 1769 OR
            trm.co_medicamento BETWEEN 1785 AND 1790 OR
            trm.co_medicamento BETWEEN 1867 AND 1868 OR
            trm.co_medicamento BETWEEN 1890 AND 1897 OR
            trm.co_medicamento BETWEEN 2111 AND 2118 OR
            trm.co_medicamento BETWEEN 2386 AND 2391 OR
            trm.co_medicamento BETWEEN 2411 AND 2417 OR
            trm.co_medicamento BETWEEN 2670 AND 2674 OR
            trm.co_medicamento BETWEEN 2723 AND 2724 OR
            trm.co_medicamento BETWEEN 2783 AND 2784 OR
            trm.co_medicamento BETWEEN 2846 AND 2862 OR
            trm.co_medicamento BETWEEN 2889 AND 2892 OR
            trm.co_medicamento BETWEEN 2937 AND 2938 OR
            trm.co_medicamento BETWEEN 3004 AND 3006 OR
            trm.co_medicamento BETWEEN 3156 AND 3157 OR
            trm.co_medicamento BETWEEN 3249 AND 3250 OR
            trm.co_medicamento BETWEEN 3268 AND 3269 OR
            trm.co_medicamento IN (199, 447, 516, 1085, 1165, 1668, 1688, 1803, 2258, 2934, 2942, 2957, 2987, 3068, 3179, 3218, 3301, 3343)
        )
    GROUP BY
        ta.co_prontuario
)
-- Consulta principal: Seleciona TODOS os medicamentos anti-hipertensivos de uso contínuo que foram prescritos NA ÚLTIMA DATA encontrada.
SELECT
    tc.co_seq_cidadao AS codcidadao,
    tp.co_seq_prontuario AS codprontuario,
    tc.no_cidadao AS nome_paciente,
    tm.no_principio_ativo AS medicamento,
    trm.qt_dose,
    trm.ds_frequencia_dose,
    trm.st_uso_continuo,
    trm.tp_frequencia_dose,
    trm.no_posologia AS posologia,
    trm.dt_inicio_tratamento
FROM
    tb_receita_medicamento trm
-- Junta as tabelas para conseguir chegar do medicamento ao prontuário e ao cidadão
JOIN
    tb_atend ta ON trm.co_atend_prof = ta.co_atend_prof
JOIN
    tb_prontuario tp ON ta.co_prontuario = tp.co_seq_prontuario
JOIN
    tb_cidadao tc ON tp.co_cidadao = tc.co_seq_cidadao
JOIN
    tb_medicamento tm ON trm.co_medicamento = tm.co_seq_medicamento
-- Junta com a CTE para ter acesso à última data de prescrição de cada paciente
JOIN
    UltimaDataPrescricaoContinua udpc ON ta.co_prontuario = udpc.co_prontuario
WHERE
    -- A CONDIÇÃO PRINCIPAL: A data do medicamento DEVE SER a última data de prescrição encontrada para aquele paciente.
    trm.dt_inicio_tratamento = udpc.ultima_data
    -- Assegura que o medicamento retornado é de uso contínuo
    AND trm.st_uso_continuo = 1
    -- Filtra novamente para garantir que estamos retornando apenas os medicamentos anti-hipertensivos prescritos naquela data.
    AND (
        trm.co_medicamento BETWEEN 195 AND 196 OR
        trm.co_medicamento BETWEEN 222 AND 224 OR
        trm.co_medicamento BETWEEN 276 AND 288 OR
        trm.co_medicamento BETWEEN 317 AND 323 OR
        trm.co_medicamento BETWEEN 372 AND 374 OR
        trm.co_medicamento BETWEEN 429 AND 431 OR
        trm.co_medicamento BETWEEN 454 AND 457 OR
        trm.co_medicamento BETWEEN 471 AND 472 OR
        trm.co_medicamento BETWEEN 542 AND 547 OR
        trm.co_medicamento BETWEEN 551 AND 554 OR
        trm.co_medicamento BETWEEN 600 AND 603 OR
        trm.co_medicamento BETWEEN 700 AND 702 OR
        trm.co_medicamento BETWEEN 787 AND 790 OR
        trm.co_medicamento BETWEEN 848 AND 850 OR
        trm.co_medicamento BETWEEN 1027 AND 1035 OR
        trm.co_medicamento BETWEEN 1114 AND 1118 OR
        trm.co_medicamento BETWEEN 1169 AND 1172 OR
        trm.co_medicamento BETWEEN 1228 AND 1229 OR
        trm.co_medicamento BETWEEN 1362 AND 1367 OR
        trm.co_medicamento BETWEEN 1479 AND 1484 OR
        trm.co_medicamento BETWEEN 1572 AND 1573 OR
        trm.co_medicamento BETWEEN 1614 AND 1617 OR
        trm.co_medicamento BETWEEN 1682 AND 1683 OR
        trm.co_medicamento BETWEEN 1768 AND 1769 OR
        trm.co_medicamento BETWEEN 1785 AND 1790 OR
        trm.co_medicamento BETWEEN 1867 AND 1868 OR
        trm.co_medicamento BETWEEN 1890 AND 1897 OR
        trm.co_medicamento BETWEEN 2111 AND 2118 OR
        trm.co_medicamento BETWEEN 2386 AND 2391 OR
        trm.co_medicamento BETWEEN 2411 AND 2417 OR
        trm.co_medicamento BETWEEN 2670 AND 2674 OR
        trm.co_medicamento BETWEEN 2723 AND 2724 OR
        trm.co_medicamento BETWEEN 2783 AND 2784 OR
        trm.co_medicamento BETWEEN 2846 AND 2862 OR
        trm.co_medicamento BETWEEN 2889 AND 2892 OR
        trm.co_medicamento BETWEEN 2937 AND 2938 OR
        trm.co_medicamento BETWEEN 3004 AND 3006 OR
        trm.co_medicamento BETWEEN 3156 AND 3157 OR
        trm.co_medicamento BETWEEN 3249 AND 3250 OR
        trm.co_medicamento BETWEEN 3268 AND 3269 OR
        trm.co_medicamento IN (199, 447, 516, 1085, 1165, 1668, 1688, 1803, 2258, 2934, 2942, 2957, 2987, 3068, 3179, 3218, 3301, 3343)
    );
