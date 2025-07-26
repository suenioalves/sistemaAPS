WITH PacientesDIU AS (
    SELECT
        c.co_seq_cidadao AS cod_paciente,
        UPPER(c.no_cidadao) AS nome_paciente,
        c.nu_cns AS cartao_sus,
        DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada,
        e.no_equipe AS nome_equipe,
        CASE
            WHEN ci.nu_micro_area ~ '^\d+$' THEN ci.nu_micro_area::int
            ELSE 0
        END AS microarea,
        'DIU' AS metodo,
        TO_CHAR(tepc.dt_auditoria, 'DD/MM/YYYY') AS data_aplicacao,
        -- Adiciona um número de linha para cada procedimento do cidadão,
        -- ordenado pela data de auditoria mais recente.
        ROW_NUMBER() OVER (PARTITION BY c.co_seq_cidadao ORDER BY tepc.dt_auditoria DESC) as rn
    FROM
        tb_cidadao c
    JOIN
        tb_cidadao_vinculacao_equipe cve
        ON c.co_seq_cidadao = cve.co_cidadao
    JOIN
        tb_equipe e
        ON cve.nu_ine = e.nu_ine
    LEFT JOIN
        tb_cds_cad_individual ci
        ON LOWER(TRIM(ci.no_cidadao_filtro)) = LOWER(TRIM(c.no_cidadao_filtro))
        AND ci.st_versao_atual = 1
    JOIN
        tb_prontuario tp
        ON tp.co_cidadao = c.co_seq_cidadao
    JOIN
        tb_atend ta
        ON ta.co_prontuario = tp.co_seq_prontuario
    JOIN
        ta_evolucao_plano_ciap tepc
        ON tepc.co_atend_prof = ta.co_atend_prof
    WHERE
        c.st_ativo = 1
        AND c.st_faleceu = 0
        AND c.no_sexo = 'FEMININO'
        AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) >= 14
        AND DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) <= 45)
        AND e.st_ativo = 1
        AND tepc.co_proced = 4807
        AND NOT EXISTS (
            SELECT 1
            FROM ta_evolucao_plano_ciap tepc2
            JOIN tb_atend ta2 ON ta2.co_atend_prof = tepc2.co_atend_prof
            JOIN tb_prontuario tp2 ON tp2.co_seq_prontuario = ta2.co_prontuario
            WHERE tepc2.co_proced = 4808
              AND tp2.co_cidadao = c.co_seq_cidadao
        )
)
SELECT
    cod_paciente,
    nome_paciente,
    cartao_sus,
    idade_calculada,
    nome_equipe,
    microarea,
    metodo,
    data_aplicacao
FROM
    PacientesDIU
WHERE
    rn = 1 -- Seleciona apenas o registro mais recente para cada paciente
    ; -- Retorna apenas os 20 primeiros