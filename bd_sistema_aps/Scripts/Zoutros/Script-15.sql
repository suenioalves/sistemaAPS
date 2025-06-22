-- retorna nome e se gravidez planejada ou nao

-- Extensões (já devem estar ativas)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Etapa 1: Normaliza nomes e filtra DUMs de 2025 até abril
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
        pn.dt_ultima_menstruacao BETWEEN '2024-05-01' AND '2024-08-31'
),

-- Etapa 2: Agrupa nomes semelhantes e define o nome representativo
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

-- Etapa 3: Para cada grupo de nomes semelhantes, seleciona o registro mais recente
com_ultima_dum AS (
    SELECT DISTINCT ON (nome_representante)
        nome_representante AS nome,
        ultima_dum,
        st_gravidez_planejada
    FROM com_representante
    ORDER BY nome_representante, ultima_dum DESC
)

-- Resultado final
SELECT 
    nome,
    ultima_dum,
    CASE 
        WHEN st_gravidez_planejada = 1 THEN 'Planejada'
        WHEN st_gravidez_planejada = 0 THEN 'Não planejada'
        ELSE 'Desconhecido'
    END AS status_planejamento
FROM 
    com_ultima_dum
ORDER BY 
    ultima_dum;
