-- ================================================================
-- SCRIPT PARA SEPARAR tb_hiperdia_tipos_acao EM DUAS TABELAS
-- ================================================================
-- Este script cria duas tabelas separadas para evitar conflitos:
-- - tb_hiperdia_has_tipos_acao (para Hipertensos)
-- - tb_hiperdia_dm_tipos_acao (para Diabéticos)
--
-- ATENÇÃO: Execute este script ANTES de qualquer outro!
-- ================================================================

-- 1. Criar tabela de tipos de ação para HIPERTENSOS (HAS)
CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_has_tipos_acao (
    cod_acao SERIAL PRIMARY KEY,
    dsc_acao VARCHAR(255) NOT NULL,
    dsc_detalhada TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de tipos de ação para DIABÉTICOS (DM)
CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_dm_tipos_acao (
    cod_acao SERIAL PRIMARY KEY,
    dsc_acao VARCHAR(255) NOT NULL,
    dsc_detalhada TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Migrar TODOS os dados da tabela antiga para HIPERTENSOS
-- Copiar todos os registros existentes que podem estar sendo usados por HAS
INSERT INTO sistemaaps.tb_hiperdia_has_tipos_acao (cod_acao, dsc_acao, dsc_detalhada)
SELECT cod_acao, dsc_acao, dsc_detalhada
FROM sistemaaps.tb_hiperdia_tipos_acao
ON CONFLICT (cod_acao) DO NOTHING;

-- 4. Migrar TODOS os dados da tabela antiga para DIABÉTICOS também
-- Copiar todos os registros existentes
INSERT INTO sistemaaps.tb_hiperdia_dm_tipos_acao (cod_acao, dsc_acao, dsc_detalhada)
SELECT cod_acao, dsc_acao, dsc_detalhada
FROM sistemaaps.tb_hiperdia_tipos_acao
ON CONFLICT (cod_acao) DO NOTHING;

-- 5. Atualizar Foreign Key na tabela de acompanhamento de HIPERTENSOS
-- Remover constraint antiga se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'tb_hiperdia_has_acompanhamento_cod_acao_fkey'
        AND table_name = 'tb_hiperdia_has_acompanhamento'
    ) THEN
        ALTER TABLE sistemaaps.tb_hiperdia_has_acompanhamento
        DROP CONSTRAINT tb_hiperdia_has_acompanhamento_cod_acao_fkey;
    END IF;
END $$;

-- Adicionar nova constraint para HAS
ALTER TABLE sistemaaps.tb_hiperdia_has_acompanhamento
ADD CONSTRAINT tb_hiperdia_has_acompanhamento_cod_acao_fkey
FOREIGN KEY (cod_acao) REFERENCES sistemaaps.tb_hiperdia_has_tipos_acao(cod_acao);

-- 6. Atualizar Foreign Key na tabela de acompanhamento de DIABÉTICOS
-- Remover constraint antiga se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'tb_hiperdia_dm_acompanhamento_cod_acao_fkey'
        AND table_name = 'tb_hiperdia_dm_acompanhamento'
    ) THEN
        ALTER TABLE sistemaaps.tb_hiperdia_dm_acompanhamento
        DROP CONSTRAINT tb_hiperdia_dm_acompanhamento_cod_acao_fkey;
    END IF;
END $$;

-- Adicionar nova constraint para DM
ALTER TABLE sistemaaps.tb_hiperdia_dm_acompanhamento
ADD CONSTRAINT tb_hiperdia_dm_acompanhamento_cod_acao_fkey
FOREIGN KEY (cod_acao) REFERENCES sistemaaps.tb_hiperdia_dm_tipos_acao(cod_acao);

-- 7. Comentários nas tabelas
COMMENT ON TABLE sistemaaps.tb_hiperdia_has_tipos_acao
IS 'Tipos de ações de acompanhamento para pacientes HIPERTENSOS';

COMMENT ON TABLE sistemaaps.tb_hiperdia_dm_tipos_acao
IS 'Tipos de ações de acompanhamento para pacientes DIABÉTICOS';

-- 8. A tabela antiga tb_hiperdia_tipos_acao pode ser mantida por enquanto
-- para compatibilidade com outros módulos (se houver)
-- NÃO vamos removê-la ainda - fazer isso manualmente depois de testar

-- Pronto! Agora as tabelas estão separadas
-- Próximo passo: Atualizar as queries no app.py
