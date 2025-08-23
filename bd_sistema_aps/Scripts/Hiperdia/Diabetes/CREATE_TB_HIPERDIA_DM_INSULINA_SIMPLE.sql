-- Criação simplificada da tabela para gerenciamento de insulinas no diabetes (PostgreSQL 9.6)
-- Especializada para NPH e Regular com doses por horário

CREATE TABLE IF NOT EXISTS sistemaaps.tb_hiperdia_dm_insulina (
    cod_seq_insulina SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    tipo_insulina VARCHAR(50) NOT NULL CHECK (tipo_insulina IN ('Insulina NPH', 'Insulina Regular', 'Insulina Glargina', 'Insulina Lispro')),
    frequencia_dia INTEGER NOT NULL CHECK (frequencia_dia BETWEEN 1 AND 4),
    doses_estruturadas TEXT NOT NULL, -- Using TEXT instead of JSON for PG 9.6 compatibility
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE NULL,
    observacoes TEXT,
    motivo_interrupcao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_dm_insulina_cidadao FOREIGN KEY (codcidadao) REFERENCES sistemaaps.tb_cidadao(co_cidadao)
);

-- Trigger function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_insulina_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS tr_update_insulina_timestamp ON sistemaaps.tb_hiperdia_dm_insulina;
CREATE TRIGGER tr_update_insulina_timestamp
    BEFORE UPDATE ON sistemaaps.tb_hiperdia_dm_insulina
    FOR EACH ROW
    EXECUTE PROCEDURE update_insulina_timestamp();

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
COMMENT ON COLUMN sistemaaps.tb_hiperdia_dm_insulina.doses_estruturadas IS 'JSON como texto com estrutura: [{"dose": 12, "horario": "08:00"}]';
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
    '[{"dose": 12, "horario": "08:00"}, {"dose": 8, "horario": "20:00"}]',
    'Exemplo: NPH 2x ao dia - manhã e noite'
),
(
    12499, 
    'Insulina Regular', 
    3, 
    '[{"dose": 4, "horario": "08:00"}, {"dose": 6, "horario": "12:00"}, {"dose": 4, "horario": "18:00"}]',
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
    -- Campo calculado para exibição resumida
    CONCAT(
        i.tipo_insulina, ' - ', 
        CASE 
            WHEN i.frequencia_dia = 1 THEN '1x/dia'
            WHEN i.frequencia_dia = 2 THEN '2x/dia'  
            WHEN i.frequencia_dia = 3 THEN '3x/dia'
            WHEN i.frequencia_dia = 4 THEN '4x/dia'
            ELSE CONCAT(i.frequencia_dia::text, 'x/dia')
        END
    ) as resumo_doses
FROM sistemaaps.tb_hiperdia_dm_insulina i
LEFT JOIN sistemaaps.tb_cidadao c ON i.codcidadao = c.co_cidadao
WHERE i.data_fim IS NULL
ORDER BY i.tipo_insulina, i.created_at DESC;

COMMENT ON VIEW sistemaaps.vw_insulinas_ativas_diabetes IS 'View com insulinas ativas e resumo formatado para exibição';