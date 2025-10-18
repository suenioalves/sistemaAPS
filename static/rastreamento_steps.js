
// ============================================================================
// STEP 2: AFERIÇÕES MRPA
// ============================================================================
function renderizarStepAfericoesMRPA(container) {
    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="ri-stethoscope-line mr-2"></i>Aferições MRPA - Monitorização Residencial
        </h3>
        <p class="text-sm text-gray-600 mb-4">
            Registre <strong>1 aferição por dia</strong> durante <strong>3 a 5 dias</strong> para cada integrante selecionado.
        </p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-blue-800">
                <i class="ri-information-line mr-1"></i>
                <strong>Protocolo MRPA:</strong> Medir a pressão arterial em ambiente domiciliar, sempre no mesmo horário, em repouso.
            </p>
        </div>

        <div id="lista-cidadaos-mrpa" class="space-y-6">
            <!-- Cidadãos serão renderizados aqui -->
        </div>
    `;

    const listaCidadaos = container.querySelector('#lista-cidadaos-mrpa');

    // Renderizar cada cidadão selecionado
    estadoApp.cidadaosSelecionados.forEach((cidadao, index) => {
        const cardCidadao = criarCardCidadaoMRPA(cidadao, index);
        listaCidadaos.appendChild(cardCidadao);
    });
}

function criarCardCidadaoMRPA(cidadao, index) {
    const div = document.createElement('div');
    div.className = 'border border-gray-300 rounded-lg p-5 bg-white shadow-sm';

    // Inicializar aferições se não existir
    if (!estadoApp.afericoesMRPA[cidadao.co_seq_cds_cad_individual]) {
        estadoApp.afericoesMRPA[cidadao.co_seq_cds_cad_individual] = [];
    }

    const afericoes = estadoApp.afericoesMRPA[cidadao.co_seq_cds_cad_individual];
    const numDias = afericoes.length;

    div.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div>
                <h4 class="font-semibold text-gray-900">${cidadao.nome_cidadao}</h4>
                <p class="text-sm text-gray-600">${cidadao.idade} anos</p>
            </div>
            <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                ${numDias} ${numDias === 1 ? 'dia' : 'dias'} registrado${numDias !== 1 ? 's' : ''}
            </span>
        </div>

        <!-- Tabela de aferições -->
        <div class="overflow-x-auto mb-4">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="px-3 py-2 text-left text-gray-700 font-medium">Dia</th>
                        <th class="px-3 py-2 text-left text-gray-700 font-medium">PAS (mmHg)</th>
                        <th class="px-3 py-2 text-left text-gray-700 font-medium">PAD (mmHg)</th>
                        <th class="px-3 py-2 text-center text-gray-700 font-medium">Ações</th>
                    </tr>
                </thead>
                <tbody id="tbody-afericoes-${cidadao.co_seq_cds_cad_individual}">
                    ${afericoes.map((afericao, diaIndex) => `
                        <tr class="border-b border-gray-100">
                            <td class="px-3 py-2 font-medium text-gray-900">Dia ${afericao.dia}</td>
                            <td class="px-3 py-2 text-gray-700">${afericao.pas}</td>
                            <td class="px-3 py-2 text-gray-700">${afericao.pad}</td>
                            <td class="px-3 py-2 text-center">
                                <button onclick="removerAfericaoMRPA(${cidadao.co_seq_cds_cad_individual}, ${diaIndex})"
                                        class="text-red-600 hover:text-red-800 transition-colors">
                                    <i class="ri-delete-bin-line"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Formulário para adicionar nova aferição -->
        ${numDias < 5 ? `
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">
                    <i class="ri-add-line mr-1"></i>Adicionar Dia ${numDias + 1}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">PAS (Sistólica)</label>
                        <input type="number"
                               id="pas-${cidadao.co_seq_cds_cad_individual}"
                               placeholder="Ex: 120"
                               min="50"
                               max="300"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">PAD (Diastólica)</label>
                        <input type="number"
                               id="pad-${cidadao.co_seq_cds_cad_individual}"
                               placeholder="Ex: 80"
                               min="30"
                               max="200"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    </div>
                    <div class="flex items-end">
                        <button onclick="adicionarAfericaoMRPA(${cidadao.co_seq_cds_cad_individual})"
                                class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                            <i class="ri-check-line mr-1"></i>Registrar
                        </button>
                    </div>
                </div>
            </div>
        ` : `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <i class="ri-check-circle-line text-green-600 mr-1"></i>
                <span class="text-sm text-green-700 font-medium">Máximo de 5 dias atingido</span>
            </div>
        `}

        ${numDias >= 3 ? `
            <div class="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-sm text-blue-700">
                    <i class="ri-lightbulb-line mr-1"></i>
                    Você já tem o mínimo de 3 dias. Pode adicionar mais 2 dias ou seguir para análise.
                </p>
            </div>
        ` : ''}
    `;

    return div;
}

// Função global para adicionar aferição MRPA
window.adicionarAfericaoMRPA = function(codIndividual) {
    const pasInput = document.getElementById(`pas-${codIndividual}`);
    const padInput = document.getElementById(`pad-${codIndividual}`);

    const pas = parseInt(pasInput.value);
    const pad = parseInt(padInput.value);

    // Validações
    if (!pas || !pad) {
        mostrarNotificacao('Preencha PAS e PAD', 'warning');
        return;
    }

    if (pas < 50 || pas > 300) {
        mostrarNotificacao('PAS deve estar entre 50 e 300 mmHg', 'warning');
        return;
    }

    if (pad < 30 || pad > 200) {
        mostrarNotificacao('PAD deve estar entre 30 e 200 mmHg', 'warning');
        return;
    }

    if (pad >= pas) {
        mostrarNotificacao('PAD deve ser menor que PAS', 'warning');
        return;
    }

    // Adicionar aferição
    const afericoes = estadoApp.afericoesMRPA[codIndividual];
    afericoes.push({
        dia: afericoes.length + 1,
        pas: pas,
        pad: pad,
        data_registro: new Date().toISOString()
    });

    // Limpar campos
    pasInput.value = '';
    padInput.value = '';

    // Re-renderizar
    renderizarStepAtual();

    mostrarNotificacao('Aferição registrada com sucesso!', 'success');
};

// Função global para remover aferição MRPA
window.removerAfericaoMRPA = function(codIndividual, index) {
    if (!confirm('Deseja realmente remover esta aferição?')) {
        return;
    }

    const afericoes = estadoApp.afericoesMRPA[codIndividual];
    afericoes.splice(index, 1);

    // Renumerar dias
    afericoes.forEach((afericao, i) => {
        afericao.dia = i + 1;
    });

    // Re-renderizar
    renderizarStepAtual();

    mostrarNotificacao('Aferição removida', 'info');
};

// ============================================================================
// STEP 3: ANÁLISE MRPA
// ============================================================================
function renderizarStepAnaliseMRPA(container) {
    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="ri-bar-chart-line mr-2"></i>Análise dos Resultados MRPA
        </h3>
        <p class="text-sm text-gray-600 mb-4">
            Médias calculadas automaticamente. Pacientes com média ≥130x80 mmHg são classificados como <strong>SUSPEITOS</strong> e seguirão para MAPA.
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-yellow-800">
                <i class="ri-alert-line mr-1"></i>
                <strong>Critério:</strong> PAS ≥130 mmHg OU PAD ≥80 mmHg → SUSPEITO (necessita MAPA)
            </p>
        </div>

        <div id="lista-analise-mrpa" class="space-y-4">
            <!-- Análises serão renderizadas aqui -->
        </div>

        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-semibold text-blue-900 mb-2">Próximos passos:</h4>
            <ul class="text-sm text-blue-800 space-y-1">
                <li><i class="ri-arrow-right-s-line mr-1"></i>Pacientes <strong>NORMAIS</strong>: Rastreamento finalizado (reavaliar em 1 ano)</li>
                <li><i class="ri-arrow-right-s-line mr-1"></i>Pacientes <strong>SUSPEITOS</strong>: Seguir para MAPA (Passo 4)</li>
            </ul>
        </div>
    `;

    const listaAnalise = container.querySelector('#lista-analise-mrpa');

    // Inicializar array de cidadãos suspeitos
    estadoApp.cidadaosSuspeitos = [];
    estadoApp.cidadaosNormais = [];

    // Analisar cada cidadão
    estadoApp.cidadaosSelecionados.forEach(cidadao => {
        const cardAnalise = criarCardAnaliseMRPA(cidadao);
        listaAnalise.appendChild(cardAnalise);
    });
}

function criarCardAnaliseMRPA(cidadao) {
    const div = document.createElement('div');
    div.className = 'border border-gray-300 rounded-lg p-5 bg-white shadow-sm';

    const afericoes = estadoApp.afericoesMRPA[cidadao.co_seq_cds_cad_individual] || [];

    // Calcular médias
    const somaPAS = afericoes.reduce((sum, a) => sum + a.pas, 0);
    const somaPAD = afericoes.reduce((sum, a) => sum + a.pad, 0);
    const numDias = afericoes.length;

    const mediaPAS = Math.round(somaPAS / numDias);
    const mediaPAD = Math.round(somaPAD / numDias);

    // Classificar
    const isSuspeito = mediaPAS >= LIMITE_PAS_HIPERTENSO || mediaPAD >= LIMITE_PAD_HIPERTENSO;
    const classificacao = isSuspeito ? 'SUSPEITO' : 'NORMAL';
    const corClassificacao = isSuspeito ? 'red' : 'green';

    // Armazenar classificação no estado
    if (isSuspeito) {
        estadoApp.cidadaosSuspeitos.push(cidadao);
    } else {
        estadoApp.cidadaosNormais.push(cidadao);
    }

    // Salvar resultados
    if (!estadoApp.resultados[cidadao.co_seq_cds_cad_individual]) {
        estadoApp.resultados[cidadao.co_seq_cds_cad_individual] = {};
    }
    estadoApp.resultados[cidadao.co_seq_cds_cad_individual].mrpa = {
        media_pas: mediaPAS,
        media_pad: mediaPAD,
        classificacao: classificacao,
        num_dias: numDias
    };

    div.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div>
                <h4 class="font-semibold text-gray-900">${cidadao.nome_cidadao}</h4>
                <p class="text-sm text-gray-600">${cidadao.idade} anos • ${numDias} dias de aferições</p>
            </div>
            <span class="px-3 py-1 bg-${corClassificacao}-100 text-${corClassificacao}-700 rounded-full text-sm font-bold">
                ${classificacao}
            </span>
        </div>

        <!-- Tabela de aferições registradas -->
        <div class="mb-4">
            <h5 class="text-sm font-semibold text-gray-700 mb-2">Aferições registradas:</h5>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-3 py-2 text-left text-gray-600 font-medium">Dia</th>
                            <th class="px-3 py-2 text-left text-gray-600 font-medium">PAS</th>
                            <th class="px-3 py-2 text-left text-gray-600 font-medium">PAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${afericoes.map(a => `
                            <tr class="border-b border-gray-100">
                                <td class="px-3 py-2 text-gray-700">Dia ${a.dia}</td>
                                <td class="px-3 py-2 ${a.pas >= LIMITE_PAS_HIPERTENSO ? 'text-red-600 font-semibold' : 'text-gray-700'}">${a.pas}</td>
                                <td class="px-3 py-2 ${a.pad >= LIMITE_PAD_HIPERTENSO ? 'text-red-600 font-semibold' : 'text-gray-700'}">${a.pad}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Resultado da média -->
        <div class="bg-${corClassificacao}-50 border-2 border-${corClassificacao}-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
                <h5 class="font-semibold text-${corClassificacao}-900">Média MRPA:</h5>
                <span class="text-2xl font-bold text-${corClassificacao}-700">${mediaPAS} x ${mediaPAD}</span>
            </div>
            <div class="text-sm text-${corClassificacao}-800">
                ${isSuspeito ?
                    `<i class="ri-alert-line mr-1"></i>Média acima do limite (≥130x80). Este paciente precisa fazer MAPA.` :
                    `<i class="ri-check-line mr-1"></i>Média dentro dos limites normais (<130x80). Rastreamento finalizado.`
                }
            </div>
        </div>

        ${isSuspeito ? `
            <div class="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p class="text-sm text-orange-800">
                    <i class="ri-time-line mr-1"></i>
                    <strong>Próximo passo:</strong> Realizar MAPA (Monitorização Ambulatorial) - 3 medidas manhã + 3 noite por 5 dias.
                </p>
            </div>
        ` : `
            <div class="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <p class="text-sm text-green-800">
                    <i class="ri-calendar-line mr-1"></i>
                    <strong>Recomendação:</strong> Reavaliar em 1 ano.
                </p>
            </div>
        `}
    `;

    return div;
}

// ============================================================================
// STEP 4: AFERIÇÕES MAPA
// ============================================================================
function renderizarStepAfericoesMAPA(container) {
    // Verificar se há cidadãos suspeitos
    if (!estadoApp.cidadaosSuspeitos || estadoApp.cidadaosSuspeitos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <i class="ri-check-line text-3xl text-green-600"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Nenhum paciente necessita MAPA</h3>
                <p class="text-gray-600">Todos os pacientes tiveram resultados normais no MRPA.</p>
                <p class="text-sm text-gray-500 mt-2">Você pode pular para o resultado final.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="ri-time-line mr-2"></i>Aferições MAPA - Monitorização Ambulatorial
        </h3>
        <p class="text-sm text-gray-600 mb-4">
            Registre <strong>3 medidas pela manhã + 3 medidas à noite</strong> durante <strong>5 dias consecutivos</strong> para pacientes SUSPEITOS.
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-yellow-800">
                <i class="ri-alert-line mr-1"></i>
                <strong>Importante:</strong> As aferições do <strong>Dia 1</strong> NÃO serão incluídas no cálculo da média (período de adaptação). Apenas os dias 2 a 5 são considerados.
            </p>
        </div>

        <div id="lista-cidadaos-mapa" class="space-y-6">
            <!-- Cidadãos suspeitos serão renderizados aqui -->
        </div>
    `;

    const listaCidadaos = container.querySelector('#lista-cidadaos-mapa');

    estadoApp.cidadaosSuspeitos.forEach(cidadao => {
        const cardMAPA = criarCardCidadaoMAPA(cidadao);
        listaCidadaos.appendChild(cardMAPA);
    });
}

function criarCardCidadaoMAPA(cidadao) {
    const div = document.createElement('div');
    div.className = 'border border-orange-300 rounded-lg p-5 bg-orange-50/30 shadow-sm';

    // Inicializar aferições MAPA se não existir
    if (!estadoApp.afericoesMAPA[cidadao.co_seq_cds_cad_individual]) {
        estadoApp.afericoesMAPA[cidadao.co_seq_cds_cad_individual] = [];
    }

    const afericoes = estadoApp.afericoesMAPA[cidadao.co_seq_cds_cad_individual];

    // Contar dias completos (6 aferições por dia)
    const diasCompletos = Math.floor(afericoes.length / 6);
    const numDiaAtual = diasCompletos + 1;
    const afericoesNoDiaAtual = afericoes.length % 6;

    const resultadoMRPA = estadoApp.resultados[cidadao.co_seq_cds_cad_individual]?.mrpa;

    div.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div>
                <h4 class="font-semibold text-gray-900">${cidadao.nome_cidadao}</h4>
                <p class="text-sm text-gray-600">${cidadao.idade} anos</p>
                ${resultadoMRPA ? `
                    <p class="text-sm text-orange-700 mt-1">
                        <i class="ri-alert-line mr-1"></i>MRPA: ${resultadoMRPA.media_pas}x${resultadoMRPA.media_pad} (SUSPEITO)
                    </p>
                ` : ''}
            </div>
            <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                Dia ${numDiaAtual}/5
            </span>
        </div>

        <!-- Progresso -->
        <div class="mb-4">
            <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progresso total</span>
                <span>${afericoes.length}/30 aferições</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-orange-600 h-2 rounded-full transition-all" style="width: ${(afericoes.length / 30) * 100}%"></div>
            </div>
        </div>

        <!-- Formulário de entrada MAPA -->
        ${numDiaAtual <= 5 ? `
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="text-sm font-semibold text-gray-900">
                        Dia ${numDiaAtual} - ${afericoesNoDiaAtual < 3 ? 'Manhã' : 'Noite'}
                        (Aferição ${(afericoesNoDiaAtual % 3) + 1}/3)
                    </h5>
                    ${numDiaAtual === 1 ? `
                        <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Adaptação - Não conta na média</span>
                    ` : ''}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">PAS (Sistólica)</label>
                        <input type="number"
                               id="mapa-pas-${cidadao.co_seq_cds_cad_individual}"
                               placeholder="Ex: 120"
                               min="50"
                               max="300"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">PAD (Diastólica)</label>
                        <input type="number"
                               id="mapa-pad-${cidadao.co_seq_cds_cad_individual}"
                               placeholder="Ex: 80"
                               min="30"
                               max="200"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500">
                    </div>
                    <div class="flex items-end">
                        <button onclick="adicionarAfericaoMAPA(${cidadao.co_seq_cds_cad_individual})"
                                class="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors">
                            <i class="ri-check-line mr-1"></i>Registrar
                        </button>
                    </div>
                </div>
            </div>
        ` : `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center mb-4">
                <i class="ri-check-circle-line text-green-600 mr-1"></i>
                <span class="text-sm text-green-700 font-medium">5 dias completos registrados!</span>
            </div>
        `}

        <!-- Tabela de aferições registradas -->
        ${afericoes.length > 0 ? `
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Aferições registradas:</h5>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-2 py-2 text-left font-medium text-gray-600">Dia</th>
                                <th class="px-2 py-2 text-left font-medium text-gray-600">Período</th>
                                <th class="px-2 py-2 text-left font-medium text-gray-600">#</th>
                                <th class="px-2 py-2 text-left font-medium text-gray-600">PAS</th>
                                <th class="px-2 py-2 text-left font-medium text-gray-600">PAD</th>
                                <th class="px-2 py-2 text-center font-medium text-gray-600">Status</th>
                                <th class="px-2 py-2 text-center font-medium text-gray-600">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${afericoes.map((afericao, index) => {
                                const excluido = afericao.excluir_calculo;
                                return `
                                    <tr class="border-b border-gray-100 ${excluido ? 'bg-gray-50 opacity-60' : ''}">
                                        <td class="px-2 py-2 font-medium text-gray-900">Dia ${afericao.dia}</td>
                                        <td class="px-2 py-2 text-gray-700">${afericao.periodo}</td>
                                        <td class="px-2 py-2 text-gray-700">${afericao.numero}</td>
                                        <td class="px-2 py-2 text-gray-700">${afericao.pas}</td>
                                        <td class="px-2 py-2 text-gray-700">${afericao.pad}</td>
                                        <td class="px-2 py-2 text-center">
                                            ${excluido ?
                                                '<span class="text-xs px-1 py-0.5 bg-gray-200 text-gray-600 rounded">Excluído</span>' :
                                                '<span class="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded">Conta</span>'
                                            }
                                        </td>
                                        <td class="px-2 py-2 text-center">
                                            <button onclick="removerAfericaoMAPA(${cidadao.co_seq_cds_cad_individual}, ${index})"
                                                    class="text-red-600 hover:text-red-800">
                                                <i class="ri-delete-bin-line"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}
    `;

    return div;
}

// Função global para adicionar aferição MAPA
window.adicionarAfericaoMAPA = function(codIndividual) {
    const pasInput = document.getElementById(`mapa-pas-${codIndividual}`);
    const padInput = document.getElementById(`mapa-pad-${codIndividual}`);

    const pas = parseInt(pasInput.value);
    const pad = parseInt(padInput.value);

    // Validações
    if (!pas || !pad) {
        mostrarNotificacao('Preencha PAS e PAD', 'warning');
        return;
    }

    if (pas < 50 || pas > 300 || pad < 30 || pad > 200) {
        mostrarNotificacao('Valores fora dos limites permitidos', 'warning');
        return;
    }

    if (pad >= pas) {
        mostrarNotificacao('PAD deve ser menor que PAS', 'warning');
        return;
    }

    // Adicionar aferição
    const afericoes = estadoApp.afericoesMAPA[codIndividual];
    const numAfericoes = afericoes.length;

    const dia = Math.floor(numAfericoes / 6) + 1;
    const afericaoNoDia = numAfericoes % 6;
    const periodo = afericaoNoDia < 3 ? 'Manhã' : 'Noite';
    const numero = (afericaoNoDia % 3) + 1;

    afericoes.push({
        dia: dia,
        periodo: periodo,
        numero: numero,
        pas: pas,
        pad: pad,
        excluir_calculo: dia === 1, // Dia 1 é excluído do cálculo
        data_registro: new Date().toISOString()
    });

    // Limpar campos
    pasInput.value = '';
    padInput.value = '';

    // Re-renderizar
    renderizarStepAtual();

    // Verificar se completou o dia
    if (afericoes.length % 6 === 0) {
        const diaCompleto = afericoes.length / 6;
        mostrarNotificacao(`Dia ${diaCompleto} completo! (6 aferições)`, 'success');
    } else {
        mostrarNotificacao('Aferição registrada!', 'success');
    }
};

// Função global para remover aferição MAPA
window.removerAfericaoMAPA = function(codIndividual, index) {
    if (!confirm('Deseja realmente remover esta aferição?')) {
        return;
    }

    const afericoes = estadoApp.afericoesMAPA[codIndividual];
    afericoes.splice(index, 1);

    // Recalcular dias, períodos e números
    afericoes.forEach((afericao, i) => {
        const dia = Math.floor(i / 6) + 1;
        const afericaoNoDia = i % 6;

        afericao.dia = dia;
        afericao.periodo = afericaoNoDia < 3 ? 'Manhã' : 'Noite';
        afericao.numero = (afericaoNoDia % 3) + 1;
        afericao.excluir_calculo = dia === 1;
    });

    renderizarStepAtual();
    mostrarNotificacao('Aferição removida', 'info');
};

// ============================================================================
// STEP 5: RESULTADO FINAL
// ============================================================================
function renderizarStepResultadoFinal(container) {
    // Calcular resultados MAPA para os suspeitos
    if (estadoApp.cidadaosSuspeitos && estadoApp.cidadaosSuspeitos.length > 0) {
        estadoApp.cidadaosSuspeitos.forEach(cidadao => {
            calcularResultadoMAPA(cidadao);
        });
    }

    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="ri-checkbox-circle-line mr-2"></i>Resultado Final do Rastreamento
        </h3>
        <p class="text-sm text-gray-600 mb-4">
            Revise os resultados automáticos e confirme ou altere o diagnóstico para cada paciente.
        </p>

        <div id="lista-resultados-finais" class="space-y-4">
            <!-- Resultados serão renderizados aqui -->
        </div>

        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800">
                <i class="ri-information-line mr-1"></i>
                Após confirmar todos os diagnósticos, clique em <strong>"Finalizar Rastreamento"</strong> para salvar os resultados.
            </p>
        </div>
    `;

    const listaResultados = container.querySelector('#lista-resultados-finais');

    // Renderizar todos os cidadãos
    estadoApp.cidadaosSelecionados.forEach(cidadao => {
        const cardResultado = criarCardResultadoFinal(cidadao);
        listaResultados.appendChild(cardResultado);
    });
}

function calcularResultadoMAPA(cidadao) {
    const afericoes = estadoApp.afericoesMAPA[cidadao.co_seq_cds_cad_individual] || [];

    // Filtrar apenas aferições que contam (excluir dia 1)
    const afericoesValidas = afericoes.filter(a => !a.excluir_calculo);

    if (afericoesValidas.length === 0) return;

    // Calcular médias
    const somaPAS = afericoesValidas.reduce((sum, a) => sum + a.pas, 0);
    const somaPAD = afericoesValidas.reduce((sum, a) => sum + a.pad, 0);

    const mediaPAS = Math.round(somaPAS / afericoesValidas.length);
    const mediaPAD = Math.round(somaPAD / afericoesValidas.length);

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
        num_afericoes_validas: afericoesValidas.length
    };
}

function criarCardResultadoFinal(cidadao) {
    const div = document.createElement('div');
    const resultado = estadoApp.resultados[cidadao.co_seq_cds_cad_individual] || {};
    const resultadoMRPA = resultado.mrpa;
    const resultadoMAPA = resultado.mapa;

    // Determinar diagnóstico automático
    let diagnosticoAutomatico, corDiagnostico, iconeDiagnostico;

    if (resultadoMAPA) {
        // Passou por MAPA
        if (resultadoMAPA.classificacao === 'HIPERTENSO') {
            diagnosticoAutomatico = 'HIPERTENSO';
            corDiagnostico = 'red';
            iconeDiagnostico = 'ri-alert-fill';
        } else {
            diagnosticoAutomatico = 'NÃO HIPERTENSO';
            corDiagnostico = 'green';
            iconeDiagnostico = 'ri-check-fill';
        }
    } else if (resultadoMRPA) {
        // Só fez MRPA
        if (resultadoMRPA.classificacao === 'NORMAL') {
            diagnosticoAutomatico = 'NÃO HIPERTENSO';
            corDiagnostico = 'green';
            iconeDiagnostico = 'ri-check-fill';
        } else {
            // Suspeito mas não fez MAPA (não deveria acontecer)
            diagnosticoAutomatico = 'PENDENTE MAPA';
            corDiagnostico = 'yellow';
            iconeDiagnostico = 'ri-time-line';
        }
    }

    // Inicializar decisão profissional se não existir
    if (!resultado.decisao_profissional) {
        resultado.decisao_profissional = {
            concordou: null,
            diagnostico_final: null,
            justificativa: ''
        };
    }

    const decisao = resultado.decisao_profissional;

    div.className = 'border-2 border-gray-300 rounded-lg p-5 bg-white shadow-md';

    div.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div>
                <h4 class="font-semibold text-gray-900 text-lg">${cidadao.nome_cidadao}</h4>
                <p class="text-sm text-gray-600">${cidadao.idade} anos</p>
            </div>
            <div class="text-right">
                <div class="px-3 py-1 bg-${corDiagnostico}-100 text-${corDiagnostico}-700 rounded-full text-sm font-bold inline-flex items-center">
                    <i class="${iconeDiagnostico} mr-1"></i>
                    ${diagnosticoAutomatico}
                </div>
            </div>
        </div>

        <!-- Resumo MRPA -->
        ${resultadoMRPA ? `
            <div class="mb-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h5 class="text-xs font-semibold text-gray-700 mb-2">Resultado MRPA:</h5>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">Média: <strong>${resultadoMRPA.media_pas}x${resultadoMRPA.media_pad}</strong> (${resultadoMRPA.num_dias} dias)</span>
                    <span class="text-xs px-2 py-1 bg-${resultadoMRPA.classificacao === 'NORMAL' ? 'green' : 'orange'}-100 text-${resultadoMRPA.classificacao === 'NORMAL' ? 'green' : 'orange'}-700 rounded">
                        ${resultadoMRPA.classificacao}
                    </span>
                </div>
            </div>
        ` : ''}

        <!-- Resumo MAPA -->
        ${resultadoMAPA ? `
            <div class="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <h5 class="text-xs font-semibold text-gray-700 mb-2">Resultado MAPA (dias 2-5):</h5>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">Média: <strong>${resultadoMAPA.media_pas}x${resultadoMAPA.media_pad}</strong> (${resultadoMAPA.num_afericoes_validas} aferições)</span>
                    <span class="text-xs px-2 py-1 bg-${resultadoMAPA.classificacao === 'HIPERTENSO' ? 'red' : 'green'}-100 text-${resultadoMAPA.classificacao === 'HIPERTENSO' ? 'red' : 'green'}-700 rounded font-bold">
                        ${resultadoMAPA.classificacao === 'HIPERTENSO' ? 'HIPERTENSO' : 'NÃO HIPERTENSO'}
                    </span>
                </div>
            </div>
        ` : ''}

        <!-- Decisão Profissional -->
        <div class="border-t-2 border-gray-200 pt-4 mt-4">
            <h5 class="text-sm font-semibold text-gray-900 mb-3">
                <i class="ri-user-star-line mr-1"></i>Decisão Profissional:
            </h5>

            <div class="space-y-3">
                <!-- Concordar / Discordar -->
                <div class="flex items-center gap-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="radio"
                               name="decisao-${cidadao.co_seq_cds_cad_individual}"
                               value="concordar"
                               ${decisao.concordou === true ? 'checked' : ''}
                               onchange="registrarDecisaoProfissional(${cidadao.co_seq_cds_cad_individual}, true, '${diagnosticoAutomatico}')"
                               class="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500">
                        <span class="ml-2 text-sm text-gray-700">
                            <i class="ri-thumb-up-line text-green-600 mr-1"></i>
                            Concordo com o diagnóstico automático
                        </span>
                    </label>

                    <label class="flex items-center cursor-pointer">
                        <input type="radio"
                               name="decisao-${cidadao.co_seq_cds_cad_individual}"
                               value="discordar"
                               ${decisao.concordou === false ? 'checked' : ''}
                               onchange="registrarDecisaoProfissional(${cidadao.co_seq_cds_cad_individual}, false, '${diagnosticoAutomatico}')"
                               class="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500">
                        <span class="ml-2 text-sm text-gray-700">
                            <i class="ri-thumb-down-line text-red-600 mr-1"></i>
                            Discordo
                        </span>
                    </label>
                </div>

                <!-- Campo de discordância -->
                <div id="area-discordancia-${cidadao.co_seq_cds_cad_individual}" class="${decisao.concordou === false ? '' : 'hidden'}">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Diagnóstico correto:</label>
                            <select id="diagnostico-final-${cidadao.co_seq_cds_cad_individual}"
                                    onchange="atualizarDiagnosticoFinal(${cidadao.co_seq_cds_cad_individual})"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500">
                                <option value="">Selecione...</option>
                                <option value="HIPERTENSO" ${decisao.diagnostico_final === 'HIPERTENSO' ? 'selected' : ''}>HIPERTENSO</option>
                                <option value="NAO_HIPERTENSO" ${decisao.diagnostico_final === 'NAO_HIPERTENSO' ? 'selected' : ''}>NÃO HIPERTENSO</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Justificativa:</label>
                            <textarea id="justificativa-${cidadao.co_seq_cds_cad_individual}"
                                      onchange="atualizarJustificativa(${cidadao.co_seq_cds_cad_individual})"
                                      rows="2"
                                      placeholder="Explique o motivo da discordância..."
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500">${decisao.justificativa || ''}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Feedback de decisão -->
                ${decisao.concordou !== null ? `
                    <div class="bg-${decisao.concordou ? 'green' : 'red'}-50 border border-${decisao.concordou ? 'green' : 'red'}-200 rounded-lg p-2">
                        <p class="text-xs text-${decisao.concordou ? 'green' : 'red'}-800">
                            <i class="ri-checkbox-circle-line mr-1"></i>
                            <strong>Decisão registrada:</strong>
                            ${decisao.concordou ?
                                `Diagnóstico confirmado como <strong>${diagnosticoAutomatico}</strong>` :
                                `Diagnóstico alterado para <strong>${decisao.diagnostico_final || 'PENDENTE'}</strong>`
                            }
                        </p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    return div;
}

// Função global para registrar decisão profissional
window.registrarDecisaoProfissional = function(codIndividual, concordou, diagnosticoAuto) {
    const resultado = estadoApp.resultados[codIndividual];

    resultado.decisao_profissional.concordou = concordou;

    if (concordou) {
        resultado.decisao_profissional.diagnostico_final = diagnosticoAuto;
        resultado.decisao_profissional.justificativa = '';
    } else {
        resultado.decisao_profissional.diagnostico_final = null;
    }

    // Mostrar/esconder área de discordância
    const areaDiscordancia = document.getElementById(`area-discordancia-${codIndividual}`);
    if (areaDiscordancia) {
        areaDiscordancia.classList.toggle('hidden', concordou);
    }

    renderizarStepAtual();
};

// Função global para atualizar diagnóstico final
window.atualizarDiagnosticoFinal = function(codIndividual) {
    const select = document.getElementById(`diagnostico-final-${codIndividual}`);
    const resultado = estadoApp.resultados[codIndividual];

    resultado.decisao_profissional.diagnostico_final = select.value;
    renderizarStepAtual();
};

// Função global para atualizar justificativa
window.atualizarJustificativa = function(codIndividual) {
    const textarea = document.getElementById(`justificativa-${codIndividual}`);
    const resultado = estadoApp.resultados[codIndividual];

    resultado.decisao_profissional.justificativa = textarea.value;
};
