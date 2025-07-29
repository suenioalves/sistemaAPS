-- Teste da correção para o problema com data_inicio NULL

-- 1. Verificar quantos registros têm data_inicio NULL
SELECT 
    'Registros com data_inicio NULL' as tipo,
    COUNT(*) as quantidade
FROM sistemaaps.tb_hiperdia_has_medicamentos 
WHERE data_inicio IS NULL 
  AND (data_fim IS NULL OR data_fim > CURRENT_DATE)

UNION ALL

SELECT 
    'Registros com data_inicio preenchida' as tipo,
    COUNT(*) as quantidade
FROM sistemaaps.tb_hiperdia_has_medicamentos 
WHERE data_inicio IS NOT NULL 
  AND (data_fim IS NULL OR data_fim > CURRENT_DATE)

UNION ALL

SELECT 
    'Total de medicamentos ativos' as tipo,
    COUNT(*) as quantidade
FROM sistemaaps.tb_hiperdia_has_medicamentos 
WHERE data_fim IS NULL OR data_fim > CURRENT_DATE;

-- 2. Testar a consulta corrigida
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
        END || ')' || 
        CASE 
            WHEN med.data_inicio IS NOT NULL 
            THEN ' - ' || TO_CHAR(med.data_inicio, 'DD/MM/YYYY')
            ELSE ''
        END,
        '<br>'
        ORDER BY 
            CASE WHEN med.data_inicio IS NOT NULL THEN med.data_inicio ELSE '1900-01-01'::date END DESC, 
            med.nome_medicamento
    ) AS tratamento_atual
    FROM sistemaaps.tb_hiperdia_has_medicamentos med
    WHERE med.codcidadao = m.cod_paciente 
      AND (med.data_fim IS NULL OR med.data_fim > CURRENT_DATE)
) tratamento ON TRUE
WHERE tratamento.tratamento_atual IS NOT NULL 
  AND TRIM(tratamento.tratamento_atual) != ''
LIMIT 10;