-- Consulta para buscar dados de um único cidadão por CNS ou CPF
SELECT
    -- Seleciona o nome completo do cidadão
    c.no_cidadao AS nome,

    -- Formata e exibe o CNS ou CPF, dando prioridade para o CNS se ambos existirem
    COALESCE(c.nu_cns,
             CASE
                 WHEN c.nu_cpf IS NOT NULL THEN
                     SUBSTRING(LPAD(c.nu_cpf::text, 11, '0'), 1, 3) || '.' ||
                     SUBSTRING(LPAD(c.nu_cpf::text, 11, '0'), 4, 3) || '.' ||
                     SUBSTRING(LPAD(c.nu_cpf::text, 11, '0'), 7, 3) || '-' ||
                     SUBSTRING(LPAD(c.nu_cpf::text, 11, '0'), 10, 2)
                 ELSE ''
             END
    ) AS cns_cpf,

    -- Formata a data de nascimento para o padrão DD/MM/YYYY
    COALESCE(TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY'), '') AS data_nascimento,

    -- Busca o nome da equipe vinculada
    COALESCE(e.no_equipe, '') AS equipe,

    -- Busca a microárea do cadastro individual mais recente
    COALESCE(ultimo_cadastro.nu_micro_area, '0') AS microarea

FROM
    -- Começa pela tabela principal de cidadãos
    tb_cidadao c

-- Junta com a tabela de vínculo para encontrar a equipe do cidadão
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON c.co_seq_cidadao = ve.co_cidadao

-- Junta com a tabela de equipes para obter o nome da equipe
LEFT JOIN tb_equipe e ON ve.nu_ine = e.nu_ine

-- Usa um LEFT JOIN com uma subconsulta para buscar APENAS o cadastro individual mais recente
LEFT JOIN (
    SELECT
        ci_sub.no_cidadao_filtro,
        ci_sub.nu_micro_area,
        -- A função ROW_NUMBER() "rankeia" os cadastros de uma mesma pessoa pela data
        ROW_NUMBER() OVER(
            PARTITION BY LOWER(TRIM(ci_sub.no_cidadao_filtro))
            ORDER BY ci_sub.dt_cad_individual DESC, ci_sub.co_seq_cds_cad_individual DESC
        ) as rn
    FROM
        tb_cds_cad_individual ci_sub
    WHERE
        -- Garante que estamos olhando apenas para as versões ativas do cadastro
        ci_sub.st_versao_atual = 1
) ultimo_cadastro ON LOWER(TRIM(ultimo_cadastro.no_cidadao_filtro)) = LOWER(TRIM(c.no_cidadao_filtro))
                   AND ultimo_cadastro.rn = 1 -- A mágica acontece aqui: pegamos apenas a linha nº 1 (a mais recente)

WHERE
    -- =================================================================
    -- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    -- CONDIÇÃO PRINCIPAL: Altere o valor abaixo para o CNS ou CPF desejado
    -- =================================================================
    c.nu_cns = '898005134629643' OR c.nu_cpf = REPLACE(REPLACE('SEU_CNS_OU_CPF_AQUI', '.', ''), '-', '')

-- Garante que, caso haja mais de um cidadão com o mesmo documento (erro de cadastro),
-- o resultado seja o cidadão cadastrado mais recentemente no sistema.
ORDER BY
    c.co_seq_cidadao DESC
LIMIT 1;