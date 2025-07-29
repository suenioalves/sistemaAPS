-- Teste da consulta modificada para o filtro "Tratamento"

-- 1. Verificar medicamentos ativos na tabela
SELECT 
    'Medicamentos Ativos' AS categoria,
    COUNT(*) AS total,
    COUNT(DISTINCT codcidadao) AS pacientes_distintos
FROM sistemaaps.tb_hiperdia_has_medicamentos 
WHERE data_fim IS NULL OR data_fim > CURRENT_DATE

UNION ALL

-- 2. Verificar pacientes hipertensos
SELECT 
    'Pacientes Hipertensos' AS categoria,
    COUNT(*) AS total,
    COUNT(DISTINCT cod_paciente) AS pacientes_distintos
FROM sistemaaps.mv_hiperdia_hipertensao;

-- 3. Testar a consulta completa do filtro "Tratamento"
WITH pacientes_com_tratamento AS (
    SELECT 
        m.cod_paciente, 
        m.nome_paciente,
        tratamento.tratamento_atual
    FROM sistemaaps.mv_hiperdia_hipertensao m
    LEFT JOIN LATERAL (
        SELECT STRING_AGG(
            '<b>' || med.nome_medicamento || '</b> (' || 
            CASE 
                WHEN med.dose IS NOT NULL AND med.frequencia IS NOT NULL 
                THEN med.dose || ' comprimido(s) - ' || med.frequencia || 'x ao dia'
                WHEN med.frequencia IS NOT NULL 
                THEN med.frequencia || 'x ao dia'
                ELSE 'Conforme prescrição'
            END || ') - ' || TO_CHAR(med.data_inicio, 'DD/MM/YYYY'),
            '<br>'
            ORDER BY med.data_inicio DESC, med.nome_medicamento
        ) AS tratamento_atual
        FROM sistemaaps.tb_hiperdia_has_medicamentos med
        WHERE med.codcidadao = m.cod_paciente 
          AND (med.data_fim IS NULL OR med.data_fim > CURRENT_DATE)
    ) tratamento ON TRUE
    WHERE tratamento.tratamento_atual IS NOT NULL 
      AND TRIM(tratamento.tratamento_atual) != ''
)
SELECT 
    'Resultado Final' AS info,
    COUNT(*) AS pacientes_com_tratamento_encontrados
FROM pacientes_com_tratamento;

-- 4. Mostrar exemplos dos pacientes encontrados
SELECT 
    m.cod_paciente, 
    m.nome_paciente,
    tratamento.tratamento_atual
FROM sistemaaps.mv_hiperdia_hipertensao m
LEFT JOIN LATERAL (
    SELECT STRING_AGG(
        '<b>' || med.nome_medicamento || '</b> (' || 
        CASE 
            WHEN med.dose IS NOT NULL AND med.frequencia IS NOT NULL 
            THEN med.dose || ' comprimido(s) - ' || med.frequencia || 'x ao dia'
            WHEN med.frequencia IS NOT NULL 
            THEN med.frequencia || 'x ao dia'
            ELSE 'Conforme prescrição'
        END || ') - ' || TO_CHAR(med.data_inicio, 'DD/MM/YYYY'),
        '<br>'
        ORDER BY med.data_inicio DESC, med.nome_medicamento
    ) AS tratamento_atual
    FROM sistemaaps.tb_hiperdia_has_medicamentos med
    WHERE med.codcidadao = m.cod_paciente 
      AND (med.data_fim IS NULL OR med.data_fim > CURRENT_DATE)
) tratamento ON TRUE
WHERE tratamento.tratamento_atual IS NOT NULL 
  AND TRIM(tratamento.tratamento_atual) != ''
LIMIT 5;