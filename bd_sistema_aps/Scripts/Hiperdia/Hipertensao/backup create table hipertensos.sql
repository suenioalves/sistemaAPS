-- Criação do schema, caso não exista
CREATE SCHEMA IF NOT EXISTS "sistemaaps";

-- Criação dos tipos ENUM para padronização de dados em português dentro do schema
CREATE TYPE "sistemaaps"."Genero" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');
CREATE TYPE "sistemaaps"."PapelUsuario" AS ENUM ('MEDICO', 'ENFERMEIRO', 'ADMIN');
CREATE TYPE "sistemaaps"."StatusTabagismo" AS ENUM ('FUMANTE_ATUAL', 'EX_FUMANTE', 'NUNCA_FUMOU');
CREATE TYPE "sistemaaps"."BracoMedicaoPA" AS ENUM ('ESQUERDO', 'DIREITO');
CREATE TYPE "sistemaaps"."StatusEstudoMrpa" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE "sistemaaps"."PeriodoDiaMrpa" AS ENUM ('MANHA', 'NOITE');
CREATE TYPE "sistemaaps"."ResultadoMrpa" AS ENUM ('NORMAL', 'ALTERADO', 'INCONCLUSIVO');
CREATE TYPE "sistemaaps"."NomeExameLaboratorial" AS ENUM ('COLESTEROL_TOTAL', 'HDL', 'LDL', 'TRIGLICERIDEOS', 'GLICEMIA_JEJUM', 'HBA1C', 'UREIA', 'CREATININA', 'SODIO', 'POTASSIO', 'ACIDO_URICO');
CREATE TYPE "sistemaaps"."TipoExameImagem" AS ENUM ('ECG', 'ECOCARDIOGRAMA');
CREATE TYPE "sistemaaps"."EspecialidadeConsulta" AS ENUM ('CARDIOLOGIA', 'NUTRICAO', 'CLINICA_GERAL');
CREATE TYPE "sistemaaps"."CategoriaRisco" AS ENUM ('BAIXO', 'MODERADO', 'ALTO', 'MUITO_ALTO');

-- Função para atualizar o campo 'atualizadoEm' automaticamente dentro do schema
CREATE OR REPLACE FUNCTION "sistemaaps".atualizar_coluna_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
   NEW."atualizadoEm" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de Usuários do Sistema
CREATE TABLE "sistemaaps"."Usuario" (
    "id" VARCHAR(255) PRIMARY KEY,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "sistemaaps"."PapelUsuario" NOT NULL DEFAULT 'ENFERMEIRO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trig_atualizar_usuario_atualizado_em
BEFORE UPDATE ON "sistemaaps"."Usuario"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Pacientes
CREATE TABLE "sistemaaps"."Paciente" (
    "id" VARCHAR(255) PRIMARY KEY,
    "cpf" VARCHAR(11) UNIQUE NOT NULL,
    "nomeCompleto" VARCHAR(255) NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "genero" "sistemaaps"."Genero" NOT NULL,
    "telefone" VARCHAR(20),
    "email" VARCHAR(255) UNIQUE,
    "endereco" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trig_atualizar_paciente_atualizado_em
BEFORE UPDATE ON "sistemaaps"."Paciente"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Fatores de Risco Cardiovascular
CREATE TABLE "sistemaaps"."FatoresRiscoCardiovascular" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) UNIQUE NOT NULL,
    "statusTabagismo" "sistemaaps"."StatusTabagismo" NOT NULL,
    "temDislipidemia" BOOLEAN NOT NULL DEFAULT false,
    "temDiabetes" BOOLEAN NOT NULL DEFAULT false,
    "historicoFamiliarDcvPrematura" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_fatoresrisco_atualizado_em
BEFORE UPDATE ON "sistemaaps"."FatoresRiscoCardiovascular"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Dados Antropométricos
CREATE TABLE "sistemaaps"."DadosAntropometricos" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "dataMedicao" TIMESTAMP(3) NOT NULL,
    "alturaEmMetros" DOUBLE PRECISION NOT NULL,
    "pesoEmKg" DOUBLE PRECISION NOT NULL,
    "imc" DOUBLE PRECISION NOT NULL,
    "circunferenciaCinturaEmCm" DOUBLE PRECISION,
    "registradoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("registradoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_dadosantropometricos_atualizado_em
BEFORE UPDATE ON "sistemaaps"."DadosAntropometricos"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Medições de Pressão Arterial (Consultório)
CREATE TABLE "sistemaaps"."MedicaoPressaoArterial" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "sistolica" INTEGER NOT NULL,
    "diastolica" INTEGER NOT NULL,
    "frequenciaCardiaca" INTEGER NOT NULL,
    "bracoUtilizado" "sistemaaps"."BracoMedicaoPA" NOT NULL,
    "dataMedicao" TIMESTAMP(3) NOT NULL,
    "registradoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("registradoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_medicaopressao_atualizado_em
BEFORE UPDATE ON "sistemaaps"."MedicaoPressaoArterial"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Estudos de MRPA
CREATE TABLE "sistemaaps"."EstudoMrpa" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" "sistemaaps"."StatusEstudoMrpa" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "mediaSistolica" DOUBLE PRECISION,
    "mediaDiastolica" DOUBLE PRECISION,
    "resultado" "sistemaaps"."ResultadoMrpa",
    "iniciadoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("iniciadoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_estudomrpa_atualizado_em
BEFORE UPDATE ON "sistemaaps"."EstudoMrpa"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Leituras de MRPA (individuais)
CREATE TABLE "sistemaaps"."LeituraMrpa" (
    "id" VARCHAR(255) PRIMARY KEY,
    "estudoMrpaId" VARCHAR(255) NOT NULL,
    "dataMedicao" TIMESTAMP(3) NOT NULL,
    "periodoDia" "sistemaaps"."PeriodoDiaMrpa" NOT NULL,
    "numeroLeitura" INTEGER NOT NULL, -- Ex: 1ª ou 2ª leitura da manhã/noite
    "sistolica" INTEGER NOT NULL,
    "diastolica" INTEGER NOT NULL,
    "frequenciaCardiaca" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("estudoMrpaId") REFERENCES "sistemaaps"."EstudoMrpa"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_leituramrpa_atualizado_em
BEFORE UPDATE ON "sistemaaps"."LeituraMrpa"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Histórico de Medicamentos
CREATE TABLE "sistemaaps"."HistoricoMedicacao" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "nomeMedicamento" VARCHAR(255) NOT NULL,
    "dosagem" VARCHAR(255) NOT NULL,
    "frequencia" VARCHAR(255) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "motivoAlteracao" TEXT,
    "prescritoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("prescritoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_historicomedicacao_atualizado_em
BEFORE UPDATE ON "sistemaaps"."HistoricoMedicacao"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Resultados de Exames Laboratoriais
CREATE TABLE "sistemaaps"."ResultadoLaboratorio" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "nomeExame" "sistemaaps"."NomeExameLaboratorial" NOT NULL,
    "valor" VARCHAR(255) NOT NULL,
    "unidade" VARCHAR(50) NOT NULL,
    "intervaloReferencia" VARCHAR(255),
    "dataColeta" TIMESTAMP(3) NOT NULL,
    "ritmoFiltroGlomerularEstimado" DOUBLE PRECISION, -- Para exames de Creatinina
    "registradoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("registradoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_resultadolaboratorio_atualizado_em
BEFORE UPDATE ON "sistemaaps"."ResultadoLaboratorio"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Resultados de Exames de Imagem
CREATE TABLE "sistemaaps"."ResultadoImagem" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "tipoExame" "sistemaaps"."TipoExameImagem" NOT NULL,
    "dataExame" TIMESTAMP(3) NOT NULL,
    "resumo" TEXT,
    "urlLaudo" TEXT,
    "registradoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("registradoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_resultadoimagem_atualizado_em
BEFORE UPDATE ON "sistemaaps"."ResultadoImagem"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Consultas e Encaminhamentos
CREATE TABLE "sistemaaps"."Consulta" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "especialidade" "sistemaaps"."EspecialidadeConsulta" NOT NULL,
    "dataConsulta" TIMESTAMP(3) NOT NULL,
    "nomeProfissional" VARCHAR(255) NOT NULL,
    "observacoes" TEXT,
    "eEncaminhamento" BOOLEAN NOT NULL DEFAULT false,
    "registradoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("registradoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_consulta_atualizado_em
BEFORE UPDATE ON "sistemaaps"."Consulta"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Avaliação de Risco Cardiovascular
CREATE TABLE "sistemaaps"."AvaliacaoRiscoCardiovascular" (
    "id" VARCHAR(255) PRIMARY KEY,
    "pacienteId" VARCHAR(255) NOT NULL,
    "dataAvaliacao" TIMESTAMP(3) NOT NULL,
    "percentualEscoreRisco" DOUBLE PRECISION NOT NULL,
    "categoriaRisco" "sistemaaps"."CategoriaRisco" NOT NULL,
    "avaliadoPorId" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "sistemaaps"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("avaliadoPorId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trig_atualizar_avaliacaorisco_atualizado_em
BEFORE UPDATE ON "sistemaaps"."AvaliacaoRiscoCardiovascular"
FOR EACH ROW
EXECUTE PROCEDURE "sistemaaps".atualizar_coluna_atualizado_em();

-- Tabela de Log de Auditoria (LGPD)
CREATE TABLE "sistemaaps"."LogAuditoria" (
    "id" VARCHAR(255) PRIMARY KEY,
    "usuarioId" VARCHAR(255) NOT NULL,
    "acao" VARCHAR(255) NOT NULL, -- Ex: 'CRIACAO_PACIENTE', 'VISUALIZACAO_PRONTUARIO'
    "entidadeAlvo" VARCHAR(255) NOT NULL, -- Ex: 'Paciente', 'ResultadoLaboratorio'
    "idAlvo" VARCHAR(255) NOT NULL,
    "detalhes" JSONB, -- Pode armazenar o estado 'antes' e 'depois' de uma alteração
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("usuarioId") REFERENCES "sistemaaps"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
