/**
 * ============================================================================
 * RASTREAMENTO CARDIOVASCULAR - SCRIPT PRINCIPAL
 * ============================================================================
 * Gerencia o fluxo passo a passo do rastreamento de hipertensão domiciliar
 */

// ============================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// ============================================================================
window.estadoApp = {
    currentStep: 1,
    totalSteps: 6,                   // Alterado de 5 para 6 (novo step: Ficha de Triagem)
    domicilioSelecionado: null,
    familiasDisponiveis: [],         // Array de famílias do domicílio
    familiasSelecionadas: [],        // Famílias selecionadas para rastreamento
    cidadaosSelecionados: [],
    cidadaosSuspeitos: [],
    cidadaosNormais: [],
    integrantesDisponiveis: [],      // Todos integrantes de todas famílias
    afericoesMRPA: {},
    afericoesMAPA: {},
    resultados: {},
    statusTriagemFamilias: {}        // { id_familia: 'nao_triada' | 'iniciada' | 'incompleta' | 'concluida' }
};

// ============================================================================
// CONSTANTES
// ============================================================================
window.FASES = {
    SELECAO_INTEGRANTES: 1,
    FICHA_TRIAGEM: 2,                // NOVO STEP: Geração de PDF de triagem
    AFERICOES_MRPA: 3,               // Renumerado de 2 para 3
    ANALISE_MRPA: 4,                 // Renumerado de 3 para 4
    AFERICOES_MAPA: 5,               // Renumerado de 4 para 5
    RESULTADO_FINAL: 6               // Renumerado de 5 para 6
};

window.LIMITE_PAS_HIPERTENSO = 130;
window.LIMITE_PAD_HIPERTENSO = 80;

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventListeners();
    carregarFiltrosIniciais();
    // Dashboard é carregado pelo dashboard_rastreamento.js
});

function inicializarEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            trocarTab(tab);
        });
    });

    // Botões principais
    document.getElementById('btn-buscar-domicilios')?.addEventListener('click', buscarDomicilios);
    document.getElementById('btn-proximo')?.addEventListener('click', proximoStep);
    document.getElementById('btn-voltar')?.addEventListener('click', voltarStep);
    document.getElementById('btn-finalizar')?.addEventListener('click', finalizarRastreamento);

    // Filtros
    document.getElementById('filtro-equipe')?.addEventListener('change', carregarMicroareas);

    // Buscar ao pressionar Enter no campo de busca
    document.getElementById('filtro-busca')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            buscarDomicilios();
        }
    });
}

// ============================================================================
// NAVEGAÇÃO ENTRE TABS
// ============================================================================
function trocarTab(tabName) {
    // Atualizar botões
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-red-500', 'text-red-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active', 'border-red-500', 'text-red-600');

    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`tab-content-${tabName}`)?.classList.remove('hidden');
}

// ============================================================================
// CARREGAMENTO DE FILTROS
// ============================================================================
async function carregarFiltrosIniciais() {
    try {
        // Buscar equipes
        const response = await fetch('/api/domicilios/equipes');
        const data = await response.json();

        const selectEquipe = document.getElementById('filtro-equipe');
        if (selectEquipe && data.equipes) {
            selectEquipe.innerHTML = '<option value="">Todas as equipes</option>';
            data.equipes.forEach(equipe => {
                const option = document.createElement('option');
                option.value = equipe;
                option.textContent = equipe;
                selectEquipe.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

async function carregarMicroareas() {
    const equipe = document.getElementById('filtro-equipe')?.value;
    if (!equipe) {
        document.getElementById('filtro-microarea').innerHTML = '<option value="">Todas as microáreas</option>';
        return;
    }

    try {
        const response = await fetch(`/api/domicilios/microareas?equipe=${encodeURIComponent(equipe)}`);
        const data = await response.json();

        const selectMicroarea = document.getElementById('filtro-microarea');
        selectMicroarea.innerHTML = '<option value="">Todas as microáreas</option>';

        if (data.microareas) {
            data.microareas.forEach(microarea => {
                const option = document.createElement('option');
                option.value = microarea;
                option.textContent = microarea;
                selectMicroarea.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar microáreas:', error);
    }
}

// ============================================================================
// BUSCA DE DOMICÍLIOS
// ============================================================================
async function buscarDomicilios() {
    const equipe = document.getElementById('filtro-equipe')?.value;
    const microarea = document.getElementById('filtro-microarea')?.value;
    const busca = document.getElementById('filtro-busca')?.value;

    // Validar: se não tem busca por texto, exigir equipe e microárea
    if (!busca && (!equipe || !microarea)) {
        mostrarNotificacao('Por favor, selecione equipe e microárea ou digite um termo para busca', 'warning');
        return;
    }

    mostrarLoading('loading-domicilios', true);
    document.getElementById('container-domicilios')?.classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            equipe: equipe || '',
            microarea: microarea || '',
            busca: busca || '',
            page: 1
        });

        const response = await fetch(`/api/domicilios/list?${params}`);
        const data = await response.json();

        renderizarDomicilios(data.domicilios || []);
    } catch (error) {
        console.error('Erro ao buscar domicílios:', error);
        mostrarNotificacao('Erro ao carregar domicílios', 'error');
    } finally {
        mostrarLoading('loading-domicilios', false);
    }
}

function renderizarDomicilios(domicilios) {
    const container = document.getElementById('lista-domicilios');
    container.innerHTML = '';

    if (domicilios.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="ri-home-4-line text-4xl mb-2"></i>
                <p>Nenhum domicílio encontrado</p>
            </div>
        `;
        return;
    }

    domicilios.forEach(domicilio => {
        const card = criarCardDomicilio(domicilio);
        container.appendChild(card);
    });
}

function criarCardDomicilio(domicilio) {
    const div = document.createElement('div');
    div.className = 'border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:shadow-md transition-all cursor-pointer';
    div.onclick = () => selecionarDomicilio(domicilio);

    div.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <h4 class="font-semibold text-gray-900">${domicilio.endereco_completo}</h4>
                <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span><i class="ri-group-line mr-1"></i>${domicilio.total_familias} família(s)</span>
                    <span><i class="ri-user-line mr-1"></i>${domicilio.total_integrantes} integrante(s)</span>
                </div>
                <div class="mt-1 text-sm text-gray-500">
                    Microárea: ${domicilio.microareas || 'N/A'}
                </div>
            </div>
            <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors">
                <i class="ri-arrow-right-line"></i>
            </button>
        </div>
    `;

    return div;
}

// ============================================================================
// SELEÇÃO DE DOMICÍLIO E INÍCIO DO RASTREAMENTO
// ============================================================================
async function selecionarDomicilio(domicilio) {
    // Buscar FAMÍLIAS do domicílio
    try {
        const response = await fetch(`/api/rastreamento/familias-domicilio/${domicilio.id_domicilio}`);
        const data = await response.json();

        if (data.familias && data.familias.length > 0) {
            // Adicionar famílias deste domicílio à lista disponível (sem duplicar)
            data.familias.forEach(familia => {
                const jaExiste = estadoApp.familiasDisponiveis.some(f => f.id_familia === familia.id_familia);
                if (!jaExiste) {
                    // Adicionar informações do domicílio à família
                    familia.domicilio = {
                        id_domicilio: domicilio.id_domicilio,
                        endereco_completo: domicilio.endereco_completo
                    };
                    estadoApp.familiasDisponiveis.push(familia);
                }
            });

            // Mostrar wizard (mas MANTER lista de domicílios visível)
            document.getElementById('wizard-rastreamento')?.classList.remove('hidden');

            // Ir para step 1 se ainda não estiver lá
            if (estadoApp.currentStep !== 1) {
                irParaStep(1);
            } else {
                // Re-renderizar step atual para mostrar novas famílias
                renderizarStepAtual();
            }

            mostrarNotificacao(`${data.familias.length} família(s) adicionada(s) do domicílio selecionado`, 'success');
        } else {
            mostrarNotificacao('Nenhuma família elegível encontrada neste domicílio', 'warning');
        }
    } catch (error) {
        console.error('Erro ao buscar famílias:', error);
        mostrarNotificacao('Erro ao carregar famílias do domicílio', 'error');
    }
}

// ============================================================================
// NAVEGAÇÃO ENTRE STEPS
// ============================================================================
function irParaStep(stepNumber) {
    estadoApp.currentStep = stepNumber;
    atualizarProgressoVisual();
    renderizarStepAtual();
}

function proximoStep() {
    if (validarStepAtual()) {
        irParaStep(estadoApp.currentStep + 1);
    }
}

function voltarStep() {
    if (estadoApp.currentStep > 1) {
        irParaStep(estadoApp.currentStep - 1);
    }
}

function atualizarProgressoVisual() {
    const porcentagem = ((estadoApp.currentStep - 1) / (estadoApp.totalSteps - 1)) * 100;
    document.getElementById('progress-bar').style.width = `${porcentagem}%`;
    document.getElementById('progress-percentage').textContent = Math.round(porcentagem);

    // Atualizar steps visuais
    document.querySelectorAll('.step-item').forEach((item, index) => {
        const stepNum = index + 1;
        const circle = item.querySelector('div');

        if (stepNum < estadoApp.currentStep) {
            // Completado
            circle.className = 'w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center mb-2';
            circle.innerHTML = '<i class="ri-check-line"></i>';
        } else if (stepNum === estadoApp.currentStep) {
            // Atual
            circle.className = 'w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center mb-2';
        } else {
            // Pendente
            circle.className = 'w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center mb-2';
        }
    });

    // Gerenciar visibilidade dos botões
    document.getElementById('btn-voltar')?.classList.toggle('hidden', estadoApp.currentStep === 1);
    document.getElementById('btn-proximo')?.classList.toggle('hidden', estadoApp.currentStep === estadoApp.totalSteps);
    document.getElementById('btn-finalizar')?.classList.toggle('hidden', estadoApp.currentStep !== estadoApp.totalSteps);

    // NOVO: Ocultar área de filtros e lista de domicílios quando step >= 2
    const areaFiltros = document.getElementById('area-filtros-domicilios');
    const listaDomicilios = document.getElementById('container-domicilios');

    if (estadoApp.currentStep >= 2) {
        // Ocultar filtros e lista de domicílios
        areaFiltros?.classList.add('hidden');
        listaDomicilios?.classList.add('hidden');
    } else {
        // Mostrar filtros (lista de domicílios só mostra se tiver resultados)
        areaFiltros?.classList.remove('hidden');
    }
}

// ============================================================================
// RENDERIZAÇÃO DE CADA STEP
// ============================================================================
window.renderizarStepAtual = function() {
    const container = document.getElementById('step-content');

    switch (estadoApp.currentStep) {
        case FASES.SELECAO_INTEGRANTES:
            renderizarStepSelecaoIntegrantes(container);
            break;
        case FASES.FICHA_TRIAGEM:              // NOVO STEP
            renderizarStepFichaTriagem(container);
            break;
        case FASES.AFERICOES_MRPA:
            renderizarStepAfericoesMRPA(container);
            break;
        case FASES.ANALISE_MRPA:
            renderizarStepAnaliseMRPA(container);
            break;
        case FASES.AFERICOES_MAPA:
            renderizarStepAfericoesMAPA(container);
            break;
        case FASES.RESULTADO_FINAL:
            renderizarStepResultadoFinal(container);
            break;
    }
};

// ============================================================================
// STEP 1: SELEÇÃO DE FAMÍLIAS E INTEGRANTES
// ============================================================================
function renderizarStepSelecaoIntegrantes(container) {
    const totalFamilias = estadoApp.familiasDisponiveis.length;
    const totalSelecionadas = estadoApp.familiasSelecionadas.length;

    container.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-900">
                    <i class="ri-group-line mr-2"></i>Selecione as Famílias e Integrantes para Rastreamento
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                    <strong>${totalFamilias} família(s)</strong> disponível(is) •
                    <strong>${totalSelecionadas} família(s)</strong> selecionada(s) •
                    <strong>${estadoApp.cidadaosSelecionados.length} integrante(s)</strong> selecionado(s)
                </p>
            </div>
            <button onclick="voltarParaBuscaDomicilios()"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2">
                <i class="ri-add-line"></i>
                Adicionar Outra Família
            </button>
        </div>

        <div id="lista-familias" class="space-y-6">
            <!-- Famílias serão renderizadas aqui -->
        </div>
    `;

    const listaFamilias = container.querySelector('#lista-familias');

    if (!estadoApp.familiasDisponiveis || estadoApp.familiasDisponiveis.length === 0) {
        listaFamilias.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="ri-home-4-line text-4xl mb-2"></i>
                <p>Nenhuma família adicionada</p>
                <p class="text-sm mt-2">Clique em "Adicionar Outra Família" para buscar domicílios</p>
            </div>
        `;
        return;
    }

    estadoApp.familiasDisponiveis.forEach(familia => {
        const cardFamilia = criarCardFamilia(familia);
        listaFamilias.appendChild(cardFamilia);
    });
}

// Função para voltar à busca de domicílios (permitindo adicionar mais famílias)
window.voltarParaBuscaDomicilios = function() {
    // Rolar para o topo para mostrar os filtros
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mostrarNotificacao('Busque outro domicílio para adicionar mais famílias', 'info');
};

// Função para mostrar filtros do wizard (botão "Iniciar Novo Rastreamento")
window.mostrarFiltrosWizard = function() {
    const areaFiltros = document.getElementById('area-filtros-domicilios');
    const botaoIniciar = document.getElementById('btn-iniciar-novo-rastreamento');

    if (areaFiltros) {
        areaFiltros.classList.remove('hidden');
        // Scroll suave até os filtros
        areaFiltros.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Ocultar botão de iniciar após clicar
    if (botaoIniciar) {
        botaoIniciar.classList.add('hidden');
    }
};

/**
 * Carrega uma família para rastreamento (chamada do dashboard)
 * @param {Object} familiaData - Dados completos da família vindos da API
 * @param {Object} progresso - Dados de progresso (opcional, para continuar triagem)
 */
window.carregarFamiliaParaRastreamento = function(familiaData, progresso = null) {
    console.log('Carregando família para rastreamento:', familiaData);

    // Resetar estado do app
    estadoApp.familiasSelecionadas = [];
    estadoApp.cidadaosSelecionados = [];
    estadoApp.familiasDisponiveis = [];
    estadoApp.afericoesMRPA = {};
    estadoApp.afericoesMAPA = {};
    estadoApp.cidadaosSuspeitos = [];
    estadoApp.cidadaosNormais = [];
    estadoApp.resultados = {};

    // Adicionar família ao estado
    estadoApp.familiasDisponiveis.push(familiaData);
    estadoApp.familiasSelecionadas.push(familiaData);

    // Selecionar automaticamente todos os integrantes elegíveis
    if (familiaData.integrantes && familiaData.integrantes.length > 0) {
        familiaData.integrantes.forEach(integrante => {
            // Apenas integrantes elegíveis (sem diagnóstico prévio de HAS)
            if (!integrante.tem_diagnostico_has) {
                estadoApp.cidadaosSelecionados.push(integrante);
            }
        });
    }

    // Se há progresso, restaurar estado
    if (progresso) {
        // TODO: Restaurar step atual, aferições, etc.
        console.log('Restaurando progresso:', progresso);
        // Implementar lógica de restauração quando necessário
    }

    // Ir para step 1 (Seleção de Integrantes)
    irParaStep(1);

    mostrarNotificacao(`Família ${familiaData.nome_responsavel} carregada com ${familiaData.total_elegiveis} integrante(s) elegível(is)`, 'success');
};

function criarCardFamilia(familia) {
    const div = document.createElement('div');
    div.className = 'border-2 border-blue-300 rounded-lg bg-blue-50 overflow-hidden';

    // Verificar se família está selecionada
    const familiaSelecionada = estadoApp.familiasSelecionadas.some(f => f.id_familia === familia.id_familia);

    div.innerHTML = `
        <!-- Cabeçalho da Família -->
        <div class="bg-blue-100 border-b-2 border-blue-300 px-4 py-3">
            <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 flex-1">
                    <input type="checkbox"
                           id="check-familia-${familia.id_familia}"
                           ${familiaSelecionada ? 'checked' : ''}
                           onchange="toggleFamilia(${familia.id_familia})"
                           class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1">
                    <div class="flex-1">
                        <h4 class="font-bold text-blue-900">
                            <i class="ri-home-heart-line mr-1"></i>FAMÍLIA - ${familia.nome_responsavel_familiar.toUpperCase()}
                        </h4>
                        <p class="text-xs text-blue-600 mt-1">
                            <i class="ri-map-pin-line mr-1"></i>${familia.domicilio?.endereco_completo || 'Endereço não disponível'}
                        </p>
                        <p class="text-sm text-blue-700 mt-1">
                            Microárea: ${familia.microarea || 'N/A'} • ${familia.total_integrantes} integrante(s) elegível(is)
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="event.stopPropagation(); toggleDetalhesFamily(${familia.id_familia})"
                            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        <i class="ri-arrow-down-s-line" id="icon-familia-${familia.id_familia}"></i>
                        <span id="text-familia-${familia.id_familia}">Expandir</span>
                    </button>
                    <button onclick="event.stopPropagation(); removerFamilia(${familia.id_familia})"
                            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            title="Remover família">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Lista de Integrantes (inicialmente oculta) -->
        <div id="integrantes-familia-${familia.id_familia}" class="hidden bg-white px-4 py-3 space-y-2">
            ${familia.integrantes.map(integrante => criarItemIntegranteFamilia(integrante, familia.id_familia)).join('')}
        </div>
    `;

    return div;
}

// Função para remover família da lista
window.removerFamilia = function(idFamilia) {
    if (!confirm('Deseja remover esta família e todos os seus integrantes da seleção?')) {
        return;
    }

    const familia = estadoApp.familiasDisponiveis.find(f => f.id_familia === idFamilia);
    if (!familia) return;

    // Remover todos integrantes desta família
    familia.integrantes.forEach(integrante => {
        estadoApp.cidadaosSelecionados = estadoApp.cidadaosSelecionados.filter(
            c => c.co_seq_cds_cad_individual !== integrante.co_seq_cds_cad_individual
        );
    });

    // Remover família das listas
    estadoApp.familiasSelecionadas = estadoApp.familiasSelecionadas.filter(f => f.id_familia !== idFamilia);
    estadoApp.familiasDisponiveis = estadoApp.familiasDisponiveis.filter(f => f.id_familia !== idFamilia);

    // Re-renderizar
    renderizarStepAtual();
    mostrarNotificacao('Família removida da seleção', 'info');
};

function criarItemIntegranteFamilia(integrante, idFamilia) {
    const jaSelecionado = estadoApp.cidadaosSelecionados.some(c => c.co_seq_cds_cad_individual === integrante.co_seq_cds_cad_individual);
    const resultado = estadoApp.resultados[integrante.co_seq_cds_cad_individual];
    const jaAvaliado = !!resultado;
    const isHipertenso = resultado?.mapa?.classificacao === 'HIPERTENSO';

    let borderClass = 'border-gray-200';
    let bgClass = 'bg-white';

    if (jaAvaliado) {
        if (isHipertenso) {
            borderClass = 'border-red-300';
            bgClass = 'bg-red-50';
        } else {
            borderClass = 'border-green-300';
            bgClass = 'bg-green-50';
        }
    }

    return `
        <div class="border ${borderClass} ${bgClass} rounded-lg p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                ${!jaAvaliado || !isHipertenso ? `
                    <input type="checkbox"
                           id="check-integrante-${integrante.co_seq_cds_cad_individual}"
                           ${jaSelecionado ? 'checked' : ''}
                           onchange="toggleIntegrante(${integrante.co_seq_cds_cad_individual}, ${idFamilia})"
                           class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                           ${integrante.tem_diagnostico_hipertensao ? 'disabled' : ''}>
                ` : `
                    <div class="w-4 h-4"></div>
                `}
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 text-sm">${integrante.nome_cidadao}</span>
                        ${integrante.st_responsavel_familiar ?
                            '<span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">Responsável</span>' :
                            ''
                        }
                        ${jaAvaliado ? `
                            ${isHipertenso ? `
                                <span class="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-bold">
                                    <i class="ri-alert-fill"></i>HIPERTENSO
                                </span>
                            ` : `
                                <span class="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded-full text-xs font-bold">
                                    <i class="ri-check-fill"></i>NÃO HIPERTENSO
                                </span>
                            `}
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <span><i class="ri-calendar-line mr-1"></i>${integrante.idade} anos</span>
                        <span><i class="ri-user-line mr-1"></i>${integrante.sexo}</span>
                        ${jaAvaliado && resultado.mapa ? `
                            <span class="${isHipertenso ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}">
                                <i class="ri-pulse-line mr-1"></i>${resultado.mapa.media_pas}×${resultado.mapa.media_pad} mmHg
                            </span>
                        ` : ''}
                    </div>
                    ${jaAvaliado && isHipertenso ? `
                        <div class="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs">
                            <p class="text-red-900 font-semibold"><i class="ri-alert-line mr-1"></i>Encaminhar para HIPERDIA + Inserir CID no PEC</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div>
                ${integrante.tem_diagnostico_hipertensao ?
                    '<span class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Já diagnosticado</span>' :
                    !jaAvaliado ?
                        '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Elegível</span>' :
                        ''
                }
            </div>
        </div>
    `;
}

// Função para expandir/recolher integrantes da família
window.toggleDetalhesFamily = function(idFamilia) {
    const divIntegrantes = document.getElementById(`integrantes-familia-${idFamilia}`);
    const icon = document.getElementById(`icon-familia-${idFamilia}`);
    const text = document.getElementById(`text-familia-${idFamilia}`);

    if (divIntegrantes.classList.contains('hidden')) {
        divIntegrantes.classList.remove('hidden');
        icon.className = 'ri-arrow-up-s-line';
        text.textContent = 'Recolher';
    } else {
        divIntegrantes.classList.add('hidden');
        icon.className = 'ri-arrow-down-s-line';
        text.textContent = 'Expandir';
    }
};

// Função para selecionar/desselecionar família inteira
window.toggleFamilia = function(idFamilia) {
    const familia = estadoApp.familiasDisponiveis.find(f => f.id_familia === idFamilia);
    if (!familia) return;

    const checkbox = document.getElementById(`check-familia-${idFamilia}`);
    const selecionada = checkbox.checked;

    if (selecionada) {
        // Adicionar família à lista de selecionadas
        if (!estadoApp.familiasSelecionadas.some(f => f.id_familia === idFamilia)) {
            estadoApp.familiasSelecionadas.push(familia);
        }

        // Selecionar todos os integrantes elegíveis da família
        familia.integrantes.forEach(integrante => {
            if (!integrante.tem_diagnostico_hipertensao) {
                const jaAdicionado = estadoApp.cidadaosSelecionados.some(c => c.co_seq_cds_cad_individual === integrante.co_seq_cds_cad_individual);
                if (!jaAdicionado) {
                    estadoApp.cidadaosSelecionados.push(integrante);
                }
            }
        });
    } else {
        // Remover família da lista de selecionadas
        estadoApp.familiasSelecionadas = estadoApp.familiasSelecionadas.filter(f => f.id_familia !== idFamilia);

        // Desselecionar todos os integrantes desta família
        familia.integrantes.forEach(integrante => {
            estadoApp.cidadaosSelecionados = estadoApp.cidadaosSelecionados.filter(
                c => c.co_seq_cds_cad_individual !== integrante.co_seq_cds_cad_individual
            );
        });
    }

    // Re-renderizar para atualizar checkboxes dos integrantes
    renderizarStepAtual();
};

function criarCardIntegrante(integrante) {
    const div = document.createElement('div');

    const jaSelecionado = estadoApp.cidadaosSelecionados.some(c => c.co_seq_cds_cad_individual === integrante.co_seq_cds_cad_individual);

    // Verificar se já foi avaliado nesta sessão
    const resultado = estadoApp.resultados[integrante.co_seq_cds_cad_individual];
    const jaAvaliado = !!resultado;
    const isHipertenso = resultado?.mapa?.classificacao === 'HIPERTENSO';

    // Definir estilo do card baseado no status
    let borderClass = 'border-gray-200';
    let bgClass = 'bg-white';

    if (jaAvaliado) {
        if (isHipertenso) {
            borderClass = 'border-red-400';
            bgClass = 'bg-red-50';
        } else {
            borderClass = 'border-green-400';
            bgClass = 'bg-green-50';
        }
    }

    div.className = `border-2 ${borderClass} ${bgClass} rounded-lg p-4 transition-all`;

    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                ${!jaAvaliado || !isHipertenso ? `
                    <input type="checkbox"
                           id="check-${integrante.co_seq_cds_cad_individual}"
                           ${jaSelecionado ? 'checked' : ''}
                           onchange="toggleIntegrante(${integrante.co_seq_cds_cad_individual})"
                           class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500">
                ` : `
                    <div class="w-5 h-5"></div>
                `}
                <div class="flex-1">
                    <div class="flex items-center gap-3">
                        <h4 class="font-medium text-gray-900">${integrante.nome_cidadao}</h4>
                        ${jaAvaliado ? `
                            ${isHipertenso ? `
                                <span class="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                                    <i class="ri-alert-fill"></i>
                                    HIPERTENSO
                                </span>
                            ` : `
                                <span class="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                                    <i class="ri-check-fill"></i>
                                    NÃO HIPERTENSO
                                </span>
                            `}
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span><i class="ri-calendar-line mr-1"></i>${integrante.idade} anos</span>
                        <span><i class="ri-user-line mr-1"></i>${integrante.sexo}</span>
                        ${jaAvaliado && resultado.mapa ? `
                            <span class="${isHipertenso ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}">
                                <i class="ri-pulse-line mr-1"></i>${resultado.mapa.media_pas}×${resultado.mapa.media_pad} mmHg
                            </span>
                        ` : ''}
                    </div>
                    ${jaAvaliado && isHipertenso ? `
                        <div class="mt-2 p-3 bg-red-100 border border-red-300 rounded-md">
                            <p class="text-xs text-red-900 font-semibold">
                                <i class="ri-alert-line mr-1"></i>AÇÃO NECESSÁRIA:
                            </p>
                            <p class="text-xs text-red-800 mt-1">
                                • Encaminhar para o programa <strong>HIPERDIA</strong><br>
                                • Inserir CID no PEC (Prontuário Eletrônico do Cidadão)
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="text-sm flex flex-col items-end gap-2">
                ${integrante.tem_diagnostico_hipertensao ?
                    '<span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Já diagnosticado</span>' :
                    !jaAvaliado ?
                        '<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Elegível</span>' :
                        ''
                }
            </div>
        </div>
    `;

    // Desabilitar checkbox se já diagnosticado OU se foi avaliado como hipertenso
    if (integrante.tem_diagnostico_hipertensao) {
        const checkbox = div.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.disabled = true;
        }
        div.classList.add('opacity-60');
    }

    return div;
}

// Função para selecionar/desselecionar integrante individual
window.toggleIntegrante = function(codIndividual, idFamilia) {
    // Buscar integrante na família
    const familia = estadoApp.familiasDisponiveis.find(f => f.id_familia === idFamilia);
    if (!familia) return;

    const integrante = familia.integrantes.find(i => i.co_seq_cds_cad_individual === codIndividual);
    if (!integrante) return;

    const index = estadoApp.cidadaosSelecionados.findIndex(c => c.co_seq_cds_cad_individual === codIndividual);

    if (index >= 0) {
        // Remover integrante
        estadoApp.cidadaosSelecionados.splice(index, 1);

        // Verificar se ainda há integrantes selecionados desta família
        const integrantesDaFamilia = familia.integrantes.filter(i =>
            estadoApp.cidadaosSelecionados.some(c => c.co_seq_cds_cad_individual === i.co_seq_cds_cad_individual)
        );

        // Se não houver mais nenhum integrante selecionado, desmarcar família
        if (integrantesDaFamilia.length === 0) {
            estadoApp.familiasSelecionadas = estadoApp.familiasSelecionadas.filter(f => f.id_familia !== idFamilia);
            const checkboxFamilia = document.getElementById(`check-familia-${idFamilia}`);
            if (checkboxFamilia) checkboxFamilia.checked = false;
        }
    } else {
        // Adicionar integrante
        estadoApp.cidadaosSelecionados.push(integrante);

        // Garantir que a família está marcada como selecionada
        if (!estadoApp.familiasSelecionadas.some(f => f.id_familia === idFamilia)) {
            estadoApp.familiasSelecionadas.push(familia);
            const checkboxFamilia = document.getElementById(`check-familia-${idFamilia}`);
            if (checkboxFamilia) checkboxFamilia.checked = true;
        }
    }
};

// ============================================================================
// STEP 2: FICHA DE TRIAGEM (GERAÇÃO DE PDF)
// ============================================================================
function renderizarStepFichaTriagem(container) {
    const totalFamilias = estadoApp.familiasSelecionadas.length;
    const totalIntegrantes = estadoApp.cidadaosSelecionados.length;

    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="ri-file-text-line mr-2"></i>Ficha de Triagem Familiar
        </h3>
        <p class="text-sm text-gray-600 mb-6">
            Gere o PDF com as fichas de triagem para impressão. Cada ficha contém espaço para registrar as medições
            domiciliares de pressão arterial dos integrantes selecionados.
        </p>

        <!-- Resumo da Seleção -->
        <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
            <h4 class="font-semibold text-blue-900 mb-3">
                <i class="ri-information-line mr-1"></i>Resumo da Seleção
            </h4>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-white rounded-lg p-3">
                    <div class="text-2xl font-bold text-blue-600">${totalFamilias}</div>
                    <div class="text-xs text-gray-600 mt-1">Família(s) selecionada(s)</div>
                </div>
                <div class="bg-white rounded-lg p-3">
                    <div class="text-2xl font-bold text-green-600">${totalIntegrantes}</div>
                    <div class="text-xs text-gray-600 mt-1">Integrante(s) selecionado(s)</div>
                </div>
                <div class="bg-white rounded-lg p-3">
                    <div class="text-2xl font-bold text-purple-600">${Math.ceil(totalFamilias / 2)}</div>
                    <div class="text-xs text-gray-600 mt-1">Página(s) do PDF</div>
                </div>
            </div>
        </div>

        <!-- Lista de Famílias Selecionadas -->
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h4 class="font-semibold text-gray-900 mb-3">
                <i class="ri-folder-user-line mr-1"></i>Famílias que serão incluídas no PDF:
            </h4>
            <div class="space-y-2">
                ${estadoApp.familiasSelecionadas.map((familia, index) => {
                    const integrantesSelecionados = familia.integrantes.filter(i =>
                        estadoApp.cidadaosSelecionados.some(c => c.co_seq_cds_cad_individual === i.co_seq_cds_cad_individual)
                    );
                    const status = obterStatusTriagemFamilia(familia.id_familia);
                    const iconeStatus = obterIconeStatusTriagem(status);
                    const corStatus = obterCorStatusTriagem(status);

                    return `
                        <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium text-gray-900">${index + 1}. ${familia.nome_responsavel_familiar}</span>
                                        <span class="${corStatus} px-2 py-0.5 rounded-full text-xs font-semibold">
                                            <i class="${iconeStatus} mr-1"></i>${status.toUpperCase().replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-600 mt-1">
                                        <i class="ri-map-pin-line mr-1"></i>${familia.domicilio?.endereco_completo}
                                    </div>
                                    <div class="text-xs text-gray-600 mt-1">
                                        ${integrantesSelecionados.length} integrante(s): ${integrantesSelecionados.map(i => i.nome_cidadao).join(', ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Botão de Gerar PDF -->
        <div class="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-6 text-center">
            <button onclick="gerarPDFTriagem()"
                    class="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-lg shadow-lg transition-all transform hover:scale-105">
                <i class="ri-file-pdf-line mr-2 text-xl"></i>
                Gerar PDF de Triagem Domiciliar
            </button>
            <p class="text-sm text-gray-700 mt-3">
                <i class="ri-information-line mr-1"></i>
                O PDF será gerado com <strong>paginação automática</strong> (nenhuma família será dividida entre páginas)
                e incluirá <strong>2 linhas extras</strong> em cada tabela para integrantes não cadastrados
            </p>
        </div>
    `;
}

// Funções auxiliares para status de triagem
function obterStatusTriagemFamilia(idFamilia) {
    return estadoApp.statusTriagemFamilias[idFamilia] || 'nao_triada';
}

function obterIconeStatusTriagem(status) {
    const icones = {
        'nao_triada': 'ri-file-list-line',
        'iniciada': 'ri-time-line',
        'incompleta': 'ri-error-warning-line',
        'concluida': 'ri-check-double-line'
    };
    return icones[status] || 'ri-file-list-line';
}

function obterCorStatusTriagem(status) {
    const cores = {
        'nao_triada': 'bg-gray-100 text-gray-700',
        'iniciada': 'bg-blue-100 text-blue-700',
        'incompleta': 'bg-yellow-100 text-yellow-700',
        'concluida': 'bg-green-100 text-green-700'
    };
    return cores[status] || 'bg-gray-100 text-gray-700';
}

// Função para calcular altura necessária para uma família no PDF
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

// Função para gerar PDF de triagem com paginação dinâmica
window.gerarPDFTriagem = async function() {
    mostrarNotificacao('Gerando PDF de triagem...', 'info');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const ALTURA_PAGINA = doc.internal.pageSize.height;
        const MARGEM_SUPERIOR = 20;
        const MARGEM_INFERIOR = 10;
        const ESPACAMENTO_ENTRE_FAMILIAS = 5;
        const ALTURA_TITULO_PAGINA = 10; // Para o título "TRIAGEM DOMICILIAR..."

        const alturaDisponivel = ALTURA_PAGINA - MARGEM_SUPERIOR - MARGEM_INFERIOR;

        let yAtual = MARGEM_SUPERIOR;
        let primeiraPagina = true;
        let primeiraFamiliaDaPagina = true;

        for (let i = 0; i < estadoApp.familiasSelecionadas.length; i++) {
            const familia = estadoApp.familiasSelecionadas[i];
            const alturaFamilia = calcularAlturaFamilia(familia);

            // Adicionar espaço para título da página se for a primeira família da página
            const alturaComTitulo = primeiraFamiliaDaPagina ? alturaFamilia + ALTURA_TITULO_PAGINA : alturaFamilia;

            // Verificar se a família cabe na página atual
            const espacoNecessario = primeiraFamiliaDaPagina ? alturaComTitulo : alturaFamilia + ESPACAMENTO_ENTRE_FAMILIAS;

            if ((yAtual + espacoNecessario) > (ALTURA_PAGINA - MARGEM_INFERIOR)) {
                // Não cabe na página atual, criar nova página
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

            // Atualizar posição Y
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

        // Re-renderizar para mostrar novos status
        renderizarStepAtual();

        mostrarNotificacao('PDF gerado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        mostrarNotificacao('Erro ao gerar PDF. Verifique se o jsPDF está carregado.', 'error');
    }
};

function renderizarFamiliaNoPDF(doc, familia, yInicial, primeiraFamiliaDaPagina = true) {
    const margemEsquerda = 10;
    const larguraPagina = doc.internal.pageSize.width;

    let yAtual = yInicial;

    // Se for a primeira família da página, adicionar título geral
    if (primeiraFamiliaDaPagina) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Texto preto
        doc.text('TRIAGEM DOMICILIAR - RASTREAMENTO DE HIPERTENSÃO ARTERIAL', larguraPagina / 2, yAtual, { align: 'center' });
        yAtual += 10; // Espaço após o título
    }

    // Cabeçalho da instrução (ALTERADO: fundo branco com texto vermelho)
    doc.setFillColor(255, 255, 255); // Fundo branco
    doc.setDrawColor(220, 53, 69); // Borda vermelha
    doc.setLineWidth(0.5);
    doc.rect(margemEsquerda, yAtual, larguraPagina - 20, 12, 'FD'); // F=Fill, D=Draw border

    doc.setTextColor(220, 53, 69); // Texto vermelho
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    let yTexto = yAtual + 4;
    doc.text('AFERIR A PRESSÃO ARTERIAL DOS MORADORES COM MAIS DE 20 ANOS DE IDADE', larguraPagina / 2, yTexto, { align: 'center' });
    yTexto += 3;
    doc.text('01 VEZ POR DIA POR 05 (CINCO) DIAS', larguraPagina / 2, yTexto, { align: 'center' });
    yTexto += 3;
    doc.text('DE MANHÃ EM JEJUM OU A NOITE ANTES DO JANTAR (NÃO ESCREVER 12X8, USAR 120X80)', larguraPagina / 2, yTexto, { align: 'center' });

    // Título da família (amarelo)
    const yTituloFamilia = yAtual + 13;
    doc.setFillColor(255, 235, 59); // Amarelo
    doc.setDrawColor(0, 0, 0); // Borda preta
    doc.rect(margemEsquerda, yTituloFamilia, larguraPagina - 20, 7, 'FD');

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

    // Desenhar tabela
    const yTabela = yTituloFamilia + 7;
    const larguraColunaCidadao = 90;
    const larguraColunaDia = 19;
    const alturaLinha = 7;

    let yLinha = yTabela;

    // Resetar cor do texto para preto (para a tabela)
    doc.setTextColor(0, 0, 0);
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

// ============================================================================
// VALIDAÇÃO DE STEPS
// ============================================================================
function validarStepAtual() {
    switch (estadoApp.currentStep) {
        case FASES.SELECAO_INTEGRANTES:
            if (estadoApp.cidadaosSelecionados.length === 0) {
                mostrarNotificacao('Selecione pelo menos um integrante para rastreamento', 'warning');
                return false;
            }
            return true;

        case FASES.FICHA_TRIAGEM:
            // Validação do Step 2: Ficha de Triagem
            // Não exige que PDF seja gerado para avançar
            return true;

        case FASES.AFERICOES_MRPA:
            // Validar se todas as aferições foram registradas
            return validarAfericoesMRPA();

        case FASES.ANALISE_MRPA:
            return true;

        case FASES.AFERICOES_MAPA:
            return validarAfericoesMAPA();

        default:
            return true;
    }
}

function validarAfericoesMRPA() {
    // Verificar se todos os cidadãos selecionados têm dados válidos
    for (const cidadao of estadoApp.cidadaosSelecionados) {
        const dados = estadoApp.afericoesMRPA[cidadao.co_seq_cds_cad_individual];

        if (!dados) {
            mostrarNotificacao(
                `${cidadao.nome_cidadao} não tem dados de triagem registrados`,
                'warning'
            );
            return false;
        }

        const tipoEntrada = dados.tipo || 'individual';

        if (tipoEntrada === 'individual') {
            // Verificar se tem pelo menos 3 aferições (em qualquer combinação de dias)
            const afericoes = dados.afericoes || [];
            if (afericoes.length < 3) {
                mostrarNotificacao(
                    `${cidadao.nome_cidadao} precisa de pelo menos 3 aferições registradas`,
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

function validarAfericoesMAPA() {
    // Se não há cidadãos suspeitos, pula a validação
    if (!estadoApp.cidadaosSuspeitos || estadoApp.cidadaosSuspeitos.length === 0) {
        return true;
    }

    // Verificar se todos os suspeitos têm MRPA 5 dias registrado
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

// ============================================================================
// UTILIDADES
// ============================================================================
function mostrarLoading(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle('hidden', !show);
    }
}

window.mostrarNotificacao = function(mensagem, tipo = 'info') {
    const cores = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const notificacao = document.createElement('div');
    notificacao.className = `fixed top-4 right-4 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    notificacao.innerHTML = `
        <div class="flex items-center gap-2">
            <span>${mensagem}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="ri-close-line"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.remove();
    }, 5000);
};

async function finalizarRastreamento() {
    // Salvar resultados no estado global para manter histórico
    estadoApp.integrantesDisponiveis = estadoApp.integrantesDisponiveis.map(integrante => {
        const resultado = estadoApp.resultados[integrante.co_seq_cds_cad_individual];
        if (resultado) {
            return {
                ...integrante,
                resultado_rastreamento: resultado
            };
        }
        return integrante;
    });

    // Resetar seleções mas manter histórico de resultados
    estadoApp.cidadaosSelecionados = [];
    estadoApp.cidadaosSuspeitos = [];
    estadoApp.cidadaosNormais = [];
    estadoApp.afericoesMRPA = {};
    estadoApp.afericoesMAPA = {};

    // NÃO limpar estadoApp.resultados - mantém histórico

    // Voltar para a tela de seleção de integrantes
    irParaStep(1);

    mostrarNotificacao('Avaliação concluída! Selecione outro integrante ou finalize o atendimento.', 'success');
}

