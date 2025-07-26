-- Extensões (caso não estejam ativas)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CTE base: normaliza nomes e traz DUM e equipe
WITH base AS (
    SELECT DISTINCT 
        c.no_cidadao AS nome,
        unaccent(lower(c.no_cidadao)) AS nome_normalizado,
        pn.dt_ultima_menstruacao AS ultima_dum, 
        c.nu_cpf, c.nu_cns 
        e.no_equipe AS nome_equipe
    FROM 
        tb_pre_natal pn
    JOIN tb_prontuario p ON p.co_seq_prontuario = pn.co_prontuario
    JOIN tb_cidadao c ON c.co_seq_cidadao = p.co_cidadao
    JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
    JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
    WHERE 
        pn.dt_ultima_menstruacao >= '2022-01-01'
        AND e.no_equipe = 'PSF - 03'
),

-- Agrupa nomes semelhantes e define nome representativo
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

-- Última DUM por gestante (sem duplicidade)
ultima_dum_por_gestante AS (
    SELECT 
        nome_representante,
        MAX(ultima_dum) AS ultima_dum
    FROM com_representante
    GROUP BY nome_representante
),

-- Classificação por ano e quadrimestre
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

-- Resultado final: contagem por quadrimestre
SELECT 
    ano,
    quadrimestre,
    COUNT(*) AS total_gestantes
FROM agrupado_por_quadrimestre
GROUP BY ano, quadrimestre
ORDER BY ano, quadrimestre;
