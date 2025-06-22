    SELECT
        tc.co_seq_cidadao AS co_cidadao,
        CASE
            WHEN tm.no_principio_ativo LIKE '%Etinilestradiol%' THEN 'Pílulas'
            WHEN tm.no_principio_ativo = 'Noretisterona, Enantato de + Estradiol, Valerato de' AND tm.co_forma_farmaceutica = 82 THEN 'Mensal'
            WHEN tm.no_principio_ativo = 'Medroxiprogesterona, Acetato' AND tm.co_forma_farmaceutica = 82 THEN 'Trimestral'
            ELSE NULL
        END AS tipo_metodo,
        ta.dt_inicio AS data_inicio_metodo,
        ROW_NUMBER() OVER (
            PARTITION BY tc.co_seq_cidadao
            ORDER BY ta.dt_inicio DESC, tm.no_principio_ativo -- Pega o método mais recente por data, e depois por nome
        ) as rn_metodo
    FROM
        tb_cidadao tc
    LEFT JOIN tb_prontuario tp ON tc.co_seq_cidadao = tp.co_cidadao
    LEFT JOIN tb_atend ta ON ta.co_prontuario = tp.co_seq_prontuario
    LEFT JOIN tb_receita_medicamento trm ON trm.co_atend_prof = ta.co_atend_prof
    LEFT JOIN tb_medicamento tm ON tm.co_seq_medicamento = trm.co_medicamento
    WHERE
        tc.no_sexo = 'FEMININO'
        AND EXTRACT(YEAR FROM AGE(tc.dt_nascimento)) BETWEEN 14 AND 45 -- Simplificado para BETWEEN
        AND tm.co_forma_farmaceutica IS NOT NULL
        AND (
            tm.no_principio_ativo LIKE '%Etinilestradiol%'
            OR tm.no_principio_ativo = 'Noretisterona, Enantato de + Estradiol, Valerato de'
            OR tm.no_principio_ativo = 'Medroxiprogesterona, Acetato'
        )