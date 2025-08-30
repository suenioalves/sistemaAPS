-- Script para adicionar novos códigos de ação para Cardiologia no módulo HIPERDIA - Hipertensos
-- Este script pode ser executado independentemente para adicionar apenas os novos tipos de ação
-- Data de criação: 2024-12-19
-- Autor: Sistema APS - Módulo HIPERDIA

-- Verifica se os códigos de ação 10 e 11 já existem antes de inserir
-- Se existirem, atualiza a descrição; se não existirem, insere novos registros

DO $$
BEGIN
    -- Verifica e insere/atualiza o código de ação 10 (Encaminhar Cardiologia)
    IF EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 10) THEN
        UPDATE sistemaaps.tb_hiperdia_tipos_acao 
        SET dsc_acao = 'Encaminhar Cardiologia',
            dsc_detalhada = 'Encaminhamento do paciente hipertenso para consulta especializada em cardiologia.'
        WHERE cod_acao = 10;
        RAISE NOTICE 'Código de ação 10 (Encaminhar Cardiologia) atualizado com sucesso.';
    ELSE
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) 
        VALUES (10, 'Encaminhar Cardiologia', 'Encaminhamento do paciente hipertenso para consulta especializada em cardiologia.');
        RAISE NOTICE 'Código de ação 10 (Encaminhar Cardiologia) inserido com sucesso.';
    END IF;

    -- Verifica e insere/atualiza o código de ação 11 (Registrar Cardiologia)
    IF EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_tipos_acao WHERE cod_acao = 11) THEN
        UPDATE sistemaaps.tb_hiperdia_tipos_acao 
        SET dsc_acao = 'Registrar Cardiologia',
            dsc_detalhada = 'Registro dos dados, avaliação e recomendações da consulta cardiológica realizada.'
        WHERE cod_acao = 11;
        RAISE NOTICE 'Código de ação 11 (Registrar Cardiologia) atualizado com sucesso.';
    ELSE
        INSERT INTO sistemaaps.tb_hiperdia_tipos_acao (cod_acao, dsc_acao, dsc_detalhada) 
        VALUES (11, 'Registrar Cardiologia', 'Registro dos dados, avaliação e recomendações da consulta cardiológica realizada.');
        RAISE NOTICE 'Código de ação 11 (Registrar Cardiologia) inserido com sucesso.';
    END IF;
END $$;

-- Consulta para verificar se os códigos foram inseridos/atualizados corretamente
SELECT cod_acao, dsc_acao, dsc_detalhada 
FROM sistemaaps.tb_hiperdia_tipos_acao 
WHERE cod_acao IN (10, 11)
ORDER BY cod_acao;

-- Consulta para listar todos os códigos de ação disponíveis
SELECT cod_acao, dsc_acao, dsc_detalhada 
FROM sistemaaps.tb_hiperdia_tipos_acao 
ORDER BY cod_acao;