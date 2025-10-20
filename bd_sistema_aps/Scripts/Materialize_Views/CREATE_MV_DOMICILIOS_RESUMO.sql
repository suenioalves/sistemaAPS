-- =========================================================================
-- Materialized View: Resumo de Domicílios para Painel
-- Data: 2025-10-15
-- Objetivo: Otimizar listagem de domicílios (de 4.3s para ~0.1s)
-- Atualização: 1x por dia (refresh programado)
-- Schema: sistemaaps
-- =========================================================================

-- Dropar view se existir
DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_domicilios_resumo CASCADE;

-- Criar Materialized View
CREATE MATERIALIZED VIEW sistemaaps.mv_domicilios_resumo AS
WITH domicilios_mais_recentes AS (
    SELECT DISTINCT ON (df.nu_cpf_cidadao)
        df.co_seq_cds_domicilio_familia,
        df.co_cds_cad_domiciliar,
        df.nu_cpf_cidadao
    FROM tb_cds_domicilio_familia df
    INNER JOIN tb_cds_cad_domiciliar d ON d.co_seq_cds_cad_domiciliar = df.co_cds_cad_domiciliar
    WHERE df.st_mudanca = 0
      AND d.st_versao_atual = 1
    ORDER BY df.nu_cpf_cidadao, d.dt_cad_domiciliar DESC, df.co_seq_cds_domicilio_familia DESC
)
SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    COALESCE(tl.no_tipo_logradouro, '') || ' ' || d.no_logradouro AS logradouro_completo,
    d.no_logradouro,
    d.nu_domicilio,
    d.no_bairro AS bairro,
    d.nu_cep AS cep,
    COUNT(DISTINCT df.co_seq_cds_domicilio_familia) AS total_familias,
    COUNT(DISTINCT ci.co_seq_cds_cad_individual) AS total_integrantes,
    -- Equipes dos responsáveis (via tb_cidadao_vinculacao_equipe)
    STRING_AGG(DISTINCT e.no_equipe, ', ') FILTER (WHERE ci.st_responsavel_familiar = 1) AS equipes,
    -- Microárea dos responsáveis
    STRING_AGG(DISTINCT ci.nu_micro_area, ', ') FILTER (WHERE ci.st_responsavel_familiar = 1) AS microareas,
    -- Lista de responsáveis com idade e sexo
    STRING_AGG(
        DISTINCT ci.co_seq_cds_cad_individual || '::' || ci.no_cidadao || '|' || COALESCE(EXTRACT(YEAR FROM AGE(ci.dt_nascimento))::text, '0') || '|' || COALESCE(s.no_sexo, 'Não informado'),
        ';;'
    ) FILTER (WHERE ci.st_responsavel_familiar = 1) AS responsaveis_info,
    -- Flag se tem responsável
    CASE WHEN MAX(ci.st_responsavel_familiar) = 1 THEN 1 ELSE 0 END AS tem_responsavel,
    -- Data de cadastro
    d.dt_cad_domiciliar,
    -- Campos extras para busca e filtros
    -- Lista de CPFs dos responsáveis (para busca)
    STRING_AGG(DISTINCT ci.nu_cpf_cidadao, ',') FILTER (WHERE ci.st_responsavel_familiar = 1) AS cpfs_responsaveis,
    -- Lista de nomes de TODOS os moradores (para busca por qualquer morador)
    STRING_AGG(DISTINCT LOWER(ci.no_cidadao), ';;') AS nomes_moradores_lower,
    -- Número de domicílio como integer (para ordenação numérica)
    CASE
        WHEN d.nu_domicilio ~ '^[0-9]+$' THEN CAST(d.nu_domicilio AS INTEGER)
        ELSE 999999
    END AS nu_domicilio_int
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
INNER JOIN domicilios_mais_recentes dmr ON dmr.co_seq_cds_domicilio_familia = df.co_seq_cds_domicilio_familia
INNER JOIN tb_cds_cad_individual ci ON (
    ci.nu_cpf_responsavel = df.nu_cpf_cidadao
    OR ci.nu_cpf_cidadao = df.nu_cpf_cidadao
    OR ci.nu_cartao_sus_responsavel = df.nu_cartao_sus
    OR ci.nu_cns_cidadao = df.nu_cartao_sus
)
LEFT JOIN tb_sexo s ON s.co_sexo = ci.co_sexo
-- Join para pegar equipe dos responsáveis
LEFT JOIN tb_cidadao c ON c.co_unico_ultima_ficha = ci.co_unico_ficha AND c.st_ativo = 1
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
WHERE d.st_versao_atual = 1
  AND df.st_mudanca = 0
  AND ci.st_versao_atual = 1
  AND ci.st_ficha_inativa = 0
GROUP BY
    d.co_seq_cds_cad_domiciliar,
    tl.no_tipo_logradouro,
    d.no_logradouro,
    d.nu_domicilio,
    d.no_bairro,
    d.nu_cep,
    d.dt_cad_domiciliar
HAVING COUNT(DISTINCT ci.co_seq_cds_cad_individual) > 0;

-- Criar índices na Materialized View para queries rápidas
CREATE UNIQUE INDEX idx_mv_domicilios_id ON sistemaaps.mv_domicilios_resumo(id_domicilio);
CREATE INDEX idx_mv_domicilios_logradouro ON sistemaaps.mv_domicilios_resumo(no_logradouro, nu_domicilio_int);
CREATE INDEX idx_mv_domicilios_bairro ON sistemaaps.mv_domicilios_resumo(bairro);
CREATE INDEX idx_mv_domicilios_equipes ON sistemaaps.mv_domicilios_resumo(equipes);
CREATE INDEX idx_mv_domicilios_microarea ON sistemaaps.mv_domicilios_resumo(microareas);
CREATE INDEX idx_mv_domicilios_nomes ON sistemaaps.mv_domicilios_resumo USING gin(to_tsvector('portuguese', nomes_moradores_lower));

-- Atualizar estatísticas
ANALYZE sistemaaps.mv_domicilios_resumo;

-- Informações sobre a view
SELECT
    schemaname,
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS tamanho,
    (SELECT COUNT(*) FROM sistemaaps.mv_domicilios_resumo) AS total_registros
FROM pg_matviews
WHERE matviewname = 'mv_domicilios_resumo' AND schemaname = 'sistemaaps';

-- Para refresh manual (executar quando necessário):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY sistemaaps.mv_domicilios_resumo;
