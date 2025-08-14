    SELECT
        c.co_seq_cidadao AS co_cidadao,
        c.no_cidadao as nome_cidadao,
        tepc.co_proced, -- O código do procedimento (4807 para DIU, 4808 para remoção)
        tepc.dt_auditoria,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY tepc.dt_auditoria DESC, tepc.co_proced DESC -- Se datas iguais, 4808 (remoção) tem precedência sobre 4807 (inserção)
        ) as rn_diu
    FROM
        ta_evolucao_plano_ciap tepc
    JOIN
        tb_atend ta ON ta.co_atend_prof = tepc.co_atend_prof
    JOIN
        tb_prontuario tp ON tp.co_seq_prontuario = ta.co_prontuario
    JOIN
        tb_cidadao c ON c.co_seq_cidadao = tp.co_cidadao
    WHERE
        tepc.co_proced IN (4807, 4808) -- Inclui tanto a inserção (4807) quanto a remoção (4808)
        AND NOT EXISTS (
            SELECT 1
            FROM ta_evolucao_plano_ciap tepc2
            JOIN tb_atend ta2 ON ta2.co_atend_prof = tepc2.co_atend_prof
            JOIN tb_prontuario tp2 ON tp2.co_seq_prontuario = ta2.co_prontuario
            JOIN tb_cidadao c2 ON c2.co_seq_cidadao = tp2.co_cidadao
            WHERE tepc2.co_proced = 4808
              AND c2.co_seq_cidadao = c.co_seq_cidadao -- Usa co_seq_cidadao diretamente
        )
        -- Exclusão: Não incluir DIU se a paciente já fez esterilização
        AND NOT EXISTS (
            SELECT 1 FROM tb_prontuario tp3 
            JOIN tb_cirurgias_internacoes tci3 ON tci3.co_prontuario = tp3.co_seq_prontuario
            WHERE tp3.co_cidadao = c.co_seq_cidadao
            AND tci3.ds_cirurgia_internacao IS NOT NULL
            AND (
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%HISTER%' OR
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%LIGAD%' OR
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%SALPING%'
            )
        )