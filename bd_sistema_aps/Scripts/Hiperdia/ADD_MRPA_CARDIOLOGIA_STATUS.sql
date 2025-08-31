-- Script para adicionar suporte ao status_mrpa=2 (Encaminhar Cardiologia)
-- Data: 2025-08-30
-- Descrição: Adiciona comentário ao campo status_mrpa para incluir a nova opção de Encaminhar Cardiologia

-- Verificar a estrutura atual da tabela
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'sistemaaps' AND table_name = 'tb_hiperdia_mrpa' AND column_name = 'status_mrpa';

-- Adicionar comentário ao campo status_mrpa para documentar os valores
COMMENT ON COLUMN sistemaaps.tb_hiperdia_mrpa.status_mrpa IS 
'Status da avaliação MRPA: 0=Modificar Tratamento, 1=Manter Tratamento, 2=Encaminhar Cardiologia';

-- Verificar se já existem registros com status_mrpa = 2
SELECT COUNT(*) as registros_cardiologia 
FROM sistemaaps.tb_hiperdia_mrpa 
WHERE status_mrpa = 2;

-- Script de validação para verificar a consistência dos dados
SELECT 
    status_mrpa,
    CASE 
        WHEN status_mrpa = 0 THEN 'Modificar Tratamento'
        WHEN status_mrpa = 1 THEN 'Manter Tratamento' 
        WHEN status_mrpa = 2 THEN 'Encaminhar Cardiologia'
        ELSE 'Status Desconhecido'
    END as descricao_status,
    COUNT(*) as quantidade
FROM sistemaaps.tb_hiperdia_mrpa 
GROUP BY status_mrpa 
ORDER BY status_mrpa;