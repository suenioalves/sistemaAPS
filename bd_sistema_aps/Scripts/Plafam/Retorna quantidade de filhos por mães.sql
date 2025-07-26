SELECT 
    m.no_cidadao_filtro AS nome_mae, 
    m.dt_nascimento AS data_nascimento_mae, 
    e.no_equipe AS nome_equipe,
    CASE 
        WHEN ci.nu_micro_area ~ '^\d+$' THEN ci.nu_micro_area::int
        ELSE 0
    END AS micro_area_mae,
    COUNT(DISTINCT c.no_cidadao_filtro) AS numero_de_filhos,
    STRING_AGG(DISTINCT c.no_cidadao_filtro, '; ') AS nomes_dos_filhos
FROM 
    tb_cidadao c
JOIN 
    tb_cidadao m 
    ON c.no_mae_filtro = m.no_cidadao_filtro  
    AND m.st_ativo = 1
JOIN 
    tb_cidadao_vinculacao_equipe ve 
    ON ve.co_cidadao = m.co_seq_cidadao
JOIN 
    tb_equipe e 
    ON e.nu_ine = ve.nu_ine
LEFT JOIN 
    tb_cds_cad_individual ci 
    ON LOWER(TRIM(ci.no_cidadao_filtro)) = LOWER(TRIM(m.no_cidadao_filtro))
    AND ci.st_versao_atual = 1
WHERE 
    c.st_ativo = 1
GROUP BY 
    m.no_cidadao_filtro, m.dt_nascimento, e.no_equipe, ci.nu_micro_area
ORDER BY 
    numero_de_filhos DESC, nome_mae;
