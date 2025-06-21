SELECT 
    COUNT(DISTINCT tappn.co_unico_pre_natal) AS total_partos
FROM 
    tb_atend_prof_pre_natal tappn
WHERE 
    tappn.st_gravidez_planejada IS NOT NULL;
