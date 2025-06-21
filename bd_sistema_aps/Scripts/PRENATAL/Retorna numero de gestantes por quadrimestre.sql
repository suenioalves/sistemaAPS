-- Extensões (caso não estejam ativas)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CTE base: normaliza nomes e traz DUM
WITH base AS (
    SELECT DISTINCT 
        c.no_cidadao AS nome,
        unaccent(lower(c.no_cidadao)) AS nome_normalizado,
        pn.dt_ultima_menstruacao AS ultima_dum
    FROM 
        tb_pre_natal pn
    JOIN tb_prontuario p ON p.co_seq_prontuario = pn.co_prontuario
    JOIN tb_cidadao c ON c.co_seq_cidadao = p.co_cidadao
    WHERE 
        pn.dt_ultima_menstruacao >= '2022-01-01'
),

-- Agrupa nomes semelhantes e define um nome representativo
com_representante AS (
    SELECT 
        b1.nome,
        b1.ultima_dum,
        (
            SELECT MIN(b2.nome)
            FROM base b2
            WHERE similarity(b1.nome_normalizado, b2.nome_normalizado) > 0.80
        ) AS nome_representante
    FROM base b1
),

-- Seleciona a última DUM por grupo de nome representativo
ultima_dum_por_gestante AS (
    SELECT 
        nome_representante,
        MAX(ultima_dum) AS ultima_dum
    FROM com_representante
    GROUP BY nome_representante
),

-- Agrupa por ano e quadrimestre
agrupado_por_quadrimestre AS (
    SELECT 
        EXTRACT(YEAR FROM ultima_dum) AS ano,
        CASE 
            WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 1 AND 4 THEN '1º Quadrimestre'
            WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 5 AND 8 THEN '2º Quadrimestre'
            WHEN EXTRACT(MONTH FROM ultima_dum) BETWEEN 9 AND 12 THEN '3º Quadrimestre'
        END AS quadrimestre
    FROM ultima_dum_por_gestante
)

-- Contagem final
SELECT 
    ano,
    quadrimestre,
    COUNT(*) AS total_gestantes
FROM agrupado_por_quadrimestre
GROUP BY ano, quadrimestre
ORDER BY ano, quadrimestre;
