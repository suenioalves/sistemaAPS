-- ===========================================================================
-- Adicionar colunas para suportar múltiplas medições por dia no MRPA
-- Protocolo: 3 medições manhã + 2 medições noite por dia
-- ===========================================================================

-- Adicionar coluna periodo (MANHA ou NOITE)
ALTER TABLE sistemaaps.tb_rastreamento_afericoes_mrpa
ADD COLUMN IF NOT EXISTS periodo VARCHAR(10) CHECK (periodo IN ('MANHA', 'NOITE'));

-- Adicionar coluna numero_afericao (1, 2 ou 3)
ALTER TABLE sistemaaps.tb_rastreamento_afericoes_mrpa
ADD COLUMN IF NOT EXISTS numero_afericao INTEGER CHECK (numero_afericao BETWEEN 1 AND 3);

-- Criar índice composto para melhor performance
CREATE INDEX IF NOT EXISTS idx_mrpa_cidadao_dia_periodo
ON sistemaaps.tb_rastreamento_afericoes_mrpa(cod_rastreamento_cidadao, dia_medicao, periodo, numero_afericao);

-- Comentários
COMMENT ON COLUMN sistemaaps.tb_rastreamento_afericoes_mrpa.periodo IS 'Período da medição: MANHA (3 medidas) ou NOITE (2 medidas)';
COMMENT ON COLUMN sistemaaps.tb_rastreamento_afericoes_mrpa.numero_afericao IS 'Número sequencial da medição no período (1, 2 ou 3)';
