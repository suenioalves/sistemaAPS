-- Script para adicionar a nova ação 'Finalizar Acompanhamento' e atualizar constraints para diabetes
-- Data: 29/08/2025
-- Autor: Claude Code Assistant

-- 1. Inserir nova ação 'Finalizar Acompanhamento' na tabela de tipos de ação
INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) VALUES
(12, 'Finalizar Acompanhamento', 'Finalização do acompanhamento diabético - Diabetes compensada/controlada.')
ON CONFLICT (cod_acao) DO UPDATE SET
    dsc_acao = EXCLUDED.dsc_acao,
    dsc_detalhada = EXCLUDED.dsc_detalhada;

-- 2. Verificar se a constraint de status_acao já suporta 'FINALIZADO'
-- Se não suportar, será necessário alterar a constraint

-- Primeiro, vamos dropar a constraint existente se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'tb_hiperdia_dm_acompanhamento_status_acao_check'
        AND constraint_schema = 'sistemaaps'
    ) THEN
        ALTER TABLE sistemaaps.tb_hiperdia_dm_acompanhamento 
        DROP CONSTRAINT tb_hiperdia_dm_acompanhamento_status_acao_check;
    END IF;
END $$;

-- 3. Adicionar nova constraint que inclui 'FINALIZADO'
ALTER TABLE sistemaaps.tb_hiperdia_dm_acompanhamento 
ADD CONSTRAINT tb_hiperdia_dm_acompanhamento_status_acao_check 
CHECK (status_acao IN ('PENDENTE', 'REALIZADA', 'CANCELADA', 'AGUARDANDO', 'FINALIZADO'));

-- 4. Atualizar o valor padrão se necessário
ALTER TABLE sistemaaps.tb_hiperdia_dm_acompanhamento 
ALTER COLUMN status_acao SET DEFAULT 'AGUARDANDO';

-- Comentários sobre as mudanças
COMMENT ON CONSTRAINT tb_hiperdia_dm_acompanhamento_status_acao_check 
ON sistemaaps.tb_hiperdia_dm_acompanhamento 
IS 'Constraint atualizada para incluir status FINALIZADO para término do acompanhamento';

-- Log da execução
DO $$
BEGIN
    RAISE NOTICE 'Script executado com sucesso!';
    RAISE NOTICE 'Nova ação cod_acao=12 "Finalizar Acompanhamento" adicionada.';
    RAISE NOTICE 'Constraint de status_acao atualizada para incluir FINALIZADO.';
END $$;