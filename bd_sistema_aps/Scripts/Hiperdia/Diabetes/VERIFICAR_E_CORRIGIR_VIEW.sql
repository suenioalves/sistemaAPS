-- ================================================================
-- VERIFICAR E CORRIGIR VIEW DE SUBTAREFAS
-- ================================================================

-- 1. VERIFICAR se a view tem as subtarefas do cod_acao = 7
SELECT cod_acao, ordem, descricao, obrigatoria
FROM sistemaaps.vw_subtarefas_template
WHERE cod_acao = 7
ORDER BY ordem;

-- Se o resultado acima estiver VAZIO, execute o comando abaixo:

-- 2. RECRIAR a view com TODAS as subtarefas
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

-- 3. VERIFICAR novamente
SELECT cod_acao, ordem, descricao, obrigatoria
FROM sistemaaps.vw_subtarefas_template
ORDER BY cod_acao, ordem;

-- 4. Depois de confirmar que a view está correta, adicionar subtarefas para o cod_acompanhamento=81
INSERT INTO sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas
(cod_acompanhamento, ordem, descricao, obrigatoria, concluida)
SELECT 81, ordem, descricao, obrigatoria, FALSE
FROM sistemaaps.vw_subtarefas_template
WHERE cod_acao = 7
ORDER BY ordem;

-- 5. Verificar se as subtarefas foram criadas
SELECT * FROM sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas
WHERE cod_acompanhamento = 81
ORDER BY ordem;
