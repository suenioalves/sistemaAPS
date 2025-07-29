# Implementação de Múltiplos PDFs para Receituários Hiperdia

## Objetivo
Modificar o sistema para gerar múltiplos arquivos PDF individuais quando vários pacientes são selecionados para impressão, com nomenclatura específica para cada arquivo.

## Modificações Realizadas

### 1. JavaScript - Função de Geração de PDFs (hiperdia_has_script.js)

**Mudança Principal:**
- Transformou geração de PDF único em múltiplos PDFs individuais
- Implementou loop para processar cada paciente separadamente
- Adicionou nomenclatura personalizada para cada arquivo
- Incluiu pausa entre downloads para evitar sobrecarga do browser

**Formato do Nome do Arquivo:**
```
RECEITUARIO (DD-MM-AAAA) - HIPERTENSAO - NOME_DO_PACIENTE.pdf
```

**Melhoramentos:**
- Contador de progresso para múltiplos pacientes
- Tratamento de erros individual por paciente  
- Sanitização do nome do paciente (remove caracteres especiais)
- Feedback ao usuário com quantidade de receituários gerados

### 2. Backend - Novo Endpoint Individual (app.py)

**Novo Endpoint:** `/api/hiperdia/generate_prescription_pdf_individual`

**Funcionalidades:**
- Processa um único paciente por vez
- Busca dados do paciente na `mv_hiperdia_hipertensão`
- Busca medicamentos ativos na `tb_hiperdia_has_medicamentos`
- Gera PDF individual usando template Word
- Retorna arquivo com nomenclatura específica

**Dados Processados:**
- Nome do paciente (formatado em maiúsculas)
- Cartão SUS
- Idade calculada
- Lista de medicamentos com posologia detalhada
- Data atual formatada

### 3. Lógica de Medicamentos

**Instruções de Horário por Frequência:**
- **1x/dia:** 06:00 horas
- **2x/dia:** 06:00 e 18:00 horas  
- **3x/dia:** 06:00, 14:00 e 22:00 horas
- **4x/dia:** 06:00, 12:00, 18:00 e 24:00 horas

**Cálculo de Quantidade:**
```javascript
total_comprimidos = dose × frequencia × 30 dias
```

## Fluxo de Funcionamento

### Frontend (JavaScript)
1. Usuário seleciona pacientes via checkboxes
2. Clica no botão "Imprimir Receituários"
3. Sistema inicia loop para cada paciente selecionado
4. Faz requisição individual para cada paciente
5. Download automático de cada PDF gerado
6. Exibe mensagem de sucesso com contador

### Backend (Python/Flask)
1. Recebe dados de um paciente específico
2. Busca informações do paciente no banco
3. Busca medicamentos ativos
4. Processa template Word com dados
5. Converte para PDF (se possível)
6. Retorna arquivo com nome formatado

## Exemplo de Uso

**Pacientes Selecionados:** 3
**Arquivos Gerados:**
- `RECEITUARIO (29-07-2025) - HIPERTENSAO - MARIA_SILVA.pdf`
- `RECEITUARIO (29-07-2025) - HIPERTENSAO - JOAO_SANTOS.pdf`  
- `RECEITUARIO (29-07-2025) - HIPERTENSAO - ANA_OLIVEIRA.pdf`

## Tratamento de Erros

### Frontend
- Erro individual por paciente não interrompe processamento dos demais
- Log detalhado no console para debug
- Mensagem final informando quantos foram processados com sucesso

### Backend  
- Validação de existência do paciente
- Verificação de medicamentos ativos
- Fallback para DOCX caso conversão PDF falhe
- Logs detalhados para troubleshooting

## Melhorias de UX

1. **Feedback Visual:** Contador de progresso no console
2. **Performance:** Pausa de 500ms entre downloads
3. **Robustez:** Continua processamento mesmo com erros individuais
4. **Nomenclatura:** Padronização clara dos nomes de arquivo
5. **Sanitização:** Remove caracteres especiais dos nomes

## Tecnologias Utilizadas

- **Frontend:** JavaScript ES6+ (async/await, Promise)
- **Backend:** Python Flask, psycopg2, docx, docx2pdf
- **Template:** Microsoft Word (.docx) com placeholders
- **Conversão:** docx2pdf com COM threading para Windows

## Arquivos Modificados

1. **static/hiperdia_has_script.js** - Função `generatePrescriptionPDF()`
2. **app.py** - Novo endpoint `api_generate_prescription_pdf_individual()`

## Status da Implementação

✅ **Concluído:**
- Múltiplos PDFs individuais
- Nomenclatura personalizada
- Tratamento de erros robusto
- Interface de usuário mantida
- Compatibilidade com sistema existente

⚠️ **Para Testar:**
- Seleção de múltiplos pacientes
- Download sequencial de arquivos
- Nomenclatura dos arquivos gerados
- Tratamento de erros em produção