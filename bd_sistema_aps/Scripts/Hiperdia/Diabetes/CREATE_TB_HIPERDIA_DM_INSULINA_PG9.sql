-- Criação da tabela para gerenciamento de insulinas no diabetes (PostgreSQL 9.6 compatible)
-- Especializada para NPH e Regular com doses por horário

CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_dm_insulina (
    cod_seq_insulina SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    tipo_insulina VARCHAR(50) NOT NULL CHECK (tipo_insulina IN ('Insulina NPH', 'Insulina Regular', 'Insulina Glargina', 'Insulina Lispro')),
    frequencia_dia INTEGER NOT NULL CHECK (frequencia_dia BETWEEN 1 AND 4),
    doses_estruturadas JSON NOT NULL,
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE NULL,
    observacoes TEXT,
    motivo_interrupcao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função para validar estrutura das doses (compatible with PG 9.6)
CREATE OR REPLACE FUNCTION validar_doses_insulina(doses JSON, frequencia INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    dose_count INTEGER;
    dose_item JSON;
    dose_valor INTEGER;
    horario_valor TEXT;
    i INTEGER := 0;
BEGIN
    -- Verificar se o número de doses corresponde à frequência
    dose_count := json_array_length(doses);
    IF dose_count != frequencia THEN
        RETURN FALSE;
    END IF;
    
    -- Validar cada dose individual
    WHILE i < dose_count LOOP
        dose_item := json_array_element(doses, i);
        
        -- Verificar se tem os campos obrigatórios
        IF NOT (dose_item ? 'dose' AND dose_item ? 'horario') THEN
            RETURN FALSE;
        END IF;
        
        -- Validar dose (1-100 unidades)
        dose_valor := (dose_item->>'dose')::INTEGER;
        IF dose_valor < 1 OR dose_valor > 100 THEN
            RETURN FALSE;
        END IF;
        
        -- Validar formato do horário (HH:MM)
        horario_valor := dose_item->>'horario';
        IF NOT horario_valor ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' THEN
            RETURN FALSE;
        END IF;
        
        i := i + 1;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Constraint para validar doses estruturadas
ALTER TABLE sistemaaps.tb_hiperdia_dm_insulina 
ADD CONSTRAINT check_doses_estruturadas 
CHECK (validar_doses_insulina(doses_estruturadas, frequencia_dia));

-- Trigger function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_insulina_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at (PG 9.6 syntax)
DROP TRIGGER IF EXISTS tr_update_insulina_timestamp ON sistemaaps.tb_hiperdia_dm_insulina;
CREATE TRIGGER tr_update_insulina_timestamp
    BEFORE UPDATE ON sistemaaps.tb_hiperdia_dm_insulina
    FOR EACH ROW
    EXECUTE PROCEDURE update_insulina_timestamp();

-- Função para prevenir insulinas duplicadas ativas
CREATE OR REPLACE FUNCTION prevent_duplicate_active_insulin()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se já existe insulina ativa do mesmo tipo para o paciente
    IF EXISTS (
        SELECT 1 FROM sistemaaps.tb_hiperdia_dm_insulina 
        WHERE codcidadao = NEW.codcidadao 
        AND tipo_insulina = NEW.tipo_insulina 
        AND data_fim IS NULL
        AND cod_seq_insulina != COALESCE(NEW.cod_seq_insulina, 0)
    ) THEN
        RAISE EXCEPTION 'Paciente já possui insulina ativa do tipo %', NEW.tipo_insulina;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para prevenir insulinas duplicadas (PG 9.6 syntax)
DROP TRIGGER IF EXISTS tr_prevent_duplicate_insulin ON sistemaaps.tb_hiperdia_dm_insulina;
CREATE TRIGGER tr_prevent_duplicate_insulin
    BEFORE INSERT OR UPDATE ON sistemaaps.tb_hiperdia_dm_insulina
    FOR EACH ROW
    WHEN (NEW.data_fim IS NULL)
    EXECUTE PROCEDURE prevent_duplicate_active_insulin();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dm_insulina_cidadao ON sistemaaps.tb_hiperdia_dm_insulina(codcidadao);
CREATE INDEX IF NOT EXISTS idx_dm_insulina_ativa ON sistemaaps.tb_hiperdia_dm_insulina(codcidadao, data_fim) WHERE data_fim IS NULL;
CREATE INDEX IF NOT EXISTS idx_dm_insulina_tipo ON sistemaaps.tb_hiperdia_dm_insulina(tipo_insulina);
CREATE INDEX IF NOT EXISTS idx_dm_insulina_frequencia ON sistemaaps.tb_hiperdia_dm_insulina(frequencia_dia);

-- Comentários da tabela
COMMENT ON TABLE sistemaaps.tb_hiperdia_dm_insulina IS 'Tabela para gerenciamento especializado de insulinas (NPH, Regular) com doses por horário';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.cod_seq_insulina IS 'Chave primária sequencial da insulina';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.codcidadao IS 'Código do cidadão/paciente';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.tipo_insulina IS 'Tipo de insulina (NPH, Regular, Glargina, Lispro)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.frequencia_dia IS 'Frequência de aplicação por dia (1-4 vezes)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.doses_estruturadas IS 'JSON com estrutura: [{"dose": 12, "horario": "08:00"}]';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.data_inicio IS 'Data de início do uso da insulina';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.data_fim IS 'Data de fim/interrupção da insulina (NULL = ativa)';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.observacoes IS 'Observações sobre a insulina';
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.motivo_interrupcao IS 'Motivo da interrupção da insulina';

-- Dados de exemplo para demonstração
INSERT INTO sistemaaps.tb_hiperdia_dm_insulina (
    codcidadao, 
    tipo_insulina, 
    frequencia_dia, 
    doses_estruturadas, 
    observacoes
) VALUES 
(
    123456, 
    'Insulina NPH', 
    2, 
    '[{"dose": 12, "horario": "08:00"}, {"dose": 8, "horario": "20:00"}]'::JSON,
    'Exemplo: NPH 2x ao dia - manhã e noite'
),
(
    12499, 
    'Insulina Regular', 
    3, 
    '[{"dose": 4, "horario": "08:00"}, {"dose": 6, "horario": "12:00"}, {"dose": 4, "horario": "18:00"}]'::JSON,
    'Exemplo: Regular 3x ao dia - café, almoço e jantar'
)
ON CONFLICT DO NOTHING;

-- View para facilitar consultas de insulinas ativas
CREATE OR REPLACE VIEW sistemaaps.vw_insulinas_ativas_diabetes AS
SELECT 
    i.cod_seq_insulina,
    i.codcidadao,
    c.no_cidadao as nome_paciente,
    i.tipo_insulina,
    i.frequencia_dia,
    i.doses_estruturadas,
    i.data_inicio,
    i.observacoes,
    i.created_at,
    i.updated_at,
    -- Campo calculado para exibição resumida (simplified for PG 9.6)
    CONCAT(
        i.tipo_insulina, ' - ', 
        CASE 
            WHEN i.frequencia_dia = 1 THEN 'Once daily'
            WHEN i.frequencia_dia = 2 THEN 'Twice daily'  
            WHEN i.frequencia_dia = 3 THEN '3x daily'
            WHEN i.frequencia_dia = 4 THEN '4x daily'
            ELSE CONCAT(i.frequencia_dia::text, 'x daily')
        END
    ) as resumo_doses
FROM sistemaaps.tb_hiperdia_dm_insulina i
LEFT JOIN sistemaaps.tb_cidadao c ON i.codcidadao = c.co_cidadao
WHERE i.data_fim IS NULL
ORDER BY i.tipo_insulina, i.created_at DESC;

COMMENT ON VIEW sistemaaps.vw_insulinas_ativas_diabetes IS 'View com insulinas ativas e resumo formatado para exibição';