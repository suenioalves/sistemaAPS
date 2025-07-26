WITH lista_nomes AS (
    SELECT 1 AS ordem, 'MARIA VARGAS MARUBO' AS nome
    UNION ALL SELECT 2, 'DIVA PEREIRA DE SOUZA'
    UNION ALL SELECT 3, 'HILDA ANDRADE TENAZOR'
    UNION ALL SELECT 4, 'MARIA CANDIDO FERREIRA'
    UNION ALL SELECT 5, 'MARIA DE LOURDES CASTRO DA SILVA'
    UNION ALL SELECT 6, 'BENE DUNU MAYURUNA'
    UNION ALL SELECT 7, 'ARTEMIZIA OLIVEIRA DE SOUZA'
    UNION ALL SELECT 8, 'SANDRA CRISTINA WADICK'
    UNION ALL SELECT 9, 'MARILIA FERREIRA DA SILVA'
    UNION ALL SELECT 10, 'MARIA SUMAITA SAMIAS'
    UNION ALL SELECT 11, 'RAIMUNDA NASCIMENTO DA SILVA'
    UNION ALL SELECT 12, 'LEILANE DA SILVA MOÇAMBITE'
    UNION ALL SELECT 13, 'GLORIA GIMAQUE MIGUEL'
    UNION ALL SELECT 14, 'SEBASTIANA LOSANO FERREIRA'
    UNION ALL SELECT 15, 'ESTELA TAPAIURI'
    UNION ALL SELECT 16, 'DACIRA FIGUEIRA FERREIRA'
    UNION ALL SELECT 17, 'JAKSON DOS SANTOS DA SILVA'
    UNION ALL SELECT 18, 'JACKSON NOGUEIRA VIEIRA'
    UNION ALL SELECT 19, 'GILBER EUGENIO NARVAEZ HUACH'
    UNION ALL SELECT 20, 'CARLOS TONICO KANAMARY'
    UNION ALL SELECT 21, 'OSMAZILIA DE MELO DE FELIX'
    UNION ALL SELECT 22, 'RAIMUNDA RAMIRES DOS SANTOS'
)
SELECT
    l.nome,
    COALESCE(
        (SELECT c.nu_cns FROM tb_cidadao c
         WHERE UPPER(unaccent(c.no_cidadao)) = l.nome
           AND c.nu_cns IS NOT NULL
           AND LEFT(c.nu_cns, 1) = '7'
         LIMIT 1),
        (SELECT c.nu_cns FROM tb_cidadao c
         WHERE UPPER(unaccent(c.no_cidadao)) = l.nome
           AND c.nu_cns IS NOT NULL
         LIMIT 1),
        (SELECT
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 1 FOR 3) || '.' ||
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 4 FOR 3) || '.' ||
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 7 FOR 3) || '-' ||
            SUBSTRING(LPAD(c.nu_cpf::text, 11, '0') FROM 10 FOR 2)
         FROM tb_cidadao c
         WHERE UPPER(unaccent(c.no_cidadao)) = l.nome
           AND c.nu_cpf IS NOT NULL
         LIMIT 1),
        ''
    ) AS cns_cpf,
    COALESCE(
        (SELECT TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY')
         FROM tb_cidadao c
         WHERE UPPER(unaccent(c.no_cidadao)) = l.nome
         LIMIT 1),
        ''
    ) AS data_nascimento,
    COALESCE(
        (SELECT e.no_equipe
         FROM tb_cidadao c
         JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
         JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
         WHERE UPPER(unaccent(c.no_cidadao)) = l.nome
         LIMIT 1),
        ''
    ) AS equipe
FROM lista_nomes l
ORDER BY l.ordem;