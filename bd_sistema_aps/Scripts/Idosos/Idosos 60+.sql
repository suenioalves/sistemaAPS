SELECT 
    tc.no_cidadao,
    EXTRACT(YEAR FROM AGE(tc.dt_nascimento))
FROM tb_cidadao tc
WHERE 
    EXTRACT(YEAR FROM AGE(tc.dt_nascimento)) >= 60
    AND tc.st_ativo = 1