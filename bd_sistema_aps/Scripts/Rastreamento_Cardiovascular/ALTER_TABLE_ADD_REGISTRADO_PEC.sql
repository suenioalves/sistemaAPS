-- Adicionar coluna registrado_pec na tabela tb_rastreamento_cidadaos
-- Esta coluna indica se o cidadão já foi registrado no PEC (Prontuário Eletrônico do Cidadão)

ALTER TABLE sistemaaps.tb_rastreamento_cidadaos
ADD COLUMN IF NOT EXISTS registrado_pec BOOLEAN DEFAULT FALSE;

-- Comentário na coluna
COMMENT ON COLUMN sistemaaps.tb_rastreamento_cidadaos.registrado_pec
IS 'Indica se o cidadão já foi registrado no PEC (Prontuário Eletrônico do Cidadão)';
