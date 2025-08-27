-- ESQUEMA FINAL DA TABELA tb_hiperdia_dm_insulina COM RASTREAMENTO HISTÓRICO
-- PostgreSQL 9.6 compatível
-- Data: 2025-08-23

-- =============================================================================
-- ESTRUTURA DA TABELA APÓS MODIFICAÇÕES PARA RASTREAMENTO HISTÓRICO
-- =============================================================================

/*
TABELA: sistemaaps.tb_hiperdia_dm_insulina

CAMPOS ORIGINAIS:
- cod_seq_insulina (SERIAL PRIMARY KEY) - Chave primária sequencial
- codcidadao (INTEGER NOT NULL) - Código do paciente
- tipo_insulina (VARCHAR(50) NOT NULL) - Tipo de insulina com CHECK constraint
- frequencia_dia (INTEGER NOT NULL) - Frequência de aplicação (1-4)
- doses_estruturadas (JSON NOT NULL) - Doses e horários em formato JSON
- data_inicio (DATE DEFAULT CURRENT_DATE) - Data de início do uso
- data_fim (DATE NULL) - Data de fim/interrupção (NULL = ativa)
- observacoes (TEXT) - Observações gerais
- motivo_interrupcao (TEXT) - Motivo da interrupção
- created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP) - Data de criação
- updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP) - Data de atualização

CAMPOS ADICIONADOS PARA RASTREAMENTO HISTÓRICO:
- status (VARCHAR(20) DEFAULT 'ATIVO') - Status: ATIVO, SUBSTITUIDO, INTERROMPIDO
- motivo_modificacao (TEXT) - Motivo da modificação
- cod_insulina_anterior (INTEGER) - Referência para insulina anterior
- data_modificacao (TIMESTAMP) - Data/hora da modificação

CONSTRAINTS:
- CHECK (status IN ('ATIVO', 'SUBSTITUIDO', 'INTERROMPIDO'))
- CHECK (tipo_insulina IN ('Insulina NPH', 'Insulina Regular', 'Insulina Glargina', 'Insulina Lispro'))
- CHECK (frequencia_dia BETWEEN 1 AND 4)
- CHECK (validar_doses_insulina(doses_estruturadas, frequencia_dia))
- FOREIGN KEY (cod_insulina_anterior) REFERENCES tb_hiperdia_dm_insulina(cod_seq_insulina)

ÍNDICES:
- PRIMARY KEY (cod_seq_insulina)
- idx_dm_insulina_cidadao (codcidadao)
- idx_dm_insulina_ativa (codcidadao, data_fim) WHERE data_fim IS NULL
- idx_dm_insulina_tipo (tipo_insulina)
- idx_dm_insulina_frequencia (frequencia_dia)
- idx_dm_insulina_status (status)
- idx_dm_insulina_cod_anterior (cod_insulina_anterior)
- idx_dm_insulina_data_modificacao (data_modificacao)
- idx_dm_insulina_cidadao_status (codcidadao, status)

TRIGGERS:
- tr_update_insulina_timestamp: Atualiza updated_at em modificações
- tr_prevent_duplicate_insulin_v2: Previne insulinas ativas duplicadas

FUNÇÕES PRINCIPAIS:
- modificar_insulina_com_historico(): Modifica insulina preservando histórico
- interromper_insulina(): Interrompe insulina com motivo
- validar_doses_insulina(): Valida estrutura JSON das doses

VIEWS:
- vw_insulinas_ativas_com_historico: Insulinas ativas com info de histórico
- vw_historico_insulinas_diabetes: Histórico completo usando CTE recursivo
*/

-- =============================================================================
-- EXEMPLO DE DADOS DEMONSTRANDO A CADEIA HISTÓRICA
-- =============================================================================

-- CENÁRIO: Paciente João Silva (codcidadao: 123456)
-- Histórico de tratamento com insulina ao longo de 1 ano

-- 1. INSULINA INICIAL (Janeiro 2025)
-- Status: SUBSTITUIDO
-- cod_seq_insulina: 1001
-- cod_insulina_anterior: NULL
INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
    cod_seq_insulina, codcidadao, tipo_insulina, frequencia_dia, 
    doses_estruturadas, data_inicio, data_fim, observacoes, 
    status, motivo_modificacao, cod_insulina_anterior, data_modificacao
) VALUES (
    1001, 123456, 'Insulina NPH', 2,
    '[{"dose": 8, "horario": "08:00"}, {"dose": 6, "horario": "20:00"}]'::JSON,
    '2025-01-15', '2025-04-15', 
    'Início do tratamento - NPH 8U manhã e 6U noite',
    'SUBSTITUIDO', 'Ajuste necessário - HbA1c ainda elevada (8.2%)', 
    NULL, '2025-04-15 09:30:00'
) ON CONFLICT (cod_seq_insulina) DO NOTHING;

-- 2. PRIMEIRA MODIFICAÇÃO (Abril 2025)
-- Status: SUBSTITUIDO
-- cod_seq_insulina: 1002
-- cod_insulina_anterior: 1001
INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
    cod_seq_insulina, codcidadao, tipo_insulina, frequencia_dia, 
    doses_estruturadas, data_inicio, data_fim, observacoes, 
    status, motivo_modificacao, cod_insulina_anterior, data_modificacao
) VALUES (
    1002, 123456, 'Insulina NPH', 2,
    '[{"dose": 12, "horario": "08:00"}, {"dose": 10, "horario": "20:00"}]'::JSON,
    '2025-04-15', '2025-07-20', 
    'Aumento da dose - NPH 12U manhã e 10U noite',
    'SUBSTITUIDO', 'Mudança para insulina basal de longa duração', 
    1001, '2025-07-20 14:15:00'
) ON CONFLICT (cod_seq_insulina) DO NOTHING;

-- 3. MUDANÇA DE TIPO (Julho 2025)
-- Status: ATIVO
-- cod_seq_insulina: 1003
-- cod_insulina_anterior: 1002
INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
    cod_seq_insulina, codcidadao, tipo_insulina, frequencia_dia, 
    doses_estruturadas, data_inicio, data_fim, observacoes, 
    status, motivo_modificacao, cod_insulina_anterior, data_modificacao
) VALUES (
    1003, 123456, 'Insulina Glargina', 1,
    '[{"dose": 24, "horario": "22:00"}]'::JSON,
    '2025-07-20', NULL, 
    'Mudança para Glargina - basal única noturna 24U',
    'ATIVO', 'Melhor controle com insulina basal de longa duração', 
    1002, '2025-07-20 14:15:00'
) ON CONFLICT (cod_seq_insulina) DO NOTHING;

-- =============================================================================
-- EXEMPLO DE OUTRO PACIENTE COM INTERRUPÇÃO
-- =============================================================================

-- CENÁRIO: Paciente Maria Santos (codcidadao: 789012)
-- Tratamento com insulina que foi posteriormente interrompido

-- 1. INSULINA ÚNICA (Março 2025)
-- Status: INTERROMPIDO
-- cod_seq_insulina: 2001
-- cod_insulina_anterior: NULL
INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
    cod_seq_insulina, codcidadao, tipo_insulina, frequencia_dia, 
    doses_estruturadas, data_inicio, data_fim, observacoes, 
    status, motivo_interrupcao, motivo_modificacao, cod_insulina_anterior, data_modificacao
) VALUES (
    2001, 789012, 'Insulina Regular', 3,
    '[{"dose": 4, "horario": "08:00"}, {"dose": 6, "horario": "12:00"}, {"dose": 4, "horario": "18:00"}]'::JSON,
    '2025-03-10', '2025-08-10', 
    'Insulina prandial - Regular 3x ao dia',
    'INTERROMPIDO', 
    'Controle adequado alcançado com metformina + glibenclamida. HbA1c 6.9%',
    'Interrupção devido ao bom controle glicêmico', 
    NULL, '2025-08-10 11:45:00'
) ON CONFLICT (cod_seq_insulina) DO NOTHING;

-- =============================================================================
-- CONSULTAS PARA VISUALIZAR OS DADOS DE EXEMPLO
-- =============================================================================

-- 1. Visualizar cadeia histórica completa do Paciente 123456 (João Silva)
SELECT 
    'EXEMPLO: Cadeia Histórica Completa' as titulo,
    cod_seq_insulina,
    tipo_insulina,
    doses_estruturadas,
    data_inicio,
    data_fim,
    status,
    motivo_modificacao,
    cod_insulina_anterior,
    CASE 
        WHEN cod_insulina_anterior IS NULL THEN 'INSULINA INICIAL'
        WHEN status = 'ATIVO' THEN 'INSULINA ATUAL'
        ELSE 'INSULINA INTERMEDIÁRIA'
    END as posicao_cadeia
FROM sistemaaps.tb_hiperdia_dm_insulina 
WHERE codcidadao = 123456 
ORDER BY data_inicio;

-- 2. Demonstrar linking entre registros
SELECT 
    'EXEMPLO: Links Entre Registros' as titulo,
    atual.cod_seq_insulina as cod_atual,
    atual.tipo_insulina as tipo_atual,
    atual.status as status_atual,
    anterior.cod_seq_insulina as cod_anterior,
    anterior.tipo_insulina as tipo_anterior,
    anterior.status as status_anterior,
    atual.motivo_modificacao
FROM sistemaaps.tb_hiperdia_dm_insulina atual
LEFT JOIN sistemaaps.tb_hiperdia_dm_insulina anterior 
    ON atual.cod_insulina_anterior = anterior.cod_seq_insulina
WHERE atual.codcidadao = 123456
ORDER BY atual.data_inicio;

-- 3. Resumo por status
SELECT 
    'EXEMPLO: Resumo por Status' as titulo,
    status,
    COUNT(*) as total_registros,
    COUNT(DISTINCT codcidadao) as total_pacientes,
    AVG(CASE WHEN data_fim IS NOT NULL AND data_inicio IS NOT NULL 
             THEN data_fim - data_inicio END) as duracao_media_dias
FROM sistemaaps.tb_hiperdia_dm_insulina 
WHERE cod_seq_insulina IN (1001, 1002, 1003, 2001)
GROUP BY status;

-- 4. Timeline de modificações
SELECT 
    'EXEMPLO: Timeline de Modificações' as titulo,
    codcidadao,
    data_inicio,
    data_fim,
    tipo_insulina,
    status,
    COALESCE(motivo_modificacao, motivo_interrupcao, 'Registro inicial') as motivo,
    CASE 
        WHEN cod_insulina_anterior IS NULL THEN 'INÍCIO'
        WHEN status = 'ATIVO' THEN 'ATUAL'
        WHEN status = 'SUBSTITUIDO' THEN 'MODIFICADO'  
        WHEN status = 'INTERROMPIDO' THEN 'FINALIZADO'
    END as fase_tratamento
FROM sistemaaps.tb_hiperdia_dm_insulina 
WHERE cod_seq_insulina IN (1001, 1002, 1003, 2001)
ORDER BY codcidadao, data_inicio;

-- =============================================================================
-- ESTRUTURA DE DADOS JSON PARA DOSES
-- =============================================================================

/*
FORMATO DAS DOSES ESTRUTURADAS (JSON):

Para frequencia_dia = 1:
[{"dose": 20, "horario": "22:00"}]

Para frequencia_dia = 2:
[{"dose": 12, "horario": "08:00"}, {"dose": 10, "horario": "20:00"}]

Para frequencia_dia = 3:
[
  {"dose": 4, "horario": "08:00"}, 
  {"dose": 6, "horario": "12:00"}, 
  {"dose": 4, "horario": "18:00"}
]

Para frequencia_dia = 4:
[
  {"dose": 3, "horario": "08:00"}, 
  {"dose": 4, "horario": "12:00"}, 
  {"dose": 4, "horario": "18:00"}, 
  {"dose": 2, "horario": "22:00"}
]

VALIDAÇÕES:
- Número de elementos no array deve ser igual a frequencia_dia
- Campo "dose": INTEGER entre 1 e 100 unidades
- Campo "horario": STRING no formato "HH:MM" (24h)
- Horários devem ser válidos (00:00 a 23:59)
*/

-- =============================================================================
-- FLUXO TÍPICO DE USO DO SISTEMA
-- =============================================================================

/*
1. INSERÇÃO DE NOVA INSULINA:
   INSERT INTO tb_hiperdia_dm_insulina (...) VALUES (...);
   Status automaticamente = 'ATIVO'

2. MODIFICAÇÃO DE INSULINA EXISTENTE:
   SELECT modificar_insulina_com_historico(
     cod_insulina_atual, 
     novo_tipo, 
     nova_frequencia, 
     novas_doses, 
     novas_observacoes, 
     motivo
   );
   
   Resultado:
   - Registro antigo: status = 'SUBSTITUIDO', data_fim preenchida
   - Registro novo: status = 'ATIVO', cod_insulina_anterior = código antigo

3. INTERRUPÇÃO DE INSULINA:
   SELECT interromper_insulina(cod_insulina, motivo);
   
   Resultado:
   - Registro: status = 'INTERROMPIDO', data_fim preenchida

4. CONSULTA DE HISTÓRICO:
   - Insulinas ativas: vw_insulinas_ativas_com_historico
   - Histórico completo: vw_historico_insulinas_diabetes
   - Cadeia específica: JOIN com cod_insulina_anterior

5. VALIDAÇÕES AUTOMÁTICAS:
   - Não permite insulinas ativas duplicadas do mesmo tipo
   - Valida estrutura JSON das doses
   - Mantém integridade referencial do histórico
*/