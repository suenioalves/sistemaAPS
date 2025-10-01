SELECT
    table_schema,
    table_name,
    -- NOVO: Agrega (junta) em uma string todas as colunas que correspondem a 'domicilio'
    STRING_AGG(column_name, ', ') FILTER (WHERE column_name ILIKE '%cidadao%') AS colunas_domicilio,
    -- NOVO: Agrega (junta) em uma string todas as colunas que correspondem a 'familia'
    STRING_AGG(column_name, ', ') FILTER (WHERE column_name ILIKE '%familia%') AS colunas_familia
FROM
    information_schema.columns
WHERE
    -- O filtro inicial continua o mesmo, pegando colunas que tenham uma OU outra palavra
    column_name ILIKE '%cidadao%'
    OR column_name ILIKE '%familia%'
GROUP BY
    table_schema,
    table_name
HAVING
    -- A condição de ter AMBOS os tipos de coluna também permanece a mesma
    COUNT(CASE WHEN column_name ILIKE '%cidadao%' THEN 1 END) > 0
    AND
    COUNT(CASE WHEN column_name ILIKE '%familia%' THEN 1 END) > 0;