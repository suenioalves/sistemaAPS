-- Extensões (caso não ativas)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Etapa 1: Normaliza nome e filtra desde 2022
WITH base AS (
    SELECT 
        c.no_cidadao AS nome,
        unaccent(lower(c.no_cidadao)) AS nome_normalizado,
        pn.dt_ultima_menstruacao AS ultima_dum,
        pn.st_gravidez_planejada
    FROM 
        tb_pre_natal pn
    JOIN tb_prontuario p ON p.co_seq_prontuario = pn.co_prontuario
    JOIN tb_cidadao c ON c.co_seq_cidadao = p.co_cidadao
    WHERE 
        pn.dt_ultima_menstruacao >= '2022-01-01'
),

-- Etapa 2: Agrupa nomes semelhantes (representante)
com_representante AS (
    SELECT 
        b1.nome,
        b1.ultima_dum,
        b1.st_gravidez_planejada,
        (
            SELECT MIN(b2.nome)
            FROM base b2
            WHERE similarity(b1.nome_normalizado, b2.nome_normalizado) > 0.80
        ) AS nome_representante
    FROM base b1
),

-- Etapa 3: Última DUM por nome representativo
com_ultima_dum AS (
    SELECT DISTINCT ON (nome_representante)
        nome_representante,
        ultima_dum,
        st_gravidez_planejada
    FROM com_representante
    ORDER BY nome_representante, ultima_dum DESC
),

-- Etapa 4: Classifica quadrimestre e status
classificacao_quadrimestre AS (
    SELECT 
        EXTRACT(YEAR FROM ultima_dum) AS ano,
        CASE 
            WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 1 AND 4 THEN '1º Quadrimestre'
            WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 5 AND 8 THEN '2º Quadrimestre'
            WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 9 AND 12 THEN '3º Quadrimestre'
        END AS quadrimestre,
        CASE 
            WHEN st_gravidez_planejada = 1 THEN 'Planejada'
            WHEN st_gravidez_planejada = 0 THEN 'Não planejada'
            ELSE 'Desconhecido'
        END AS status_planejamento
    FROM com_ultima_dum
),

-- Etapa 5: total por quadrimestre (para calcular %)
totais_por_quadrimestre AS (
    SELECT 
        ano,
        quadrimestre,
        COUNT(*) AS total_quadrimestre
    FROM classificacao_quadrimestre
    GROUP BY ano, quadrimestre
),

-- Etapa 6: contagem e porcentagem
resultado_final AS (
    SELECT 
        cq.ano,
        cq.quadrimestre,
        cq.status_planejamento,
        COUNT(*) AS total,
        ROUND(COUNT(*) * 100.0 / tq.total_quadrimestre, 1) AS percentual
    FROM classificacao_quadrimestre cq
    JOIN totais_por_quadrimestre tq 
        ON cq.ano = tq.ano AND cq.quadrimestre = tq.quadrimestre
    GROUP BY 
        cq.ano, cq.quadrimestre, cq.status_planejamento, tq.total_quadrimestre
)

-- Resultado final
SELECT 
    ano,
    quadrimestre,
    status_planejamento,
    total,
    percentual
FROM 
    resultado_final
ORDER BY 
    ano, quadrimestre, status_planejamento;
