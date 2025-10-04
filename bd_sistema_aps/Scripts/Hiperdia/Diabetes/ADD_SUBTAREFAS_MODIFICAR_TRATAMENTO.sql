-- ================================================================
-- ADICIONAR SUBTAREFAS PARA MODIFICAR TRATAMENTO
-- ================================================================
-- Este script adiciona a subtarefa da ação cod_acao = 5
-- "Modificar Tratamento"
-- ================================================================

-- Atualizar a view de templates com as novas subtarefas
DROP VIEW IF EXISTS sistemaaps.vw_subtarefas_template;

CREATE VIEW sistemaaps.vw_subtarefas_template AS
-- Subtarefas para cod_acao = 2 (Aguardando Coleta de Exames e MGR)
SELECT 2 as cod_acao, 1 as ordem, 'Entregar Solicitação de Exames (Hemoglobina Glicada, Glicemia de Jejum, Outros)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 2 as ordem, 'Iniciado o MGR (Mapeamento de Glicemias Residencial)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 3 as ordem, 'Exames laboratoriais realizados' as descricao, true as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 4 as ordem, 'MGR concluído' as descricao, true as obrigatoria

UNION ALL

-- Subtarefa para cod_acao = 5 (Modificar Tratamento)
SELECT 5 as cod_acao, 1 as ordem, 'Nova receita dos medicamentos entregue ao paciente' as descricao, true as obrigatoria

UNION ALL

-- Subtarefas para cod_acao = 7 (Encaminhar para Endocrinologia)
SELECT 7 as cod_acao, 1 as ordem, 'Agendar a consulta na telessaúde' as descricao, false as obrigatoria
UNION ALL
SELECT 7 as cod_acao, 2 as ordem, 'Encaminhar para a consulta presencial' as descricao, false as obrigatoria
UNION ALL
SELECT 7 as cod_acao, 3 as ordem, 'Entregue solicitação de exames prescritos pela endocrinologia' as descricao, false as obrigatoria
UNION ALL
SELECT 7 as cod_acao, 4 as ordem, 'Entregue a nova prescrição de medicamentos pela endocrinologia' as descricao, false as obrigatoria
UNION ALL
SELECT 7 as cod_acao, 5 as ordem, 'Exames realizados' as descricao, false as obrigatoria
UNION ALL
SELECT 7 as cod_acao, 6 as ordem, 'Consulta com endocrinologia realizada' as descricao, true as obrigatoria

UNION ALL

-- Subtarefas para cod_acao = 8 (Encaminhar para Nutrição)
SELECT 8 as cod_acao, 1 as ordem, 'Entregue o encaminhamento para a Nutrição' as descricao, false as obrigatoria
UNION ALL
SELECT 8 as cod_acao, 2 as ordem, 'Consulta com a Nutrição realizada' as descricao, true as obrigatoria;

-- Verificar os templates criados
SELECT cod_acao, ordem, descricao, obrigatoria
FROM sistemaaps.vw_subtarefas_template
ORDER BY cod_acao, ordem;

-- Adicionar subtarefas para ações cod_acao = 5 já existentes (se houver)
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
WHERE a.cod_acao = 5  -- Modificar Tratamento
  AND t.cod_acao = 5
  AND NOT EXISTS (
      -- Verificar se já não tem subtarefas
      SELECT 1
      FROM sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas s
      WHERE s.cod_acompanhamento = a.cod_acompanhamento
  )
ORDER BY a.cod_acompanhamento, t.ordem;

-- Verificar quantas subtarefas existem para cod_acao = 5
SELECT
    a.cod_acompanhamento,
    a.cod_cidadao,
    a.data_agendamento,
    a.status_acao,
    COUNT(s.cod_subtarefa) as total_subtarefas
FROM sistemaaps.tb_hiperdia_dm_acompanhamento a
LEFT JOIN sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas s
    ON a.cod_acompanhamento = s.cod_acompanhamento
WHERE a.cod_acao = 5
GROUP BY a.cod_acompanhamento, a.cod_cidadao, a.data_agendamento, a.status_acao
ORDER BY a.cod_acompanhamento;
