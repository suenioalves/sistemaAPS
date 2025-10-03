-- EXECUTE ESTE SCRIPT NO BANCO DE DADOS ANTES DE TESTAR
-- Script simplificado para criar a tabela de subtarefas

-- 1. Criar a tabela de subtarefas
CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas (
    cod_subtarefa SERIAL PRIMARY KEY,
    cod_acompanhamento INTEGER NOT NULL REFERENCES sistemaaps.tb_hiperdia_dm_acompanhamento(cod_acompanhamento) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    descricao VARCHAR(300) NOT NULL,
    obrigatoria BOOLEAN DEFAULT FALSE,
    concluida BOOLEAN DEFAULT FALSE,
    data_conclusao DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_ordem_por_acompanhamento UNIQUE (cod_acompanhamento, ordem)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_subtarefas_cod_acompanhamento ON sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas(cod_acompanhamento);

-- 3. Criar view de templates (4 subtarefas para cod_acao = 2)
CREATE OR REPLACE VIEW sistemaaps.vw_subtarefas_template AS
SELECT 2 as cod_acao, 1 as ordem, 'Entregar Solicitação de Exames (Hemoglobina Glicada, Glicemia de Jejum, Outros)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 2 as ordem, 'Iniciado o MGR (Mapeamento de Glicemias Residencial)' as descricao, false as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 3 as ordem, 'Exames laboratoriais realizados' as descricao, true as obrigatoria
UNION ALL
SELECT 2 as cod_acao, 4 as ordem, 'MGR concluído' as descricao, true as obrigatoria;

-- 4. Função e trigger para updated_at
CREATE OR REPLACE FUNCTION sistemaaps.update_subtarefa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trigger_update_subtarefa_timestamp'
    ) THEN
        DROP TRIGGER trigger_update_subtarefa_timestamp ON sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas;
    END IF;
END $$;

CREATE TRIGGER trigger_update_subtarefa_timestamp
BEFORE UPDATE ON sistemaaps.tb_hiperdia_dm_acompanhamento_subtarefas
FOR EACH ROW
EXECUTE PROCEDURE sistemaaps.update_subtarefa_updated_at();

-- Pronto! Agora teste criando um novo acompanhamento
