/**
 * ============================================================================
 * DASHBOARD DE ACOMPANHAMENTO - RASTREAMENTO CARDIOVASCULAR
 * ============================================================================
 * Gerencia a visualização dos domicílios em triagem, triados e hipertensos
 */

// ============================================================================
// CARREGAMENTO DO DASHBOARD
// ============================================================================
async function carregarDashboardAcompanhamento() {
    try {
        // Buscar dados do dashboard
        const response = await fetch('/api/rastreamento/dashboard');
        const data = await response.json();

        if (data.success) {
            renderizarDashboard(data.dashboard);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        // Renderizar dashboard vazio em caso de erro
        renderizarDashboard({
            em_triagem: [],
            triados: [],
            hipertensos: []
        });
    }
}

// ============================================================================
// RENDERIZAÇÃO DO DASHBOARD
// ============================================================================
function renderizarDashboard(dashboard) {
    renderizarEmTriagem(dashboard.em_triagem || []);
    renderizarTriados(dashboard.triados || []);
    renderizarHipertensos(dashboard.hipertensos || []);
}

// ============================================================================
// DOMICÍLIOS EM TRIAGEM
// ============================================================================
function renderizarEmTriagem(domicilios) {
    const container = document.getElementById('lista-em-triagem');
    const countElement = document.getElementById('count-em-triagem');

    countElement.textContent = domicilios.length;

    if (domicilios.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-gray-400 text-center py-4">
                Nenhum domicílio em triagem
            </div>
        `;
        return;
    }

    container.innerHTML = domicilios.map(dom => `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
             onclick="acessarTriagem(${dom.id_domicilio})">
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-blue-900 text-sm truncate">${dom.endereco}</h5>
                    <div class="flex items-center gap-2 mt-1 text-xs text-blue-700">
                        <span><i class="ri-group-line mr-1"></i>${dom.total_familias} fam.</span>
                        <span><i class="ri-user-line mr-1"></i>${dom.total_integrantes} int.</span>
                    </div>
                    <div class="mt-2">
                        <div class="w-full bg-blue-200 rounded-full h-1.5">
                            <div class="bg-blue-600 h-1.5 rounded-full transition-all"
                                 style="width: ${dom.progresso}%"></div>
                        </div>
                        <p class="text-xs text-blue-600 mt-1">${dom.progresso}% completo</p>
                    </div>
                </div>
                <button class="text-blue-600 hover:text-blue-800">
                    <i class="ri-arrow-right-s-line text-lg"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================================
// DOMICÍLIOS TRIADOS
// ============================================================================
function renderizarTriados(domicilios) {
    const container = document.getElementById('lista-triados');
    const countElement = document.getElementById('count-triados');

    countElement.textContent = domicilios.length;

    if (domicilios.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-gray-400 text-center py-4">
                Nenhum domicílio triado
            </div>
        `;
        return;
    }

    container.innerHTML = domicilios.map(dom => `
        <div class="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition-colors"
             onclick="verResultados(${dom.id_domicilio})">
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-green-900 text-sm truncate">${dom.endereco}</h5>
                    <div class="flex items-center gap-2 mt-1 text-xs text-green-700">
                        <span><i class="ri-group-line mr-1"></i>${dom.total_familias} fam.</span>
                        <span><i class="ri-user-line mr-1"></i>${dom.total_triados} triados</span>
                    </div>
                    <div class="flex items-center gap-2 mt-2 text-xs">
                        <span class="px-2 py-0.5 bg-green-600 text-white rounded-full">
                            <i class="ri-check-line mr-1"></i>${dom.normais} normais
                        </span>
                        ${dom.hipertensos > 0 ? `
                            <span class="px-2 py-0.5 bg-red-600 text-white rounded-full">
                                <i class="ri-alert-line mr-1"></i>${dom.hipertensos} hipertensos
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        <i class="ri-calendar-line mr-1"></i>Concluído em ${formatarData(dom.data_conclusao)}
                    </p>
                </div>
                <button class="text-green-600 hover:text-green-800">
                    <i class="ri-eye-line text-lg"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================================
// HIPERTENSOS DIAGNOSTICADOS
// ============================================================================
function renderizarHipertensos(cidadaos) {
    const container = document.getElementById('lista-hipertensos');
    const countElement = document.getElementById('count-hipertensos');

    countElement.textContent = cidadaos.length;

    if (cidadaos.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-gray-400 text-center py-4">
                Nenhum caso diagnosticado
            </div>
        `;
        return;
    }

    container.innerHTML = cidadaos.map(cidadao => `
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors"
             onclick="verDetalhesCidadao(${cidadao.co_seq_cds_cad_individual})">
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-red-900 text-sm truncate">${cidadao.nome}</h5>
                    <div class="flex items-center gap-2 mt-1 text-xs text-red-700">
                        <span><i class="ri-calendar-line mr-1"></i>${cidadao.idade} anos</span>
                        <span><i class="ri-user-line mr-1"></i>${cidadao.sexo}</span>
                    </div>
                    <div class="mt-2 flex items-center gap-2 text-xs">
                        <span class="px-2 py-0.5 bg-red-600 text-white rounded-full font-semibold">
                            <i class="ri-pulse-line mr-1"></i>${cidadao.pas}×${cidadao.pad} mmHg
                        </span>
                        ${cidadao.encaminhado_hiperdia ? `
                            <span class="px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs">
                                <i class="ri-checkbox-circle-line mr-1"></i>Encaminhado
                            </span>
                        ` : `
                            <span class="px-2 py-0.5 bg-yellow-600 text-white rounded-full text-xs animate-pulse">
                                <i class="ri-error-warning-line mr-1"></i>Pendente
                            </span>
                        `}
                    </div>
                    <p class="text-xs text-gray-600 mt-1 truncate">
                        <i class="ri-map-pin-line mr-1"></i>${cidadao.endereco}
                    </p>
                </div>
                <button class="text-red-600 hover:text-red-800">
                    <i class="ri-arrow-right-s-line text-lg"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================================
// FUNÇÕES DE ACESSO RÁPIDO
// ============================================================================
window.acessarTriagem = function(idDomicilio) {
    // TODO: Implementar acesso rápido à triagem em andamento
    mostrarNotificacao('Carregando triagem em andamento...', 'info');
    console.log('Acessar triagem do domicílio:', idDomicilio);

    // Futuramente: carregar dados da triagem e voltar ao passo correto
};

window.verResultados = function(idDomicilio) {
    // TODO: Implementar visualização de resultados de domicílio triado
    mostrarNotificacao('Carregando resultados da triagem...', 'info');
    console.log('Ver resultados do domicílio:', idDomicilio);

    // Futuramente: abrir modal ou página com resultados completos
};

window.verDetalhesCidadao = function(coSeqCadIndividual) {
    // TODO: Implementar visualização de detalhes do cidadão hipertenso
    mostrarNotificacao('Carregando detalhes do cidadão...', 'info');
    console.log('Ver detalhes do cidadão:', coSeqCadIndividual);

    // Futuramente: abrir modal com dados completos e opções de encaminhamento
};

// ============================================================================
// UTILIDADES
// ============================================================================
function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Exportar função global
window.carregarDashboardAcompanhamento = carregarDashboardAcompanhamento;
