SELECT * FROM (
    SELECT DISTINCT ON (tc.co_seq_cidadao) 
        tc.co_seq_cidadao AS codigo,
        tc.no_cidadao AS nome,
        tam.dt_medicao AS data_medicao,
        tam.nu_medicao_imc AS imc,
        tam.nu_medicao_peso as peso,
        tam.nu_medicao_altura as altura
    FROM tb_cidadao tc
    LEFT JOIN tb_prontuario tp 
        ON tc.co_seq_cidadao = tp.co_cidadao 
    LEFT JOIN tb_atend ta 
        ON ta.co_prontuario = tp.co_seq_prontuario  
    LEFT JOIN ta_medicao tam 
        ON tam.co_atend_prof = ta.co_atend_prof
    WHERE 
        tam.nu_medicao_imc IS NOT NULL
    ORDER BY 
        tc.co_seq_cidadao, tam.dt_medicao DESC
) subquery
ORDER BY imc DESC;
