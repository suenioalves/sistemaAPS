-- ================================================================
-- ADICIONAR NOVOS TIPOS DE AÇÃO PARA DIABETES
-- ================================================================
-- Este script adiciona os novos tipos de ação:
-- 7 - Encaminhar para Endocrinologia
-- 8 - Encaminhar para Nutrição
-- ================================================================

-- Inserir novos tipos de ação
INSERT INTO sistemaaps.tb_hiperdia_dm_tipos_acao (cod_acao, dsc_acao, dsc_detalhada)
VALUES
    (7, 'Encaminhar para Endocrinologia', 'Encaminhamento do paciente para consulta com especialista em endocrinologia'),
    (8, 'Encaminhar para Nutrição', 'Encaminhamento do paciente para consulta com nutricionista')
ON CONFLICT (cod_acao) DO UPDATE
SET
    dsc_acao = EXCLUDED.dsc_acao,
    dsc_detalhada = EXCLUDED.dsc_detalhada,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar os tipos de ação cadastrados
SELECT cod_acao, dsc_acao, dsc_detalhada
FROM sistemaaps.tb_hiperdia_dm_tipos_acao
ORDER BY cod_acao;
