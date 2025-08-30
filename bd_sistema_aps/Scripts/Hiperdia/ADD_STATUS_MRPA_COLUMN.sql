-- Script to add status_mrpa column to tb_hiperdia_mrpa table
-- This column stores the treatment decision from MRPA evaluation:
-- 0 = Modificar Tratamento (Hipertensão descompensada)
-- 1 = Manter Tratamento (Hipertensão controlada)

-- Add the status_mrpa column
ALTER TABLE sistemaaps.tb_hiperdia_mrpa 
ADD COLUMN IF NOT EXISTS status_mrpa INTEGER;

-- Add comment to document the column purpose
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrpa.status_mrpa IS 'Status do MRPA: 0=Modificar Tratamento (Hipertensão descompensada), 1=Manter Tratamento (Hipertensão controlada)';