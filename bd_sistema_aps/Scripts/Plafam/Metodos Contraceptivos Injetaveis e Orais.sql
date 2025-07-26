SELECT
    tc.co_seq_cidadao AS codigo,
    CASE  
        WHEN tm.no_principio_ativo LIKE '%Etinilestradiol%' THEN 'pilulas'
        WHEN tm.no_principio_ativo = 'Noretisterona, Enantato de + Estradiol, Valerato de'  
             AND tm.co_forma_farmaceutica = 82 THEN 'mensal'
        WHEN tm.no_principio_ativo = 'Medroxiprogesterona, Acetato'  
             AND tm.co_forma_farmaceutica = 82 THEN 'trimestral'
    END AS metodo,

    TO_CHAR(MAX(ta.dt_inicio), 'DD/MM/YYYY') AS dataaplicacao  -- Formato brasileiro
FROM tb_cidadao tc
LEFT JOIN tb_prontuario tp 
    ON tc.co_seq_cidadao = tp.co_cidadao 
LEFT JOIN tb_atend ta 
    ON ta.co_prontuario = tp.co_seq_prontuario  
LEFT JOIN tb_receita_medicamento trm 
    ON trm.co_atend_prof = ta.co_atend_prof 
LEFT JOIN tb_medicamento tm 
    ON tm.co_seq_medicamento = trm.co_medicamento
    AND (
        tm.no_principio_ativo LIKE '%Etinilestradiol%' 
        OR tm.no_principio_ativo = 'Noretisterona, Enantato de + Estradiol, Valerato de'
        OR tm.no_principio_ativo = 'Medroxiprogesterona, Acetato'
    )
LEFT JOIN tb_evolucao_plano tep 
    ON tep.co_atend_prof = ta.co_atend_prof 
WHERE 
    tc.no_sexo = 'FEMININO'  
    AND EXTRACT(YEAR FROM AGE(tc.dt_nascimento)) > 14
    AND EXTRACT(YEAR FROM AGE(tc.dt_nascimento)) < 45
    AND tm.co_forma_farmaceutica IS NOT NULL
GROUP BY 
    tc.co_seq_cidadao, tc.no_cidadao, tc.dt_nascimento, tc.nu_cpf, tc.nu_cns,
    tm.no_principio_ativo, tm.co_forma_farmaceutica
ORDER BY 
    MAX(ta.dt_inicio) DESC;

