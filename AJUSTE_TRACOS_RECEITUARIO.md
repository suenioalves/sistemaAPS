# Ajuste dos Traços no Receituário PDF - Hiperdia

## Objetivo
Modificar a quantidade de traços entre o nome do medicamento e a quantidade no receituário PDF conforme o tamanho da fonte utilizada, para melhor aproveitamento do espaço e legibilidade.

## Problema Anterior
Todos os receituários usavam a mesma quantidade de traços (40 traços: `----------------------------------------`), independentemente do tamanho da fonte, causando:
- **Fontes maiores**: Espaçamento excessivo e desperdício de linha
- **Fontes menores**: Pouco preenchimento da linha disponível

## Solução Implementada

### Lógica de Ajuste Dinâmico
```python
# Definir quantidade de traços baseada no tamanho da fonte
if num_medicamentos <= 2:  # Fonte maior (14pt)
    tracos = "--------------------------------"  # 32 traços
else:  # Fonte menor (12pt, 10pt, 8pt)
    tracos = "---------------------------------------------"  # 45 traços
```

### Critérios de Aplicação

#### **Fonte Grande (14pt) - 1 ou 2 medicamentos**
- **Traços**: `--------------------------------` (32 traços)
- **Motivo**: Fonte maior ocupa mais espaço horizontal
- **Resultado**: Melhor proporção visual na linha

#### **Fonte Pequena (12pt, 10pt, 8pt) - 3+ medicamentos**
- **Traços**: `---------------------------------------------` (45 traços)
- **Motivo**: Fonte menor permite mais caracteres por linha
- **Resultado**: Melhor preenchimento do espaço disponível

## Modificações Realizadas

### 1. Endpoint Principal (`api_generate_prescriptions_pdf`)
**Antes:**
```python
medicamentos_texto += f"{idx}) {med['nome']} ---------------------------------------- {med['quantidade']} comprimidos\n"
```

**Depois:**
```python
# Definir quantidade de traços baseada no tamanho da fonte
if num_medicamentos <= 2:  # Fonte maior (14pt)
    tracos = "--------------------------------"  # 32 traços
else:  # Fonte menor (12pt, 10pt, 8pt)
    tracos = "---------------------------------------------"  # 45 traços

medicamentos_texto += f"{idx}) {med['nome']} {tracos} {med['quantidade']} comprimidos\n"
```

### 2. Endpoint Individual (`api_generate_prescription_pdf_individual`)
**Aplicação idêntica:**
- Mesma lógica de ajuste dinâmico
- Mesmas quantidades de traços
- Mesmo critério baseado no número de medicamentos

### 3. Texto Padrão (quando não há medicamentos)
**Antes:**
```python
medicamentos_texto = "1) MEDICAMENTO CONFORME ORIENTAÇÃO MÉDICA -------- 30 comprimidos\n\n"
```

**Depois:**
```python
medicamentos_texto = "1) MEDICAMENTO CONFORME ORIENTAÇÃO MÉDICA -------------------------------- 30 comprimidos\n\n"
```

### 4. Detecção de Linhas de Medicamento
**Atualizada para reconhecer ambos os padrões:**
```python
# Antes: Só reconhecia um padrão
if ') ' in text and '--------' in text and 'comprimidos' in text.lower():

# Depois: Reconhece ambos os padrões
if ') ' in text and ('--------' in text or '-----' in text) and 'comprimidos' in text.lower():
```

## Exemplos de Resultado

### Receituário com 1-2 Medicamentos (Fonte 14pt)
```
1) LOSARTANA 50MG -------------------------------- 30 comprimidos
Tomar 01 comprimido as 06:00 horas

2) HIDROCLOROTIAZIDA 25MG -------------------------------- 30 comprimidos
Tomar 01 comprimido as 06:00 horas
```

### Receituário com 3+ Medicamentos (Fonte 12pt ou menor)
```
1) LOSARTANA 50MG --------------------------------------------- 30 comprimidos
Tomar 01 comprimido as 06:00 horas

2) HIDROCLOROTIAZIDA 25MG --------------------------------------------- 30 comprimidos
Tomar 01 comprimido as 06:00 horas

3) AMLODIPINA 5MG --------------------------------------------- 30 comprimidos
Tomar 01 comprimido as 06:00 horas
```

## Benefícios da Modificação

### 1. **Melhor Aproveitamento Visual**
- Fontes maiores: Evita espaçamento excessivo
- Fontes menores: Preenche adequadamente a linha

### 2. **Consistência Proporcional**
- Traços proporcionais ao tamanho da fonte
- Melhor equilíbrio visual no documento

### 3. **Legibilidade Otimizada**
- Espaçamento adequado para cada cenário
- Melhor separação visual entre nome e quantidade

### 4. **Flexibilidade Mantida**
- Sistema continua adaptando automaticamente
- Compatibilidade com todos os cenários existentes

## Mapeamento Fonte vs Traços

| Medicamentos | Fonte | Traços | Quantidade | Uso |
|-------------|-------|--------|------------|-----|
| 1-2 | 14pt | `--------` | 32 | Receituários simples |
| 3 | 12pt | `---------` | 45 | Receituários médios |
| 4 | 10pt | `---------` | 45 | Receituários complexos |
| 5+ | 8pt | `---------` | 45 | Receituários muito complexos |

## Arquivos Modificados

1. **app.py** - Ambos os endpoints de geração de PDF
   - `api_generate_prescriptions_pdf()` (linha ~3911-3915)
   - `api_generate_prescription_pdf_individual()` (linha ~4272-4276)

## Compatibilidade

### ✅ **Mantido**
- Lógica de tamanho de fonte baseada na quantidade
- Formatação de negrito para medicamentos
- Sistema de instruções de horário
- Duplicação de páginas no receituário

### ✅ **Melhorado**
- Proporção visual entre nome e quantidade
- Aproveitamento do espaço na linha
- Consistência visual em diferentes cenários

## Status da Implementação

✅ **Endpoints atualizados**: Ambos os geradores de PDF modificados
✅ **Lógica dinâmica**: Traços ajustam conforme número de medicamentos
✅ **Detecção atualizada**: Reconhece ambos os padrões de traços
✅ **Texto padrão**: Atualizado com novo padrão
✅ **Compatibilidade**: Mantida com sistema existente

## Resultado Final

Os receituários agora apresentam quantidade de traços otimizada para cada cenário:
- **Menos medicamentos** = **Menos traços** (melhor para fontes grandes)
- **Mais medicamentos** = **Mais traços** (melhor para fontes pequenas)

Isso resulta em documentos mais balanceados visualmente e com melhor aproveitamento do espaço disponível.