-- ================================================================
-- CORRIGIR: Adicionar subtarefas para ações cod_acao=7 já existentes
-- ================================================================
-- Este script adiciona as subtarefas para as ações de "Encaminhar para
-- Endocrinologia" que já foram criadas antes do script de templates
-- ================================================================

-- Primeiro, execute o script ADD_SUBTAREFAS_ENDOCRINOLOGIA.sql para criar a view

-- Depois, execute este script para adicionar subtarefas às ações existentes

-- Adicionar subtarefas para todas as ações cod_acao = 7 que não têm subtarefas
INSERT INTO sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas
(cod_acompanhamento, ordem, descricao, obrigatoria, concluida)
SELECT
    a.cod_acompanhamento,
    t.ordem,
    t.descricao,
    t.obrigatoria,
    FALSE as concluida
FROM sistemaaps.tb_hiperdia_dm_acompanhamento a
CROSS JOIN sistemaaps.vw_subtarefas_template t
WHERE a.cod_acao = 7  -- Encaminhar para Endocrinologia
  AND t.cod_acao = 7
  AND NOT EXISTS (
      -- Verificar se já não tem subtarefas
      SELECT 1
      FROM sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas s
      WHERE s.cod_acompanhamento = a.cod_acompanhamento
  )
ORDER BY a.cod_acompanhamento, t.ordem;

-- Verificar quantas subtarefas foram adicionadas
SELECT
    a.cod_acompanhamento,
    a.cod_cidadao,
    a.data_agendamento,
    COUNT(s.cod_subtarefa) as total_subtarefas
FROM sistemaaps.tb_hiperdia_dm_acompanhamento a
LEFT JOIN sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas s
    ON a.cod_acompanhamento = s.cod_acompanhamento
WHERE a.cod_acao = 7
GROUP BY a.cod_acompanhamento, a.cod_cidadao, a.data_agendamento
ORDER BY a.cod_acompanhamento;
