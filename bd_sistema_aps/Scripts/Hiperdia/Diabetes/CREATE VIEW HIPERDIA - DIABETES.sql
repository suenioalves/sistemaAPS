-- Remove a view materializada se ela já existir, para evitar erros ao recriar.
DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_hiperdia_diabetes;

-- Cria a nova view materializada no schema 'sistemaaps' para pacientes diabéticos
CREATE MATERIALIZED VIEW sistemaaps.mv_hiperdia_diabetes AS

-- Inicia os Common Table Expressions (CTEs)
WITH 
-- CTE 1: Busca a última atualização do cadastro individual (lógica existente).
UltimaAtualizacaoCadIndividual AS (
    SELECT
        ci.no_cidadao_filtro,
        ci.nu_micro_area,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(ci.no_cidadao_filtro))
            ORDER BY ci.dt_cad_individual DESC, ci.co_seq_cds_cad_individual DESC
        ) as rn
    FROM
        tb_cds_cad_individual ci
    WHERE
        ci.st_versao_atual = 1
)

-- Início da consulta principal que define os dados da view para diabetes
SELECT DISTINCT ON (c.co_seq_cidadao) -- Garante que cada paciente apareça apenas uma vez
    c.co_seq_cidadao AS cod_paciente,
    UPPER(c.no_cidadao) AS nome_paciente,
    c.nu_cns AS cartao_sus,
    DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada,
    e.no_equipe AS nome_equipe,
    -- Converte o número da microárea para inteiro, tratando casos não numéricos
    CASE
        WHEN ua.nu_micro_area ~ '^\d+$' THEN ua.nu_micro_area::int
        ELSE 0
    END AS microarea,
    c.dt_nascimento,
    c.no_sexo as sexo,
    tprob.co_ciap AS ciap_cronico,
    tprob.co_cid10 AS cid10_cronico,
    tprobevol.co_situacao_problema as situacao_problema,
    -- Adicionar tipo de diabetes baseado no código CIAP
    CASE 
        WHEN tprob.co_ciap = 476 THEN 'DIABETES INSULINO-DEPENDENTE'
        WHEN tprob.co_ciap = 477 THEN 'DIABETES NÃO INSULINO-DEPENDENTE'
        WHEN tprob.co_ciap = 732 THEN 'DIABETES'
        ELSE 'DIABETES'
    END AS tipo_diabetes

FROM
    tb_cidadao c
JOIN
    tb_cidadao_vinculacao_equipe cve ON c.co_seq_cidadao = cve.co_cidadao
JOIN
    tb_equipe e ON e.nu_ine = cve.nu_ine
LEFT JOIN
    UltimaAtualizacaoCadIndividual ua ON LOWER(TRIM(COALESCE(c.no_cidadao_filtro, ''))) = LOWER(TRIM(COALESCE(ua.no_cidadao_filtro, ''))) AND ua.rn = 1
LEFT JOIN 
    tb_prontuario tp ON c.co_seq_cidadao = tp.co_cidadao
LEFT JOIN 
    tb_problema tprob ON tprob.co_prontuario = tp.co_seq_prontuario
LEFT JOIN 
    tb_problema_evolucao tprobevol ON tprobevol.co_seq_problema_evolucao = tprob.co_ultimo_problema_evolucao

WHERE
    c.st_ativo = 1
    AND c.st_faleceu = 0
    AND e.st_ativo = 1
    AND (
        -- Códigos CIAP para diabetes
        (tprob.co_ciap IN (476, 477, 732))
        OR 
        -- Códigos CID10 para diabetes (faixas principais)
        (tprob.co_cid10 BETWEEN 1746 AND 1771) -- E10-E14 (Diabetes mellitus)
        OR
        (tprob.co_cid10 BETWEEN 1722 AND 1745) -- E10-E14 subcategorias
        OR
        (tprob.co_cid10 IN (12731, 12732, 12733, 12734, 12735)) -- Códigos específicos adicionais
    )
    AND (tprobevol.co_situacao_problema IN (0, 1)) -- 0: Ativo, 1: Compensado

ORDER BY
    c.co_seq_cidadao,
    e.no_equipe;

-- Criar índices para otimizar consultas
CREATE UNIQUE INDEX idx_mv_hiperdia_diabetes_cod_paciente ON sistemaaps.mv_hiperdia_diabetes (cod_paciente);
CREATE INDEX idx_mv_hiperdia_diabetes_nome_equipe ON sistemaaps.mv_hiperdia_diabetes (nome_equipe);
CREATE INDEX idx_mv_hiperdia_diabetes_microarea ON sistemaaps.mv_hiperdia_diabetes (microarea);
CREATE INDEX idx_mv_hiperdia_diabetes_situacao ON sistemaaps.mv_hiperdia_diabetes (situacao_problema);
CREATE INDEX idx_mv_hiperdia_diabetes_tipo ON sistemaaps.mv_hiperdia_diabetes (tipo_diabetes);

-- Adicionar comentários para documentação
COMMENT ON MATERIALIZED VIEW sistemaaps.mv_hiperdia_diabetes IS 'View materializada para pacientes diabéticos do programa HIPERDIA';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.cod_paciente IS 'Código único do paciente';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.nome_paciente IS 'Nome do paciente em maiúsculas';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.cartao_sus IS 'Número do Cartão SUS';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.idade_calculada IS 'Idade calculada em anos';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.nome_equipe IS 'Nome da equipe de saúde responsável';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.microarea IS 'Número da microárea';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.situacao_problema IS '0: Ativo, 1: Compensado';
COMMENT ON COLUMN sistemaaps.mv_hiperdia_diabetes.tipo_diabetes IS 'Tipo de diabetes baseado no código CIAP';

-- Script para atualizar a view materializada (executar periodicamente)
-- REFRESH MATERIALIZED VIEW sistemaaps.mv_hiperdia_diabetes;