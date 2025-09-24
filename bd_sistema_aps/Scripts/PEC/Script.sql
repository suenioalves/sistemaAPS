CREATE MATERIALIZED VIEW sistemaaps.mv_plafam AS
WITH UltimaAtualizacaoCadIndividual AS (
    -- CTE para encontrar a última atualização de cadastro individual para cada cidadão
    SELECT
        ci.no_cidadao_filtro,
        ci.nu_micro_area,
        ci.st_versao_atual,
        ci.dt_cad_individual,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(ci.no_cidadao_filtro))
            ORDER BY ci.dt_cad_individual DESC, ci.co_seq_cds_cad_individual DESC
        ) as rn
    FROM
        tb_cds_cad_individual ci
    WHERE
        ci.st_versao_atual = 1
        and ci.dt_obito is null
),
MulheresNaFaixaEtariaRanked AS (
    -- CTE auxiliar: Rankeia múltiplas vinculações de equipe para o mesmo cidadão
    SELECT
        c.co_seq_cidadao AS cod_paciente,
        UPPER(c.no_cidadao_filtro) AS nome_paciente,
        c.no_mae as nome_responsavel,
        c.nu_cns AS cartao_sus,
        DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada,
        e.no_equipe AS nome_equipe,
        CASE
            WHEN ua.nu_micro_area ~ '^\d+$' THEN ua.nu_micro_area::int
            ELSE 0
        END AS microarea,
        c.dt_nascimento,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY 
                cve.dt_atualizacao_cadastro DESC NULLS LAST,  -- Atualização mais recente primeiro
                e.no_equipe ASC,        -- Se datas iguais, equipe por ordem alfabética
                cve.co_seq_cidadao_vinculacao_eqp DESC -- Desempate final por ID
        ) as rn_vinculacao
    FROM
        tb_cidadao c
    JOIN
        tb_cidadao_vinculacao_equipe cve
        ON c.co_seq_cidadao = cve.co_cidadao
    JOIN
        tb_equipe e
        ON e.nu_ine = cve.nu_ine
    LEFT JOIN
        UltimaAtualizacaoCadIndividual ua
        ON LOWER(TRIM(COALESCE(ua.no_cidadao_filtro, ''))) = LOWER(TRIM(COALESCE(c.no_cidadao_filtro, '')))
        AND ua.rn = 1
    WHERE
        c.st_ativo = 1
        AND c.st_faleceu = 0
        AND c.no_sexo = 'FEMININO'
        AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) >= 14
        AND DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) <= 45)
        AND e.st_ativo = 1
),
MulheresNaFaixaEtariaBase AS (
    -- CTE 1: Seleciona apenas uma vinculação por cidadão (a mais recente)
    SELECT 
        cod_paciente,
        nome_paciente,
        nome_responsavel,
        cartao_sus,
        idade_calculada,
        nome_equipe,
        microarea,
        dt_nascimento
    FROM 
        MulheresNaFaixaEtariaRanked
    WHERE 
        rn_vinculacao = 1  -- Pega apenas a vinculação mais recente para cada cidadão
)

select * from 