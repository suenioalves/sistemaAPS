# Implementação: Média Manual e Análise no MRPA 5 Dias

## ✅ STATUS: ESTRUTURA DE DADOS ATUALIZADA

A estrutura de dados do MRPA 5 dias já foi modificada para suportar entrada manual de média:

```javascript
estadoApp.afericoesMAPA[cidadao.co_seq_cds_cad_individual] = {
    tipo: 'individual', // 'individual' ou 'media'
    dias: [],           // Array de dias completos
    media_manual: { pas: null, pad: null },  // Média informada manualmente
    analise_medicoes: '' // Texto de análise
};
```

## 🔧 O QUE AINDA PRECISA SER IMPLEMENTADO

### 1. Adicionar Seletor de Tipo de Entrada no Card MRPA

Inserir logo após o cabeçalho do card (linha ~634), ANTES do "Aviso em destaque":

```html
<!-- Seletor de tipo de entrada -->
<div class="bg-gray-100 border-2 border-gray-400 px-4 py-3">
    <label class="block text-sm font-bold text-gray-900 mb-2">Tipo de Entrada:</label>
    <div class="flex gap-6">
        <label class="flex items-center cursor-pointer">
            <input type="radio"
                   name="tipo-entrada-mapa-${cidadao.co_seq_cds_cad_individual}"
                   value="individual"
                   ${tipoEntrada === 'individual' ? 'checked' : ''}
                   onchange="alterarTipoEntradaMAPA(${cidadao.co_seq_cds_cad_individual}, 'individual')"
                   class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500">
            <span class="ml-2 text-sm font-semibold text-gray-900">Medições Individuais (30 valores: 6/dia × 5 dias)</span>
        </label>
        <label class="flex items-center cursor-pointer">
            <input type="radio"
                   name="tipo-entrada-mapa-${cidadao.co_seq_cds_cad_individual}"
                   value="media"
                   ${tipoEntrada === 'media' ? 'checked' : ''}
                   onchange="alterarTipoEntradaMAPA(${cidadao.co_seq_cds_cad_individual}, 'media')"
                   class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500">
            <span class="ml-2 text-sm font-semibold text-gray-900">Informar Média Já Calculada</span>
        </label>
    </div>
</div>
```

### 2. Tornar Conteúdo Condicional

Modificar o conteúdo do card para exibir TABELA + FORMULÁRIO quando `tipo === 'individual'` ou FORMULÁRIO DE MÉDIA quando `tipo === 'media'`.

Substituir todo o bloco de "Aviso em destaque" até o final do formulário por:

```javascript
<!-- Conteúdo condicional baseado no tipo de entrada -->
${tipoEntrada === 'individual' ? `
    <!-- MODO INDIVIDUAL: Tabela + Formulário completo -->

    <!-- Aviso em destaque -->
    <div class="bg-red-50 border-y-2 border-red-300 px-4 py-3">
        <p class="text-sm font-bold text-red-900 text-center mb-1">
            AFERIR APÓS SENTADO POR 5 MINUTOS EM REPOUSO
        </p>
        <p class="text-xs font-semibold text-red-800 text-center">
            Intervalo de 1 minuto entre cada medida
        </p>
    </div>

    <!-- Tabela de aferições (igual à imagem) -->
    <div class="overflow-x-auto">
        ... TODO O CÓDIGO DA TABELA EXISTENTE ...
    </div>

    <!-- Formulário de entrada -->
    ${numDiaAtual <= 5 ? `
        <div class="bg-gray-100 border-t-2 border-gray-400 p-4">
            ... TODO O CÓDIGO DO FORMULÁRIO EXISTENTE ...
        </div>
    ` : `
        <div class="bg-green-100 border-t-2 border-green-600 p-4 text-center">
            <i class="ri-check-circle-fill text-green-600 text-2xl mr-2"></i>
            <span class="text-green-800 font-bold">5 DIAS COMPLETOS REGISTRADOS</span>
        </div>
    `}

` : `
    <!-- MODO MÉDIA MANUAL: Formulário simples -->

    <div class="bg-green-50 border-2 border-green-300 rounded-lg p-6 m-4">
        <h5 class="text-lg font-bold text-green-900 mb-4 text-center">
            <i class="ri-calculator-line mr-2"></i>Média Calculada Manualmente
        </h5>
        <p class="text-sm text-green-800 mb-4 text-center">
            Informe a média dos valores de PA que você já calculou (dias 2-5, excluindo dia 1 de adaptação)
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">PAS Médio (mmHg)</label>
                <input type="number"
                       id="media-mapa-pas-${cidadao.co_seq_cds_cad_individual}"
                       value="${dados.media_manual.pas || ''}"
                       placeholder="Ex: 142"
                       min="50"
                       max="300"
                       onchange="salvarMediaManualMAPA(${cidadao.co_seq_cds_cad_individual})"
                       class="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 font-bold text-2xl text-center">
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">PAD Médio (mmHg)</label>
                <input type="number"
                       id="media-mapa-pad-${cidadao.co_seq_cds_cad_individual}"
                       value="${dados.media_manual.pad || ''}"
                       placeholder="Ex: 88"
                       min="30"
                       max="200"
                       onchange="salvarMediaManualMAPA(${cidadao.co_seq_cds_cad_individual})"
                       class="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 font-bold text-2xl text-center">
            </div>
        </div>

        ${dados.media_manual.pas && dados.media_manual.pad ? `
            <div class="mt-4 bg-white border-2 border-green-400 rounded-lg p-3 text-center">
                <span class="text-lg text-green-900 font-bold">
                    <i class="ri-check-double-line mr-2"></i>Média registrada:
                    <span class="text-2xl">${dados.media_manual.pas}×${dados.media_manual.pad}</span>
                </span>
            </div>
        ` : ''}
    </div>
`}

<!-- Campo de Análise das Medições Residenciais (sempre visível) -->
<div class="bg-purple-50 border-t-2 border-purple-300 px-4 py-4">
    <label class="block text-sm font-bold text-purple-900 mb-2">
        <i class="ri-file-text-line mr-1"></i>Análise das Medições Residenciais
    </label>
    <textarea
        id="analise-mapa-${cidadao.co_seq_cds_cad_individual}"
        rows="3"
        placeholder="Insira sua análise profissional sobre as medições residenciais (MRPA 5 dias)..."
        onchange="salvarAnaliseMedicoes(${cidadao.co_seq_cds_cad_individual})"
        class="w-full px-3 py-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 text-sm"
    >${dados.analise_medicoes || ''}</textarea>
    <p class="text-xs text-purple-700 mt-1">
        <i class="ri-information-line mr-1"></i>Descreva observações relevantes, padrões identificados ou considerações clínicas das medições residenciais.
    </p>
</div>
```

### 3. Criar Funções JavaScript Globais

Adicionar após a função `window.removerDiaMAPA`:

```javascript
// Função global para alterar tipo de entrada MAPA
window.alterarTipoEntradaMAPA = function(codIndividual, tipo) {
    const dados = estadoApp.afericoesMAPA[codIndividual];
    dados.tipo = tipo;

    // Re-renderizar para mostrar formulário apropriado
    renderizarStepAtual();

    if (tipo === 'media') {
        mostrarNotificacao('Modo alterado: Informe a média já calculada (dias 2-5)', 'info');
    } else {
        mostrarNotificacao('Modo alterado: Registre medições individuais (30 valores)', 'info');
    }
};

// Função global para salvar média manual MAPA
window.salvarMediaManualMAPA = function(codIndividual) {
    const pasInput = document.getElementById(`media-mapa-pas-${codIndividual}`);
    const padInput = document.getElementById(`media-mapa-pad-${codIndividual}`);

    const pas = parseInt(pasInput.value);
    const pad = parseInt(padInput.value);

    // Validações
    if (pas && (pas < 50 || pas > 300)) {
        mostrarNotificacao('PAS deve estar entre 50 e 300 mmHg', 'warning');
        pasInput.value = '';
        return;
    }

    if (pad && (pad < 30 || pad > 200)) {
        mostrarNotificacao('PAD deve estar entre 30 e 200 mmHg', 'warning');
        padInput.value = '';
        return;
    }

    if (pas && pad && pad >= pas) {
        mostrarNotificacao('PAD deve ser menor que PAS', 'warning');
        padInput.value = '';
        return;
    }

    // Salvar média manual
    const dados = estadoApp.afericoesMAPA[codIndividual];
    dados.media_manual.pas = pas || null;
    dados.media_manual.pad = pad || null;

    // Re-renderizar
    renderizarStepAtual();

    if (pas && pad) {
        mostrarNotificacao('Média MRPA 5 dias registrada com sucesso!', 'success');
    }
};

// Função global para salvar análise das medições
window.salvarAnaliseMedicoes = function(codIndividual) {
    const textarea = document.getElementById(`analise-mapa-${codIndividual}`);
    const dados = estadoApp.afericoesMAPA[codIndividual];

    dados.analise_medicoes = textarea.value;

    mostrarNotificacao('Análise das medições residenciais salva', 'success');
};
```

### 4. Atualizar Função `calcularResultadoMAPA`

Modificar para considerar os dois tipos de entrada:

```javascript
function calcularResultadoMAPA(cidadao) {
    const dados = estadoApp.afericoesMAPA[cidadao.co_seq_cds_cad_individual];
    if (!dados) return;

    const tipoEntrada = dados.tipo || 'individual';
    let mediaPAS, mediaPAD, totalMedidas, numDiasValidos;

    if (tipoEntrada === 'media') {
        // Usar média manual informada
        mediaPAS = dados.media_manual.pas;
        mediaPAD = dados.media_manual.pad;
        totalMedidas = 0; // Não há medidas individuais
        numDiasValidos = 0;

        if (!mediaPAS || !mediaPAD) {
            console.warn('Média manual não informada para:', cidadao.nome_cidadao);
            return;
        }
    } else {
        // Calcular média das medições individuais
        if (!dados.dias || dados.dias.length === 0) return;

        // Excluir dia 1 (adaptação) e calcular média dos dias 2-5
        const diasValidos = dados.dias.filter((dia, index) => !dia.adaptacao);

        if (diasValidos.length === 0) return;

        // Calcular médias de TODAS as medidas (manhã e noite) dos dias válidos
        let somaPAS = 0;
        let somaPAD = 0;
        totalMedidas = 0;

        diasValidos.forEach(dia => {
            // Somar medidas da manhã
            dia.manha.forEach(medida => {
                somaPAS += medida.pas;
                somaPAD += medida.pad;
                totalMedidas++;
            });
            // Somar medidas da noite
            dia.noite.forEach(medida => {
                somaPAS += medida.pas;
                somaPAD += medida.pad;
                totalMedidas++;
            });
        });

        mediaPAS = Math.round(somaPAS / totalMedidas);
        mediaPAD = Math.round(somaPAD / totalMedidas);
        numDiasValidos = diasValidos.length;
    }

    // Classificar
    const isHipertenso = mediaPAS >= LIMITE_PAS_HIPERTENSO || mediaPAD >= LIMITE_PAD_HIPERTENSO;

    // Salvar resultado MAPA
    if (!estadoApp.resultados[cidadao.co_seq_cds_cad_individual]) {
        estadoApp.resultados[cidadao.co_seq_cds_cad_individual] = {};
    }

    estadoApp.resultados[cidadao.co_seq_cds_cad_individual].mapa = {
        media_pas: mediaPAS,
        media_pad: mediaPAD,
        classificacao: isHipertenso ? 'HIPERTENSO' : 'NAO_HIPERTENSO',
        num_afericoes_validas: totalMedidas,
        num_dias_validos: numDiasValidos,
        tipo_entrada: tipoEntrada,
        analise_medicoes: dados.analise_medicoes || ''
    };
}
```

### 5. Atualizar Validação `validarAfericoesMAPA`

No arquivo `rastreamento_cardiovascular_script.js`, modificar a função de validação:

```javascript
function validarAfericoesMAPA() {
    // Se não há cidadãos suspeitos, pula a validação
    if (!estadoApp.cidadaosSuspeitos || estadoApp.cidadaosSuspeitos.length === 0) {
        return true;
    }

    // Verificar se todos os suspeitos têm MAPA registrado
    for (const cidadao of estadoApp.cidadaosSuspeitos) {
        const dados = estadoApp.afericoesMAPA[cidadao.co_seq_cds_cad_individual];

        if (!dados) {
            mostrarNotificacao(
                `${cidadao.nome_cidadao} não tem dados de MRPA 5 dias registrados`,
                'warning'
            );
            return false;
        }

        const tipoEntrada = dados.tipo || 'individual';

        if (tipoEntrada === 'individual') {
            // Verificar se tem 5 dias completos (mínimo 4 dias considerando adaptação)
            if (!dados.dias || dados.dias.length < 4) {
                mostrarNotificacao(
                    `${cidadao.nome_cidadao} precisa de pelo menos 4 dias de medições (dia 1 + 3 dias válidos)`,
                    'warning'
                );
                return false;
            }
        } else if (tipoEntrada === 'media') {
            // Verificar se informou a média manual
            if (!dados.media_manual || !dados.media_manual.pas || !dados.media_manual.pad) {
                mostrarNotificacao(
                    `${cidadao.nome_cidadao}: Informe a média calculada (PAS e PAD)`,
                    'warning'
                );
                return false;
            }
        }
    }

    return true;
}
```

## 📝 LOCALIZAÇÃO DOS ARQUIVOS

- **Card MRPA**: `static/rastreamento_steps.js` - função `criarCardCidadaoMAPA()` (linha ~596)
- **Funções JavaScript**: `static/rastreamento_steps.js` - após `window.removerDiaMAPA` (linha ~307)
- **Cálculo Resultado**: `static/rastreamento_steps.js` - função `calcularResultadoMAPA()` (linha ~544)
- **Validação**: `static/rastreamento_cardiovascular_script.js` - função `validarAfericoesMAPA()` (linha ~483)

## ✨ RESUMO DAS MUDANÇAS

1. ✅ Estrutura de dados atualizada com `tipo`, `media_manual` e `analise_medicoes`
2. ⏳ Adicionar seletor de tipo de entrada no card
3. ⏳ Tornar conteúdo condicional (tabela OU formulário de média)
4. ⏳ Criar funções `alterarTipoEntradaMAPA()`, `salvarMediaManualMAPA()`, `salvarAnaliseMedicoes()`
5. ⏳ Atualizar `calcularResultadoMAPA()` para considerar os dois tipos
6. ⏳ Atualizar `validarAfericoesMAPA()` para validar os dois tipos

## 🎯 RESULTADO FINAL

O profissional poderá:
- Escolher entre registrar 30 valores individuais (6/dia × 5 dias) OU informar apenas a média já calculada
- Adicionar análise textual das medições residenciais
- Sistema calcula resultado automaticamente baseado no tipo de entrada escolhido
