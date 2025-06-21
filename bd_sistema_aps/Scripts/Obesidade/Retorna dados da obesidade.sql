WITH classificacao_imc AS (
    SELECT 
        tc.co_seq_cidadao AS codigo,
        tam.nu_medicao_imc::NUMERIC AS imc, -- Conversão para NUMERIC
        CASE 
            WHEN tam.nu_medicao_imc::NUMERIC BETWEEN 25 AND 29.9 THEN 'Sobrepeso (IMC entre 25 e 29.9)'
            WHEN tam.nu_medicao_imc::NUMERIC BETWEEN 30 AND 34.9 THEN 'Obesidade Grau 1 (IMC entre 30 e 34.9)'
            WHEN tam.nu_medicao_imc::NUMERIC BETWEEN 35 AND 39.9 THEN 'Obesidade Grau 2 (IMC entre 35 e 39.9)'
            WHEN tam.nu_medicao_imc::NUMERIC >= 40 THEN 'Obesidade Grau 3 - Morbida - IMC acima de 40)'
            ELSE 'Abaixo do peso ou normal'
        END AS classificacao
    FROM tb_cidadao tc
    LEFT JOIN tb_prontuario tp 
        ON tc.co_seq_cidadao = tp.co_cidadao 
    LEFT JOIN tb_atend ta 
        ON ta.co_prontuario = tp.co_seq_prontuario  
    LEFT JOIN ta_medicao tam 
        ON tam.co_atend_prof = ta.co_atend_prof
    WHERE 
        tam.nu_medicao_imc IS NOT NULL
)
SELECT 
    classificacao,
    COUNT(*) AS total_pacientes,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS porcentagem
FROM classificacao_imc
GROUP BY classificacao
ORDER BY 
    CASE 
        WHEN classificacao = 'Sobrepeso (IMC entre 25 e 29.9)' THEN 1
        WHEN classificacao = 'Obesidade Grau 1 (IMC entre 30 e 34.9)' THEN 2
        WHEN classificacao = 'Obesidade Grau 2 (IMC entre 35 e 39.9)' THEN 3
        WHEN classificacao = 'Obesidade Grau 3 - Morbida - IMC acima de 40)' THEN 4
        ELSE 5
    END;