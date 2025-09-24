-- Remove a view materializada se ela já existir, para evitar erros ao recriar.
DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_plafam;

-- Cria a nova view materializada no schema 'sistemaaps'
CREATE MATERIALIZED VIEW sistemaaps.mv_plafam AS
WITH 
MulheresNaFaixaEtariaRanked AS (
    SELECT
        c.co_seq_cidadao AS cod_paciente,
        UPPER(c.no_cidadao_filtro) AS nome_paciente,
        c.no_mae as nome_responsavel,
        c.nu_cns AS cartao_sus,
        DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada,
        e.no_equipe AS nome_equipe,
        CASE
            WHEN ci.nu_micro_area ~ '^\d+$' THEN ci.nu_micro_area::int
            ELSE 0
        END AS microarea,
        c.dt_nascimento,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY 
                cve.dt_atualizacao_cadastro DESC NULLS LAST,
                e.no_equipe ASC,
                cve.co_seq_cidadao_vinculacao_eqp DESC
        ) as rn_vinculacao
    FROM
        tb_cidadao c
    JOIN
        tb_cidadao_vinculacao_equipe cve ON c.co_seq_cidadao = cve.co_cidadao
    JOIN
        tb_equipe e ON e.nu_ine = cve.nu_ine
    LEFT JOIN
        tb_cds_cad_individual ci ON c.co_unico_ultima_ficha = ci.co_unico_ficha
                                AND ci.st_versao_atual = 1
    WHERE
        c.st_ativo = 1
        AND c.st_faleceu = 0
        AND c.no_sexo = 'FEMININO'
        AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) BETWEEN 14 AND 45)
        AND e.st_ativo = 1
),
MulheresNaFaixaEtariaBase AS (
    SELECT 
        cod_paciente,
        nome_paciente,
        nome_responsavel,
        cartao_sus,
        idade_calculada,
        nome_equipe,
        microarea,
        dt_nascimento
    FROM 
        MulheresNaFaixaEtariaRanked
    WHERE 
        rn_vinculacao = 1
),
GravidasAtivas AS (
    SELECT
        c.co_seq_cidadao AS cod_paciente_gravida,
        TO_CHAR(MAX(pn.dt_ultima_menstruacao) + INTERVAL '280 days', 'DD/MM/YYYY') AS data_prob_parto_formatada
    FROM
        tb_pre_natal pn
    JOIN
        tb_prontuario p ON p.co_seq_prontuario = pn.co_prontuario
    JOIN
        tb_cidadao c ON c.co_seq_cidadao = p.co_cidadao
    WHERE
        pn.dt_ultima_menstruacao IS NOT NULL
    GROUP BY
        c.co_seq_cidadao
    HAVING
        (MAX(pn.dt_ultima_menstruacao) + INTERVAL '280 days') >= CURRENT_DATE
),
ProcedimentosDIURanked AS (
    SELECT
        c.co_seq_cidadao AS co_cidadao,
        tepc.co_proced,
        tepc.dt_auditoria,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY tepc.dt_auditoria DESC, tepc.co_proced DESC
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
        tepc.co_proced IN (4807, 4808)
        AND NOT EXISTS (
            SELECT 1
            FROM ta_evolucao_plano_ciap tepc2
            JOIN tb_atend ta2 ON ta2.co_atend_prof = tepc2.co_atend_prof
            WHERE tepc2.co_proced = 4808 AND ta2.co_prontuario = tp.co_seq_prontuario
        )
        AND NOT EXISTS (
            SELECT 1 FROM tb_prontuario tp3 
            JOIN tb_cirurgias_internacoes tci3 ON tci3.co_prontuario = tp3.co_seq_prontuario
            WHERE tp3.co_cidadao = c.co_seq_cidadao
            AND tci3.ds_cirurgia_internacao IS NOT NULL
            AND (UPPER(tci3.ds_cirurgia_internacao) LIKE '%HISTER%' OR UPPER(tci3.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR UPPER(tci3.ds_cirurgia_internacao) LIKE '%LIGAD%' OR UPPER(tci3.ds_cirurgia_internacao) LIKE '%SALPING%')
        )
),
UltimoStatusDIU AS (
    SELECT
        co_cidadao,
        co_proced AS ultimo_co_proced,
        dt_auditoria AS ultima_dt_auditoria
    FROM
        ProcedimentosDIURanked
    WHERE
        rn_diu = 1
),
RankedMetodosContraceptivos AS (
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
            ORDER BY ta.dt_inicio DESC, tm.no_principio_ativo
        ) as rn_metodo
    FROM
        tb_cidadao tc
    LEFT JOIN tb_prontuario tp ON tc.co_seq_cidadao = tp.co_cidadao
    LEFT JOIN tb_atend ta ON ta.co_prontuario = tp.co_seq_prontuario
    LEFT JOIN tb_receita_medicamento trm ON trm.co_atend_prof = ta.co_atend_prof
    LEFT JOIN tb_medicamento tm ON tm.co_seq_medicamento = trm.co_medicamento
    WHERE
        tc.no_sexo = 'FEMININO'
        AND (EXTRACT(YEAR FROM AGE(tc.dt_nascimento)) BETWEEN 14 AND 45)
        AND tm.co_forma_farmaceutica IS NOT NULL
        AND (
            tm.no_principio_ativo LIKE '%Etinilestradiol%'
            OR tm.no_principio_ativo = 'Noretisterona, Enantato de + Estradiol, Valerato de'
            OR tm.no_principio_ativo = 'Medroxiprogesterona, Acetato'
        )
        AND NOT EXISTS (
            SELECT 1 FROM tb_prontuario tp2 
            JOIN tb_cirurgias_internacoes tci2 ON tci2.co_prontuario = tp2.co_seq_prontuario
            WHERE tp2.co_cidadao = tc.co_seq_cidadao
            AND tci2.ds_cirurgia_internacao IS NOT NULL
            AND (UPPER(tci2.ds_cirurgia_internacao) LIKE '%HISTER%' OR UPPER(tci2.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR UPPER(tci2.ds_cirurgia_internacao) LIKE '%LIGAD%' OR UPPER(tci2.ds_cirurgia_internacao) LIKE '%SALPING%')
        )
),
UltimoMetodoContraceptivo AS (
    SELECT
        co_cidadao,
        tipo_metodo,
        data_inicio_metodo
    FROM
        RankedMetodosContraceptivos
    WHERE
        rn_metodo = 1
),
ProcedimentosImplanteRanked AS (
    SELECT
        c.co_seq_cidadao AS co_cidadao,
        tepc.co_proced,
        tepc.dt_auditoria,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY tepc.dt_auditoria DESC, tepc.co_proced DESC
        ) as rn_implante
    FROM
        ta_evolucao_plano_ciap tepc
    JOIN
        tb_atend ta ON ta.co_atend_prof = tepc.co_atend_prof
    JOIN
        tb_prontuario tp ON tp.co_seq_prontuario = ta.co_prontuario
    JOIN
        tb_cidadao c ON c.co_seq_cidadao = tp.co_cidadao
    WHERE
        tepc.co_proced IN (4913, 4914)
        AND NOT EXISTS (
            SELECT 1
            FROM ta_evolucao_plano_ciap tepc2
            JOIN tb_atend ta2 ON ta2.co_atend_prof = tepc2.co_atend_prof
            WHERE tepc2.co_proced = 4914 AND ta2.co_prontuario = tp.co_seq_prontuario
        )
        AND NOT EXISTS (
            SELECT 1 FROM tb_prontuario tp4 
            JOIN tb_cirurgias_internacoes tci4 ON tci4.co_prontuario = tp4.co_seq_prontuario
            WHERE tp4.co_cidadao = c.co_seq_cidadao
            AND tci4.ds_cirurgia_internacao IS NOT NULL
            AND (UPPER(tci4.ds_cirurgia_internacao) LIKE '%HISTER%' OR UPPER(tci4.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR UPPER(tci4.ds_cirurgia_internacao) LIKE '%LIGAD%' OR UPPER(tci4.ds_cirurgia_internacao) LIKE '%SALPING%')
        )
),
UltimoStatusImplante AS (
    SELECT
        co_cidadao,
        co_proced AS ultimo_co_proced,
        dt_auditoria AS ultima_dt_auditoria
    FROM
        ProcedimentosImplanteRanked
    WHERE
        rn_implante = 1
),
UltimaEsterilizacao AS (
    SELECT
        c.co_seq_cidadao,
        CASE
            WHEN UPPER(tci.ds_cirurgia_internacao) LIKE '%HISTER%' THEN 'HISTERECTOMIA'
            WHEN (UPPER(tci.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR UPPER(tci.ds_cirurgia_internacao) LIKE '%LIGAD%' OR UPPER(tci.ds_cirurgia_internacao) LIKE '%SALPING%') THEN 'LAQUEADURA'
            ELSE NULL
        END AS tipo_esterilizacao,
        tci.dt_cirurgia_internacao AS data_cirurgia,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY tci.dt_cirurgia_internacao DESC
        ) as rn_cirurgia
    FROM tb_cidadao c
    JOIN tb_prontuario tp ON tp.co_cidadao = c.co_seq_cidadao
    JOIN tb_cirurgias_internacoes tci ON tci.co_prontuario = tp.co_seq_prontuario
    WHERE
        c.no_sexo = 'FEMININO'
        AND tci.ds_cirurgia_internacao IS NOT NULL
        AND (UPPER(tci.ds_cirurgia_internacao) LIKE '%HISTER%' OR UPPER(tci.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR UPPER(tci.ds_cirurgia_internacao) LIKE '%LIGAD%' OR UPPER(tci.ds_cirurgia_internacao) LIKE '%SALPING%')
),
ResultadoFinal AS (
    SELECT
        m.cod_paciente,
        m.nome_paciente,
        m.nome_responsavel,
        m.cartao_sus,
        m.idade_calculada,
        m.nome_equipe,
        m.microarea,
        CASE
            WHEN ue.rn_cirurgia = 1 THEN ue.tipo_esterilizacao
            WHEN usd.ultimo_co_proced = 4807 THEN 'DIU'
            WHEN usi.ultimo_co_proced = 4913 THEN 'IMPLANTE SUBDÉRMICO'
            WHEN umc.tipo_metodo IS NOT NULL THEN umc.tipo_metodo
            ELSE ''
        END AS metodo,
        CASE
            WHEN ue.rn_cirurgia = 1 THEN TO_CHAR(ue.data_cirurgia, 'DD/MM/YYYY')
            WHEN usd.ultimo_co_proced = 4807 THEN TO_CHAR(usd.ultima_dt_auditoria, 'DD/MM/YYYY')
            WHEN usi.ultimo_co_proced = 4913 THEN TO_CHAR(usi.ultima_dt_auditoria, 'DD/MM/YYYY')
            WHEN umc.tipo_metodo IS NOT NULL THEN TO_CHAR(umc.data_inicio_metodo, 'DD/MM/YYYY')
            ELSE ''
        END AS data_aplicacao,
        CASE
            WHEN ga.cod_paciente_gravida IS NOT NULL THEN 'Grávida'
            ELSE ''
        END AS status_gravidez,
        COALESCE(ga.data_prob_parto_formatada, '') AS data_provavel_parto
    FROM
        MulheresNaFaixaEtariaBase m
    LEFT JOIN UltimoStatusDIU usd ON m.cod_paciente = usd.co_cidadao
    LEFT JOIN UltimoStatusImplante usi ON m.cod_paciente = usi.co_cidadao
    LEFT JOIN UltimoMetodoContraceptivo umc ON m.cod_paciente = umc.co_cidadao
    LEFT JOIN UltimaEsterilizacao ue ON m.cod_paciente = ue.co_seq_cidadao AND ue.rn_cirurgia = 1
    LEFT JOIN GravidasAtivas ga ON m.cod_paciente = ga.cod_paciente_gravida
)
SELECT
    cod_paciente,
    nome_paciente,
    nome_responsavel,
    cartao_sus,
    idade_calculada,
    nome_equipe,
    microarea,
    metodo,
    data_aplicacao,
    status_gravidez,
    data_provavel_parto
FROM
    ResultadoFinal;