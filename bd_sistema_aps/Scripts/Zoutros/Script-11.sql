WITH MulheresNaFaixaEtaria AS (
    SELECT
        c.co_seq_cidadao AS cod_paciente,
        UPPER(c.no_cidadao_filtro) AS nome_paciente,
        c.nu_cns AS cartao_sus,
        DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada,
        e.no_equipe AS nome_equipe,
        ve.nu_ine,
        CASE
            WHEN ci.nu_micro_area ~ '^\d+$' THEN ci.nu_micro_area::int
            ELSE 0
        END AS microarea,
        c.dt_nascimento -- Manter para o cálculo da idade
    FROM
        tb_cidadao c
    JOIN
        tb_prontuario p ON p.co_cidadao = c.co_seq_cidadao
    JOIN
        tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
    JOIN
        tb_equipe e ON e.nu_ine = ve.nu_ine
    LEFT JOIN
        tb_cds_cad_individual ci ON LOWER(TRIM(COALESCE(ci.no_cidadao_filtro, ''))) = LOWER(TRIM(COALESCE(c.no_cidadao_filtro, ''))) AND ci.st_versao_atual = 1
    WHERE
        c.st_ativo = 1 AND c.st_faleceu = 0
        AND c.no_sexo = 'FEMININO'
        AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) >= 14
        AND DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) <= 45)
        AND e.st_ativo = 1
),
ProcedimentosDIURanked AS (
    SELECT
        tp.co_cidadao,
        tepc.co_proced,
        tepc.dt_auditoria,
        -- Classifica os procedimentos (4807 e 4808) para cada cidadão pela data mais recente
        ROW_NUMBER() OVER (
            PARTITION BY tp.co_cidadao
            ORDER BY tepc.dt_auditoria DESC, tepc.co_proced DESC -- Desempate: 4808 antes de 4807 se datas iguais
        ) as rn
    FROM
        ta_evolucao_plano_ciap tepc
    JOIN
        tb_atend ta ON ta.co_atend_prof = tepc.co_atend_prof
    JOIN
        tb_prontuario tp ON tp.co_seq_prontuario = ta.co_prontuario
    WHERE
        tepc.co_proced IN (4807, 4808) -- Inclui tanto inserção quanto remoção
),
UltimoStatusDIU AS (
    SELECT
        co_cidadao,
        co_proced AS ultimo_co_proced,
        dt_auditoria AS ultima_dt_auditoria
    FROM
        ProcedimentosDIURanked
    WHERE
        rn = 1 -- Pega apenas o procedimento (4807 ou 4808) mais recente para cada cidadão
)
SELECT
    m.cod_paciente,
    m.nome_paciente,
    m.cartao_sus,
    m.idade_calculada,
    m.nome_equipe,
    m.microarea,
    -- Define 'metodo' e 'data_aplicacao' com base no último procedimento encontrado
    CASE
        WHEN usd.ultimo_co_proced = 4807 THEN 'DIU' -- Se o último procedimento foi DIU (4807)
        ELSE '' -- Se foi 4808 (remoção) ou NULL (nenhum procedimento), deixa em branco
    END AS metodo,
    CASE
        WHEN usd.ultimo_co_proced = 4807 THEN TO_CHAR(usd.ultima_dt_auditoria, 'DD/MM/YYYY')
        ELSE ''
    END AS data_aplicacao
FROM
    MulheresNaFaixaEtaria m
LEFT JOIN
    UltimoStatusDIU usd
    ON m.cod_paciente = usd.co_cidadao;