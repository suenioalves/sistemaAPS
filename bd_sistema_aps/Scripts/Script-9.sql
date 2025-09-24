-- Script para corrigir a descrição da ação 3 na timeline
-- Atualizar apenas a ação código 3 para mostrar a descrição correta

UPDATE sistemaaps.tb_hiperdia_tipos_acao
SET dsc_acao = 'Solicitar Mapeamento Residencial de Glicemias',
    dsc_detalhada = 'Solicitação para que o paciente diabético realize a Monitorização Residencial da Glicemia.'
WHERE cod_acao = 3;

-- Verificar se foi atualizado
SELECT cod_acao, dsc_acao, dsc_detalhada
FROM sistemaaps.tb_hiperdia_tipos_acao
WHERE cod_acao = 3;