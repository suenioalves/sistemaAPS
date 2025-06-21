-- COMANDOS PARA EXCLUSÃO DE TODOS OS OBJETOS DO SCHEMA 'sistemaaps'
-- Execute este script com cuidado, pois ele removerá permanentemente os dados.

-- Abordagem 2: Excluir o Schema inteiro (RECOMENDADO - Mais rápido e simples)
-- Este único comando removerá o schema "sistemaaps" e TODOS os objetos contidos nele
-- (tabelas, tipos, funções, triggers, etc.), evitando erros de dependência.
-- Descomente a linha abaixo para usar esta abordagem.
-- DROP SCHEMA IF EXISTS "sistemaaps" CASCADE;


-- Abordagem 1: Excluir cada objeto individualmente (Controle manual)
-- Se preferir apagar item por item, use os comandos abaixo.

-- 1. Excluir as Tabelas
-- A opção CASCADE remove automaticamente quaisquer objetos dependentes,
-- como chaves estrangeiras e triggers associados a cada tabela.
DROP TABLE IF EXISTS "sistemaaps"."LogAuditoria" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."AvaliacaoRiscoCardiovascular" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."Consulta" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."ResultadoImagem" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."ResultadoLaboratorio" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."HistoricoMedicacao" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."LeituraMrpa" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."EstudoMrpa" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."MedicaoPressaoArterial" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."DadosAntropometricos" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."FatoresRiscoCardiovascular" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."Paciente" CASCADE;
DROP TABLE IF EXISTS "sistemaaps"."Usuario" CASCADE;

-- 2. Excluir a Função do Trigger
-- A cláusula CASCADE foi adicionada aqui para corrigir o erro [2BP01].
-- Ela força a remoção da função e de quaisquer objetos que dependam dela (como os triggers),
-- caso os triggers não tenham sido removidos junto com as tabelas.
DROP FUNCTION IF EXISTS "sistemaaps".atualizar_coluna_atualizado_em() CASCADE;

-- 3. Excluir os Tipos ENUM
-- Estes tipos só podem ser excluídos depois que as tabelas que os utilizam forem removidas.
DROP TYPE IF EXISTS "sistemaaps"."Genero";
DROP TYPE IF EXISTS "sistemaaps"."PapelUsuario";
DROP TYPE IF EXISTS "sistemaaps"."StatusTabagismo";
DROP TYPE IF EXISTS "sistemaaps"."BracoMedicaoPA";
DROP TYPE IF EXISTS "sistemaaps"."StatusEstudoMrpa";
DROP TYPE IF EXISTS "sistemaaps"."PeriodoDiaMrpa";
DROP TYPE IF EXISTS "sistemaaps"."ResultadoMrpa";
DROP TYPE IF EXISTS "sistemaaps"."NomeExameLaboratorial";
DROP TYPE IF EXISTS "sistemaaps"."TipoExameImagem";
DROP TYPE IF EXISTS "sistemaaps"."EspecialidadeConsulta";
DROP TYPE IF EXISTS "sistemaaps"."CategoriaRisco";
