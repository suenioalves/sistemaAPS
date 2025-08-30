# Implementação da Funcionalidade de Cardiologia - HIPERDIA Hipertensos

## Resumo da Implementação

Esta documentação descreve a implementação completa da funcionalidade de Cardiologia no módulo HIPERDIA - Hipertensos do Sistema APS.

## Estrutura de Arquivos Criados

### 1. Scripts SQL Principais
- `CREATE_TB_HIPERDIA_HAS_CARDIOLOGIA.sql` - Script principal com criação da tabela e tipos de ação
- `ADD_ACOES_CARDIOLOGIA_HIPERDIA.sql` - Script independente para adicionar apenas os códigos de ação
- `EXAMPLES_QUERIES_CARDIOLOGIA.sql` - Consultas úteis e exemplos de uso

### 2. Localização dos Arquivos
```
bd_sistema_aps/Scripts/Hiperdia/Hipertensao/
├── CREATE_TB_HIPERDIA_HAS_CARDIOLOGIA.sql
├── ADD_ACOES_CARDIOLOGIA_HIPERDIA.sql
├── EXAMPLES_QUERIES_CARDIOLOGIA.sql
└── README_CARDIOLOGIA_IMPLEMENTATION.md
```

## Códigos de Ação Implementados

| Código | Descrição | Finalidade |
|--------|-----------|------------|
| 10 | Encaminhar Cardiologia | Registrar encaminhamento do paciente para consulta cardiológica |
| 11 | Registrar Cardiologia | Registrar os dados e resultados da consulta cardiológica realizada |

## Estrutura da Tabela Principal

### tb_hiperdia_has_cardiologia

**Campos Principais:**
- `cod_cardiologia` (PK) - Chave primária única
- `cod_acompanhamento` (FK) - Ligação com tb_hiperdia_has_acompanhamento
- `cod_cidadao` - Código do paciente
- `tipo_acao` - Tipo de ação (10=Encaminhar, 11=Registrar)
- `data_acao` - Data da ação realizada
- `profissional_responsavel` - Nome do profissional
- `observacoes` - Observações gerais

**Campos Específicos para Registro de Consulta (tipo_acao=11):**
- `consulta_cardiologia` - Relatório detalhado da consulta
- `recomendacoes_cardiologia` - Recomendações do cardiologista
- `tipo_consulta` - Modalidade (Presencial/Telemedicina)

**Campos de Auditoria:**
- `created_at` - Data/hora de criação do registro
- `updated_at` - Data/hora da última atualização

## Índices Criados
- `idx_cardiologia_cod_acompanhamento` - Otimiza buscas por acompanhamento
- `idx_cardiologia_cod_cidadao` - Otimiza buscas por paciente
- `idx_cardiologia_tipo_acao` - Otimiza buscas por tipo de ação
- `idx_cardiologia_data_acao` - Otimiza buscas por data

## Alterações no Código Python

### app.py - Linha 21-33
Atualizado o mapeamento `TIPO_ACAO_MAP_PY` para incluir:
```python
10: "Encaminhar Cardiologia",
11: "Registrar Cardiologia"
```

## Funcionalidades Implementadas

### 1. Encaminhamento para Cardiologia (Código 10)
- Registro de encaminhamento com motivo e observações
- Controle de quem realizou o encaminhamento
- Data do encaminhamento

### 2. Registro de Consulta Cardiológica (Código 11)
- Relatório completo da consulta realizada
- Recomendações específicas do cardiologista
- Tipo de consulta (Presencial/Telemedicina)
- Data da consulta
- Profissional que registrou

## Recursos Adicionais

### Triggers Implementados
- Trigger automático para atualização do campo `updated_at`

### Consultas Úteis Disponíveis
1. Histórico completo de cardiologia por paciente
2. Encaminhamentos pendentes de retorno
3. Estatísticas de encaminhamentos e consultas
4. Análise de tempo médio de espera
5. Relatórios por profissional
6. Integração com dados de acompanhamento geral

### Função Útil
- `sistemaaps.get_ultima_acao_cardiologia(cod_cidadao)` - Retorna a última ação de cardiologia de um paciente

## Instruções de Implantação

### 1. Execução em Ordem
1. Execute `CREATE_TB_HIPERDIA_HAS_CARDIOLOGIA.sql` para criar toda a estrutura
2. Alternativamente, execute apenas `ADD_ACOES_CARDIOLOGIA_HIPERDIA.sql` se a tabela já existir

### 2. Verificação da Implementação
```sql
-- Verificar se os códigos foram criados
SELECT cod_acao, dsc_acao FROM sistemaaps.tb_hiperdia_tipos_acao 
WHERE cod_acao IN (10, 11);

-- Verificar se a tabela foi criada
\d sistemaaps.tb_hiperdia_has_cardiologia
```

### 3. Teste de Funcionalidade
```sql
-- Teste de inserção de encaminhamento
INSERT INTO sistemaaps.tb_hiperdia_has_cardiologia 
(cod_acompanhamento, cod_cidadao, tipo_acao, data_acao, profissional_responsavel, observacoes)
VALUES (1, 123456, 10, CURRENT_DATE, 'Dr. Teste', 'Teste de encaminhamento');
```

## Integração com Frontend

### Interface Existente
A interface já possui elementos preparados para cardiologia:
- `#hiperdia-cardiologySection` - Seção da cardiologia
- `#hiperdia-avaliacao-cardiologica` - Campo para avaliação
- `#hiperdia-recomendacoes-cardiologia` - Campo para recomendações
- Radio buttons para tipo de consulta (Presencial/Telemedicina)

### Arquivos Frontend Relacionados
- `templates/painel-hiperdia-has.html` - Interface principal
- `static/hiperdiaDom.js` - Manipulação DOM da cardiologia

## Considerações de Segurança

### Controles Implementados
- Chaves estrangeiras com CASCADE DELETE
- Constraints para validação de tipo_acao
- Constraints para validação de tipo_consulta
- Índices para otimização de consultas
- Triggers para auditoria automática

### Permissões Recomendadas
- Acesso de leitura/escrita restrito a profissionais autorizados
- Log de auditoria através dos campos created_at/updated_at
- Validação de dados no frontend e backend

## Monitoramento e Manutenção

### Consultas de Monitoramento
- Verificar encaminhamentos sem retorno
- Analisar tempo médio de espera
- Relatórios de atividade por profissional
- Estatísticas gerais de uso

### Manutenção Preventiva
- Monitorar crescimento da tabela
- Verificar performance dos índices
- Avaliar necessidade de arquivamento de dados antigos

## Próximos Passos Sugeridos

1. **Testes de Integração**: Testar inserção, consulta e atualização de dados
2. **Validação de Frontend**: Verificar se a interface funciona corretamente com os novos códigos
3. **Treinamento de Usuários**: Capacitar equipe para uso da nova funcionalidade
4. **Monitoramento Inicial**: Acompanhar uso nos primeiros meses
5. **Relatórios Personalizados**: Desenvolver relatórios específicos conforme necessidade da equipe

---
*Documento gerado em: 2024-12-19*  
*Sistema APS - Módulo HIPERDIA - Funcionalidade Cardiologia*