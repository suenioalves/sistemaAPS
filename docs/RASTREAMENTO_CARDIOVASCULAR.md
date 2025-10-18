# Rastreamento Cardiovascular - Módulo de Hipertensão

**Data:** 2025-10-17
**Versão:** 1.0.0
**Fase Atual:** Fase 1 - Rastreamento de Hipertensão

---

## 📋 Visão Geral

O Módulo de Rastreamento Cardiovascular é um sistema completo para rastreamento domiciliar de hipertensão arterial, diabetes e avaliação de risco cardiovascular. Este documento detalha a **Fase 1: Rastreamento de Hipertensão**.

### Fases do Projeto

1. **✅ Fase 1**: Rastreamento de Hipertensão (Implementado)
2. **Fase 2**: Rastreamento de Diabetes (Planejado)
3. **Fase 3**: Rastreamento de Risco Cardiovascular (Planejado)

---

## 🎯 Objetivos da Fase 1

- Rastrear cidadãos suspeitos de hipertensão arterial através de medições domiciliares
- Seguir protocolo MRPA (Monitorização Residencial da Pressão Arterial)
- Seguir protocolo MAPA (Monitorização Ambulatorial da Pressão Arterial) quando necessário
- Automatizar cálculos de médias e classificações
- Permitir decisão final do profissional de saúde
- Agendar reavaliações para pacientes não hipertensos

---

## 📊 Fluxo de Rastreamento

### 1. Seleção de Família

```
Equipe → Microárea → Domicílio → Família → Integrantes Elegíveis
```

**Critérios de Elegibilidade:**
- Idade >= 20 anos
- Sem diagnóstico prévio de hipertensão
- Integrante da família selecionada

### 2. Fase MRPA (Monitorização Residencial)

**Protocolo:**
- **Duração**: 3 a 5 dias
- **Frequência**: 1 aferição por dia
- **Medidas**: Pressão Sistólica (PAS) e Diastólica (PAD)

**Cálculo:**
```
Média PAS = Σ(PAS de todos os dias) / Número de dias
Média PAD = Σ(PAD de todos os dias) / Número de dias
```

**Classificação Automática:**
- `MRPA >= 130x80 mmHg` → **SUSPEITO** → Prosseguir para MAPA
- `MRPA < 130x80 mmHg` → **NORMAL** → Finalizar (não hipertenso)

### 3. Fase MAPA (Monitorização Ambulatorial)

**Protocolo:**
- **Duração**: 5 dias
- **Frequência**: 3 medidas pela manhã + 3 medidas à noite
- **Total**: 6 aferições/dia × 5 dias = 30 aferições

**Regra Importante:**
- ❌ **Dia 1**: Excluído do cálculo da média (adaptação ao aparelho)
- ✅ **Dias 2-5**: Incluídos no cálculo

**Cálculo:**
```
Média PAS = Σ(PAS dos dias 2-5) / 24 aferições
Média PAD = Σ(PAD dos dias 2-5) / 24 aferições
```

**Diagnóstico Automático:**
- `MAPA >= 130x80 mmHg` → **HIPERTENSO**
- `MAPA < 130x80 mmHg` → **NÃO HIPERTENSO** (reavaliar em 1 ano)

### 4. Decisão do Profissional

O sistema apresenta o diagnóstico automático, mas o profissional pode:

- ✅ **CONCORDAR**: Aceita o diagnóstico sugerido
- ❌ **NÃO CONCORDAR**: Altera o diagnóstico com justificativa

### 5. Entrada Manual

Para casos especiais onde o paciente traz aferições de outros médicos:

- **Entrada de médias**: PAS e PAD já calculadas
- **Tipo de medição**: Ex: "7 dias 2x/dia", "10 dias 1x/dia"
- **Origem**: Ex: "Solicitado por cardiologista Dr. João"
- **Classificação**: Profissional decide HIPERTENSO ou NÃO HIPERTENSO

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. tb_rastreamento_familias
Armazena famílias selecionadas para rastreamento.

```sql
CREATE TABLE sistemaaps.tb_rastreamento_familias (
    cod_seq_rastreamento_familia SERIAL PRIMARY KEY,
    co_seq_cds_domicilio_familia BIGINT NOT NULL,
    co_seq_cds_cad_domiciliar BIGINT NOT NULL,
    equipe VARCHAR(100),
    microarea VARCHAR(10),
    data_inicio_rastreamento DATE DEFAULT CURRENT_DATE,
    status_rastreamento VARCHAR(20) DEFAULT 'INICIADO',
    responsavel_rastreamento VARCHAR(255),
    observacoes TEXT
);
```

#### 2. tb_rastreamento_cidadaos
Cidadãos incluídos no rastreamento.

```sql
CREATE TABLE sistemaaps.tb_rastreamento_cidadaos (
    cod_seq_rastreamento_cidadao SERIAL PRIMARY KEY,
    cod_rastreamento_familia INTEGER REFERENCES tb_rastreamento_familias,
    co_seq_cds_cad_individual BIGINT NOT NULL,
    nome_cidadao VARCHAR(255) NOT NULL,
    idade_no_rastreamento INTEGER,
    fase_rastreamento VARCHAR(50) DEFAULT 'MRPA_INICIAL',
    resultado_rastreamento VARCHAR(50),
    decisao_profissional VARCHAR(20),
    data_proximo_rastreamento DATE
);
```

**Fases Possíveis:**
- `MRPA_INICIAL`: Fase de coleta MRPA
- `ANALISE_MRPA`: Análise dos resultados MRPA
- `MAPA`: Fase de coleta MAPA (se suspeito)
- `ANALISE_MAPA`: Análise final
- `MANUAL`: Entrada manual de resultados
- `FINALIZADO`: Processo concluído

#### 3. tb_rastreamento_afericoes_mrpa
Aferições da fase MRPA (1x/dia por 3-5 dias).

```sql
CREATE TABLE sistemaaps.tb_rastreamento_afericoes_mrpa (
    cod_seq_afericao_mrpa SERIAL PRIMARY KEY,
    cod_rastreamento_cidadao INTEGER REFERENCES tb_rastreamento_cidadaos,
    dia_medicao INTEGER NOT NULL,
    data_afericao DATE NOT NULL,
    pressao_sistolica INTEGER CHECK (pressao_sistolica BETWEEN 50 AND 300),
    pressao_diastolica INTEGER CHECK (pressao_diastolica BETWEEN 30 AND 200),
    frequencia_cardiaca INTEGER,
    observacoes TEXT
);
```

#### 4. tb_rastreamento_afericoes_mapa
Aferições da fase MAPA (3 manhã + 3 noite × 5 dias).

```sql
CREATE TABLE sistemaaps.tb_rastreamento_afericoes_mapa (
    cod_seq_afericao_mapa SERIAL PRIMARY KEY,
    cod_rastreamento_cidadao INTEGER REFERENCES tb_rastreamento_cidadaos,
    dia_medicao INTEGER NOT NULL,
    periodo VARCHAR(10) CHECK (periodo IN ('MANHA', 'NOITE')),
    numero_afericao INTEGER CHECK (numero_afericao BETWEEN 1 AND 3),
    pressao_sistolica INTEGER,
    pressao_diastolica INTEGER,
    excluir_calculo BOOLEAN DEFAULT FALSE, -- TRUE para dia 1
    observacoes TEXT
);
```

#### 5. tb_rastreamento_resultado_manual
Entrada manual para aferições em outros formatos.

```sql
CREATE TABLE sistemaaps.tb_rastreamento_resultado_manual (
    cod_seq_resultado_manual SERIAL PRIMARY KEY,
    cod_rastreamento_cidadao INTEGER REFERENCES tb_rastreamento_cidadaos,
    media_pas INTEGER NOT NULL,
    media_pad INTEGER NOT NULL,
    tipo_medicao VARCHAR(100), -- Ex: "7 dias 2x/dia"
    origem_medicao VARCHAR(200), -- Ex: "Solicitado por cardiologista"
    classificacao_profissional VARCHAR(50) -- HIPERTENSO ou NAO_HIPERTENSO
);
```

### View: vw_rastreamento_cidadaos_resumo

Resumo completo com médias calculadas automaticamente.

```sql
CREATE VIEW sistemaaps.vw_rastreamento_cidadaos_resumo AS
SELECT
    rc.cod_seq_rastreamento_cidadao,
    rc.nome_cidadao,
    rc.fase_rastreamento,
    rc.resultado_rastreamento,

    -- Médias MRPA
    (SELECT ROUND(AVG(pressao_sistolica))
     FROM tb_rastreamento_afericoes_mrpa
     WHERE cod_rastreamento_cidadao = rc.cod_seq_rastreamento_cidadao) AS media_mrpa_pas,

    -- Médias MAPA (excluindo dia 1)
    (SELECT ROUND(AVG(pressao_sistolica))
     FROM tb_rastreamento_afericoes_mapa
     WHERE cod_rastreamento_cidadao = rc.cod_seq_rastreamento_cidadao
       AND excluir_calculo = FALSE) AS media_mapa_pas

FROM tb_rastreamento_cidadaos rc;
```

---

## 🔌 APIs Disponíveis

### 1. GET `/api/rastreamento/integrantes-domicilio/<id_domicilio>`

Busca integrantes elegíveis de um domicílio.

**Response:**
```json
{
    "success": true,
    "total": 3,
    "integrantes": [
        {
            "co_seq_cds_cad_individual": 123,
            "nome_cidadao": "João da Silva",
            "idade": 45,
            "sexo": "Masculino",
            "tem_diagnostico_hipertensao": false,
            "elegivel_rastreamento": true
        }
    ]
}
```

### 2. POST `/api/rastreamento/iniciar-familia`

Inicia rastreamento para uma família.

**Request:**
```json
{
    "co_seq_cds_cad_domiciliar": 456,
    "equipe": "PSF-01",
    "microarea": "06",
    "cidadaos_selecionados": [...]
}
```

### 3. POST `/api/rastreamento/registrar-afericao-mrpa`

Registra aferição MRPA.

**Request:**
```json
{
    "cod_rastreamento_cidadao": 789,
    "dia_medicao": 1,
    "pressao_sistolica": 135,
    "pressao_diastolica": 85,
    "data_afericao": "2025-10-17"
}
```

### 4. GET `/api/rastreamento/calcular-media-mrpa/<cod_rastreamento_cidadao>`

Calcula média MRPA e classifica.

**Response:**
```json
{
    "success": true,
    "media_pas": 132,
    "media_pad": 84,
    "total_afericoes": 5,
    "classificacao": "SUSPEITO",
    "proxima_fase": "MAPA",
    "mensagem": "Média: 132/84 mmHg - SUSPEITO"
}
```

### 5. POST `/api/rastreamento/registrar-afericao-mapa`

Registra aferição MAPA.

**Request:**
```json
{
    "cod_rastreamento_cidadao": 789,
    "dia_medicao": 2,
    "periodo": "MANHA",
    "numero_afericao": 1,
    "pressao_sistolica": 128,
    "pressao_diastolica": 82
}
```

### 6. GET `/api/rastreamento/calcular-media-mapa/<cod_rastreamento_cidadao>`

Calcula média MAPA e diagnóstico final.

**Response:**
```json
{
    "success": true,
    "media_pas": 128,
    "media_pad": 80,
    "total_afericoes_validas": 24,
    "diagnostico_sugerido": "NAO_HIPERTENSO",
    "mensagem": "Paciente pode ser classificado como NÃO HIPERTENSO. Reavaliar em 1 ano."
}
```

### 7. POST `/api/rastreamento/finalizar`

Finaliza rastreamento com decisão do profissional.

**Request:**
```json
{
    "cod_rastreamento_cidadao": 789,
    "resultado_rastreamento": "NAO_HIPERTENSO",
    "decisao_profissional": "CONCORDO",
    "justificativa_decisao": null
}
```

---

## 🎨 Interface do Usuário

### Componentes Principais

#### 1. Wizard de 5 Steps

```
[1] Seleção de Integrantes → [2] Aferições MRPA → [3] Análise MRPA → [4] MAPA (se necessário) → [5] Resultado Final
```

#### 2. Indicador de Progresso

- Barra de progresso visual
- Ícones indicativos de cada fase
- Estados: Pendente / Em Andamento / Concluído

#### 3. Formulários de Aferição

**MRPA:**
- Dia da medição (1-5)
- PAS (mmHg)
- PAD (mmHg)
- Data e hora
- Observações

**MAPA:**
- Dia da medição (1-5)
- Período (Manhã/Noite)
- Número da aferição (1ª, 2ª, 3ª)
- PAS/PAD
- Data e hora

#### 4. Tela de Resultado

- Médias calculadas automaticamente
- Diagnóstico sugerido pelo sistema
- Opções para concordar ou discordar
- Campo de justificativa (se discordar)
- Agendamento automático de reavaliação

---

## 📈 Critérios Clínicos

### Valores de Referência

| Classificação | PAS (mmHg) | PAD (mmHg) |
|---------------|------------|------------|
| Normal        | < 130      | < 80       |
| Limítrofe     | 130-139    | 80-89      |
| Hipertensão   | >= 130     | >= 80      |

### Decisões Clínicas

1. **MRPA < 130x80**: Paciente normal, finalizar rastreamento
2. **MRPA >= 130x80**: Suspeito, prosseguir para MAPA
3. **MAPA >= 130x80**: Hipertenso confirmado
4. **MAPA < 130x80**: Não hipertenso, reavaliar em 1 ano

---

## 🔒 Segurança e Validação

### Validações no Frontend

- Campos obrigatórios
- Limites de valores de PA: PAS (50-300), PAD (30-200)
- Validação de datas
- Consistência de número de aferições

### Validações no Backend

- Checks no banco de dados
- Validação de relacionamentos (FK)
- Prevenção de SQL injection
- Sanitização de entradas

---

## 📱 Acesso ao Sistema

**URL:** `/painel-rastreamento-cardiovascular`

**Navegação:**
1. Selecionar Equipe e Microárea
2. Buscar Domicílios
3. Selecionar Domicílio e Família
4. Seguir wizard passo a passo

---

## 🚀 Próximas Fases

### Fase 2: Rastreamento de Diabetes

**Planejado:**
- Glicemia de jejum
- Hemoglobina glicada
- Teste oral de tolerância à glicose
- Classificação por faixas de risco

### Fase 3: Risco Cardiovascular

**Planejado:**
- Escore de Framingham
- Calculadora de risco global
- Estratificação de risco
- Recomendações personalizadas

---

## 📞 Suporte e Manutenção

### Scripts de Banco de Dados

**Localização:** `bd_sistema_aps/Scripts/Rastreamento_Cardiovascular/`

**Arquivos:**
- `CREATE_TABLES_RASTREAMENTO_HIPERTENSAO.sql`: Criação de tabelas

### Logs e Debug

- Logs de erro no console do navegador (frontend)
- Logs de erro no terminal (backend Python)
- Trace completo de exceptions

---

## ✅ Checklist de Implementação

- [x] Estrutura de banco de dados criada
- [x] APIs backend desenvolvidas
- [x] Interface HTML criada
- [x] JavaScript modular implementado
- [x] Cálculos automáticos de MRPA funcionando
- [x] Cálculos automáticos de MAPA funcionando
- [x] Entrada manual implementada
- [x] Decisão do profissional implementada
- [x] Documentação completa

---

## 📝 Notas Importantes

1. **Primeira aferição MAPA é excluída**: O sistema automaticamente marca `excluir_calculo = TRUE` para o dia 1 do MAPA

2. **Média arredondada**: Todas as médias são arredondadas para o inteiro mais próximo

3. **Reavaliação anual**: Pacientes não hipertensos recebem agendamento automático para reavaliação em 365 dias

4. **Flexibilidade profissional**: O sistema sugere diagnóstico, mas sempre permite decisão final do profissional

5. **Histórico completo**: Todas as aferições são armazenadas permanentemente para auditoria

---

**Documentação gerada automaticamente**
**Última atualização:** 2025-10-17
**Versão do Sistema:** 1.0.0
