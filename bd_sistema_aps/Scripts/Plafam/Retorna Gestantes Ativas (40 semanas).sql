SELECT
    c.co_seq_cidadao,
    TO_CHAR(MAX(pn.dt_ultima_menstruacao), 'DD/MM/YYYY') AS ultima_dum,
    TO_CHAR(MAX(pn.dt_ultima_menstruacao) + INTERVAL '280 days', 'DD/MM/YYYY') AS data_prob_parto
FROM tb_pre_natal pn
JOIN tb_prontuario p 
    ON p.co_seq_prontuario = pn.co_prontuario
JOIN tb_cidadao c 
    ON c.co_seq_cidadao = p.co_cidadao
WHERE 
    pn.dt_ultima_menstruacao IS NOT NULL
GROUP BY 
    c.co_seq_cidadao, c.no_cidadao, c.nu_cpf, c.nu_cns, c.dt_nascimento
HAVING 
    -- CORRIGIDO: Data provável do parto (DUM + 280 dias) deve ser >= data atual
    MAX(pn.dt_ultima_menstruacao) + INTERVAL '280 days' >= CURRENT_DATE
ORDER BY 
    MAX(pn.dt_ultima_menstruacao) DESC; -- Ordena pela DUM mais recente
