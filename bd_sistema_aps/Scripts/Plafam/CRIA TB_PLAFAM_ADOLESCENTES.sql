/*
===============================================================================
SISTEMA APS - TABELA DE ADOLESCENTES DO PROGRAMA PLAFAM
===============================================================================

DESCRIÇÃO:
Esta tabela armazena as ações e abordagens realizadas com adolescentes no 
Programa de Planejamento Familiar (Plafam). Cada registro representa uma 
ação específica realizada com um adolescente, incluindo tipo de abordagem,
resultado obtido e próximas ações programadas.

SISTEMA DE CÓDIGOS:
===============================================================================

🎯 TIPO DE AÇÃO (Campo: tipo_abordagem)
Representa a ação atual sendo realizada com o adolescente:

┌────────┬──────────────────────────────────┬──────────┐
│ Código │ Ação                             │ Status   │
├────────┼──────────────────────────────────┼──────────┤
│ 1      │ Abordagem com pais               │ ✅ Ativo │
│ 2      │ Abordagem direta com adolescente │ ✅ Ativo │
│ 5      │ Mudou de área                    │ ✅ Ativo │
│ 7      │ Remover do acompanhamento        │ ✅ Ativo │
└────────┴──────────────────────────────────┴──────────┘

🎯 RESULTADO DA ABORDAGEM (Campo: resultado_abordagem)
Representa o resultado obtido após a ação realizada:

┌────────┬────────────────────────────────────────────┬──────────┐
│ Código │ Resultado                                  │ Status   │
├────────┼────────────────────────────────────────────┼──────────┤
│ 1      │ Deseja iniciar um método contraceptivo     │ ✅ Ativo │
│ 2      │ Recusou método contraceptivo               │ ✅ Ativo │
│ 3      │ Ausente em domicílio                       │ ✅ Ativo │
│ 4      │ Já usa um método                           │ ✅ Ativo │
│ 5      │ Mudou de área                              │ ✅ Ativo │
│ 6      │ Mudou de cidade                            │ ✅ Ativo │
│ 7      │ Método particular                          │ ✅ Ativo │
│ 8      │ Outros motivos                             │ ✅ Ativo │
└────────┴────────────────────────────────────────────┴──────────┘

🎯 PRÓXIMA AÇÃO - TIPO (Campo: tipo_abordagem para próximas ações)
Define as próximas ações possíveis baseadas no resultado obtido:

┌────────┬──────────────────────────────────┬─────────────────────────────────────────────────┬────────────────┐
│ Código │ Ação                             │ Disponível Quando                               │ Status         │
├────────┼──────────────────────────────────┼─────────────────────────────────────────────────┼────────────────┤
│ 1      │ Abordagem com pais               │ Padrão/Recusou método/Ausente                   │ ✅ Ativo        │
│ 2      │ Abordagem direta com adolescente │ Padrão/Recusou método/Ausente                   │ ✅ Ativo        │
│ 3      │ Iniciar método na UBS            │ Deseja iniciar método                           │ 🔄 Condicional │
│ 5      │ Mudou de área                    │ Padrão                                          │ ✅ Ativo        │
│ 6      │ Iniciar método em domicílio      │ Deseja iniciar método                           │ 🔄 Condicional │
│ 7      │ Remover do acompanhamento        │ Padrão                                          │ ✅ Ativo        │
│ 8      │ Atualizar no PEC                 │ Já usa método/Mudou área/Remover acompanhamento │ 🔄 Condicional │
└────────┴──────────────────────────────────┴─────────────────────────────────────────────────┴────────────────┘

🔄 LÓGICA CONDICIONAL ATIVA:

REGRAS ESPECIAIS POR TIPO DE AÇÃO:
• Mudou de área (5): 
  - Resultado obrigatório: Apenas "Mudou de área (5)"
  - Próxima ação obrigatória: Apenas "Atualizar no PEC (8)"

• Remover acompanhamento (7):
  - Resultados possíveis: "Mudou de cidade (6)", "Método particular (7)", "Outros motivos (8)"
  - Próxima ação obrigatória: Apenas "Atualizar no PEC (8)"

REGRAS POR RESULTADO DA ABORDAGEM:
• Deseja iniciar método (1):
  - Próximas ações: "Iniciar método na UBS (3)" OU "Iniciar método em domicílio (6)"

• Recusou método (2):
  - Próximas ações: Data +6 meses + "Abordagem com pais (1)" OU "Abordagem direta (2)"

• Já usa método (4):
  - Próximas ações: "Atualizar no PEC (8)" OU "Remover acompanhamento (7)"

🗑️ CÓDIGOS REMOVIDOS/INATIVOS:
┌────────┬─────────────────────────────┬─────────────────────────────┐
│ Código │ Ação                        │ Status                      │
├────────┼─────────────────────────────┼─────────────────────────────┤
│ 3      │ Iniciou método na UBS       │ ❌ Removido do Tipo de Ação │
│ 4      │ Entrega de convite          │ ❌ Removido do Tipo de Ação │
│ 6      │ Iniciou método em domicílio │ ❌ Removido do Tipo de Ação │
└────────┴─────────────────────────────┴─────────────────────────────┘

ESTRUTURA DOS CAMPOS:
===============================================================================
• co_abordagem: Chave primária única para cada ação registrada
• co_cidadao: Código do cidadão (adolescente) no sistema
• nome_adolescente: Nome completo do adolescente
• nome_responsavel: Nome do responsável legal (quando aplicável)
• motivo_acompanhamento: Justificativa para o acompanhamento
• tipo_abordagem: Código da ação atual (ver tabela acima)
• resultado_abordagem: Código do resultado obtido (ver tabela acima)
• metodo_desejado: Código do método contraceptivo desejado
• observacoes: Campo livre para anotações adicionais (max 500 caracteres)
• data_acao: Data de execução da ação
• responsavel_pela_acao: Nome do profissional responsável pela ação

IMPORTANTE:
Esta tabela faz parte do Sistema APS (Atenção Primária à Saúde) e integra
com outras tabelas do programa Plafam para controle completo do planejamento
familiar para adolescentes.
===============================================================================
*/

-- sistemaaps.tb_plafam_adolescentes definição

-- Drop table

-- DROP TABLE sistemaaps.tb_plafam_adolescentes;

CREATE TABLE sistemaaps.tb_plafam_adolescentes (
	co_abordagem int4 NOT NULL,
	co_cidadao int4 NOT NULL,
	nome_adolescente varchar NULL,
	nome_responsavel varchar NULL,
	motivo_acompanhamento varchar(100) NULL,
	tipo_abordagem int4 NULL,
	resultado_abordagem int4 NULL,
	metodo_desejado int4 NULL,
	observacoes varchar(500) NULL,
	data_acao date NULL,
	responsavel_pela_acao varchar(100) NULL,
	CONSTRAINT pk_tb_plafam_adolescentes PRIMARY KEY (co_abordagem)
);