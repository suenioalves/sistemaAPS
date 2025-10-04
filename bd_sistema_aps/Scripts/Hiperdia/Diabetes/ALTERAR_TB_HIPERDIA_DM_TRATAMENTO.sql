-- Script para alterar a tabela tb_hiperdia_dm_tratamento
-- Modificações solicitadas:
-- 1. Adicionar campo status_tratamento (código 1-verde, 2-amarelo, 3-vermelho)
-- 2. Remover campo tipo_ajuste
-- 3. Adicionar campo observacoes
-- 4. Adicionar campo mudanca_proposta

-- Remover campo tipo_ajuste
ALTER TABLE sistemaaps.tb_hiperdia_dm_tratamento
DROP COLUMN IF EXISTS tipo_ajuste;

-- Adicionar campo status_tratamento
ALTER TABLE sistemaaps.tb_hiperdia_dm_tratamento
ADD COLUMN IF NOT EXISTS status_tratamento INTEGER CHECK (status_tratamento IN (1, 2, 3));

-- Adicionar campo observacoes
ALTER TABLE sistemaaps.tb_hiperdia_dm_tratamento
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Adicionar campo mudanca_proposta
ALTER TABLE sistemaaps.tb_hiperdia_dm_tratamento
ADD COLUMN IF NOT EXISTS mudanca_proposta TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_tratamento.status_tratamento IS 'Status do tratamento: 1-Controlado (verde), 2-Aceitável (amarelo), 3-Descompensado (vermelho)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_tratamento.observacoes IS 'Observações sobre a avaliação do tratamento';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_tratamento.mudanca_proposta IS 'Mudanças propostas no tratamento';
