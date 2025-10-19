# Atualização: PDF de Triagem - Modelo Final

**Data:** 2025-10-18
**Módulo:** Rastreamento Cardiovascular - Geração de PDF
**Tipo:** Implementação Completa do Layout do PDF

---

## 📋 Objetivo

Implementar a geração de PDF de triagem domiciliar seguindo **exatamente** o modelo fornecido pelo usuário ([modelo_triagem.pdf](../modelo_triagem.pdf)).

---

## 🎯 Alterações Implementadas

### 1. Mudança no Título da Família

**ANTES:**
```
DOMICILIO - MARIA DAS GRAÇAS BARBOSA DE SOUZA
```

**DEPOIS:**
```
RUA DAS FLORES, 123 - CENTRO - MARIA DAS GRAÇAS BARBOSA DE SOUZA
```

**Formato:** `[ENDEREÇO COMPLETO DO DOMICÍLIO] - [NOME DO RESPONSÁVEL FAMILIAR]`

---

## 📄 Layout Completo do PDF Implementado

### Estrutura da Página

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIAGEM DOMICILIAR - RASTREAMENTO DE HIPERTENSÃO ARTERIAL      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ AFERIR A PRESSÃO ARTERIAL DOS MORADORES COM MAIS DE 20   │  │
│  │ ANOS DE IDADE                                             │  │
│  │ 01 VEZ POR DIA POR 05 (CINCO) DIAS                        │  │ ← VERMELHO
│  │ DE MANHÃ EM JEJUM OU A NOITE ANTES DO JANTAR              │  │
│  │ (NÃO ESCREVER 12X8, USAR 120X80)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ RUA DAS FLORES, 123 - CENTRO - MARIA DAS GRAÇAS          │  │ ← AMARELO
│  └───────────────────────────────────────────────────────────┘  │
│  ┌────────────────────┬──────┬──────┬──────┬──────┬──────┐     │
│  │ CIDADÃO            │__/__/│__/__/│__/__/│__/__/│__/__/│     │
│  ├────────────────────┼──────┼──────┼──────┼──────┼──────┤     │
│  │ ANTONIA BARBOSA DE │      │      │      │      │      │     │
│  │ SOUZA, 40 anos     │      │      │      │      │      │     │
│  ├────────────────────┼──────┼──────┼──────┼──────┼──────┤     │
│  │ VICTOR DE SOUZA    │      │      │      │      │      │     │
│  │ JUNIOR, 28 anos    │      │      │      │      │      │     │
│  ├────────────────────┼──────┼──────┼──────┼──────┼──────┤     │
│  │ ISAIAS DE SOUZA    │      │      │      │      │      │     │
│  │ BEZERRA, 23 anos   │      │      │      │      │      │     │
│  ├────────────────────┼──────┼──────┼──────┼──────┼──────┤     │
│  │ (linha extra)      │      │      │      │      │      │     │
│  ├────────────────────┼──────┼──────┼──────┼──────┼──────┤     │
│  │ (linha extra)      │      │      │      │      │      │     │
│  └────────────────────┴──────┴──────┴──────┴──────┴──────┘     │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ AFERIR A PRESSÃO ARTERIAL DOS MORADORES COM MAIS DE 20   │  │
│  │ ANOS DE IDADE                                             │  │ ← VERMELHO
│  │ 01 VEZ POR DIA POR 05 (CINCO) DIAS                        │  │
│  │ DE MANHÃ EM JEJUM OU A NOITE ANTES DO JANTAR              │  │
│  │ (NÃO ESCREVER 12X8, USAR 120X80)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ AVENIDA BRASIL, 456 - JARDIM - RANDEVAL DA SILVA CHAGAS  │  │ ← AMARELO
│  └───────────────────────────────────────────────────────────┘  │
│  ┌────────────────────┬──────┬──────┬──────┬──────┬──────┐     │
│  │ CIDADÃO            │__/__/│__/__/│__/__/│__/__/│__/__/│     │
│  ├────────────────────┼──────┼──────┼──────┼──────┼──────┤     │
│  │ ...                │      │      │      │      │      │     │
│  └────────────────────┴──────┴──────┴──────┴──────┴──────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Elementos Visuais

### 1. Título Principal (Primeira Família da Página)
- **Texto:** "TRIAGEM DOMICILIAR - RASTREAMENTO DE HIPERTENSÃO ARTERIAL"
- **Posição:** Centralizado no topo da página
- **Fonte:** Helvetica Bold, 12pt
- **Y:** 10mm

### 2. Cabeçalho de Instruções (Cada Família)
- **Cor de Fundo:** Vermelho (#DC3545 / RGB 220,53,69)
- **Cor do Texto:** Branco
- **Fonte:** Helvetica Bold, 8pt
- **Altura:** 12mm
- **Conteúdo:** 3 linhas de instrução

### 3. Título da Família
- **Cor de Fundo:** Amarelo (#FFEB3B / RGB 255,235,59)
- **Cor do Texto:** Preto
- **Fonte:** Helvetica Bold, 10pt
- **Altura:** 7mm
- **Formato:** `[ENDEREÇO] - [RESPONSÁVEL]`

### 4. Tabela de Cidadãos
- **Colunas:**
  - CIDADÃO: 90mm de largura
  - 5 colunas de data: 19mm cada
- **Altura da Linha:** 7mm
- **Bordas:** Pretas, 0.5pt
- **Cabeçalho:**
  - Coluna 1: "CIDADÃO"
  - Colunas 2-6: "___/___/___"
- **Dados:**
  - Nome do cidadão em MAIÚSCULAS + idade
  - 2 linhas extras vazias

---

## 💻 Código Implementado

### Arquivo: `static/rastreamento_cardiovascular_script.js`

#### Função `renderizarFamiliaNoPDF()` (Linhas 924-1034)

```javascript
function renderizarFamiliaNoPDF(doc, familia, yInicial) {
    const margemEsquerda = 10;
    const larguraPagina = doc.internal.pageSize.width;

    // Se for a primeira família da página, adicionar título geral
    if (yInicial === 20) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TRIAGEM DOMICILIAR - RASTREAMENTO DE HIPERTENSÃO ARTERIAL',
                 larguraPagina / 2, 10, { align: 'center' });
    }

    // Cabeçalho da instrução (vermelho)
    doc.setFillColor(220, 53, 69); // Vermelho
    doc.rect(margemEsquerda, yInicial, larguraPagina - 20, 12, 'F');

    doc.setTextColor(255, 255, 255); // Texto branco
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    let yTexto = yInicial + 4;
    doc.text('AFERIR A PRESSÃO ARTERIAL DOS MORADORES COM MAIS DE 20 ANOS DE IDADE',
             larguraPagina / 2, yTexto, { align: 'center' });
    yTexto += 3;
    doc.text('01 VEZ POR DIA POR 05 (CINCO) DIAS',
             larguraPagina / 2, yTexto, { align: 'center' });
    yTexto += 3;
    doc.text('DE MANHÃ EM JEJUM OU A NOITE ANTES DO JANTAR (NÃO ESCREVER 12X8, USAR 120X80)',
             larguraPagina / 2, yTexto, { align: 'center' });

    // Título da família (amarelo)
    const yTituloFamilia = yInicial + 13;
    doc.setFillColor(255, 235, 59); // Amarelo
    doc.rect(margemEsquerda, yTituloFamilia, larguraPagina - 20, 7, 'F');

    doc.setTextColor(0, 0, 0); // Texto preto
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Título: ENDEREÇO DO DOMICÍLIO - NOME DO RESPONSÁVEL FAMILIAR
    const tituloFamilia = `${familia.domicilio?.endereco_completo || 'ENDEREÇO NÃO DISPONÍVEL'} - ${familia.nome_responsavel_familiar.toUpperCase()}`;
    doc.text(tituloFamilia, margemEsquerda + 2, yTituloFamilia + 5);

    // Preparar dados da tabela
    const integrantesSelecionados = familia.integrantes.filter(i =>
        estadoApp.cidadaosSelecionados.some(c => c.co_seq_cds_cad_individual === i.co_seq_cds_cad_individual)
    );

    // Linhas da tabela: integrantes + 2 linhas extras
    const linhasTabela = [];

    integrantesSelecionados.forEach(integrante => {
        linhasTabela.push([
            `${integrante.nome_cidadao.toUpperCase()}, ${integrante.idade} anos`,
            '___/___/___',
            '___/___/___',
            '___/___/___',
            '___/___/___',
            '___/___/___'
        ]);
    });

    // Adicionar 2 linhas extras
    linhasTabela.push(['', '___/___/___', '___/___/___', '___/___/___', '___/___/___', '___/___/___']);
    linhasTabela.push(['', '___/___/___', '___/___/___', '___/___/___', '___/___/___', '___/___/___']);

    // Desenhar tabela manualmente
    const yTabela = yTituloFamilia + 7;
    const larguraColunaCidadao = 90;
    const larguraColunaDia = 19;
    const alturaLinha = 7;

    let yLinha = yTabela;

    // Cabeçalho da tabela
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);

    // Linha de cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.rect(margemEsquerda, yLinha, larguraColunaCidadao, alturaLinha);
    doc.text('CIDADÃO', margemEsquerda + 2, yLinha + 5);

    for (let i = 0; i < 5; i++) {
        const xCol = margemEsquerda + larguraColunaCidadao + (i * larguraColunaDia);
        doc.rect(xCol, yLinha, larguraColunaDia, alturaLinha);
        doc.text('___/___/___', xCol + 2, yLinha + 5);
    }

    yLinha += alturaLinha;

    // Linhas de dados
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    linhasTabela.forEach(linha => {
        // Coluna CIDADÃO
        doc.rect(margemEsquerda, yLinha, larguraColunaCidadao, alturaLinha);
        if (linha[0]) {
            doc.text(linha[0], margemEsquerda + 2, yLinha + 5);
        }

        // Colunas de dias
        for (let i = 0; i < 5; i++) {
            const xCol = margemEsquerda + larguraColunaCidadao + (i * larguraColunaDia);
            doc.rect(xCol, yLinha, larguraColunaDia, alturaLinha);
        }

        yLinha += alturaLinha;
    });
}
```

---

## 📐 Dimensões e Posicionamento

### Posicionamento Vertical (Y)

**Primeira Família da Página (yInicial = 20):**
- Y = 10: Título principal da página
- Y = 20: Início do cabeçalho vermelho
- Y = 32: Final do cabeçalho vermelho
- Y = 33: Início do título amarelo
- Y = 40: Final do título amarelo
- Y = 41: Início da tabela

**Segunda Família da Página (yInicial = 150):**
- Y = 150: Início do cabeçalho vermelho
- Y = 162: Final do cabeçalho vermelho
- Y = 163: Início do título amarelo
- Y = 170: Final do título amarelo
- Y = 171: Início da tabela

### Larguras

- **Margem Esquerda:** 10mm
- **Largura Total Útil:** 190mm (210mm - 20mm de margens)
- **Coluna CIDADÃO:** 90mm
- **Cada Coluna de Data:** 19mm
- **Total Colunas de Data:** 95mm (5 × 19mm)
- **Largura Total da Tabela:** 185mm

### Alturas

- **Cabeçalho Vermelho:** 12mm
- **Título Amarelo:** 7mm
- **Cada Linha da Tabela:** 7mm

---

## 📊 Exemplo de Saída

### Dados de Entrada:

```javascript
familia = {
    id_familia: 123,
    nome_responsavel_familiar: "MARIA DAS GRAÇAS BARBOSA DE SOUZA",
    domicilio: {
        endereco_completo: "RUA DAS FLORES, 123 - CENTRO"
    },
    integrantes: [
        { nome_cidadao: "ANTONIA BARBOSA DE SOUZA", idade: 40 },
        { nome_cidadao: "VICTOR DE SOUZA JUNIOR", idade: 28 },
        { nome_cidadao: "ISAIAS DE SOUZA BEZERRA", idade: 23 }
    ]
}
```

### Saída no PDF:

```
┌─────────────────────────────────────────────────────────────────┐
│  AFERIR A PRESSÃO ARTERIAL DOS MORADORES COM MAIS DE 20 ANOS   │ [VERMELHO]
│  01 VEZ POR DIA POR 05 (CINCO) DIAS                            │
│  DE MANHÃ EM JEJUM OU A NOITE ANTES DO JANTAR                  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  RUA DAS FLORES, 123 - CENTRO - MARIA DAS GRAÇAS BARBOSA       │ [AMARELO]
└─────────────────────────────────────────────────────────────────┘
┌────────────────────────────┬──────┬──────┬──────┬──────┬──────┐
│ CIDADÃO                    │__/__/│__/__/│__/__/│__/__/│__/__/│
├────────────────────────────┼──────┼──────┼──────┼──────┼──────┤
│ ANTONIA BARBOSA DE SOUZA,  │      │      │      │      │      │
│ 40 anos                    │      │      │      │      │      │
├────────────────────────────┼──────┼──────┼──────┼──────┼──────┤
│ VICTOR DE SOUZA JUNIOR,    │      │      │      │      │      │
│ 28 anos                    │      │      │      │      │      │
├────────────────────────────┼──────┼──────┼──────┼──────┼──────┤
│ ISAIAS DE SOUZA BEZERRA,   │      │      │      │      │      │
│ 23 anos                    │      │      │      │      │      │
├────────────────────────────┼──────┼──────┼──────┼──────┼──────┤
│                            │      │      │      │      │      │
├────────────────────────────┼──────┼──────┼──────┼──────┼──────┤
│                            │      │      │      │      │      │
└────────────────────────────┴──────┴──────┴──────┴──────┴──────┘
```

---

## ✅ Checklist de Conformidade com o Modelo

- ✅ Título principal centralizado no topo da página
- ✅ Cabeçalho vermelho com instruções (3 linhas)
- ✅ Título amarelo com formato: `[ENDEREÇO] - [RESPONSÁVEL]`
- ✅ Tabela com coluna "CIDADÃO" + 5 colunas de data
- ✅ Nomes em MAIÚSCULAS + idade
- ✅ 2 linhas extras vazias em cada tabela
- ✅ 2 famílias por página
- ✅ Bordas pretas nas células
- ✅ Cabeçalho da tabela com "___/___/___"
- ✅ Layout idêntico ao modelo fornecido

---

## 🧪 Como Testar

1. Executar a aplicação: `python app.py`
2. Acessar o painel de rastreamento cardiovascular
3. Selecionar um ou mais domicílios
4. Selecionar famílias e integrantes
5. Avançar para Step 2: "Ficha de Triagem"
6. Clicar em "Gerar PDF de Triagem Domiciliar"
7. Abrir o PDF baixado
8. Verificar se o layout está idêntico ao modelo

---

## 📝 Notas Técnicas

### Compatibilidade
- Usa apenas funcionalidades nativas do jsPDF (sem plugins)
- Desenho manual de tabelas para máxima compatibilidade
- Fontes Helvetica (padrão do jsPDF)

### Performance
- Geração rápida (client-side)
- Sem requisições ao servidor
- PDF gerado instantaneamente

### Limitações
- Nomes muito longos podem ultrapassar a largura da célula
- Sem quebra automática de linha (texto truncado visualmente)
- Máximo de ~8-10 integrantes por família para caber na página

### Possíveis Melhorias Futuras
- Quebra automática de linha para nomes longos
- Ajuste dinâmico de fonte para textos grandes
- Paginação automática se família tiver muitos integrantes
- Logo da unidade de saúde no cabeçalho
- Rodapé com data de geração e página

---

## 📚 Referências

- Arquivo modelo: [modelo_triagem.pdf](../modelo_triagem.pdf)
- Código fonte: [rastreamento_cardiovascular_script.js](../static/rastreamento_cardiovascular_script.js) (linhas 924-1034)
- Documentação jsPDF: https://artskydj.github.io/jsPDF/docs/

---

**Status:** ✅ **COMPLETO**
**Data de Conclusão:** 2025-10-18
**Testado:** ⏳ Aguardando testes em ambiente real
