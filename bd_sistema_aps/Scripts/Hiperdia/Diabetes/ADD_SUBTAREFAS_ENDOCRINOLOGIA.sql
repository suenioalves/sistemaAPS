-- ================================================================
-- ADICIONAR SUBTAREFAS PARA ENCAMINHAMENTO À ENDOCRINOLOGIA
-- ================================================================
-- Este script adiciona as subtarefas da ação cod_acao = 7
-- "Encaminhar para Endocrinologia"
-- ================================================================

-- Atualizar a view de templates com as novas subtarefas
CREATE OR REPLACE VIEW sistemaaps.vw_subtarefas_template AS
-- Subtarefas para cod_acao = 2 (Aguardando Coleta de Exames e MGR)
SELECT 2 as cod_acao, 1 as ordem, 'Entregar Solicitação de Exames (Hemoglobina Glicada, Glicemia de Jejum, Outros)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 2 as ordem, 'Iniciado o MGR (Mapeamento de Glicemias Residencial)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 3 as ordem, 'Exames laboratoriais realizados' as descricao, true as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 4 as ordem, 'MGR concluído' as descricao, true as obrigatoria

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
SELECT 7 as cod_acao, 6 as ordem, 'Consulta com endocrinologia realizada' as descricao, true as obrigatoria;

-- Verificar os templates criados
SELECT cod_acao, ordem, descricao, obrigatoria
FROM sistemaaps.vw_subtarefas_template
ORDER BY cod_acao, ordem;
