-- retorna a ultima glicemia do paciente
WITH ranked_glicemias AS (
    SELECT 
        tc.co_seq_cidadao AS codigo,
        tc.no_cidadao AS nome,
        tam.dt_medicao AS data_medicao,
        tam.nu_medicao_glicemia::NUMERIC AS glicemia,
        ROW_NUMBER() OVER (
            PARTITION BY tc.co_seq_cidadao 
            ORDER BY tam.nu_medicao_glicemia::NUMERIC DESC
        ) AS rn  -- Numera as linhas de cada paciente
    FROM tb_cidadao tc
    LEFT JOIN tb_prontuario tp 
        ON tc.co_seq_cidadao = tp.co_cidadao 
    LEFT JOIN tb_atend ta 
        ON ta.co_prontuario = tp.co_seq_prontuario  
    LEFT JOIN ta_medicao tam 
        ON tam.co_atend_prof = ta.co_atend_prof
    WHERE 
        tam.nu_medicao_glicemia IS NOT NULL
        AND tam.nu_medicao_glicemia::NUMERIC > 126  -- Filtra glicemias acima de 126
        AND tam.dt_medicao >= NOW() - INTERVAL '12 months'  -- Filtra os últimos 12 meses
)
SELECT 
    codigo,
    nome,
    data_medicao,
    glicemia
FROM ranked_glicemias
WHERE rn = 1  -- Filtra apenas a maior glicemia de cada paciente
ORDER BY 
    glicemia DESC;  -- Ordena pela maior glicemia