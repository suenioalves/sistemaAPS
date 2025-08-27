-- Exemplos de uso do sistema de rastreamento histórico de insulinas
-- PostgreSQL 9.6 compatível
-- Data: 2025-08-23

-- =============================================================================
-- EXEMPLO 1: MODIFICAÇÃO DE INSULINA COM HISTÓRICO
-- =============================================================================

-- Cenário: Paciente com insulina NPH que precisa ter a dose ajustada

-- Passo 1: Inserir insulina inicial
INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
    codcidadao, 
    tipo_insulina, 
    frequencia_dia, 
    doses_estruturadas, 
    data_inicio,
    observacoes,
    status
) VALUES (
    888001, 
    'Insulina NPH', 
    2, 
    '[{"dose": 8, "horario": "07:00"}, {"dose": 6, "horario": "19:00"}]'::JSON,
    CURRENT_DATE - INTERVAL '6 months',
    'Início do tratamento - NPH 8U manhã e 6U noite',
    'ATIVO'
) ON CONFLICT DO NOTHING;

-- Passo 2: Verificar insulina atual
SELECT 
    cod_seq_insulina,
    tipo_insulina,
    doses_estruturadas,
    data_inicio,
    status,
    observacoes
FROM sistemaaps.tb_hiperdia_dm_insulina
WHERE codcidadao = 888001 AND status = 'ATIVO';

-- Passo 3: Modificar insulina usando a função (simular após 3 meses)
DO $$
DECLARE 
    v_cod_atual INTEGER;
    v_cod_novo INTEGER;
BEGIN
    -- Buscar código da insulina atual
    SELECT cod_seq_insulina INTO v_cod_atual
    FROM sistemaaps.tb_hiperdia_dm_insulina
    WHERE codcidadao = 888001 AND status = 'ATIVO'
    LIMIT 1;
    
    IF v_cod_atual IS NOT NULL THEN
        -- Modificar insulina
        SELECT modificar_insulina_com_historico(
            v_cod_atual,
            'Insulina NPH',
            2,
            '[{"dose": 12, "horario": "07:00"}, {"dose": 10, "horario": "19:00"}]'::JSON,
            'Ajuste de dose - NPH 12U manhã e 10U noite. Controle glicêmico inadequado',
            'HbA1c 8.5% - necessário aumento de dose'
        ) INTO v_cod_novo;
        
        RAISE NOTICE 'Insulina modificada. Código anterior: %, Novo código: %', v_cod_atual, v_cod_novo;
    END IF;
END $$;

-- =============================================================================
-- EXEMPLO 2: MUDANÇA COMPLETA DE TIPO DE INSULINA
-- =============================================================================

-- Cenário: Trocar NPH por Glargina
DO $$
DECLARE 
    v_cod_atual INTEGER;
    v_cod_novo INTEGER;
BEGIN
    -- Buscar insulina NPH atual do paciente 888001
    SELECT cod_seq_insulina INTO v_cod_atual
    FROM sistemaaps.tb_hiperdia_dm_insulina
    WHERE codcidadao = 888001 AND status = 'ATIVO' AND tipo_insulina = 'Insulina NPH'
    LIMIT 1;
    
    IF v_cod_atual IS NOT NULL THEN
        -- Trocar por Glargina
        SELECT modificar_insulina_com_historico(
            v_cod_atual,
            'Insulina Glargina',
            1,
            '[{"dose": 20, "horario": "22:00"}]'::JSON,
            'Mudança para Glargina - basal única à noite',
            'Melhoria do controle com insulina basal de longa duração'
        ) INTO v_cod_novo;
        
        RAISE NOTICE 'Tipo de insulina alterado. NPH (%) -> Glargina (%)', v_cod_atual, v_cod_novo;
    END IF;
END $$;

-- =============================================================================
-- EXEMPLO 3: INTERRUPÇÃO DE INSULINA
-- =============================================================================

-- Cenário: Paciente conseguiu controle apenas com medicação oral
DO $$
DECLARE 
    v_cod_atual INTEGER;
BEGIN
    -- Inserir nova insulina para exemplo de interrupção
    INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
        codcidadao, 
        tipo_insulina, 
        frequencia_dia, 
        doses_estruturadas, 
        data_inicio,
        observacoes,
        status
    ) VALUES (
        888002, 
        'Insulina Regular', 
        3, 
        '[{"dose": 4, "horario": "08:00"}, {"dose": 6, "horario": "12:00"}, {"dose": 4, "horario": "18:00"}]'::JSON,
        CURRENT_DATE - INTERVAL '2 months',
        'Insulina prandial - Regular 3x ao dia',
        'ATIVO'
    ) RETURNING cod_seq_insulina INTO v_cod_atual;
    
    -- Interromper insulina
    PERFORM interromper_insulina(
        v_cod_atual,
        'Controle adequado alcançado com metformina + glibenclamida. HbA1c 6.8%'
    );
    
    RAISE NOTICE 'Insulina % interrompida com sucesso', v_cod_atual;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Se registro já existe, buscar o código e interromper
        SELECT cod_seq_insulina INTO v_cod_atual
        FROM sistemaaps.tb_hiperdia_dm_insulina
        WHERE codcidadao = 888002 AND status = 'ATIVO' 
        LIMIT 1;
        
        IF v_cod_atual IS NOT NULL THEN
            PERFORM interromper_insulina(
                v_cod_atual,
                'Controle adequado alcançado com metformina + glibenclamida. HbA1c 6.8%'
            );
            RAISE NOTICE 'Insulina % interrompida (registro existente)', v_cod_atual;
        END IF;
END $$;

-- =============================================================================
-- CONSULTAS PARA VISUALIZAR O HISTÓRICO
-- =============================================================================

-- 1. Ver todas as insulinas ativas com informações de histórico
SELECT 
    nome_paciente,
    tipo_insulina,
    frequencia_dia,
    doses_estruturadas,
    data_inicio,
    tem_historico,
    total_modificacoes_anteriores,
    motivo_modificacao
FROM sistemaaps.vw_insulinas_ativas_com_historico
WHERE codcidadao IN (888001, 888002)
ORDER BY codcidadao, tipo_insulina;

-- 2. Ver histórico completo de um paciente específico
SELECT 
    nome_paciente,
    tipo_insulina,
    frequencia_dia,
    doses_estruturadas,
    data_inicio,
    data_fim,
    status,
    motivo_modificacao,
    motivo_interrupcao,
    posicao_historica,
    nivel_historico
FROM sistemaaps.vw_historico_insulinas_diabetes
WHERE codcidadao = 888001
ORDER BY tipo_insulina, nivel_historico;

-- 3. Consulta para rastrear cadeia de modificações
WITH cadeia_modificacoes AS (
    SELECT 
        i1.cod_seq_insulina as cod_atual,
        i1.codcidadao,
        i1.tipo_insulina as tipo_atual,
        i1.data_inicio as data_inicio_atual,
        i1.status as status_atual,
        i1.motivo_modificacao,
        
        i2.cod_seq_insulina as cod_anterior,
        i2.tipo_insulina as tipo_anterior,
        i2.data_inicio as data_inicio_anterior,
        i2.data_fim as data_fim_anterior,
        i2.status as status_anterior,
        
        CASE 
            WHEN i1.tipo_insulina != i2.tipo_insulina THEN 'MUDANÇA DE TIPO'
            WHEN i1.doses_estruturadas::text != i2.doses_estruturadas::text THEN 'AJUSTE DE DOSE'
            ELSE 'OUTRAS MODIFICAÇÕES'
        END as tipo_modificacao
    FROM sistemaaps.tb_hiperdia_dm_insulina i1
    LEFT JOIN sistemaaps.tb_hiperdia_dm_insulina i2 
        ON i1.cod_insulina_anterior = i2.cod_seq_insulina
    WHERE i1.cod_insulina_anterior IS NOT NULL
)
SELECT 
    c.no_cidadao as nome_paciente,
    cm.tipo_modificacao,
    cm.tipo_anterior || ' -> ' || cm.tipo_atual as mudanca_tipo,
    cm.data_inicio_anterior as data_inicio_anterior,
    cm.data_fim_anterior as data_fim_anterior,
    cm.data_inicio_atual as data_inicio_nova,
    cm.motivo_modificacao
FROM cadeia_modificacoes cm
LEFT JOIN sistemaaps.tb_cidadao c ON cm.codcidadao = c.co_cidadao
ORDER BY cm.codcidadao, cm.data_inicio_atual;

-- 4. Relatório de insulinas por status
SELECT 
    status,
    tipo_insulina,
    COUNT(*) as total_registros,
    COUNT(DISTINCT codcidadao) as total_pacientes
FROM sistemaaps.tb_hiperdia_dm_insulina
GROUP BY status, tipo_insulina
ORDER BY status, tipo_insulina;

-- 5. Pacientes com maior número de modificações de insulina
SELECT 
    c.no_cidadao as nome_paciente,
    i.codcidadao,
    COUNT(CASE WHEN i.status = 'ATIVO' THEN 1 END) as insulinas_ativas,
    COUNT(CASE WHEN i.status = 'SUBSTITUIDO' THEN 1 END) as insulinas_substituidas,
    COUNT(CASE WHEN i.status = 'INTERROMPIDO' THEN 1 END) as insulinas_interrompidas,
    COUNT(*) as total_historico,
    MAX(i.data_modificacao) as ultima_modificacao
FROM sistemaaps.tb_hiperdia_dm_insulina i
LEFT JOIN sistemaaps.tb_cidadao c ON i.codcidadao = c.co_cidadao
GROUP BY c.no_cidadao, i.codcidadao
HAVING COUNT(*) > 1  -- Apenas pacientes com histórico
ORDER BY total_historico DESC, ultima_modificacao DESC;

-- =============================================================================
-- CONSULTAS DE VALIDAÇÃO E INTEGRIDADE
-- =============================================================================

-- 1. Verificar se há insulinas ativas duplicadas (não deveria haver)
SELECT 
    codcidadao,
    tipo_insulina,
    COUNT(*) as total_ativas
FROM sistemaaps.tb_hiperdia_dm_insulina
WHERE status = 'ATIVO' AND data_fim IS NULL
GROUP BY codcidadao, tipo_insulina
HAVING COUNT(*) > 1;

-- 2. Verificar consistência das referências anteriores
SELECT 
    i1.cod_seq_insulina as insulina_atual,
    i1.cod_insulina_anterior as ref_anterior,
    CASE 
        WHEN i2.cod_seq_insulina IS NULL THEN 'REFERÊNCIA INVÁLIDA'
        WHEN i2.codcidadao != i1.codcidadao THEN 'PACIENTE DIFERENTE'
        WHEN i2.status != 'SUBSTITUIDO' THEN 'STATUS ANTERIOR INCORRETO'
        ELSE 'OK'
    END as status_validacao
FROM sistemaaps.tb_hiperdia_dm_insulina i1
LEFT JOIN sistemaaps.tb_hiperdia_dm_insulina i2 
    ON i1.cod_insulina_anterior = i2.cod_seq_insulina
WHERE i1.cod_insulina_anterior IS NOT NULL
AND i1.status = 'ATIVO';

-- 3. Verificar orfãos (insulinas substituídas sem sucessora)
SELECT 
    cod_seq_insulina,
    codcidadao,
    tipo_insulina,
    data_fim,
    motivo_modificacao
FROM sistemaaps.tb_hiperdia_dm_insulina i1
WHERE status = 'SUBSTITUIDO'
AND NOT EXISTS (
    SELECT 1 FROM sistemaaps.tb_hiperdia_dm_insulina i2
    WHERE i2.cod_insulina_anterior = i1.cod_seq_insulina
);

-- =============================================================================
-- EXEMPLO DE CLEANUP DE DADOS (USAR COM CUIDADO)
-- =============================================================================

-- Comentado por segurança - descomente apenas se necessário
/*
-- Remover dados de exemplo criados
DELETE FROM sistemaaps.tb_hiperdia_dm_insulina 
WHERE codcidadao IN (888001, 888002, 999001);
*/