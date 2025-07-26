SELECT 
    tc.co_seq_cidadao AS codigo,
    tc.no_cidadao AS nome,
    tam.dt_medicao AS data_medicao,
    tam.nu_medicao_glicemia::NUMERIC AS glicemia  -- Conversão para NUMERIC
FROM tb_cidadao tc
LEFT JOIN tb_prontuario tp 
    ON tc.co_seq_cidadao = tp.co_cidadao 
LEFT JOIN tb_atend ta 
    ON ta.co_prontuario = tp.co_seq_prontuario  
LEFT JOIN ta_medicao tam 
    ON tam.co_atend_prof = ta.co_atend_prof
WHERE 
    tam.nu_medicao_glicemia IS NOT NULL
    AND tam.nu_medicao_glicemia::NUMERIC > 126  -- Conversão e comparação
    AND tam.dt_medicao >= NOW() - INTERVAL '12 months'  -- Filtra apenas os últimos 12 meses
ORDER BY 
    tc.no_cidadao,  -- Agrupa por paciente (ordenação alfabética)
    tam.dt_medicao DESC;  -- Dentro de cada paciente, ordena pela data mais recente