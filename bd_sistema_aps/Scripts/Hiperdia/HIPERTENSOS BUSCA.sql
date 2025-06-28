-- Remove a view materializada se ela já existir, para evitar erros ao recriar.
DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_hiperdia_hipertensao;

-- Cria a nova view materializada no schema 'sistemaaps'
CREATE MATERIALIZED VIEW sistemaaps.mv_hiperdia_hipertensao AS

-- Inicia os Common Table Expressions (CTEs)
WITH 
-- CTE 1: Busca a última atualização do cadastro individual (lógica existente).
UltimaAtualizacaoCadIndividual AS (
    SELECT
        ci.no_cidadao_filtro,
        ci.nu_micro_area,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(ci.no_cidadao_filtro))
            ORDER BY ci.dt_cad_individual DESC, ci.co_seq_cds_cad_individual DESC
        ) as rn
    FROM
        tb_cds_cad_individual ci
    WHERE
        ci.st_versao_atual = 1
)

-- Início da consulta principal que define os dados da view
SELECT DISTINCT ON (c.co_seq_cidadao) -- Garante que cada paciente apareça apenas uma vez
    c.co_seq_cidadao AS cod_paciente,
    UPPER(c.no_cidadao) AS nome_paciente,
    c.nu_cns AS cartao_sus,
    DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada,
    e.no_equipe AS nome_equipe,
    -- Converte o número da microárea para inteiro, tratando casos não numéricos
    CASE
        WHEN ua.nu_micro_area ~ '^\d+$' THEN ua.nu_micro_area::int
        ELSE 0
    END AS microarea,
    c.dt_nascimento,
    c.no_sexo as sexo,
    tprob.co_ciap AS ciap_cronico,
    tprob.co_cid10 AS cid10_cronico,
    tprobevol.co_situacao_problema as situacao_problema

FROM
    tb_cidadao c
JOIN
    tb_cidadao_vinculacao_equipe cve ON c.co_seq_cidadao = cve.co_cidadao
JOIN
    tb_equipe e ON e.nu_ine = cve.nu_ine
LEFT JOIN
    UltimaAtualizacaoCadIndividual ua ON LOWER(TRIM(COALESCE(c.no_cidadao_filtro, ''))) = LOWER(TRIM(COALESCE(ua.no_cidadao_filtro, ''))) AND ua.rn = 1
LEFT JOIN 
    tb_prontuario tp ON c.co_seq_cidadao = tp.co_cidadao
LEFT JOIN 
    tb_problema tprob ON tprob.co_prontuario = tp.co_seq_prontuario
LEFT JOIN 
    tb_problema_evolucao tprobevol ON tprobevol.co_seq_problema_evolucao = tprob.co_ultimo_problema_evolucao

WHERE
    c.st_ativo = 1
    AND c.st_faleceu = 0
    AND e.st_ativo = 1
    AND (
        (tprob.co_ciap IN (178, 179))
        OR 
        (tprob.co_cid10 BETWEEN 3184 AND 3197)
        OR
        (tprob.co_cid10 BETWEEN 12969 AND 12972)
    )
    AND (tprobevol.co_situacao_problema IN (0, 1))

ORDER BY
    c.co_seq_cidadao,
    e.no_equipe;
