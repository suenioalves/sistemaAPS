-- Script para modificar a tabela tb_hiperdia_has_medicamentos
-- Torna cod_seq_medicamentos uma chave primária auto-incrementável (SERIAL)

DO $$ 
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'sistemaaps' 
        AND table_name = 'tb_hiperdia_has_medicamentos'
    ) THEN
        
        RAISE NOTICE 'Modificando tabela tb_hiperdia_has_medicamentos...';
        
        -- 1. Remover constraint de chave primária se existir
        BEGIN
            ALTER TABLE sistemaaps.tb_hiperdia_has_medicamentos 
            DROP CONSTRAINT IF EXISTS tb_hiperdia_has_medicamentos_pkey;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Nenhuma constraint de PK para remover ou erro: %', SQLERRM;
        END;
        
        -- 2. Criar uma sequência para o auto-incremento
        CREATE SEQUENCE IF NOT EXISTS sistemaaps.tb_hiperdia_has_medicamentos_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;
        
        -- 3. Atualizar valores existentes na coluna (se houver dados)
        UPDATE sistemaaps.tb_hiperdia_has_medicamentos 
        SET cod_seq_medicamentos = nextval('sistemaaps.tb_hiperdia_has_medicamentos_seq')
        WHERE cod_seq_medicamentos IS NULL OR cod_seq_medicamentos = 0;
        
        -- 4. Modificar a coluna para NOT NULL e definir default
        ALTER TABLE sistemaaps.tb_hiperdia_has_medicamentos 
        ALTER COLUMN cod_seq_medicamentos SET NOT NULL;
        
        ALTER TABLE sistemaaps.tb_hiperdia_has_medicamentos 
        ALTER COLUMN cod_seq_medicamentos SET DEFAULT nextval('sistemaaps.tb_hiperdia_has_medicamentos_seq');
        
        -- 5. Definir a coluna como chave primária
        ALTER TABLE sistemaaps.tb_hiperdia_has_medicamentos 
        ADD CONSTRAINT tb_hiperdia_has_medicamentos_pkey PRIMARY KEY (cod_seq_medicamentos);
        
        -- 6. Associar a sequência à coluna (ownership)
        ALTER SEQUENCE sistemaaps.tb_hiperdia_has_medicamentos_seq 
        OWNED BY sistemaaps.tb_hiperdia_has_medicamentos.cod_seq_medicamentos;
        
        -- 7. Ajustar o valor da sequência para o próximo valor disponível
        SELECT setval('sistemaaps.tb_hiperdia_has_medicamentos_seq', 
            COALESCE((SELECT MAX(cod_seq_medicamentos) FROM sistemaaps.tb_hiperdia_has_medicamentos), 0) + 1, 
            false);
        
        RAISE NOTICE 'Tabela tb_hiperdia_has_medicamentos modificada com sucesso!';
        RAISE NOTICE 'cod_seq_medicamentos agora é uma chave primária auto-incrementável';
        
    ELSE
        RAISE NOTICE 'Tabela tb_hiperdia_has_medicamentos não existe. Criando nova tabela...';
        
        -- Criar tabela nova com a estrutura correta
        CREATE TABLE sistemaaps.tb_hiperdia_has_medicamentos (
            cod_seq_medicamentos SERIAL PRIMARY KEY,
            codcidadao INTEGER NOT NULL,
            nome_medicamento VARCHAR(200) NOT NULL,
            frequencia INTEGER,
            data_inicio DATE NOT NULL,
            data_fim DATE,
            cod_acao INTEGER,
            codmedicamento INTEGER,
            observacao VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_tb_hiperdia_has_medicamentos_codcidadao 
        ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao);
        
        CREATE INDEX IF NOT EXISTS idx_tb_hiperdia_has_medicamentos_ativo 
        ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao, data_fim) 
        WHERE data_fim IS NULL;
        
        RAISE NOTICE 'Nova tabela tb_hiperdia_has_medicamentos criada com sucesso!';
    END IF;
    
END $$;