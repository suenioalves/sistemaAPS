SELECT 
    c.no_cidadao AS nome,

    -- CPF formatado
    CASE 
        WHEN c.nu_cpf IS NOT NULL THEN
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 1 FOR 3) || '.' ||
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 4 FOR 3) || '.' ||
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 7 FOR 3) || '-' ||
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 10 FOR 2)
        ELSE NULL
    END AS cpf_formatado,

    c.nu_cns AS cartao_sus,

    TO_CHAR(tepc.dt_auditoria, 'DD/MM/YYYY') AS data_insercao

FROM ta_evolucao_plano_ciap tepc
JOIN tb_atend ta 
    ON ta.co_atend_prof = tepc.co_atend_prof
JOIN tb_prontuario tp 
    ON tp.co_seq_prontuario = ta.co_prontuario
JOIN tb_cidadao c 
    ON c.co_seq_cidadao = tp.co_cidadao

WHERE 
    tepc.co_proced = 4807
    AND c.no_sexo = 'FEMININO'
    AND NOT EXISTS (
        SELECT 1
        FROM ta_evolucao_plano_ciap tepc2
        JOIN tb_atend ta2 ON ta2.co_atend_prof = tepc2.co_atend_prof
        JOIN tb_prontuario tp2 ON tp2.co_seq_prontuario = ta2.co_prontuario
        WHERE tepc2.co_proced = 4808
          AND tp2.co_cidadao = tp.co_cidadao
    );
