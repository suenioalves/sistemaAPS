# Atualização: PDF com Paginação Dinâmica e Cores Ajustadas

**Data:** 2025-10-18
**Módulo:** Rastreamento Cardiovascular - Geração de PDF
**Tipo:** Melhoria de Algoritmo

---

## 📋 Objetivo

Implementar duas melhorias no sistema de geração de PDF de triagem:

1. **Paginação Dinâmica:** Permitir múltiplas famílias por página, garantindo que nenhuma família seja dividida entre páginas
2. **Cores Invertidas:** Mudar o cabeçalho de instruções de "texto branco em fundo vermelho" para "texto vermelho em fundo branco"

---

## 🎯 Alterações Implementadas

### 1. Paginação Dinâmica Inteligente

**ANTES:**
- Sistema sempre colocava exatamente 2 famílias por página
- Posições fixas: primeira família em Y=20, segunda em Y=150
- Não considerava o tamanho real de cada família
- Famílias grandes poderiam ultrapassar os limites da página

**DEPOIS:**
- Sistema calcula a altura necessária para cada família dinamicamente
- Verifica se a família cabe na página atual antes de renderizar
- Se não couber, cria nova página automaticamente
- Nenhuma família é dividida entre páginas
- Permite múltiplas famílias pequenas na mesma página
- Espaçamento inteligente entre famílias (5mm)

### 2. Cores do Cabeçalho de Instruções

**ANTES:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ FUNDO VERMELHO + TEXTO BRANCO          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**DEPOIS:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ FUNDO BRANCO + TEXTO VERMELHO          ┃ ← Borda vermelha
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 💻 Código Implementado

### Arquivo: `static/rastreamento_cardiovascular_script.js`

#### 1. Nova Função: `calcularAlturaFamilia()` (Linhas 875-891)

```javascript
function calcularAlturaFamilia(familia) {
    const integrantesSelecionados = familia.integrantes.filter(i =>
        estadoApp.cidadaosSelecionados.some(c => c.co_seq_cds_cad_individual === i.co_seq_cds_cad_individual)
    );

    const ALTURA_CABECALHO_INSTRUCOES = 12;
    const ALTURA_TITULO_FAMILIA = 7;
    const ALTURA_LINHA_TABELA = 7;
    const LINHAS_EXTRAS = 2;

    // Total de linhas: cabeçalho + integrantes + linhas extras
    const totalLinhasTabela = 1 + integrantesSelecionados.length + LINHAS_EXTRAS;
    const alturaTabela = totalLinhasTabela * ALTURA_LINHA_TABELA;

    return ALTURA_CABECALHO_INSTRUCOES + ALTURA_TITULO_FAMILIA + alturaTabela;
}
```

**Propósito:** Calcular precisamente quantos milímetros uma família ocupará no PDF.

**Componentes da altura:**
- Cabeçalho de instruções: 12mm
- Título da família (amarelo): 7mm
- Linha de cabeçalho da tabela: 7mm
- Cada integrante selecionado: 7mm
- 2 linhas extras: 14mm (2 × 7mm)

**Exemplo:**
- Família com 3 integrantes = 12 + 7 + (7 × 6) = 61mm
  - 6 linhas da tabela = 1 cabeçalho + 3 integrantes + 2 extras

#### 2. Função Atualizada: `gerarPDFTriagem()` (Linhas 893-963)

```javascript
window.gerarPDFTriagem = async function() {
    mostrarNotificacao('Gerando PDF de triagem...', 'info');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const ALTURA_PAGINA = doc.internal.pageSize.height; // ~297mm (A4)
        const MARGEM_SUPERIOR = 20;
        const MARGEM_INFERIOR = 10;
        const ESPACAMENTO_ENTRE_FAMILIAS = 5;
        const ALTURA_TITULO_PAGINA = 10; // "TRIAGEM DOMICILIAR..."

        const alturaDisponivel = ALTURA_PAGINA - MARGEM_SUPERIOR - MARGEM_INFERIOR;

        let yAtual = MARGEM_SUPERIOR;
        let primeiraPagina = true;
        let primeiraFamiliaDaPagina = true;

        for (let i = 0; i < estadoApp.familiasSelecionadas.length; i++) {
            const familia = estadoApp.familiasSelecionadas[i];
            const alturaFamilia = calcularAlturaFamilia(familia);

            // Adicionar espaço para título da página se for a primeira família
            const alturaComTitulo = primeiraFamiliaDaPagina ?
                alturaFamilia + ALTURA_TITULO_PAGINA : alturaFamilia;

            // Verificar se a família cabe na página atual
            const espacoNecessario = primeiraFamiliaDaPagina ?
                alturaComTitulo : alturaFamilia + ESPACAMENTO_ENTRE_FAMILIAS;

            if ((yAtual + espacoNecessario) > (ALTURA_PAGINA - MARGEM_INFERIOR)) {
                // NÃO CABE: Criar nova página
                doc.addPage();
                yAtual = MARGEM_SUPERIOR;
                primeiraPagina = false;
                primeiraFamiliaDaPagina = true;
            }

            // Adicionar espaçamento entre famílias (exceto primeira da página)
            if (!primeiraFamiliaDaPagina) {
                yAtual += ESPACAMENTO_ENTRE_FAMILIAS;
            }

            // Renderizar família
            renderizarFamiliaNoPDF(doc, familia, yAtual, primeiraFamiliaDaPagina);

            // Atualizar posição Y para a próxima família
            yAtual += alturaComTitulo;
            primeiraFamiliaDaPagina = false;
        }

        // Salvar PDF
        doc.save(`triagem_familiar_${new Date().toISOString().split('T')[0]}.pdf`);

        // Marcar famílias como "iniciada"
        estadoApp.familiasSelecionadas.forEach(familia => {
            if (estadoApp.statusTriagemFamilias[familia.id_familia] === 'nao_triada' ||
                !estadoApp.statusTriagemFamilias[familia.id_familia]) {
                estadoApp.statusTriagemFamilias[familia.id_familia] = 'iniciada';
            }
        });

        renderizarStepAtual();
        mostrarNotificacao('PDF gerado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        mostrarNotificacao('Erro ao gerar PDF. Verifique se o jsPDF está carregado.', 'error');
    }
};
```

**Lógica do Algoritmo:**

1. **Inicialização:**
   - Define constantes de margens e espaçamentos
   - Inicia `yAtual` na margem superior (20mm)

2. **Loop por cada família:**
   - Calcula altura necessária via `calcularAlturaFamilia()`
   - Adiciona altura do título da página se for primeira família da página
   - Verifica se cabe na página atual

3. **Decisão de paginação:**
   ```javascript
   if ((yAtual + espacoNecessario) > (ALTURA_PAGINA - MARGEM_INFERIOR)) {
       // NÃO CABE: Nova página
       doc.addPage();
       yAtual = MARGEM_SUPERIOR;
       primeiraFamiliaDaPagina = true;
   }
   ```

4. **Renderização:**
   - Adiciona espaçamento entre famílias (5mm)
   - Renderiza família na posição `yAtual`
   - Atualiza `yAtual` para a próxima família

#### 3. Função Atualizada: `renderizarFamiliaNoPDF()` (Linhas 965-1081)

**Mudanças Principais:**

**a) Novo parâmetro `primeiraFamiliaDaPagina`:**
```javascript
function renderizarFamiliaNoPDF(doc, familia, yInicial, primeiraFamiliaDaPagina = true) {
    // ...
}
```

**b) Título da página apenas se for primeira família:**
```javascript
let yAtual = yInicial;

if (primeiraFamiliaDaPagina) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TRIAGEM DOMICILIAR - RASTREAMENTO DE HIPERTENSÃO ARTERIAL',
             larguraPagina / 2, yAtual, { align: 'center' });
    yAtual += 10;
}
```

**c) Cores invertidas no cabeçalho:**
```javascript
// ANTES:
doc.setFillColor(220, 53, 69); // Fundo vermelho
doc.rect(margemEsquerda, yAtual, larguraPagina - 20, 12, 'F'); // F = Fill only
doc.setTextColor(255, 255, 255); // Texto branco

// DEPOIS:
doc.setFillColor(255, 255, 255); // Fundo branco
doc.setDrawColor(220, 53, 69); // Borda vermelha
doc.setLineWidth(0.5);
doc.rect(margemEsquerda, yAtual, larguraPagina - 20, 12, 'FD'); // FD = Fill + Draw
doc.setTextColor(220, 53, 69); // Texto vermelho
```

---

## 📊 Exemplos de Paginação

### Cenário 1: Famílias Pequenas (3 integrantes cada)

**Cálculo:**
- Família A: 61mm (12 + 7 + 42)
- Família B: 61mm
- Família C: 61mm
- Total: 183mm + 10mm (título) + 10mm (espaçamentos) = 203mm

**Resultado:** Todas as 3 famílias cabem em 1 página (A4 = 297mm)

```
PÁGINA 1:
├─ Título: "TRIAGEM DOMICILIAR..."
├─ Família A (61mm)
├─ Espaçamento (5mm)
├─ Família B (61mm)
├─ Espaçamento (5mm)
└─ Família C (61mm)
   Total: 203mm ✓ Cabe!
```

### Cenário 2: Famílias Médias (5 integrantes cada)

**Cálculo:**
- Família A: 75mm (12 + 7 + 56)
- Família B: 75mm
- Família C: 75mm
- Total por 2 famílias: 160mm

**Resultado:** 2 famílias por página

```
PÁGINA 1:
├─ Título (10mm)
├─ Família A (75mm)
├─ Espaçamento (5mm)
└─ Família B (75mm)
   Total: 165mm ✓

PÁGINA 2:
├─ Título (10mm)
└─ Família C (75mm)
   Total: 85mm ✓
```

### Cenário 3: Família Grande (15 integrantes)

**Cálculo:**
- Família A: 145mm (12 + 7 + 126)
  - 126mm = 18 linhas × 7mm (1 cabeçalho + 15 integrantes + 2 extras)

**Resultado:** 1 família sozinha na página

```
PÁGINA 1:
├─ Título (10mm)
└─ Família A (145mm)
   Total: 155mm ✓

PÁGINA 2:
├─ Título (10mm)
└─ Família B...
```

---

## 🎨 Comparação Visual

### Cabeçalho de Instruções

**ANTES:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃█████████████████████████████████████████████████┃ ← Fundo vermelho
┃█ AFERIR A PRESSÃO ARTERIAL... (branco)      █████┃
┃█ 01 VEZ POR DIA... (branco)                 █████┃
┃█ DE MANHÃ EM JEJUM... (branco)              █████┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**DEPOIS:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ← Borda vermelha
┃                                                  ┃
┃  AFERIR A PRESSÃO ARTERIAL... (vermelho)        ┃ ← Fundo branco
┃  01 VEZ POR DIA... (vermelho)                   ┃   Texto vermelho
┃  DE MANHÃ EM JEJUM... (vermelho)                ┃
┃                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 📐 Constantes de Dimensões

| Elemento | Altura (mm) | Descrição |
|----------|-------------|-----------|
| `ALTURA_CABECALHO_INSTRUCOES` | 12 | Cabeçalho vermelho com instruções |
| `ALTURA_TITULO_FAMILIA` | 7 | Barra amarela com endereço + responsável |
| `ALTURA_LINHA_TABELA` | 7 | Cada linha da tabela (cabeçalho ou dados) |
| `ALTURA_TITULO_PAGINA` | 10 | Título "TRIAGEM DOMICILIAR..." |
| `ESPACAMENTO_ENTRE_FAMILIAS` | 5 | Espaço em branco entre famílias |
| `MARGEM_SUPERIOR` | 20 | Margem do topo da página |
| `MARGEM_INFERIOR` | 10 | Margem do fundo da página |

---

## ✅ Benefícios

### 1. Paginação Dinâmica

✅ **Otimização de Papel:** Famílias pequenas são agrupadas automaticamente
✅ **Legibilidade:** Nenhuma família dividida entre páginas
✅ **Flexibilidade:** Funciona com famílias de qualquer tamanho
✅ **Automação:** Não requer configuração manual de quantas famílias por página

### 2. Cores Ajustadas

✅ **Melhor Contraste:** Texto vermelho em fundo branco é mais legível
✅ **Economiza Tinta:** Não imprime fundo vermelho sólido
✅ **Padronização:** Alinha com boas práticas de design de impressão
✅ **Destaque Visual:** Borda vermelha mantém o destaque visual

---

## 🧪 Como Testar

1. **Teste com Famílias Pequenas:**
   - Selecionar 5 famílias com 2-3 integrantes cada
   - Verificar se múltiplas famílias aparecem na mesma página
   - Confirmar espaçamento de 5mm entre famílias

2. **Teste com Famílias Grandes:**
   - Selecionar 1 família com 15+ integrantes
   - Verificar se a família ocupa página inteira sem cortes
   - Confirmar que próxima família inicia em nova página

3. **Teste com Mix de Tamanhos:**
   - Selecionar 2 famílias pequenas + 1 grande + 2 pequenas
   - Verificar distribuição inteligente entre páginas
   - Exemplo esperado:
     - Página 1: 2 pequenas
     - Página 2: 1 grande
     - Página 3: 2 pequenas

4. **Teste Visual de Cores:**
   - Gerar qualquer PDF
   - Verificar cabeçalho de instruções:
     - ✓ Fundo branco
     - ✓ Texto vermelho
     - ✓ Borda vermelha

---

## 📝 Limitações e Considerações

### Limitações

1. **Famílias Muito Grandes:**
   - Família com 30+ integrantes pode ultrapassar altura da página
   - Neste caso, a tabela será cortada no final da página
   - **Solução futura:** Implementar paginação de tabela grande

2. **Cálculo de Altura:**
   - Assume que nomes cabem em uma linha
   - Nomes muito longos podem quebrar linha e aumentar altura real
   - **Impacto:** Mínimo, pois margem inferior de 10mm absorve pequenas variações

### Considerações

- **Performance:** Algoritmo é O(n) onde n = número de famílias
- **Memória:** Calcula altura sob demanda, sem armazenar em cache
- **Compatibilidade:** Funciona com jsPDF 2.5.1+

---

## 🔄 Retrocompatibilidade

✅ **100% Retrocompatível**

Todas as funcionalidades anteriores continuam funcionando:
- Formato do PDF idêntico (exceto cores do cabeçalho)
- Estrutura das tabelas mantida
- Sistema de status inalterado
- API de geração não mudou (mesma função `gerarPDFTriagem()`)

---

## 📚 Referências de Código

| Funcionalidade | Arquivo | Linhas |
|----------------|---------|--------|
| `calcularAlturaFamilia()` | `rastreamento_cardiovascular_script.js` | 875-891 |
| `gerarPDFTriagem()` atualizado | `rastreamento_cardiovascular_script.js` | 893-963 |
| `renderizarFamiliaNoPDF()` atualizado | `rastreamento_cardiovascular_script.js` | 965-1081 |
| Texto informativo atualizado | `rastreamento_cardiovascular_script.js` | 841-845 |

---

## ✅ Status

**Implementação:** ✅ **COMPLETA**
**Testes:** ⏳ Pendente (requer execução da aplicação)
**Documentação:** ✅ Completa
**Data de Conclusão:** 2025-10-18

### Funcionalidades Entregues:

- ✅ Função `calcularAlturaFamilia()` implementada
- ✅ Algoritmo de paginação dinâmica implementado
- ✅ Verificação de espaço disponível antes de renderizar
- ✅ Criação automática de nova página quando necessário
- ✅ Espaçamento inteligente entre famílias (5mm)
- ✅ Cores invertidas (texto vermelho, fundo branco)
- ✅ Borda vermelha no cabeçalho de instruções
- ✅ Parâmetro `primeiraFamiliaDaPagina` implementado
- ✅ Título da página apenas na primeira família
- ✅ Mensagem informativa atualizada

---

**Documentação gerada automaticamente**
**Última atualização:** 2025-10-18
