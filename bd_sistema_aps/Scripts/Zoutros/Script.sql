SELECT
    c.co_seq_cidadao
FROM
    public.tb_cidadao c
JOIN
    public.tb_prontuario p
    ON p.co_cidadao = c.co_seq_cidadao
JOIN
    public.tb_cidadao_vinculacao_equipe ve
    ON ve.co_cidadao = c.co_seq_cidadao
JOIN
    public.tb_equipe e
    ON e.nu_ine = ve.nu_ine
LEFT JOIN
    public.tb_cds_cad_individual ci
    ON LOWER(TRIM(ci.no_cidadao_filtro)) = LOWER(TRIM(c.no_cidadao_filtro))
    AND ci.st_versao_atual = 1
WHERE
    c.st_ativo = 1 AND c.st_faleceu = 0
    AND c.no_sexo = 'FEMININO'
    AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) >= 14
    AND DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) <= 45)
GROUP BY
    c.co_seq_cidadao -- Agrupa por ID do cidadão, garantindo um único ID por grupo