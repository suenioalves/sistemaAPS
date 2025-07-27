-- Script para adicionar a coluna posologia se ela não existir

DO $$ 
BEGIN
    -- Verifica se a coluna posologia não existe e a adiciona
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'sistemaaps' 
        AND table_name = 'tb_hiperdia_has_medicamentos' 
        AND column_name = 'posologia'
    ) THEN
        ALTER TABLE sistemaaps.tb_hiperdia_has_medicamentos 
        ADD COLUMN posologia VARCHAR(100);
        
        RAISE NOTICE 'Coluna posologia adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna posologia já existe';
    END IF;
END $$;