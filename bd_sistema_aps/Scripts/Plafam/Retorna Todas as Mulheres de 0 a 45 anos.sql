SELECT 
    c.co_seq_cidadao,-- Garante uma única linha por cidadão
    UPPER(c.no_cidadao_filtro) AS nome_mulher,
    c.nu_cns AS cns,
    c.dt_nascimento AS data_nascimento,
    e.no_equipe AS nome_equipe,
    ve.nu_ine,
    CASE
        WHEN ci.nu_micro_area ~ '^\d+$' THEN ci.nu_micro_area::int
        ELSE 0
    END AS microarea
FROM
    tb_cidadao c
JOIN
    tb_prontuario p
    ON p.co_cidadao = c.co_seq_cidadao
JOIN
    tb_cidadao_vinculacao_equipe ve
    ON ve.co_cidadao = c.co_seq_cidadao
JOIN
    tb_equipe e
    ON e.nu_ine = ve.nu_ine
LEFT JOIN
    tb_cds_cad_individual ci
    ON LOWER(TRIM(ci.no_cidadao_filtro)) = LOWER(TRIM(c.no_cidadao_filtro))
    AND ci.st_versao_atual = 1
WHERE
    c.st_ativo = 1 AND c.st_faleceu = 0
    AND c.no_sexo = 'FEMININO'
    AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) >= 14
    AND DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) <= 45)