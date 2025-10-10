-- ============================================================================
-- QUERIES SQL PARA BANCO DE DADOS E-SUS PEC
-- Sistema de Consulta de Domicílios, Famílias e Cidadãos
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LISTAR DOMICÍLIOS
-- ----------------------------------------------------------------------------
-- Retorna todos os domicílios ativos com endereço completo

SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    COALESCE(tl.no_tipo_logradouro, '') AS tipo_logradouro,
    d.no_logradouro,
    d.nu_domicilio AS numero,
    d.no_bairro AS bairro,
    d.nu_cep AS cep,
    d.ds_complemento AS complemento,
    d.ds_ponto_referencia AS ponto_referencia,
    d.co_unico_domicilio AS uuid_domicilio,
    d.dt_cad_domiciliar AS data_cadastro
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
WHERE d.st_versao_atual = 1  -- Apenas versão atual
ORDER BY d.dt_cad_domiciliar DESC;


-- ----------------------------------------------------------------------------
-- 2. LISTAR FAMÍLIAS POR DOMICÍLIO
-- ----------------------------------------------------------------------------
-- Retorna as famílias vinculadas a cada domicílio

SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    COALESCE(tl.no_tipo_logradouro, '') || ' ' || d.no_logradouro || ', ' || d.nu_domicilio AS endereco_completo,
    df.co_seq_cds_domicilio_familia AS id_familia,
    df.nu_cartao_sus AS cns_responsavel,
    df.nu_cpf_cidadao AS cpf_responsavel,
    TO_CHAR(df.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento_responsavel,
    df.qt_membros_familia AS qtd_membros,
    rf.no_renda_familiar AS renda_familiar
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
LEFT JOIN tb_renda_familiar rf ON rf.co_renda_familiar = df.co_renda_familiar
WHERE d.st_versao_atual = 1
  AND df.st_mudanca = 0  -- Família ainda reside no domicílio
ORDER BY d.dt_cad_domiciliar DESC;


-- ----------------------------------------------------------------------------
-- 3. LISTAR CIDADÃOS CADASTRADOS (tb_cds_cad_individual)
-- ----------------------------------------------------------------------------
-- Retorna todos os cidadãos com informações do cadastro individual

SELECT
    ci.co_seq_cds_cad_individual AS id_cadastro,
    ci.no_cidadao AS nome_cidadao,
    ci.nu_cns_cidadao AS cns,
    ci.nu_cpf_cidadao AS cpf,
    TO_CHAR(ci.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
    s.no_sexo AS sexo,
    rc.ds_raca_cor AS raca_cor,
    ci.no_mae_cidadao AS nome_mae,
    ci.no_pai_cidadao AS nome_pai,
    ci.nu_micro_area AS microarea,
    ci.st_responsavel_familiar AS eh_responsavel_familiar,
    ci.nu_cpf_responsavel AS cpf_responsavel_familiar,
    ci.nu_cartao_sus_responsavel AS cns_responsavel_familiar,
    e.no_equipe AS equipe
FROM tb_cds_cad_individual ci
LEFT JOIN tb_sexo s ON s.co_seq_sexo = ci.co_sexo
LEFT JOIN tb_raca_cor rc ON rc.co_seq_raca_cor = ci.co_raca_cor
LEFT JOIN tb_cidadao c ON c.nu_cpf = ci.nu_cpf_cidadao OR c.nu_cns = ci.nu_cns_cidadao
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
WHERE ci.st_versao_atual = 1  -- Apenas versão atual
  AND ci.st_ficha_inativa = 0  -- Ficha ativa
ORDER BY ci.dt_cad_individual DESC;


-- ----------------------------------------------------------------------------
-- 4. LISTAR CIDADÃOS DA TABELA MESTRE (tb_cidadao)
-- ----------------------------------------------------------------------------
-- Retorna cidadãos da tabela principal com dados consolidados

SELECT
    c.co_seq_cidadao AS id_cidadao,
    c.no_cidadao AS nome,
    c.nu_cpf AS cpf,
    c.nu_cns AS cns,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
    c.no_sexo AS sexo,
    c.no_mae AS nome_mae,
    c.no_pai AS nome_pai,
    c.nu_micro_area AS microarea,
    c.nu_area AS area,
    c.ds_logradouro AS logradouro,
    c.nu_numero AS numero,
    c.no_bairro AS bairro,
    c.ds_cep AS cep,
    c.nu_telefone_celular AS celular,
    c.ds_email AS email,
    c.st_ativo AS ativo
FROM tb_cidadao c
WHERE c.st_ativo = 1
  AND c.st_faleceu = 0  -- Excluir falecidos
ORDER BY c.no_cidadao;


-- ----------------------------------------------------------------------------
-- 5. BUSCAR CIDADÃO POR CPF, CNS OU NOME
-- ----------------------------------------------------------------------------
-- Query parametrizada para buscar um cidadão específico
-- Substitua @cpf, @cns e @nome pelos valores desejados

SELECT
    c.co_seq_cidadao AS id_cidadao,
    c.no_cidadao AS nome,
    c.nu_cpf AS cpf,
    c.nu_cns AS cns,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
    c.no_sexo AS sexo,
    c.nu_micro_area AS microarea_atual,
    e.no_equipe AS equipe_atual,
    ci.nu_micro_area AS microarea_cadastro,
    ci.st_responsavel_familiar AS eh_responsavel
FROM tb_cidadao c
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
LEFT JOIN tb_cds_cad_individual ci ON (ci.nu_cpf_cidadao = c.nu_cpf OR ci.nu_cns_cidadao = c.nu_cns)
                                    AND ci.st_versao_atual = 1
WHERE (c.nu_cpf = @cpf OR c.nu_cns = @cns OR LOWER(c.no_cidadao) LIKE LOWER(@nome))
  AND c.st_ativo = 1
ORDER BY c.dt_atualizado DESC
LIMIT 1;


-- ----------------------------------------------------------------------------
-- 6. DOMICÍLIO COMPLETO COM FAMÍLIAS E INTEGRANTES
-- ----------------------------------------------------------------------------
-- Retorna um domicílio específico com todas as famílias e seus integrantes
-- Baseado no relacionamento: domicílio -> família -> cidadãos

SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    COALESCE(tl.no_tipo_logradouro, '') || ' ' || d.no_logradouro || ', ' || d.nu_domicilio AS endereco,
    d.no_bairro AS bairro,
    d.nu_cep AS cep,
    df.co_seq_cds_domicilio_familia AS id_familia,
    df.nu_cartao_sus AS cns_responsavel_familia,
    df.nu_cpf_cidadao AS cpf_responsavel_familia,
    df.qt_membros_familia AS qtd_membros,
    -- Buscar dados do responsável familiar
    c_resp.no_cidadao AS nome_responsavel,
    TO_CHAR(c_resp.dt_nascimento, 'DD/MM/YYYY') AS nascimento_responsavel,
    c_resp.no_sexo AS sexo_responsavel,
    -- Buscar membros via núcleo familiar
    cnf.st_responsavel AS eh_responsavel_nucleo,
    c.no_cidadao AS nome_membro,
    c.nu_cpf AS cpf_membro,
    c.nu_cns AS cns_membro,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS nascimento_membro,
    c.no_sexo AS sexo_membro,
    gp.no_grau_parentesco AS parentesco
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
LEFT JOIN tb_cidadao c_resp ON (c_resp.nu_cns = df.nu_cartao_sus OR c_resp.nu_cpf = df.nu_cpf_cidadao)
LEFT JOIN tb_familia f ON f.nu_cpf_cns_responsavel = COALESCE(df.nu_cpf_cidadao, df.nu_cartao_sus)
LEFT JOIN tb_cidadao_nucleo_familiar cnf ON cnf.nu_cpf_cns_responsavel = f.nu_cpf_cns_responsavel
LEFT JOIN tb_cidadao c ON c.co_seq_cidadao = cnf.co_cidadao
LEFT JOIN tb_grau_parentesco gp ON gp.co_grau_parentesco = cnf.co_grau_parentesco
WHERE d.st_versao_atual = 1
  AND d.co_seq_cds_cad_domiciliar = @id_domicilio  -- Substituir pelo ID do domicílio
ORDER BY df.co_seq_cds_domicilio_familia, cnf.st_responsavel DESC, c.no_cidadao;


-- ----------------------------------------------------------------------------
-- 7. LISTAR CIDADÃOS POR MICROÁREA E EQUIPE
-- ----------------------------------------------------------------------------
-- Retorna cidadãos filtrados por microárea e equipe de saúde

SELECT
    ci.no_cidadao AS nome,
    ci.nu_cpf_cidadao AS cpf,
    ci.nu_cns_cidadao AS cns,
    TO_CHAR(ci.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
    s.no_sexo AS sexo,
    ci.nu_micro_area AS microarea,
    e.no_equipe AS equipe,
    ci.st_responsavel_familiar AS eh_responsavel_familiar,
    -- Dados do domicílio
    COALESCE(tl.no_tipo_logradouro, '') || ' ' ||
    COALESCE(d.no_logradouro, '') || ', ' ||
    COALESCE(d.nu_domicilio, 'S/N') AS endereco,
    d.no_bairro AS bairro
FROM tb_cds_cad_individual ci
LEFT JOIN tb_sexo s ON s.co_sexo = ci.co_sexo
LEFT JOIN tb_cidadao c ON c.nu_cpf = ci.nu_cpf_cidadao OR c.nu_cns = ci.nu_cns_cidadao
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
-- Buscar domicílio via família
LEFT JOIN tb_familia f ON f.nu_cpf_cns_responsavel = ci.nu_cpf_cidadao OR f.nu_cpf_cns_responsavel = ci.nu_cns_cidadao
LEFT JOIN tb_cds_domicilio_familia df ON df.nu_cpf_cidadao = ci.nu_cpf_cidadao OR df.nu_cartao_sus = ci.nu_cns_cidadao
LEFT JOIN tb_cds_cad_domiciliar d ON d.co_seq_cds_cad_domiciliar = COALESCE(f.co_cds_domicilio, df.co_cds_cad_domiciliar)
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
WHERE ci.st_versao_atual = 1
  AND ci.st_ficha_inativa = 0
  AND ci.nu_micro_area = @microarea  -- Substituir pela microárea desejada
  AND e.no_equipe LIKE @equipe  -- Substituir pela equipe desejada (ex: '%PSF%')
ORDER BY ci.no_cidadao;


-- ----------------------------------------------------------------------------
-- 8. IDENTIFICAR RESPONSÁVEL FAMILIAR
-- ----------------------------------------------------------------------------
-- Query para identificar o responsável familiar de cada família

SELECT
    df.co_seq_cds_domicilio_familia AS id_familia,
    df.nu_cpf_cidadao AS cpf_responsavel,
    df.nu_cartao_sus AS cns_responsavel,
    c.no_cidadao AS nome_responsavel,
    c.nu_cpf AS cpf_confirmado,
    c.nu_cns AS cns_confirmado,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
    c.no_sexo AS sexo,
    -- Endereço do domicílio
    COALESCE(tl.no_tipo_logradouro, '') || ' ' ||
    d.no_logradouro || ', ' ||
    d.nu_domicilio AS endereco,
    d.no_bairro AS bairro
FROM tb_cds_domicilio_familia df
INNER JOIN tb_cds_cad_domiciliar d ON d.co_seq_cds_cad_domiciliar = df.co_cds_cad_domiciliar
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
LEFT JOIN tb_cidadao c ON (c.nu_cpf = df.nu_cpf_cidadao OR c.nu_cns = df.nu_cartao_sus)
WHERE d.st_versao_atual = 1
  AND df.st_mudanca = 0
  AND c.st_ativo = 1
ORDER BY d.no_logradouro, d.nu_domicilio;


-- ----------------------------------------------------------------------------
-- 9. ESTATÍSTICAS POR MICROÁREA
-- ----------------------------------------------------------------------------
-- Retorna estatísticas de cidadãos por microárea

SELECT
    ci.nu_micro_area AS microarea,
    e.no_equipe AS equipe,
    COUNT(DISTINCT ci.co_seq_cds_cad_individual) AS total_cidadaos,
    COUNT(DISTINCT CASE WHEN ci.st_responsavel_familiar = 1 THEN ci.co_seq_cds_cad_individual END) AS total_responsaveis,
    COUNT(DISTINCT CASE WHEN s.no_sexo = 'MASCULINO' THEN ci.co_seq_cds_cad_individual END) AS total_masculino,
    COUNT(DISTINCT CASE WHEN s.no_sexo = 'FEMININO' THEN ci.co_seq_cds_cad_individual END) AS total_feminino
FROM tb_cds_cad_individual ci
LEFT JOIN tb_sexo s ON s.co_sexo = ci.co_sexo
LEFT JOIN tb_cidadao c ON c.nu_cpf = ci.nu_cpf_cidadao OR c.nu_cns = ci.nu_cns_cidadao
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
WHERE ci.st_versao_atual = 1
  AND ci.st_ficha_inativa = 0
GROUP BY ci.nu_micro_area, e.no_equipe
ORDER BY ci.nu_micro_area;


-- ----------------------------------------------------------------------------
-- 10. QUERY USADA NO CÓDIGO PYTHON (gerar_relatorio_v3.py)
-- ----------------------------------------------------------------------------
-- Esta é a query que está sendo usada no sistema atual

SELECT
    c.no_cidadao AS nome,
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
    COALESCE(TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY'), '') AS data_nascimento,
    COALESCE(e.no_equipe, '') AS equipe,
    COALESCE(ultimo_cadastro.nu_micro_area, '0') AS microarea
FROM tb_cidadao c
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON c.co_seq_cidadao = ve.co_cidadao
LEFT JOIN tb_equipe e ON ve.nu_ine = e.nu_ine
LEFT JOIN (
    SELECT
        ci_sub.no_cidadao_filtro,
        ci_sub.nu_micro_area,
        ROW_NUMBER() OVER(
            PARTITION BY LOWER(TRIM(ci_sub.no_cidadao_filtro))
            ORDER BY ci_sub.dt_cad_individual DESC, ci_sub.co_seq_cds_cad_individual DESC
        ) as rn
    FROM tb_cds_cad_individual ci_sub
    WHERE ci_sub.st_versao_atual = 1
) ultimo_cadastro ON LOWER(TRIM(ultimo_cadastro.no_cidadao_filtro)) = LOWER(TRIM(c.no_cidadao_filtro))
                   AND ultimo_cadastro.rn = 1
WHERE (c.nu_cns = @cns OR c.nu_cpf = @cpf OR LOWER(TRIM(c.no_cidadao)) LIKE LOWER(TRIM(@nome)))
ORDER BY c.co_seq_cidadao DESC
LIMIT 1;


-- ----------------------------------------------------------------------------
-- 11. LISTAR APENAS DOMICÍLIOS COM INTEGRANTES MORANDO
-- ----------------------------------------------------------------------------
-- Retorna somente domicílios que possuem pelo menos 1 integrante cadastrado
-- Esta query garante que o domicílio não está vazio

-- VERSÃO SIMPLES (apenas contagem)
SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    COALESCE(tl.no_tipo_logradouro, '') || ' ' || d.no_logradouro || ', ' || d.nu_domicilio AS endereco_completo,
    d.no_bairro AS bairro,
    d.nu_cep AS cep,
    TO_CHAR(d.dt_cad_domiciliar, 'DD/MM/YYYY') AS data_cadastro,
    COUNT(DISTINCT ci.co_seq_cds_cad_individual) AS total_integrantes,
    df.qt_membros_familia AS qtd_membros_declarada
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
INNER JOIN tb_cds_cad_individual ci ON (
    -- Vincula cidadãos por CPF do responsável
    ci.nu_cpf_responsavel = df.nu_cpf_cidadao
    -- Vincula o próprio responsável
    OR ci.nu_cpf_cidadao = df.nu_cpf_cidadao
    -- Vincula por CNS hasheado (se CPF não disponível)
    OR ci.nu_cartao_sus_responsavel = df.nu_cartao_sus
    OR ci.nu_cns_cidadao = df.nu_cartao_sus
)
WHERE d.st_versao_atual = 1  -- Apenas versão atual do domicílio
  AND df.st_mudanca = 0  -- Família ainda reside no domicílio
  AND ci.st_versao_atual = 1  -- Apenas versão atual do cadastro
  AND ci.st_ficha_inativa = 0  -- Ficha do cidadão ativa
GROUP BY
    d.co_seq_cds_cad_domiciliar,
    tl.no_tipo_logradouro,
    d.no_logradouro,
    d.nu_domicilio,
    d.no_bairro,
    d.nu_cep,
    d.dt_cad_domiciliar,
    df.qt_membros_familia
HAVING COUNT(DISTINCT ci.co_seq_cds_cad_individual) > 0  -- Apenas domicílios com integrantes
ORDER BY d.dt_cad_domiciliar DESC;


-- VERSÃO COMPLETA (com nomes dos integrantes)
SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    COALESCE(tl.no_tipo_logradouro, '') || ' ' || d.no_logradouro || ', ' || d.nu_domicilio AS endereco_completo,
    d.no_bairro AS bairro,
    d.nu_cep AS cep,
    -- Dados da família
    df.co_seq_cds_domicilio_familia AS id_familia,
    df.nu_cpf_cidadao AS cpf_responsavel,
    df.qt_membros_familia AS qtd_membros_declarada,
    rf.no_renda_familiar AS renda_familiar,
    -- Dados dos integrantes
    ci.co_seq_cds_cad_individual AS id_cadastro_integrante,
    ci.no_cidadao AS nome_integrante,
    ci.nu_cpf_cidadao AS cpf_integrante,
    ci.nu_cns_cidadao AS cns_integrante,
    TO_CHAR(ci.dt_nascimento, 'DD/MM/YYYY') AS nascimento_integrante,
    s.no_sexo AS sexo_integrante,
    ci.st_responsavel_familiar AS eh_responsavel,
    ci.nu_micro_area AS microarea
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
LEFT JOIN tb_renda_familiar rf ON rf.co_renda_familiar = df.co_renda_familiar
INNER JOIN tb_cds_cad_individual ci ON (
    ci.nu_cpf_responsavel = df.nu_cpf_cidadao
    OR ci.nu_cpf_cidadao = df.nu_cpf_cidadao
    OR ci.nu_cartao_sus_responsavel = df.nu_cartao_sus
    OR ci.nu_cns_cidadao = df.nu_cartao_sus
)
LEFT JOIN tb_sexo s ON s.co_sexo = ci.co_sexo
WHERE d.st_versao_atual = 1
  AND df.st_mudanca = 0
  AND ci.st_versao_atual = 1
  AND ci.st_ficha_inativa = 0
ORDER BY d.dt_cad_domiciliar DESC, d.co_seq_cds_cad_domiciliar, ci.st_responsavel_familiar DESC, ci.no_cidadao;


-- VERSÃO AGREGADA (com lista de nomes em uma coluna)
SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    COALESCE(tl.no_tipo_logradouro, '') || ' ' || d.no_logradouro || ', ' || d.nu_domicilio AS endereco_completo,
    d.no_bairro AS bairro,
    COUNT(DISTINCT ci.co_seq_cds_cad_individual) AS total_integrantes,
    STRING_AGG(
        ci.no_cidadao ||
        CASE WHEN ci.st_responsavel_familiar = 1 THEN ' (RESPONSÁVEL)' ELSE '' END,
        '; '
    ) AS lista_integrantes
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
INNER JOIN tb_cds_cad_individual ci ON (
    ci.nu_cpf_responsavel = df.nu_cpf_cidadao
    OR ci.nu_cpf_cidadao = df.nu_cpf_cidadao
    OR ci.nu_cartao_sus_responsavel = df.nu_cartao_sus
    OR ci.nu_cns_cidadao = df.nu_cartao_sus
)
WHERE d.st_versao_atual = 1
  AND df.st_mudanca = 0
  AND ci.st_versao_atual = 1
  AND ci.st_ficha_inativa = 0
GROUP BY
    d.co_seq_cds_cad_domiciliar,
    tl.no_tipo_logradouro,
    d.no_logradouro,
    d.nu_domicilio,
    d.no_bairro
HAVING COUNT(DISTINCT ci.co_seq_cds_cad_individual) > 0
ORDER BY d.dt_cad_domiciliar DESC;
