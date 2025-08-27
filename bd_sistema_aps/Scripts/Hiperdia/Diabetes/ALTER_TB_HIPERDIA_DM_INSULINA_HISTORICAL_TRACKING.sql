-- Script para adicionar funcionalidade de rastreamento histórico à tabela de insulinas
-- PostgreSQL 9.6 compatível
-- Versão: 1.0
-- Data: 2025-08-23

-- PASSO 1: Adicionar novos campos para rastreamento histórico
BEGIN;

-- Adicionar campos para controle de status e histórico
ALTER TABLE sistemaaps.tb_hiperdia_dm_insulina 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ATIVO' 
    CHECK (status IN ('ATIVO', 'SUBSTITUIDO', 'INTERROMPIDO'));

ALTER TABLE sistemaaps.tb_hiperdia_dm_insulina 
ADD COLUMN IF NOT EXISTS motivo_modificacao TEXT;

ALTER TABLE sistemaaps.tb_hiperdia_dm_insulina 
ADD COLUMN IF NOT EXISTS cod_insulina_anterior INTEGER 
    REFERENCES sistemaaps.tb_hiperdia_dm_insulina(cod_seq_insulina);

ALTER TABLE sistemaaps.tb_hiperdia_dm_insulina 
ADD COLUMN IF NOT EXISTS data_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Atualizar registros existentes para status ATIVO
UPDATE sistemaaps.tb_hiperdia_dm_insulina 
SET status = 'ATIVO' 
WHERE status IS NULL AND data_fim IS NULL;

-- Atualizar registros existentes interrompidos
UPDATE sistemaaps.tb_hiperdia_dm_insulina 
SET status = 'INTERROMPIDO' 
WHERE status IS NULL AND data_fim IS NOT NULL;

COMMIT;

-- PASSO 2: Criar função para gerenciar modificação de insulinas com histórico
CREATE OR REPLACE FUNCTION modificar_insulina_com_historico(
    p_cod_insulina_atual INTEGER,
    p_novo_tipo_insulina VARCHAR(50),
    p_nova_frequencia_dia INTEGER,
    p_novas_doses_estruturadas JSON,
    p_novas_observacoes TEXT,
    p_motivo_modificacao TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_codcidadao INTEGER;
    v_novo_cod_insulina INTEGER;
    v_data_atual DATE := CURRENT_DATE;
    v_timestamp_atual TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Buscar dados da insulina atual
    SELECT codcidadao INTO v_codcidadao
    FROM sistemaaps.tb_hiperdia_dm_insulina
    WHERE cod_seq_insulina = p_cod_insulina_atual
    AND status = 'ATIVO';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insulina % não encontrada ou não está ativa', p_cod_insulina_atual;
    END IF;
    
    -- Marcar insulina atual como SUBSTITUIDA
    UPDATE sistemaaps.tb_hiperdia_dm_insulina
    SET 
        status = 'SUBSTITUIDO',
        data_fim = v_data_atual,
        data_modificacao = v_timestamp_atual,
        motivo_modificacao = p_motivo_modificacao
    WHERE cod_seq_insulina = p_cod_insulina_atual;
    
    -- Criar nova insulina baseada na anterior
    INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
        codcidadao,
        tipo_insulina,
        frequencia_dia,
        doses_estruturadas,
        data_inicio,
        observacoes,
        status,
        cod_insulina_anterior,
        motivo_modificacao,
        data_modificacao,
        created_at,
        updated_at
    ) VALUES (
        v_codcidadao,
        p_novo_tipo_insulina,
        p_nova_frequencia_dia,
        p_novas_doses_estruturadas,
        v_data_atual,
        p_novas_observacoes,
        'ATIVO',
        p_cod_insulina_atual,
        p_motivo_modificacao,
        v_timestamp_atual,
        v_timestamp_atual,
        v_timestamp_atual
    ) RETURNING cod_seq_insulina INTO v_novo_cod_insulina;
    
    RETURN v_novo_cod_insulina;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao modificar insulina: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Criar função para interromper insulina
CREATE OR REPLACE FUNCTION interromper_insulina(
    p_cod_insulina INTEGER,
    p_motivo_interrupcao TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_timestamp_atual TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Marcar insulina como INTERROMPIDA
    UPDATE sistemaaps.tb_hiperdia_dm_insulina
    SET 
        status = 'INTERROMPIDO',
        data_fim = CURRENT_DATE,
        motivo_interrupcao = p_motivo_interrupcao,
        data_modificacao = v_timestamp_atual
    WHERE cod_seq_insulina = p_cod_insulina
    AND status = 'ATIVO';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insulina % não encontrada ou não está ativa', p_cod_insulina;
    END IF;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao interromper insulina: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Atualizar trigger para prevenir duplicatas considerando apenas insulinas ATIVAS
DROP TRIGGER IF EXISTS tr_prevent_duplicate_insulin ON sistemaaps.tb_hiperdia_dm_insulina;

CREATE OR REPLACE FUNCTION prevent_duplicate_active_insulin_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se já existe insulina ATIVA do mesmo tipo para o paciente
    IF NEW.status = 'ATIVO' AND EXISTS (
        SELECT 1 FROM sistemaaps.tb_hiperdia_dm_insulina 
        WHERE codcidadao = NEW.codcidadao 
        AND tipo_insulina = NEW.tipo_insulina 
        AND status = 'ATIVO'
        AND data_fim IS NULL
        AND cod_seq_insulina != COALESCE(NEW.cod_seq_insulina, 0)
    ) THEN
        RAISE EXCEPTION 'Paciente já possui insulina ativa do tipo %', NEW.tipo_insulina;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prevent_duplicate_insulin_v2
    BEFORE INSERT OR UPDATE ON sistemaaps.tb_hiperdia_dm_insulina
    FOR EACH ROW
    EXECUTE PROCEDURE prevent_duplicate_active_insulin_v2();

-- PASSO 5: Criar índices para melhor performance das consultas históricas
CREATE INDEX IF NOT EXISTS idx_dm_insulina_status ON sistemaaps.tb_hiperdia_dm_insulina(status);
CREATE INDEX IF NOT EXISTS idx_dm_insulina_cod_anterior ON sistemaaps.tb_hiperdia_dm_insulina(cod_insulina_anterior);
CREATE INDEX IF NOT EXISTS idx_dm_insulina_data_modificacao ON sistemaaps.tb_hiperdia_dm_insulina(data_modificacao);
CREATE INDEX IF NOT EXISTS idx_dm_insulina_cidadao_status ON sistemaaps.tb_hiperdia_dm_insulina(codcidadao, status);

-- PASSO 6: Criar view para consultar histórico completo de insulinas
CREATE OR REPLACE VIEW sistemaaps.vw_historico_insulinas_diabetes AS
WITH RECURSIVE historico_chain AS (
    -- Anchor: insulinas atuais (ativas)
    SELECT 
        cod_seq_insulina,
        codcidadao,
        tipo_insulina,
        frequencia_dia,
        doses_estruturadas,
        data_inicio,
        data_fim,
        status,
        motivo_modificacao,
        motivo_interrupcao,
        cod_insulina_anterior,
        data_modificacao,
        created_at,
        updated_at,
        1 as nivel_historico,
        ARRAY[cod_seq_insulina] as cadeia_historica
    FROM sistemaaps.tb_hiperdia_dm_insulina
    WHERE status = 'ATIVO'
    
    UNION ALL
    
    -- Recursive: buscar insulinas anteriores
    SELECT 
        i.cod_seq_insulina,
        i.codcidadao,
        i.tipo_insulina,
        i.frequencia_dia,
        i.doses_estruturadas,
        i.data_inicio,
        i.data_fim,
        i.status,
        i.motivo_modificacao,
        i.motivo_interrupcao,
        i.cod_insulina_anterior,
        i.data_modificacao,
        i.created_at,
        i.updated_at,
        h.nivel_historico + 1,
        h.cadeia_historica || i.cod_seq_insulina
    FROM sistemaaps.tb_hiperdia_dm_insulina i
    INNER JOIN historico_chain h ON h.cod_insulina_anterior = i.cod_seq_insulina
    WHERE h.nivel_historico < 10  -- Evitar loops infinitos
)
SELECT 
    h.*,
    c.no_cidadao as nome_paciente,
    CASE 
        WHEN h.nivel_historico = 1 THEN 'ATUAL'
        ELSE CONCAT('HISTÓRICO ', h.nivel_historico - 1)
    END as posicao_historica
FROM historico_chain h
LEFT JOIN sistemaaps.tb_cidadao c ON h.codcidadao = c.co_cidadao
ORDER BY h.codcidadao, h.tipo_insulina, h.nivel_historico;

-- PASSO 7: Criar view simplificada para insulinas ativas com informação de histórico
CREATE OR REPLACE VIEW sistemaaps.vw_insulinas_ativas_com_historico AS
SELECT 
    i.cod_seq_insulina,
    i.codcidadao,
    c.no_cidadao as nome_paciente,
    i.tipo_insulina,
    i.frequencia_dia,
    i.doses_estruturadas,
    i.data_inicio,
    i.observacoes,
    i.status,
    i.cod_insulina_anterior,
    i.motivo_modificacao,
    i.data_modificacao,
    i.created_at,
    i.updated_at,
    -- Informações sobre histórico
    CASE 
        WHEN i.cod_insulina_anterior IS NOT NULL THEN 'SIM'
        ELSE 'NÃO'
    END as tem_historico,
    -- Contar quantas modificações foram feitas
    (SELECT COUNT(*) 
     FROM sistemaaps.tb_hiperdia_dm_insulina hist 
     WHERE hist.codcidadao = i.codcidadao 
     AND hist.tipo_insulina = i.tipo_insulina 
     AND hist.status IN ('SUBSTITUIDO', 'INTERROMPIDO')
    ) as total_modificacoes_anteriores,
    -- Resumo para exibição
    CONCAT(
        i.tipo_insulina, ' - ', 
        CASE 
            WHEN i.frequencia_dia = 1 THEN 'Once daily'
            WHEN i.frequencia_dia = 2 THEN 'Twice daily'  
            WHEN i.frequencia_dia = 3 THEN '3x daily'
            WHEN i.frequencia_dia = 4 THEN '4x daily'
            ELSE CONCAT(i.frequencia_dia::text, 'x daily')
        END,
        CASE 
            WHEN i.cod_insulina_anterior IS NOT NULL THEN ' (MODIFICADA)'
            ELSE ''
        END
    ) as resumo_doses
FROM sistemaaps.tb_hiperdia_dm_insulina i
LEFT JOIN sistemaaps.tb_cidadao c ON i.codcidadao = c.co_cidadao
WHERE i.status = 'ATIVO' AND i.data_fim IS NULL
ORDER BY i.tipo_insulina, i.created_at DESC;

-- PASSO 8: Adicionar comentários para os novos campos
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.status IS 'Status do registro: ATIVO, SUBSTITUIDO, INTERROMPIDO';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.motivo_modificacao IS 'Motivo da modificação quando insulina foi alterada';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.cod_insulina_anterior IS 'Código da insulina que foi substituída por esta';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.data_modificacao IS 'Data/hora da última modificação no registro';

COMMENT ON VIEW sistemaaps.vw_historico_insulinas_diabetes IS 'View com histórico completo de insulinas usando CTE recursivo';
COMMENT ON VIEW sistemaaps.vw_insulinas_ativas_com_historico IS 'View de insulinas ativas com informações do histórico';

COMMENT ON FUNCTION modificar_insulina_com_historico(INTEGER, VARCHAR(50), INTEGER, JSON, TEXT, TEXT) IS 'Função para modificar insulina preservando histórico';
COMMENT ON FUNCTION interromper_insulina(INTEGER, TEXT) IS 'Função para interromper insulina com motivo';

-- PASSO 9: Inserir dados de exemplo demonstrando o histórico
-- (Executar apenas se não houver dados conflitantes)

DO $$
DECLARE 
    v_cod_original INTEGER;
    v_cod_modificada INTEGER;
BEGIN
    -- Inserir insulina original
    INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
        codcidadao, 
        tipo_insulina, 
        frequencia_dia, 
        doses_estruturadas, 
        data_inicio,
        observacoes,
        status
    ) VALUES (
        999001, 
        'Insulina NPH', 
        2, 
        '[{"dose": 10, "horario": "08:00"}, {"dose": 6, "horario": "20:00"}]'::JSON,
        '2025-01-01',
        'Insulina inicial - NPH 2x ao dia',
        'ATIVO'
    ) RETURNING cod_seq_insulina INTO v_cod_original;
    
    -- Simular modificação após 3 meses
    UPDATE sistemaaps.tb_hiperdia_dm_insulina 
    SET data_modificacao = '2025-04-01 10:30:00'::TIMESTAMP
    WHERE cod_seq_insulina = v_cod_original;
    
    -- Modificar a insulina (aumentar doses)
    SELECT modificar_insulina_com_historico(
        v_cod_original,
        'Insulina NPH',
        2,
        '[{"dose": 14, "horario": "08:00"}, {"dose": 10, "horario": "20:00"}]'::JSON,
        'Insulina modificada - aumento das doses devido a controle inadequado',
        'Aumento de dose devido HbA1c elevada (9.2%)'
    ) INTO v_cod_modificada;
    
    -- Atualizar data da modificação para exemplo
    UPDATE sistemaaps.tb_hiperdia_dm_insulina 
    SET 
        data_inicio = '2025-04-01',
        data_modificacao = '2025-04-01 10:30:00'::TIMESTAMP
    WHERE cod_seq_insulina = v_cod_modificada;
    
    RAISE NOTICE 'Exemplo de histórico criado: Insulina original (%) -> Insulina modificada (%)', v_cod_original, v_cod_modificada;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Dados de exemplo já existem ou conflito detectado';
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar dados de exemplo: %', SQLERRM;
END $$;