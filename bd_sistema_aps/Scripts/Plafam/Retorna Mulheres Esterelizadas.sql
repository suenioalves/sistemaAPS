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

    -- Classificação da cirurgia com base na descrição
    CASE
        WHEN UPPER(tci.ds_cirurgia_internacao) LIKE '%HISTER%' THEN 'HISTERECTOMIA'
        WHEN UPPER(tci.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' 
          OR UPPER(tci.ds_cirurgia_internacao) LIKE '%LIGAD%' 
          OR UPPER(tci.ds_cirurgia_internacao) LIKE '%SALPING%' THEN 'LAQUEADURA'
        ELSE NULL
    END AS tipo_cirurgia

FROM tb_cidadao c
JOIN tb_prontuario tp 
    ON tp.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_cirurgias_internacoes tci 
    ON tci.co_prontuario = tp.co_seq_prontuario 
    AND (
        UPPER(tci.ds_cirurgia_internacao) LIKE '%HISTER%' OR
        UPPER(tci.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR
        UPPER(tci.ds_cirurgia_internacao) LIKE '%LIGAD%' OR
        UPPER(tci.ds_cirurgia_internacao) LIKE '%SALPING%'
    )
WHERE 
    c.no_sexo = 'FEMININO'
    AND tci.ds_cirurgia_internacao IS NOT NULL
ORDER BY 
    c.no_cidadao;
