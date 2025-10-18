-- =========================================================================
-- Script: Criação de Índices para Otimização da Query de Domicílios
-- Data: 2025-10-15
-- Objetivo: Melhorar performance da listagem de domicílios no painel
-- =========================================================================

-- Índice 1: tb_cds_domicilio_familia - nu_cpf_cidadao (usado na CTE)
CREATE INDEX IF NOT EXISTS idx_df_cpf_cidadao_mudanca
ON tb_cds_domicilio_familia(nu_cpf_cidadao, st_mudanca)
WHERE st_mudanca = 0;

-- Índice 2: tb_cds_cad_individual - nu_cpf_responsavel (usado no JOIN)
CREATE INDEX IF NOT EXISTS idx_ci_cpf_responsavel_ativo
ON tb_cds_cad_individual(nu_cpf_responsavel)
WHERE st_versao_atual = 1 AND st_ficha_inativa = 0;

-- Índice 3: tb_cds_cad_individual - nu_cpf_cidadao (usado no JOIN)
CREATE INDEX IF NOT EXISTS idx_ci_cpf_cidadao_ativo
ON tb_cds_cad_individual(nu_cpf_cidadao, st_responsavel_familiar)
WHERE st_versao_atual = 1 AND st_ficha_inativa = 0;

-- Índice 4: tb_cds_cad_individual - nu_cartao_sus_responsavel (usado no JOIN)
CREATE INDEX IF NOT EXISTS idx_ci_cns_responsavel_ativo
ON tb_cds_cad_individual(nu_cartao_sus_responsavel)
WHERE st_versao_atual = 1 AND st_ficha_inativa = 0 AND nu_cartao_sus_responsavel IS NOT NULL;

-- Índice 5: tb_cds_cad_individual - nu_cns_cidadao (usado no JOIN)
CREATE INDEX IF NOT EXISTS idx_ci_cns_cidadao_ativo
ON tb_cds_cad_individual(nu_cns_cidadao)
WHERE st_versao_atual = 1 AND st_ficha_inativa = 0 AND nu_cns_cidadao IS NOT NULL;

-- Índice 6: tb_cds_domicilio_familia - co_cds_cad_domiciliar (usado nos JOINs)
CREATE INDEX IF NOT EXISTS idx_df_domiciliar_mudanca
ON tb_cds_domicilio_familia(co_cds_cad_domiciliar, nu_cpf_cidadao)
WHERE st_mudanca = 0;

-- Verificar índices criados
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_df_%' OR indexname LIKE 'idx_ci_%'
ORDER BY tablename, indexname;

-- Estatísticas das tabelas (para o planner usar os índices corretamente)
ANALYZE tb_cds_domicilio_familia;
ANALYZE tb_cds_cad_individual;
ANALYZE tb_cds_cad_domiciliar;
