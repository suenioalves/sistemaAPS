-- Remove a view materializada se ela já existir, para evitar erros ao recriar.
DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_hiperdia_afericoes_pa;

-- Cria a nova view materializada, otimizada para performance.
CREATE MATERIALIZED VIEW sistemaaps.mv_hiperdia_afericoes_pa AS

SELECT
    -- Colunas de retorno simplificadas conforme solicitado.
    c.co_seq_cidadao AS cod_paciente,
    tam.dt_medicao AS data_afericao,
    -- Extrai o valor da pressão sistólica (antes da barra) e converte para inteiro.
    CAST(split_part(tam.nu_medicao_pressao_arterial, '/', 1) AS INTEGER) AS pa_sistolica,
    -- Extrai o valor da pressão diastólica (depois da barra) e converte para inteiro.
    CAST(split_part(tam.nu_medicao_pressao_arterial, '/', 2) AS INTEGER) AS pa_diastolica
FROM
    -- A consulta agora começa pela tabela de problemas, que é o principal filtro.
    tb_problema tprob
-- Garante que o problema está ativo ou compensado.
JOIN 
    tb_problema_evolucao tprobevol 
    ON tprobevol.co_seq_problema_evolucao = tprob.co_ultimo_problema_evolucao
    AND tprobevol.co_situacao_problema IN (0, 1)
-- Junta com os atendimentos e medições para buscar as aferições.
JOIN
    tb_atend ta ON ta.co_prontuario = tprob.co_prontuario
JOIN
    tb_medicao tam ON tam.co_atend_prof = ta.co_atend_prof
-- Junta com o prontuário e o cidadão para obter o código do paciente e seu status.
JOIN
    tb_prontuario tp ON tprob.co_prontuario = tp.co_seq_prontuario
JOIN
    tb_cidadao c ON tp.co_cidadao = c.co_seq_cidadao

WHERE
    -- Filtro principal para identificar os pacientes hipertensos.
    (
        (tprob.co_ciap IN (178, 179))
        OR 
        (tprob.co_cid10 BETWEEN 3184 AND 3197)
        OR
        (tprob.co_cid10 BETWEEN 12969 AND 12972)
    )
    -- Filtra medições ocorridas nos últimos 6 meses.
    AND tam.dt_medicao >= CURRENT_DATE - INTERVAL '6 months'
    -- Garante que o campo de PA não está nulo e tem o formato esperado ('120/80').
    AND tam.nu_medicao_pressao_arterial IS NOT NULL
    AND tam.nu_medicao_pressao_arterial LIKE '%/%'
    -- Filtros gerais de elegibilidade do cidadão.
    AND c.st_ativo = 1
    AND c.st_faleceu = 0

ORDER BY
    c.co_seq_cidadao,
    tam.dt_medicao DESC;
