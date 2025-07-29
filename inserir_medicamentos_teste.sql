-- Script para inserir medicamentos de teste na tb_hiperdia_has_medicamentos
-- Execute este script para ter dados de teste para o filtro "Tratamento"

-- Verificar se existem pacientes hipertensos para testar
DO $$ 
DECLARE
    paciente_ids INTEGER[];
    pac_id INTEGER;
BEGIN
    -- Buscar alguns IDs de pacientes hipertensos
    SELECT ARRAY(
        SELECT cod_paciente 
        FROM sistemaaps.mv_hiperdia_hipertensao 
        LIMIT 5
    ) INTO paciente_ids;
    
    IF array_length(paciente_ids, 1) > 0 THEN
        RAISE NOTICE 'Inserindo medicamentos de teste para % pacientes...', array_length(paciente_ids, 1);
        
        -- Inserir medicamentos para cada paciente
        FOREACH pac_id IN ARRAY paciente_ids
        LOOP
            -- Inserir 1-3 medicamentos por paciente
            INSERT INTO sistemaaps.tb_hiperdia_has_medicamentos 
            (codcidadao, nome_medicamento, dose, frequencia, data_inicio, observacao)
            VALUES 
            (pac_id, 'Losartana 50mg', 1, 1, CURRENT_DATE - INTERVAL '30 days', 'Medicamento de teste'),
            (pac_id, 'Hidroclorotiazida 25mg', 1, 1, CURRENT_DATE - INTERVAL '20 days', 'Medicamento de teste');
            
            -- Alguns pacientes com medicamento adicional
            IF pac_id % 2 = 0 THEN
                INSERT INTO sistemaaps.tb_hiperdia_has_medicamentos 
                (codcidadao, nome_medicamento, dose, frequencia, data_inicio, observacao)
                VALUES 
                (pac_id, 'Amlodipina 5mg', 1, 1, CURRENT_DATE - INTERVAL '10 days', 'Medicamento de teste adicional');
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Medicamentos de teste inseridos com sucesso!';
        
        -- Mostrar resumo
        SELECT COUNT(*) AS total_medicamentos, COUNT(DISTINCT codcidadao) AS pacientes_com_medicamentos
        FROM sistemaaps.tb_hiperdia_has_medicamentos 
        WHERE observacao = 'Medicamento de teste' OR observacao = 'Medicamento de teste adicional';
        
    ELSE
        RAISE NOTICE 'Nenhum paciente hipertenso encontrado para inserir medicamentos de teste.';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    COUNT(*) AS total_medicamentos_ativos,
    COUNT(DISTINCT codcidadao) AS pacientes_com_medicamentos
FROM sistemaaps.tb_hiperdia_has_medicamentos 
WHERE data_fim IS NULL OR data_fim > CURRENT_DATE;

-- Mostrar alguns exemplos
SELECT 
    codcidadao,
    nome_medicamento,
    dose || ' comprimido(s) - ' || frequencia || 'x ao dia' AS posologia,
    TO_CHAR(data_inicio, 'DD/MM/YYYY') AS inicio
FROM sistemaaps.tb_hiperdia_has_medicamentos 
WHERE data_fim IS NULL OR data_fim > CURRENT_DATE
ORDER BY codcidadao, data_inicio DESC
LIMIT 10;