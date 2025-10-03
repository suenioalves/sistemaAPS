-- ==========================================
-- SCRIPT PARA ATUALIZAR SISTEMA DE SUBTAREFAS
-- ==========================================
-- Execute este script para:
-- 1. Adicionar coluna 'obrigatoria' na tabela de subtarefas
-- 2. Atualizar nome da ação cod_acao=2
-- 3. Atualizar view de templates para 4 subtarefas

-- 1. Adicionar coluna 'obrigatoria' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'sistemaaps'
        AND table_name = 'tb_hiperdia_dm_acompanhamento_subtarefas'
        AND column_name = 'obrigatoria'
    ) THEN
        ALTER TABLE sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas
        ADD COLUMN obrigatoria BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Atualizar nome da ação cod_acao=2 na tabela ESPECÍFICA de Diabéticos
-- Agora as tabelas estão separadas, então podemos atualizar sem afetar hipertensos!
UPDATE sistemaaps.tb_hiperdia_dm_tipos_acao
SET dsc_acao = 'Aguardando Coleta de Exames e Glicemias Residenciais',
    dsc_detalhada = 'Aguardando que o paciente realize a coleta de exames laboratoriais e o mapeamento residencial de glicemias.'
WHERE cod_acao = 2;

-- 3. Atualizar view de templates para 4 subtarefas
CREATE OR REPLACE VIEW sistemaaps.vw_subtarefas_template AS
SELECT 2 as cod_acao, 1 as ordem, 'Entregar Solicitação de Exames (Hemoglobina Glicada, Glicemia de Jejum, Outros)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 2 as ordem, 'Iniciado o MGR (Mapeamento de Glicemias Residencial)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 3 as ordem, 'Exames laboratoriais realizados' as descricao, true as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 4 as ordem, 'MGR concluído' as descricao, true as obrigatoria;

-- Pronto! Agora crie um novo acompanhamento para testar as 4 subtarefas
