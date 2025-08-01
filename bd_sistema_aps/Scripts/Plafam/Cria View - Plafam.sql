DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_plafam;

CREATE MATERIALIZED VIEW sistemaaps.mv_plafam AS
WITH UltimaAtualizacaoCadIndividual AS (
    -- CTE para encontrar a última atualização de cadastro individual para cada cidadão
    SELECT
        ci.no_cidadao_filtro,
        ci.nu_micro_area,
        ci.st_versao_atual,
        ci.dt_cad_individual,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(ci.no_cidadao_filtro))
            ORDER BY ci.dt_cad_individual DESC, ci.co_seq_cds_cad_individual DESC
        ) as rn
    FROM
        tb_cds_cad_individual ci
    WHERE
        ci.st_versao_atual = 1
),
MulheresNaFaixaEtariaRanked AS (
    -- CTE auxiliar: Rankeia múltiplas vinculações de equipe para o mesmo cidadão
    SELECT
        c.co_seq_cidadao AS cod_paciente,
        UPPER(c.no_cidadao_filtro) AS nome_paciente,
        c.no_mae as nome_responsavel,
        c.nu_cns AS cartao_sus,
        DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada,
        e.no_equipe AS nome_equipe,
        CASE
            WHEN ua.nu_micro_area ~ '^\d+$' THEN ua.nu_micro_area::int
            ELSE 0
        END AS microarea,
        c.dt_nascimento,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY 
                cve.dt_vinculacao DESC,  -- Vinculação mais recente primeiro
                e.no_equipe ASC,        -- Se datas iguais, equipe por ordem alfabética
                cve.co_cidadao_vinculacao_equipe DESC -- Desempate final por ID
        ) as rn_vinculacao
    FROM
        tb_cidadao c
    JOIN
        tb_cidadao_vinculacao_equipe cve
        ON c.co_seq_cidadao = cve.co_cidadao
    JOIN
        tb_equipe e
        ON e.nu_ine = cve.nu_ine
    LEFT JOIN
        UltimaAtualizacaoCadIndividual ua
        ON LOWER(TRIM(COALESCE(ua.no_cidadao_filtro, ''))) = LOWER(TRIM(COALESCE(c.no_cidadao_filtro, '')))
        AND ua.rn = 1
    WHERE
        c.st_ativo = 1
        AND c.st_faleceu = 0
        AND c.no_sexo = 'FEMININO'
        AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) >= 14
        AND DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) <= 45)
        AND e.st_ativo = 1
        AND cve.st_ativo = 1  -- Adiciona filtro para vinculação ativa
),
MulheresNaFaixaEtariaBase AS (
    -- CTE 1: Seleciona apenas uma vinculação por cidadão (a mais recente)
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
        rn_vinculacao = 1  -- Pega apenas a vinculação mais recente para cada cidadão
),
-- NOVA CTE: GravidasAtivas - Identifica mulheres grávidas ativas
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
        c.co_seq_cidadao, c.no_cidadao, c.nu_cpf, c.nu_cns, c.dt_nascimento
    HAVING
        MAX(pn.dt_ultima_menstruacao) + INTERVAL '280 days' >= CURRENT_DATE -- DPP >= data atual
),

ProcedimentosDIURanked AS (
    -- CTE que identifica e rankeia todos os procedimentos de DIU (inserção e remoção)
    -- para cada cidadão, pegando o mais recente.
    SELECT
        tp.co_cidadao,
        tepc.co_proced, -- O código do procedimento (4807 para DIU, 4808 para remoção)
        tepc.dt_auditoria,
        ROW_NUMBER() OVER (
            PARTITION BY tp.co_cidadao
            ORDER BY tepc.dt_auditoria DESC, tepc.co_proced DESC -- Se datas iguais, 4808 (remoção) tem precedência sobre 4807 (inserção)
        ) as rn_diu
    FROM
        ta_evolucao_plano_ciap tepc
    JOIN
        tb_atend ta ON ta.co_atend_prof = tepc.co_atend_prof
    JOIN
        tb_prontuario tp ON tp.co_seq_prontuario = ta.co_prontuario
    WHERE
        tepc.co_proced IN (4807, 4808) -- Inclui tanto a inserção (4807) quanto a remoção (4808)
        AND NOT EXISTS (
            SELECT 1
            FROM ta_evolucao_plano_ciap tepc2
            JOIN tb_atend ta2 ON ta2.co_atend_prof = tepc2.co_atend_prof
            JOIN tb_prontuario tp2 ON tp2.co_seq_prontuario = ta2.co_prontuario
            WHERE tepc2.co_proced = 4808
              AND tp2.co_cidadao::text = tp.co_cidadao::text -- Corrigido: Força a conversão para texto
        )
        -- Exclusão: Não incluir DIU se a paciente já fez esterilização
        AND NOT EXISTS (
            SELECT 1 FROM tb_prontuario tp3 
            JOIN tb_cirurgias_internacoes tci3 ON tci3.co_prontuario = tp3.co_seq_prontuario
            WHERE tp3.co_cidadao = tp.co_cidadao
            AND tci3.ds_cirurgia_internacao IS NOT NULL
            AND (
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%HISTER%' OR
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%LIGAD%' OR
                UPPER(tci3.ds_cirurgia_internacao) LIKE '%SALPING%'
            )
        )
),
UltimoStatusDIU AS (
    -- CTE que pega o último status (inserção ou remoção) de DIU para cada cidadão.
    SELECT
        co_cidadao,
        co_proced AS ultimo_co_proced,
        dt_auditoria AS ultima_dt_auditoria
    FROM
        ProcedimentosDIURanked
    WHERE
        rn_diu = 1 -- Seleciona apenas o mais recente
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
        AND EXTRACT(YEAR FROM AGE(tc.dt_nascimento)) BETWEEN 14 AND 45
        AND tm.co_forma_farmaceutica IS NOT NULL
        AND (
            tm.no_principio_ativo LIKE '%Etinilestradiol%'
            OR tm.no_principio_ativo = 'Noretisterona, Enantato de + Estradiol, Valerato de'
            OR tm.no_principio_ativo = 'Medroxiprogesterona, Acetato'
        )
        -- Exclusão: Não incluir métodos contraceptivos se a paciente já fez esterilização
        AND NOT EXISTS (
            SELECT 1 FROM tb_prontuario tp2 
            JOIN tb_cirurgias_internacoes tci2 ON tci2.co_prontuario = tp2.co_seq_prontuario
            WHERE tp2.co_cidadao = tc.co_seq_cidadao
            AND tci2.ds_cirurgia_internacao IS NOT NULL
            AND (
                UPPER(tci2.ds_cirurgia_internacao) LIKE '%HISTER%' OR
                UPPER(tci2.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR
                UPPER(tci2.ds_cirurgia_internacao) LIKE '%LIGAD%' OR
                UPPER(tci2.ds_cirurgia_internacao) LIKE '%SALPING%'
            )
        )
),

UltimoMetodoContraceptivo AS (
	SELECT
	    co_cidadao,
	    tipo_metodo,
	    data_inicio_metodo,
	    rn_metodo
	FROM
	    RankedMetodosContraceptivos
	WHERE
	    rn_metodo = 1 -- Filtra para pegar apenas o registro mais recente para cada co_cidadao
),    

-- NOVA CTE: ProcedimentosImplanteRanked - Identifica e rankeia procedimentos de Implante Subdérmico
ProcedimentosImplanteRanked AS (
    SELECT
        tp.co_cidadao,
        tepc.co_proced,
        tepc.dt_auditoria,
        ROW_NUMBER() OVER (
            PARTITION BY tp.co_cidadao
            ORDER BY tepc.dt_auditoria DESC, tepc.co_proced DESC
        ) as rn_implante
    FROM
        ta_evolucao_plano_ciap tepc
    JOIN
        tb_atend ta ON ta.co_atend_prof = tepc.co_atend_prof
    JOIN
        tb_prontuario tp ON tp.co_seq_prontuario = ta.co_prontuario
    WHERE
        tepc.co_proced IN (4913, 4914) -- Inserção (4913) e Retirada (4914) de Implante
        AND NOT EXISTS (
            SELECT 1
            FROM ta_evolucao_plano_ciap tepc2
            JOIN tb_atend ta2 ON ta2.co_atend_prof = tepc2.co_atend_prof
            JOIN tb_prontuario tp2 ON tp2.co_seq_prontuario = ta2.co_prontuario
            WHERE tepc2.co_proced = 4914 -- Se tiver uma retirada mais recente, não considera
              AND tp2.co_cidadao::text = tp.co_cidadao::text
        )
        -- Exclusão: Não incluir Implante se a paciente já fez esterilização
        AND NOT EXISTS (
            SELECT 1 FROM tb_prontuario tp4 
            JOIN tb_cirurgias_internacoes tci4 ON tci4.co_prontuario = tp4.co_seq_prontuario
            WHERE tp4.co_cidadao = tp.co_cidadao
            AND tci4.ds_cirurgia_internacao IS NOT NULL
            AND (
                UPPER(tci4.ds_cirurgia_internacao) LIKE '%HISTER%' OR
                UPPER(tci4.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR
                UPPER(tci4.ds_cirurgia_internacao) LIKE '%LIGAD%' OR
                UPPER(tci4.ds_cirurgia_internacao) LIKE '%SALPING%'
            )
        )
),
UltimoStatusImplante AS (
    -- CTE para pegar o último status (inserção ou remoção) de Implante para cada cidadão.
    SELECT
        co_cidadao,
        co_proced AS ultimo_co_proced,
        dt_auditoria AS ultima_dt_auditoria
    FROM
        ProcedimentosImplanteRanked
    WHERE
        rn_implante = 1 -- Apenas implantes ATIVOS (última ação foi inserção)
),

-- NOVA CTE: UltimaEsterilizacao - Identifica a última cirurgia de esterilização
UltimaEsterilizacao AS (
    SELECT
        c.co_seq_cidadao,
        -- Classificação da cirurgia
        CASE
            WHEN UPPER(tci.ds_cirurgia_internacao) LIKE '%HISTER%' THEN 'HISTERECTOMIA'
            WHEN UPPER(tci.ds_cirurgia_internacao) LIKE '%LAQUEADUR%'
              OR UPPER(tci.ds_cirurgia_internacao) LIKE '%LIGAD%'
              OR UPPER(tci.ds_cirurgia_internacao) LIKE '%SALPING%' THEN 'LAQUEADURA'
            ELSE NULL
        END AS tipo_esterilizacao,
        tci.dt_cirurgia_internacao AS data_cirurgia,
        ROW_NUMBER() OVER (
            PARTITION BY c.co_seq_cidadao
            ORDER BY tci.dt_cirurgia_internacao DESC -- Pega a cirurgia mais recente
        ) as rn_cirurgia
    FROM tb_cidadao c
    JOIN tb_prontuario tp ON tp.co_cidadao = c.co_seq_cidadao
    JOIN tb_cirurgias_internacoes tci ON tci.co_prontuario = tp.co_seq_prontuario
    WHERE
        c.no_sexo = 'FEMININO'
        AND tci.ds_cirurgia_internacao IS NOT NULL
        AND (
            UPPER(tci.ds_cirurgia_internacao) LIKE '%HISTER%' OR
            UPPER(tci.ds_cirurgia_internacao) LIKE '%LAQUEADUR%' OR
            UPPER(tci.ds_cirurgia_internacao) LIKE '%LIGAD%' OR
            UPPER(tci.ds_cirurgia_internacao) LIKE '%SALPING%'
        )
)


-- CTE Final: Garantia absoluta de unicidade por co_seq_cidadao
ResultadoFinalRanked AS (
    SELECT
        m.cod_paciente,
        m.nome_paciente,
        m.nome_responsavel,
        m.cartao_sus,
        m.idade_calculada,
        m.nome_equipe,
        m.microarea,
        -- Coluna 'metodo': PRIORIDADE ABSOLUTA DE ESTERILIZAÇÃO -> DIU -> IMPLANTE -> OUTROS MÉTODOS -> VAZIO
        -- IMPORTANTE: As CTEs já garantem que se há esterilização, outros métodos são excluídos
        CASE
            WHEN ue.rn_cirurgia = 1 THEN ue.tipo_esterilizacao::varchar(30) -- PRIORIDADE 1: Esterilização (Laqueadura/Histerectomia)
            WHEN usd.ultimo_co_proced = 4807 THEN 'DIU'::varchar(30) -- PRIORIDADE 2: DIU ativo
            WHEN usi.ultimo_co_proced = 4913 THEN 'IMPLANTE SUBDÉRMICO'::varchar(30) -- PRIORIDADE 3: Implante ativo
            WHEN umc.rn_metodo = 1 THEN umc.tipo_metodo::varchar(30) -- PRIORIDADE 4: Outros métodos (Pílulas, Mensal, Trimestral) mais recentes
            ELSE ''::varchar(30) -- Sem método contraceptivo
        END AS metodo,
        -- Coluna 'data_aplicacao': SÓ É PREENCHIDA PARA DIU E OUTROS MÉTODOS, NÃO PARA ESTERILIZAÇÃO
        CASE
            WHEN usd.ultimo_co_proced = 4807 THEN TO_CHAR(usd.ultima_dt_auditoria, 'DD/MM/YYYY')::text
            WHEN usi.ultimo_co_proced = 4913 THEN TO_CHAR(usi.ultima_dt_auditoria, 'DD/MM/YYYY')::text -- NOVO
            WHEN umc.rn_metodo = 1 THEN TO_CHAR(umc.data_inicio_metodo, 'DD/MM/YYYY')::text
            ELSE ''::text -- Para esterilização e outros casos, fica vazio
        END AS data_aplicacao,
        -- Status de Gravidez
        CASE
            WHEN ga.cod_paciente_gravida IS NOT NULL THEN 'Grávida'::varchar(15)
            ELSE ''::varchar(15)
        END AS status_gravidez,
        -- Data Provável do Parto
        COALESCE(ga.data_prob_parto_formatada, '')::text AS data_provavel_parto,
        -- Ranking final para garantir unicidade absoluta
        ROW_NUMBER() OVER (
            PARTITION BY m.cod_paciente
            ORDER BY 
                -- Prioridade 1: Esterilização sempre primeiro
                CASE WHEN ue.rn_cirurgia = 1 THEN 1 ELSE 2 END,
                -- Prioridade 2: Data mais recente de esterilização
                ue.data_cirurgia DESC NULLS LAST,
                -- Prioridade 3: DIU
                CASE WHEN usd.ultimo_co_proced = 4807 THEN 1 ELSE 2 END,
                -- Prioridade 4: Data mais recente de DIU
                usd.ultima_dt_auditoria DESC NULLS LAST,
                -- Prioridade 5: Implante
                CASE WHEN usi.ultimo_co_proced = 4913 THEN 1 ELSE 2 END,
                -- Prioridade 6: Data mais recente de Implante
                usi.ultima_dt_auditoria DESC NULLS LAST,
                -- Prioridade 7: Outros métodos
                CASE WHEN umc.rn_metodo = 1 THEN 1 ELSE 2 END,
                -- Prioridade 8: Data mais recente de outros métodos
                umc.data_inicio_metodo DESC NULLS LAST,
                -- Desempate final por nome da equipe
                m.nome_equipe ASC
        ) as rn_final
    FROM
        MulheresNaFaixaEtariaBase m
    LEFT JOIN
        UltimoStatusDIU usd ON m.cod_paciente = usd.co_cidadao
    LEFT JOIN -- NOVO: LEFT JOIN com o status do Implante Subdérmico
        UltimoStatusImplante usi ON m.cod_paciente = usi.co_cidadao
    LEFT JOIN
        UltimoMetodoContraceptivo umc ON m.cod_paciente = umc.co_cidadao
    LEFT JOIN -- NOVO: LEFT JOIN com a CTE de última esterilização
        UltimaEsterilizacao ue ON m.cod_paciente = ue.co_seq_cidadao
    LEFT JOIN
        GravidasAtivas ga ON m.cod_paciente = ga.cod_paciente_gravida
)

-- Consulta principal da view materializada:
-- Combina todas as informações, priorizando esterilização para a coluna 'metodo'.
-- REGRAS DE PRIORIZAÇÃO (aplicadas nas CTEs acima):
-- 1. Laqueadura/Histerectomia SEMPRE prevalecem sobre qualquer outro método
-- 2. Para múltiplos métodos do mesmo paciente: pega o mais recente
-- 3. Garantia de unicidade: Um registro por co_seq_cidadao
-- 4. Outros métodos só são considerados se NÃO há esterilização
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
    ResultadoFinalRanked
WHERE
    rn_final = 1; -- Garante absolutamente um único registro por co_seq_cidadao





