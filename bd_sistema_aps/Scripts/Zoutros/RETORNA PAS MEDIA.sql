SELECT 
    tc.co_seq_cidadao AS codigo,
    tc.no_cidadao AS nome,
    tc.dt_nascimento as dt_nascimento,
    COUNT(*) AS num_afericoes,
    CEIL(AVG(CAST(split_part(tbm.nu_medicao_pressao_arterial, '/', 1) AS NUMERIC))) AS PA_sistolica_media,
    CEIL(AVG(CAST(split_part(tbm.nu_medicao_pressao_arterial, '/', 2) AS NUMERIC))) AS PA_diastolica_media
FROM tb_cidadao tc
LEFT JOIN tb_prontuario tp 
    ON tc.co_seq_cidadao = tp.co_cidadao 
LEFT JOIN tb_atend ta 
    ON ta.co_prontuario = tp.co_seq_prontuario  
LEFT JOIN tb_medicao tbm 
    ON tbm.co_atend_prof = ta.co_atend_prof
WHERE 
    tbm.nu_medicao_pressao_arterial IS NOT NULL
    AND tbm.dt_medicao >= CURRENT_DATE - INTERVAL '6 months'
    AND
    tc.dt_atualizado = (
        SELECT
            MAX(sub_tc.dt_atualizado)
        FROM
            tb_cidadao sub_tc
        WHERE
            sub_tc.co_seq_cidadao = tc.co_seq_cidadao
            AND sub_tc.st_ativo = 1
    )
    GROUP BY 
    tc.co_seq_cidadao, 
    tc.no_cidadao
ORDER BY 
    PA_sistolica_media DESC, 
    PA_diastolica_media DESC;
