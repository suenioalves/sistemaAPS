-- retorna o numero de gestantes por quadrimestre
SELECT 
    EXTRACT(YEAR FROM ultima_dum) AS ano,
    CASE 
        WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 1 AND 4 THEN '1º Quadrimestre'
        WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 5 AND 8 THEN '2º Quadrimestre'
        WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 9 AND 12 THEN '3º Quadrimestre'
    END AS quadrimestre,
    COUNT(*) AS total_gestantes
FROM (
    SELECT 
        co_prontuario,
        MAX(dt_ultima_menstruacao) AS ultima_dum
    FROM 
        tb_pre_natal
    WHERE 
        dt_ultima_menstruacao BETWEEN '2022-01-01' AND CURRENT_DATE
    GROUP BY 
        co_prontuario
) AS sub
GROUP BY 
    ano, quadrimestre
ORDER BY 
    ano, quadrimestre;
