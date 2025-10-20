/**
 * ============================================================================
 * DASHBOARD DE ACOMPANHAMENTO - RASTREAMENTO CARDIOVASCULAR
 * ============================================================================
 * Gerencia a visualização das 6 categorias de rastreamento:
 * 1. Sem Triagem
 * 2. Em Triagem
 * 3. Família - Triagem Completa
 * 4. Família - Triagem Incompleta
 * 5. Não Hipertensos
 * 6. Hipertensos
 */

// Estado global do dashboard
window.estadoDashboard = {
    abaAtiva: 'sem-triagem',
    filtros: {
        equipe: '',
        microarea: '',
        busca: ''
    },
    paginaAtual: 1,
    dados: null,
    paginacao: null,
    // NOVO: Carrinho de triagem
    carrinhoTriagem: []  // Array de { id_familia, nome_responsavel, endereco, integrantes: [] }
};

// ============================================================================
// CARREGAMENTO DO DASHBOARD
// ============================================================================
async function carregarDashboardAcompanhamento() {
    console.log('>>> Iniciando carregamento do dashboard...'); // DEBUG

    try {
        // Buscar dados do dashboard com filtros e paginação
        const params = new URLSearchParams({
            ...window.estadoDashboard.filtros,
            pagina: window.estadoDashboard.paginaAtual,
            aba: window.estadoDashboard.abaAtiva
        });
        const url = `/api/rastreamento/dashboard?${params}`;

        console.log('>>> URL da requisição:', url); // DEBUG

        const response = await fetch(url);

        console.log('>>> Response status:', response.status); // DEBUG

        const data = await response.json();

        console.log('>>> Dashboard recebido:', data); // DEBUG
        console.log('>>> data.success:', data.success); // DEBUG

        if (data.success) {
            window.estadoDashboard.dados = data.dashboard;
            window.estadoDashboard.paginacao = data.dashboard.paginacao;
            console.log('>>> Sem triagem:', data.dashboard.sem_triagem); // DEBUG
            console.log('>>> Total sem triagem:', data.dashboard.contadores.sem_triagem); // DEBUG
            console.log('>>> Paginação:', data.dashboard.paginacao); // DEBUG
            console.log('>>> Chamando renderizarDashboard...'); // DEBUG
            renderizarDashboard(data.dashboard);
            console.log('>>> renderizarDashboard concluído'); // DEBUG
        } else {
            console.error('>>> Erro ao carregar dashboard:', data.message);
            renderizarDashboardVazio();
        }
    } catch (error) {
        console.error('>>> Erro ao carregar dashboard:', error);
        renderizarDashboardVazio();
    }
}

// ============================================================================
// SELEÇÃO DE ABAS
// ============================================================================
window.selecionarAba = function(nomeAba) {
    console.log(`>>> selecionarAba chamada com: ${nomeAba}`);

    // Atualizar estado global
    window.estadoDashboard.abaAtiva = nomeAba;
    window.estadoDashboard.paginaAtual = 1; // Resetar para página 1

    // Atualizar estilo dos botões de aba
    document.querySelectorAll('.aba-btn').forEach(btn => {
        const btnAba = btn.getAttribute('data-aba');
        if (btnAba === nomeAba) {
            btn.classList.add('active');
            btn.classList.add('bg-blue-500', 'text-white');
            btn.classList.remove('bg-gray-100', 'text-gray-600');
        } else {
            btn.classList.remove('active');
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-600');
        }
    });

    // Mostrar/ocultar conteúdo das abas
    document.querySelectorAll('.aba-conteudo').forEach(div => {
        div.classList.add('hidden');
    });

    const abaConteudo = document.getElementById(`aba-${nomeAba}`);
    if (abaConteudo) {
        abaConteudo.classList.remove('hidden');
    }

    // Recarregar dados da aba selecionada
    carregarDashboardAcompanhamento();
}

// ============================================================================
// RENDERIZAÇÃO DOS CONTADORES
// ============================================================================
function renderizarDashboard(dashboard) {
    // Atualizar contadores DOS CARDS (sempre sem busca, apenas equipe/microárea)
    document.getElementById('count-sem-triagem').textContent = dashboard.contadores?.sem_triagem || 0;
    document.getElementById('count-em-triagem').textContent = dashboard.contadores?.em_triagem || 0;
    document.getElementById('count-triagem-completa').textContent = dashboard.contadores?.triagem_completa || 0;
    document.getElementById('count-triagem-incompleta').textContent = dashboard.contadores?.triagem_incompleta || 0;
    document.getElementById('count-nao-hipertensos').textContent = dashboard.contadores?.nao_hipertensos || 0;
    document.getElementById('count-hipertensos').textContent = dashboard.contadores?.hipertensos || 0;

    // Atualizar contadores DAS ABAS (com busca, se houver)
    if (dashboard.tem_busca && dashboard.contadores_abas) {
        // Quando há busca, mostrar contadores filtrados nas abas
        atualizarContadoresAbas(dashboard.contadores_abas);
    } else {
        // Sem busca, as abas usam os mesmos contadores dos cards
        atualizarContadoresAbas(dashboard.contadores);
    }

    // Renderizar conteúdo da aba ativa
    renderizarConteudoAba(window.estadoDashboard.abaAtiva, dashboard);
}

function atualizarContadoresAbas(contadores) {
    // Atualizar os números nos botões das abas
    const btnSemTriagem = document.querySelector('.aba-btn[data-aba="sem-triagem"]');
    const btnEmTriagem = document.querySelector('.aba-btn[data-aba="em-triagem"]');
    const btnTriagemCompleta = document.querySelector('.aba-btn[data-aba="triagem-completa"]');
    const btnTriagemIncompleta = document.querySelector('.aba-btn[data-aba="triagem-incompleta"]');
    const btnNaoHipertensos = document.querySelector('.aba-btn[data-aba="nao-hipertensos"]');
    const btnHipertensos = document.querySelector('.aba-btn[data-aba="hipertensos"]');

    if (btnSemTriagem) {
        const countSpan = btnSemTriagem.querySelector('.count-aba');
        if (countSpan) countSpan.textContent = `(${contadores.sem_triagem || 0})`;
    }
    if (btnEmTriagem) {
        const countSpan = btnEmTriagem.querySelector('.count-aba');
        if (countSpan) countSpan.textContent = `(${contadores.em_triagem || 0})`;
    }
    if (btnTriagemCompleta) {
        const countSpan = btnTriagemCompleta.querySelector('.count-aba');
        if (countSpan) countSpan.textContent = `(${contadores.triagem_completa || 0})`;
    }
    if (btnTriagemIncompleta) {
        const countSpan = btnTriagemIncompleta.querySelector('.count-aba');
        if (countSpan) countSpan.textContent = `(${contadores.triagem_incompleta || 0})`;
    }
    if (btnNaoHipertensos) {
        const countSpan = btnNaoHipertensos.querySelector('.count-aba');
        if (countSpan) countSpan.textContent = `(${contadores.nao_hipertensos || 0})`;
    }
    if (btnHipertensos) {
        const countSpan = btnHipertensos.querySelector('.count-aba');
        if (countSpan) countSpan.textContent = `(${contadores.hipertensos || 0})`;
    }
}

function renderizarDashboardVazio() {
    // Zerar todos os contadores
    document.getElementById('count-sem-triagem').textContent = '0';
    document.getElementById('count-em-triagem').textContent = '0';
    document.getElementById('count-triagem-completa').textContent = '0';
    document.getElementById('count-triagem-incompleta').textContent = '0';
    document.getElementById('count-nao-hipertensos').textContent = '0';
    document.getElementById('count-hipertensos').textContent = '0';

    // Mostrar mensagens vazias em todas as abas
    const abas = ['sem-triagem', 'em-triagem', 'triagem-completa', 'triagem-incompleta', 'nao-hipertensos', 'hipertensos'];
    abas.forEach(aba => {
        const container = document.getElementById(`aba-${aba}`);
        if (container) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhum dado disponível</p>';
        }
    });
}

// ============================================================================
// SISTEMA DE ABAS
// ============================================================================

// Event listeners para os botões das abas
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const nomeAba = btn.getAttribute('data-aba');
            selecionarAba(nomeAba);
        });
    });
});

// ============================================================================
// RENDERIZAÇÃO DO CONTEÚDO DE CADA ABA
// ============================================================================
function renderizarConteudoAba(nomeAba, dashboard) {
    switch (nomeAba) {
        case 'sem-triagem':
            renderizarSemTriagem(dashboard.sem_triagem || []);
            break;
        case 'em-triagem':
            renderizarEmTriagem(dashboard.em_triagem || []);
            break;
        case 'triagem-completa':
            renderizarTriagemCompleta(dashboard.triagem_completa || []);
            break;
        case 'triagem-incompleta':
            renderizarTriagemIncompleta(dashboard.triagem_incompleta || []);
            break;
        case 'nao-hipertensos':
            renderizarNaoHipertensos(dashboard.nao_hipertensos || []);
            break;
        case 'hipertensos':
            renderizarHipertensos(dashboard.hipertensos || []);
            break;
    }
}

// ============================================================================
// ABA: SEM TRIAGEM
// ============================================================================
function renderizarSemTriagem(familias) {
    console.log('>>> renderizarSemTriagem chamada com', familias.length, 'famílias'); // DEBUG
    const container = document.getElementById('aba-sem-triagem');
    console.log('>>> Container encontrado:', container); // DEBUG

    if (familias.length === 0) {
        console.log('>>> Nenhuma família, mostrando mensagem vazia'); // DEBUG
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhuma família sem triagem</p>';
        return;
    }

    console.log('>>> Renderizando', familias.length, 'cards de família'); // DEBUG

    const paginacaoHTML = renderizarControlesPaginacao();

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            ${familias.map(familia => {
                const jaNoCarrinho = window.estadoDashboard.carrinhoTriagem.some(f => f.id_familia === familia.id_familia);
                return `
                <div class="border ${jaNoCarrinho ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                     onclick="abrirModalSelecaoIntegrantes(${familia.id_familia})">
                    ${jaNoCarrinho ? '<span class="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded"><i class="ri-check-line"></i> Selecionada</span>' : ''}
                    <h5 class="font-semibold text-gray-900 mb-2">${familia.nome_responsavel}</h5>
                    <p class="text-sm text-gray-600 mb-2">
                        <i class="ri-map-pin-line mr-1"></i>${familia.endereco}
                    </p>
                    <div class="flex items-center gap-3 text-xs text-gray-500">
                        <span><i class="ri-home-line mr-1"></i>Microárea: ${familia.microarea}</span>
                        <span><i class="ri-group-line mr-1"></i>${familia.total_integrantes} int.</span>
                    </div>
                    <button class="mt-3 w-full ${jaNoCarrinho ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'} hover:bg-blue-600 px-3 py-2 rounded text-sm">
                        <i class="ri-user-add-line mr-1"></i>${jaNoCarrinho ? 'Editar Seleção' : 'Selecionar Integrantes'}
                    </button>
                </div>
            `;
            }).join('')}
        </div>
        ${paginacaoHTML}
    `;
    console.log('>>> HTML renderizado com sucesso'); // DEBUG
}

// ============================================================================
// ABA: EM TRIAGEM
// ============================================================================
function renderizarEmTriagem(familias) {
    const container = document.getElementById('aba-em-triagem');

    if (familias.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhuma família em triagem</p>';
        return;
    }

    // Inicializar seleção se não existir
    if (!window.familiasSelecionadasPDF) {
        window.familiasSelecionadasPDF = new Set();
    }

    const paginacaoHTML = renderizarControlesPaginacao();

    container.innerHTML = `
        <!-- Controles de Seleção e PDF -->
        <div class="mb-4 flex justify-between items-center">
            <div class="flex gap-2 items-center">
                <button onclick="selecionarTodasFamiliasPDF()"
                        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm">
                    <i class="ri-checkbox-multiple-line mr-1"></i>Selecionar Todas
                </button>
                <button onclick="deselecionarTodasFamiliasPDF()"
                        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm">
                    <i class="ri-checkbox-blank-line mr-1"></i>Limpar Seleção
                </button>
                <span class="text-sm text-gray-600" id="contador-selecao">
                    <i class="ri-file-list-line mr-1"></i>
                    <span id="num-selecionadas">0</span> família(s) selecionada(s)
                </span>
            </div>
            <button onclick="gerarPDFTriagem()" id="btn-gerar-pdf"
                    class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled>
                <i class="ri-file-pdf-line text-xl"></i>
                Gerar PDF (<span id="pdf-count">0</span>)
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            ${familias.map(familia => {
                const total = familia.total_integrantes || 0;
                const finalizados = familia.total_finalizados || 0;
                const progresso = total > 0 ? Math.round((finalizados / total) * 100) : 0;
                const isSelected = window.familiasSelecionadasPDF.has(familia.cod_seq_rastreamento_familia);

                return `
                <div class="border border-blue-200 bg-blue-50 rounded-lg p-4 hover:shadow-md transition-shadow relative ${isSelected ? 'ring-2 ring-blue-500' : ''}"
                     data-familia-id="${familia.cod_seq_rastreamento_familia}">
                    <!-- Checkbox de seleção -->
                    <div class="absolute top-2 right-2">
                        <input type="checkbox"
                               class="w-5 h-5 cursor-pointer checkbox-familia-pdf"
                               data-familia-id="${familia.cod_seq_rastreamento_familia}"
                               ${isSelected ? 'checked' : ''}
                               onchange="toggleFamiliaPDF(${familia.cod_seq_rastreamento_familia})"
                               onclick="event.stopPropagation()">
                    </div>

                    <div onclick="continuarTriagemFamilia(${familia.cod_seq_rastreamento_familia})" class="cursor-pointer">
                        <h5 class="font-semibold text-blue-900 mb-2 pr-8">${familia.nome_responsavel}</h5>
                        <p class="text-sm text-blue-700 mb-2">
                            <i class="ri-map-pin-line mr-1"></i>${familia.endereco}
                        </p>
                        <div class="flex items-center gap-3 text-xs text-blue-600 mb-2">
                            <span><i class="ri-home-line mr-1"></i>Microárea: ${familia.microarea}</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-blue-600 mb-2">
                            <span><i class="ri-group-line mr-1"></i>${total} integrante${total !== 1 ? 's' : ''}</span>
                            <span><i class="ri-checkbox-line mr-1"></i>${finalizados} finalizado${finalizados !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="w-full bg-blue-200 rounded-full h-2 mb-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${progresso}%"></div>
                        </div>
                        <p class="text-xs text-blue-600 mb-3">${progresso}% completo</p>
                        <button class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
                            <i class="ri-play-line mr-1"></i>Continuar Triagem
                        </button>
                    </div>
                </div>
            `;
            }).join('')}
        </div>
        ${paginacaoHTML}
    `;
}

// ============================================================================
// ABA: TRIAGEM COMPLETA
// ============================================================================
function renderizarTriagemCompleta(familias) {
    const container = document.getElementById('aba-triagem-completa');

    if (familias.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhuma família com triagem completa</p>';
        return;
    }

    const paginacaoHTML = renderizarControlesPaginacao();

    container.innerHTML = `
        ${paginacaoHTML}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            ${familias.map(familia => {
                const normais = (familia.total_triados || 0) - (familia.total_hipertensos || 0);
                return `
                <div class="border border-green-200 bg-green-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     onclick="verResultadosFamilia(${familia.cod_seq_rastreamento_familia})">
                    <div class="flex items-start justify-between mb-2">
                        <h5 class="font-semibold text-green-900">${familia.nome_responsavel}</h5>
                        <i class="ri-checkbox-circle-fill text-green-600 text-xl"></i>
                    </div>
                    <p class="text-sm text-green-700 mb-2">
                        <i class="ri-map-pin-line mr-1"></i>${familia.endereco}
                    </p>
                    <div class="flex items-center justify-between text-xs text-green-700 mb-2">
                        <span><i class="ri-team-line mr-1"></i>${familia.equipe}</span>
                        <span>Micro: ${familia.microarea}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-3">
                        <span class="px-2 py-1 bg-green-600 text-white rounded text-xs">
                            <i class="ri-user-smile-line mr-1"></i>${normais} normais
                        </span>
                        ${familia.total_hipertensos > 0 ? `
                            <span class="px-2 py-1 bg-red-600 text-white rounded text-xs">
                                <i class="ri-alert-line mr-1"></i>${familia.total_hipertensos} hipert.
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                        <i class="ri-calendar-line mr-1"></i>Iniciado: ${formatarData(familia.data_inicio_rastreamento)}
                    </p>
                </div>
                `;
            }).join('')}
        </div>
        ${paginacaoHTML}
    `;
}

// ============================================================================
// ABA: TRIAGEM INCOMPLETA
// ============================================================================
function renderizarTriagemIncompleta(familias) {
    const container = document.getElementById('aba-triagem-incompleta');

    if (familias.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhuma família com triagem incompleta</p>';
        return;
    }

    const paginacaoHTML = renderizarControlesPaginacao();

    container.innerHTML = `
        ${paginacaoHTML}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            ${familias.map(familia => {
                const totalTriados = familia.total_triados || 0;
                const totalIntegrantes = familia.total_integrantes || 0;
                const naoTriados = totalIntegrantes - totalTriados;
                const percentual = totalIntegrantes > 0 ? Math.round((totalTriados / totalIntegrantes) * 100) : 0;
                const normais = totalTriados - (familia.total_hipertensos || 0);

                return `
                <div class="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     onclick="verResultadosFamilia(${familia.cod_seq_rastreamento_familia})">
                        <div class="flex items-start justify-between mb-2">
                            <h5 class="font-semibold text-yellow-900 pr-8">${familia.nome_responsavel}</h5>
                            <i class="ri-error-warning-line text-yellow-600 text-xl"></i>
                        </div>
                        <p class="text-sm text-yellow-700 mb-2">
                            <i class="ri-map-pin-line mr-1"></i>${familia.endereco}
                        </p>
                        <div class="flex items-center justify-between text-xs text-yellow-700 mb-2">
                            <span><i class="ri-team-line mr-1"></i>${familia.equipe}</span>
                            <span>Micro: ${familia.microarea}</span>
                        </div>
                        <div class="mb-2">
                            <div class="flex justify-between text-xs text-yellow-700 mb-1">
                                <span>${totalTriados} de ${totalIntegrantes} triados</span>
                                <span>${percentual}%</span>
                            </div>
                            <div class="w-full bg-yellow-200 rounded-full h-2">
                                <div class="bg-yellow-600 h-2 rounded-full transition-all" style="width: ${percentual}%"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap mt-3">
                            ${normais > 0 ? `
                                <span class="px-2 py-1 bg-teal-600 text-white rounded text-xs">
                                    <i class="ri-user-smile-line mr-1"></i>${normais} normais
                                </span>
                            ` : ''}
                            ${familia.total_hipertensos > 0 ? `
                                <span class="px-2 py-1 bg-red-600 text-white rounded text-xs">
                                    <i class="ri-alert-line mr-1"></i>${familia.total_hipertensos} hipert.
                                </span>
                            ` : ''}
                            ${naoTriados > 0 ? `
                                <span class="px-2 py-1 bg-gray-500 text-white rounded text-xs">
                                    <i class="ri-close-line mr-1"></i>${naoTriados} pendentes
                                </span>
                            ` : ''}
                        </div>
                        <p class="text-xs text-gray-500 mt-2">
                            <i class="ri-calendar-line mr-1"></i>Iniciado: ${formatarData(familia.data_inicio_rastreamento)}
                        </p>
                </div>
                `;
            }).join('')}
        </div>
        ${paginacaoHTML}
    `;
}

// ============================================================================
// ABA: NÃO HIPERTENSOS (PACIENTES)
// ============================================================================
function renderizarNaoHipertensos(pacientes) {
    const container = document.getElementById('aba-nao-hipertensos');

    if (pacientes.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhum paciente não hipertenso</p>';
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${pacientes.map(paciente => `
                <div class="border border-teal-200 bg-teal-50 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h5 class="font-semibold text-teal-900 text-sm">${paciente.nome}</h5>
                            <div class="flex items-center gap-3 text-xs text-teal-700 mt-1">
                                <span><i class="ri-calendar-line mr-1"></i>${paciente.idade} anos</span>
                                <span><i class="ri-user-line mr-1"></i>${paciente.sexo}</span>
                            </div>
                            <div class="mt-2">
                                <span class="px-2 py-1 bg-teal-600 text-white rounded text-xs font-semibold">
                                    <i class="ri-pulse-line mr-1"></i>${paciente.pas}×${paciente.pad} mmHg
                                </span>
                            </div>
                            <p class="text-xs text-gray-600 mt-2">
                                <i class="ri-map-pin-line mr-1"></i>${paciente.endereco}
                            </p>
                        </div>
                        <i class="ri-user-smile-fill text-teal-600 text-2xl"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================================
// ABA: HIPERTENSOS (PACIENTES)
// ============================================================================
function renderizarHipertensos(pacientes) {
    const container = document.getElementById('aba-hipertensos');

    if (pacientes.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhum paciente hipertenso</p>';
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${pacientes.map(paciente => `
                <div class="border border-red-200 bg-red-50 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                     onclick="verDetalhesPaciente(${paciente.co_seq})">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h5 class="font-semibold text-red-900 text-sm">${paciente.nome}</h5>
                            <div class="flex items-center gap-3 text-xs text-red-700 mt-1">
                                <span><i class="ri-calendar-line mr-1"></i>${paciente.idade} anos</span>
                                <span><i class="ri-user-line mr-1"></i>${paciente.sexo}</span>
                            </div>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">
                                    <i class="ri-pulse-line mr-1"></i>${paciente.pas}×${paciente.pad} mmHg
                                </span>
                                ${paciente.encaminhado ? `
                                    <span class="px-2 py-1 bg-purple-600 text-white rounded text-xs">
                                        <i class="ri-checkbox-circle-line mr-1"></i>Encaminhado
                                    </span>
                                ` : `
                                    <span class="px-2 py-1 bg-yellow-600 text-white rounded text-xs animate-pulse">
                                        <i class="ri-error-warning-line mr-1"></i>Pendente
                                    </span>
                                `}
                            </div>
                            <p class="text-xs text-gray-600 mt-2">
                                <i class="ri-map-pin-line mr-1"></i>${paciente.endereco}
                            </p>
                        </div>
                        <i class="ri-alert-fill text-red-600 text-2xl"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================================
// FUNÇÕES DE AÇÃO
// ============================================================================

/**
 * Iniciar triagem de uma família que ainda não foi triada
 */
window.iniciarTriagemFamilia = async function(idFamilia) {
    try {
        console.log('Iniciar triagem da família:', idFamilia);

        // Buscar dados completos da família via API
        const response = await fetch(`/api/rastreamento/familia/${idFamilia}`);
        const data = await response.json();

        if (!data.success) {
            alert('Erro ao carregar família: ' + data.message);
            return;
        }

        // Carregar família no estado do app
        if (typeof window.carregarFamiliaParaRastreamento === 'function') {
            window.carregarFamiliaParaRastreamento(data.familia);

            // Ocultar dashboard e mostrar wizard
            document.getElementById('area-filtros-dashboard')?.classList.add('hidden');
            document.querySelector('#tab-content-hipertensao > .grid')?.classList.add('hidden'); // contadores
            document.querySelector('#tab-content-hipertensao > .bg-white')?.classList.add('hidden'); // abas
            document.getElementById('wizard-rastreamento')?.classList.remove('hidden');

            // Scroll para o wizard
            document.getElementById('wizard-rastreamento')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Função carregarFamiliaParaRastreamento não encontrada');
        }

    } catch (error) {
        console.error('Erro ao iniciar triagem:', error);
        alert('Erro ao iniciar triagem da família');
    }
};

/**
 * Continuar triagem de uma família em andamento
 */
window.continuarTriagemFamilia = async function(idFamilia) {
    try {
        console.log('Continuar triagem da família:', idFamilia);

        // Buscar dados da família + progresso via API
        const response = await fetch(`/api/rastreamento/familia/${idFamilia}/resumo`);
        const data = await response.json();

        if (!data.success) {
            alert('Erro ao carregar família: ' + data.message);
            return;
        }

        // Carregar família e restaurar progresso
        if (typeof window.carregarFamiliaParaRastreamento === 'function') {
            window.carregarFamiliaParaRastreamento(data.familia, data.progresso);

            // Ocultar dashboard e mostrar wizard
            document.getElementById('area-filtros-dashboard')?.classList.add('hidden');
            document.querySelector('#tab-content-hipertensao > .grid')?.classList.add('hidden');
            document.querySelector('#tab-content-hipertensao > .bg-white')?.classList.add('hidden');
            document.getElementById('wizard-rastreamento')?.classList.remove('hidden');

            document.getElementById('wizard-rastreamento')?.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (error) {
        console.error('Erro ao continuar triagem:', error);
        alert('Erro ao carregar triagem em andamento');
    }
};

/**
 * Ver resultados de uma família com triagem completa
 */
window.verResultadosFamilia = function(idFamilia) {
    console.log('Ver resultados da família:', idFamilia);
    // Navegar para tab de triagem completa com detalhes expandidos
    alert(`Visualizar resultados da família ${idFamilia}\n\nFuncionalidade em desenvolvimento.`);
};

/**
 * Ver detalhes de um paciente hipertenso (para encaminhamento ao HIPERDIA)
 */
window.verDetalhesPaciente = function(coSeq) {
    console.log('Ver detalhes do paciente:', coSeq);
    alert(`Detalhes do paciente ${coSeq}\n\nOpções:\n- Encaminhar para HIPERDIA\n- Ver histórico de aferições\n- Gerar relatório\n\nFuncionalidade em desenvolvimento.`);
};

// ============================================================================
// SISTEMA DE FILTROS
// ============================================================================
window.aplicarFiltrosDashboard = function() {
    console.log('=== APLICAR FILTROS DASHBOARD ==='); // DEBUG

    // Obter valores dos filtros do dashboard
    const equipe = document.getElementById('filtro-equipe-dashboard')?.value || '';
    const microarea = document.getElementById('filtro-microarea-dashboard')?.value || '';
    const busca = document.getElementById('filtro-busca-dashboard')?.value || '';

    console.log('Filtros:', { equipe, microarea, busca }); // DEBUG

    // Atualizar estado
    window.estadoDashboard.filtros = {
        equipe,
        microarea,
        busca
    };
    // Resetar para página 1 ao mudar filtros
    window.estadoDashboard.paginaAtual = 1;

    // Recarregar dashboard
    carregarDashboardAcompanhamento();
};

// ============================================================================
// CARREGAR FILTROS (EQUIPES E MICROÁREAS)
// ============================================================================

/**
 * Carrega lista de equipes no select
 */
async function carregarEquipes() {
    try {
        const response = await fetch('/api/rastreamento/equipes');
        const data = await response.json();

        if (data.success && data.equipes) {
            const selectEquipe = document.getElementById('filtro-equipe-dashboard');
            if (selectEquipe) {
                // Limpar opções existentes (exceto "Todas as equipes")
                selectEquipe.innerHTML = '<option value="">Todas as equipes</option>';

                // Adicionar equipes
                data.equipes.forEach(equipe => {
                    const option = document.createElement('option');
                    option.value = equipe;
                    option.textContent = equipe;
                    selectEquipe.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar equipes:', error);
    }
}

/**
 * Carrega lista de todas as microáreas no select
 */
async function carregarMicroareas() {
    try {
        const response = await fetch('/api/rastreamento/microareas');
        const data = await response.json();

        if (data.success && data.microareas) {
            const selectMicroarea = document.getElementById('filtro-microarea-dashboard');
            if (selectMicroarea) {
                // Limpar opções existentes (exceto "Todas as microáreas")
                selectMicroarea.innerHTML = '<option value="">Todas as microáreas</option>';

                // Adicionar microáreas
                data.microareas.forEach(microarea => {
                    const option = document.createElement('option');
                    option.value = microarea;
                    option.textContent = microarea;
                    selectMicroarea.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar microáreas:', error);
    }
}

// Event listeners para filtros do dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Carregar equipes e microáreas inicialmente
    carregarEquipes();
    carregarMicroareas();

    // Quando mudar equipe, aplicar filtro automaticamente
    document.getElementById('filtro-equipe-dashboard')?.addEventListener('change', () => {
        aplicarFiltrosDashboard();
    });

    // Quando mudar microárea, aplicar filtro automaticamente
    document.getElementById('filtro-microarea-dashboard')?.addEventListener('change', () => {
        aplicarFiltrosDashboard();
    });

    // Enter no campo de busca do dashboard
    document.getElementById('filtro-busca-dashboard')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            aplicarFiltrosDashboard();
        }
    });

    // Carregar dashboard inicial
    carregarDashboardAcompanhamento();
});

// ============================================================================
// PAGINAÇÃO
// ============================================================================
function renderizarControlesPaginacao() {
    const pag = window.estadoDashboard.paginacao;
    if (!pag || pag.total_paginas <= 1) {
        return '';  // Não mostrar paginação se só tem 1 página
    }

    const inicio = ((pag.pagina_atual - 1) * pag.itens_por_pagina) + 1;
    const fim = Math.min(pag.pagina_atual * pag.itens_por_pagina, pag.total_itens);

    return `
        <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
            <div class="flex flex-1 justify-between sm:hidden">
                <button onclick="mudarPagina(${pag.pagina_atual - 1})"
                        ${!pag.tem_anterior ? 'disabled' : ''}
                        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Anterior
                </button>
                <button onclick="mudarPagina(${pag.pagina_atual + 1})"
                        ${!pag.tem_proxima ? 'disabled' : ''}
                        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Próxima
                </button>
            </div>
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Mostrando <span class="font-medium">${inicio}</span> a <span class="font-medium">${fim}</span> de{' '}
                        <span class="font-medium">${pag.total_itens}</span> resultados
                    </p>
                </div>
                <div>
                    <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button onclick="mudarPagina(${pag.pagina_atual - 1})"
                                ${!pag.tem_anterior ? 'disabled' : ''}
                                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="ri-arrow-left-s-line"></i>
                        </button>
                        <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                            ${pag.pagina_atual} / ${pag.total_paginas}
                        </span>
                        <button onclick="mudarPagina(${pag.pagina_atual + 1})"
                                ${!pag.tem_proxima ? 'disabled' : ''}
                                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="ri-arrow-right-s-line"></i>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    `;
}

window.mudarPagina = function(novaPagina) {
    window.estadoDashboard.paginaAtual = novaPagina;
    carregarDashboardAcompanhamento();
};

// ============================================================================
// UTILIDADES
// ============================================================================
function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function mostrarNotificacao(mensagem, tipo) {
    // TODO: Implementar sistema de notificações
    console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
}

// ============================================================================
// FASE 1: SELEÇÃO DE INTEGRANTES PARA TRIAGEM
// ============================================================================

/**
 * Abre modal para selecionar integrantes de uma família
 */
window.abrirModalSelecaoIntegrantes = async function(idFamilia) {
    console.log('Abrindo modal para família:', idFamilia);

    try {
        // Buscar dados da família
        const response = await fetch(`/api/rastreamento/familia/${idFamilia}`);
        const data = await response.json();

        if (!data.success) {
            alert('Erro ao carregar família: ' + data.message);
            return;
        }

        const familia = data.familia;

        // Verificar se família já está no carrinho
        const familiaNoCarrinho = window.estadoDashboard.carrinhoTriagem.find(f => f.id_familia === idFamilia);
        const integrantesSelecionados = familiaNoCarrinho ? familiaNoCarrinho.integrantes : [];

        // Montar HTML do modal
        const modalHTML = `
            <div id="modalSelecaoIntegrantes" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <!-- Cabeçalho -->
                    <div class="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                        <h3 class="text-xl font-semibold">
                            <i class="ri-user-add-line mr-2"></i>Selecionar Integrantes para Triagem
                        </h3>
                        <p class="text-sm text-blue-100 mt-1">${familia.nome_responsavel} - ${familia.endereco}</p>
                    </div>

                    <!-- Corpo -->
                    <div class="px-6 py-4">
                        <p class="text-gray-600 mb-4">
                            <i class="ri-information-line text-blue-500 mr-1"></i>
                            Selecione os integrantes que serão incluídos na triagem cardiovascular (≥20 anos).
                        </p>

                        ${familia.integrantes && familia.integrantes.length > 0 ? `
                            <div class="space-y-2">
                                ${familia.integrantes.map(integrante => {
                                    const jaSelecionado = integrantesSelecionados.includes(integrante.cod_individual);
                                    const jaTriado = integrante.resultado_triagem !== null && integrante.resultado_triagem !== undefined;

                                    // Definir cor do badge baseado no resultado
                                    let badgeClass = '';
                                    let badgeIcon = '';
                                    let badgeText = '';

                                    if (jaTriado) {
                                        const resultado = integrante.resultado_triagem.toUpperCase();
                                        if (resultado === 'NAO_HIPERTENSO' || resultado === 'NORMAL') {
                                            badgeClass = 'bg-green-100 text-green-700 border border-green-300';
                                            badgeIcon = 'ri-checkbox-circle-line';
                                            badgeText = 'Já triado - Não Hipertenso';
                                        } else if (resultado === 'SUSPEITO_HAS' || resultado.includes('HAS')) {
                                            badgeClass = 'bg-red-100 text-red-700 border border-red-300';
                                            badgeIcon = 'ri-alert-line';
                                            badgeText = 'Já triado - Suspeito de HAS';
                                        } else {
                                            badgeClass = 'bg-blue-100 text-blue-700 border border-blue-300';
                                            badgeIcon = 'ri-information-line';
                                            badgeText = 'Já triado - ' + resultado;
                                        }
                                    }

                                    return `
                                        <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${jaSelecionado ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}">
                                            <input type="checkbox"
                                                   class="integrante-checkbox w-4 h-4 text-blue-600 rounded mr-3"
                                                   value="${integrante.cod_individual}"
                                                   ${jaSelecionado ? 'checked' : ''}
                                                   ${integrante.tem_diagnostico_has ? 'disabled title="Já tem diagnóstico de HAS"' : ''}
                                                   data-nome="${integrante.nome}"
                                                   data-idade="${integrante.idade}">
                                            <div class="flex-1">
                                                <div class="flex items-center justify-between">
                                                    <div>
                                                        <span class="font-medium text-gray-900">${integrante.nome}</span>
                                                        <span class="text-sm text-gray-500 ml-2">${integrante.idade} anos ${integrante.sexo ? '- ' + integrante.sexo : ''}</span>
                                                    </div>
                                                    ${jaTriado ? `
                                                        <span class="text-xs ${badgeClass} px-2 py-1 rounded-full ml-2">
                                                            <i class="${badgeIcon}"></i> ${badgeText}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                                ${integrante.tem_diagnostico_has ? '<span class="text-xs text-orange-600 mt-1 block"><i class="ri-alert-line"></i> Já tem diagnóstico de HAS</span>' : ''}
                                                ${jaTriado ? '<span class="text-xs text-gray-500 mt-1 block"><i class="ri-information-line"></i> Pode ser selecionado novamente para retriagem</span>' : ''}
                                            </div>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        ` : '<p class="text-gray-500 text-center py-4">Nenhum integrante elegível para triagem.</p>'}
                    </div>

                    <!-- Rodapé -->
                    <div class="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
                        <button onclick="fecharModalSelecaoIntegrantes()"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
                            <i class="ri-close-line mr-1"></i>Cancelar
                        </button>
                        <button onclick="adicionarAoCarrinhoTriagem(${idFamilia}, '${familia.nome_responsavel}', '${familia.endereco.replace(/'/g, "\\'")}', '${familia.equipe}', '${familia.microarea}')"
                                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            <i class="ri-shopping-cart-line mr-1"></i>Adicionar ao Carrinho
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        alert('Erro ao carregar família');
    }
};

/**
 * Fecha modal de seleção
 */
window.fecharModalSelecaoIntegrantes = function() {
    const modal = document.getElementById('modalSelecaoIntegrantes');
    if (modal) {
        modal.remove();
    }
};

/**
 * Adiciona família ao carrinho de triagem
 */
window.adicionarAoCarrinhoTriagem = function(idFamilia, nomeResponsavel, endereco, equipe, microarea) {
    // Coletar integrantes selecionados
    const checkboxes = document.querySelectorAll('.integrante-checkbox:checked:not([disabled])');
    const integrantesSelecionados = Array.from(checkboxes).map(cb => ({
        cod_individual: parseInt(cb.value),
        nome: cb.dataset.nome,
        idade: parseInt(cb.dataset.idade)
    }));

    if (integrantesSelecionados.length === 0) {
        alert('Selecione pelo menos um integrante para triagem!');
        return;
    }

    // Remover família do carrinho se já existir
    window.estadoDashboard.carrinhoTriagem = window.estadoDashboard.carrinhoTriagem.filter(
        f => f.id_familia !== idFamilia
    );

    // Adicionar família ao carrinho
    window.estadoDashboard.carrinhoTriagem.push({
        id_familia: idFamilia,
        nome_responsavel: nomeResponsavel,
        endereco: endereco,
        equipe: equipe,
        microarea: microarea,
        integrantes: integrantesSelecionados
    });

    console.log('Carrinho atualizado:', window.estadoDashboard.carrinhoTriagem);

    // Fechar modal
    fecharModalSelecaoIntegrantes();

    // Recarregar lista para atualizar indicadores visuais
    carregarDashboardAcompanhamento();

    // Mostrar notificação
    mostrarNotificacao(`${integrantesSelecionados.length} integrante(s) adicionado(s) ao carrinho`, 'success');

    // Atualizar botão flutuante do carrinho
    atualizarBotaoCarrinho();
};

/**
 * Atualiza contador do botão flutuante do carrinho
 */
function atualizarBotaoCarrinho() {
    const totalFamilias = window.estadoDashboard.carrinhoTriagem.length;
    const totalIntegrantes = window.estadoDashboard.carrinhoTriagem.reduce(
        (sum, f) => sum + f.integrantes.length, 0
    );

    let botao = document.getElementById('botao-carrinho-flutuante');
    if (!botao && totalFamilias > 0) {
        // Criar botão flutuante
        const botaoHTML = `
            <button id="botao-carrinho-flutuante"
                    onclick="abrirCarrinhoTriagem()"
                    class="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 z-40">
                <i class="ri-shopping-cart-2-line mr-2"></i>
                <span id="contador-carrinho">${totalFamilias} família(s) | ${totalIntegrantes} pessoa(s)</span>
            </button>
        `;
        document.body.insertAdjacentHTML('beforeend', botaoHTML);
    } else if (botao) {
        if (totalFamilias === 0) {
            botao.remove();
        } else {
            document.getElementById('contador-carrinho').textContent =
                `${totalFamilias} família(s) | ${totalIntegrantes} pessoa(s)`;
        }
    }
}

/**
 * Abre modal do carrinho de triagem
 */
window.abrirCarrinhoTriagem = function() {
    const carrinho = window.estadoDashboard.carrinhoTriagem;

    if (carrinho.length === 0) {
        alert('Carrinho vazio! Selecione famílias primeiro.');
        return;
    }

    const totalFamilias = carrinho.length;
    const totalIntegrantes = carrinho.reduce((sum, f) => sum + f.integrantes.length, 0);

    const modalHTML = `
        <div id="modalCarrinhoTriagem" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                <!-- Cabeçalho -->
                <div class="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                    <h3 class="text-xl font-semibold">
                        <i class="ri-shopping-cart-2-line mr-2"></i>Carrinho de Triagem
                    </h3>
                    <p class="text-sm text-blue-100 mt-1">
                        ${totalFamilias} família(s) | ${totalIntegrantes} pessoa(s) selecionada(s)
                    </p>
                </div>

                <!-- Corpo (scrollable) -->
                <div class="px-6 py-4 overflow-y-auto flex-1">
                    <div class="space-y-4">
                        ${carrinho.map((familia, index) => `
                            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <!-- Cabeçalho da família -->
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-gray-900">
                                            <i class="ri-home-4-line text-blue-500 mr-1"></i>
                                            ${familia.nome_responsavel}
                                        </h4>
                                        <p class="text-sm text-gray-600 mt-1">
                                            <i class="ri-map-pin-line mr-1"></i>${familia.endereco}
                                        </p>
                                        <div class="flex gap-3 mt-2 text-xs text-gray-500">
                                            <span><i class="ri-team-line mr-1"></i>${familia.equipe || 'Sem equipe'}</span>
                                            <span><i class="ri-home-line mr-1"></i>Microárea: ${familia.microarea || '-'}</span>
                                        </div>
                                    </div>
                                    <button onclick="removerFamiliaDoCarrinho(${index})"
                                            class="text-red-500 hover:text-red-700 p-2"
                                            title="Remover família">
                                        <i class="ri-delete-bin-line text-xl"></i>
                                    </button>
                                </div>

                                <!-- Lista de integrantes selecionados -->
                                <div class="bg-gray-50 rounded-md p-3">
                                    <p class="text-xs font-semibold text-gray-600 mb-2">
                                        INTEGRANTES SELECIONADOS (${familia.integrantes.length}):
                                    </p>
                                    <div class="space-y-1">
                                        ${familia.integrantes.map(int => `
                                            <div class="flex items-center text-sm">
                                                <i class="ri-user-line text-blue-500 mr-2"></i>
                                                <span class="text-gray-800">${int.nome}</span>
                                                <span class="text-gray-500 ml-2">(${int.idade} anos)</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Rodapé -->
                <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <button onclick="fecharCarrinhoTriagem()"
                                    class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
                                <i class="ri-arrow-left-line mr-1"></i>Voltar
                            </button>
                            <button onclick="limparCarrinho()"
                                    class="ml-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                                <i class="ri-delete-bin-line mr-1"></i>Limpar Tudo
                            </button>
                        </div>
                        <button onclick="confirmarTriagem()"
                                class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold">
                            <i class="ri-check-line mr-1"></i>Confirmar Triagem
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

/**
 * Fecha modal do carrinho
 */
window.fecharCarrinhoTriagem = function() {
    const modal = document.getElementById('modalCarrinhoTriagem');
    if (modal) {
        modal.remove();
    }
};

/**
 * Remove família do carrinho
 */
window.removerFamiliaDoCarrinho = function(index) {
    if (confirm('Remover esta família do carrinho?')) {
        window.estadoDashboard.carrinhoTriagem.splice(index, 1);
        atualizarBotaoCarrinho();
        fecharCarrinhoTriagem();
        carregarDashboardAcompanhamento(); // Atualizar cards

        if (window.estadoDashboard.carrinhoTriagem.length > 0) {
            abrirCarrinhoTriagem(); // Reabrir se ainda tem itens
        }
    }
};

/**
 * Limpa todo o carrinho
 */
window.limparCarrinho = function() {
    if (confirm('Limpar todo o carrinho? Esta ação não pode ser desfeita.')) {
        window.estadoDashboard.carrinhoTriagem = [];
        atualizarBotaoCarrinho();
        fecharCarrinhoTriagem();
        carregarDashboardAcompanhamento();
        mostrarNotificacao('Carrinho limpo!', 'info');
    }
};

/**
 * Confirma triagem e envia ao backend
 */
window.confirmarTriagem = async function() {
    const carrinho = window.estadoDashboard.carrinhoTriagem;

    if (carrinho.length === 0) {
        alert('Carrinho vazio!');
        return;
    }

    const totalIntegrantes = carrinho.reduce((sum, f) => sum + f.integrantes.length, 0);

    if (!confirm(`Confirmar triagem de ${carrinho.length} família(s) com ${totalIntegrantes} pessoa(s)?\n\nIsso moverá as famílias para a aba "Em Triagem".`)) {
        return;
    }

    try {
        // Preparar dados para envio
        const dados = {
            familias: carrinho.map(f => ({
                id_familia: f.id_familia,
                nome_responsavel: f.nome_responsavel,
                endereco: f.endereco,
                equipe: f.equipe,
                microarea: f.microarea,
                integrantes: f.integrantes.map(i => i.cod_individual)
            }))
        };

        // Enviar ao backend
        const response = await fetch('/api/rastreamento/confirmar-triagem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Triagem confirmada!\n\n${carrinho.length} família(s) movida(s) para "Em Triagem".`);

            // Limpar carrinho
            window.estadoDashboard.carrinhoTriagem = [];
            atualizarBotaoCarrinho();
            fecharCarrinhoTriagem();

            // Recarregar dashboard
            carregarDashboardAcompanhamento();

            mostrarNotificacao('Triagem confirmada com sucesso!', 'success');
        } else {
            alert('❌ Erro ao confirmar triagem: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao confirmar triagem:', error);
        alert('❌ Erro ao confirmar triagem. Verifique o console.');
    }
};

// ============================================================================
// FUNÇÕES DE SELEÇÃO PARA PDF
// ============================================================================
window.toggleFamiliaPDF = function(codFamilia) {
    if (!window.familiasSelecionadasPDF) {
        window.familiasSelecionadasPDF = new Set();
    }

    if (window.familiasSelecionadasPDF.has(codFamilia)) {
        window.familiasSelecionadasPDF.delete(codFamilia);
    } else {
        window.familiasSelecionadasPDF.add(codFamilia);
    }

    atualizarContadorSelecao();
};

window.selecionarTodasFamiliasPDF = function() {
    const checkboxes = document.querySelectorAll('.checkbox-familia-pdf');
    window.familiasSelecionadasPDF = new Set();

    checkboxes.forEach(cb => {
        const familiaId = parseInt(cb.getAttribute('data-familia-id'));
        window.familiasSelecionadasPDF.add(familiaId);
        cb.checked = true;

        // Adicionar ring visual
        const card = cb.closest('[data-familia-id]');
        if (card) card.classList.add('ring-2', 'ring-blue-500');
    });

    atualizarContadorSelecao();
};

window.deselecionarTodasFamiliasPDF = function() {
    const checkboxes = document.querySelectorAll('.checkbox-familia-pdf');
    window.familiasSelecionadasPDF = new Set();

    checkboxes.forEach(cb => {
        cb.checked = false;

        // Remover ring visual
        const card = cb.closest('[data-familia-id]');
        if (card) card.classList.remove('ring-2', 'ring-blue-500');
    });

    atualizarContadorSelecao();
};

function atualizarContadorSelecao() {
    const numSelecionadas = window.familiasSelecionadasPDF ? window.familiasSelecionadasPDF.size : 0;

    const numEl = document.getElementById('num-selecionadas');
    const pdfCountEl = document.getElementById('pdf-count');
    const btnGerarPDF = document.getElementById('btn-gerar-pdf');

    if (numEl) numEl.textContent = numSelecionadas;
    if (pdfCountEl) pdfCountEl.textContent = numSelecionadas;
    if (btnGerarPDF) {
        btnGerarPDF.disabled = numSelecionadas === 0;
    }
}

function atualizarContadorSelecaoIncompleta() {
    const numSelecionadas = window.familiasSelecionadasPDF ? window.familiasSelecionadasPDF.size : 0;

    const numEl = document.getElementById('num-selecionadas-incompleta');
    const pdfCountEl = document.getElementById('pdf-count-incompleta');
    const btnGerarPDF = document.getElementById('btn-gerar-pdf-incompleta');

    if (numEl) numEl.textContent = numSelecionadas;
    if (pdfCountEl) pdfCountEl.textContent = numSelecionadas;
    if (btnGerarPDF) {
        btnGerarPDF.disabled = numSelecionadas === 0;
    }
}

// ============================================================================
// GERAÇÃO DE PDF - FICHAS DE TRIAGEM
// ============================================================================
window.gerarPDFTriagem = async function() {
    try {
        // Verificar se há famílias selecionadas
        if (!window.familiasSelecionadasPDF || window.familiasSelecionadasPDF.size === 0) {
            alert('Selecione pelo menos uma família para gerar o PDF.');
            return;
        }

        console.log('Gerando PDF de triagem...');

        // Buscar dados das famílias em triagem
        const response = await fetch('/api/rastreamento/familias-para-pdf');
        const data = await response.json();

        if (!data.success || data.familias.length === 0) {
            alert('Nenhuma família em triagem para gerar PDF.');
            return;
        }

        // Filtrar apenas famílias selecionadas
        const familiasSelecionadas = data.familias.filter(f =>
            window.familiasSelecionadasPDF.has(f.cod_seq_rastreamento_familia)
        );

        if (familiasSelecionadas.length === 0) {
            alert('Nenhuma das famílias selecionadas foi encontrada.');
            return;
        }

        console.log(`Gerando PDF com ${familiasSelecionadas.length} famílias selecionadas`);

        // Criar novo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const margemEsq = 10;
        const margemDir = 200;
        const larguraPagina = margemDir - margemEsq;
        let yAtual = 10; // Começar do topo, sem título
        let primeiraPagina = true;

        // Para cada família selecionada
        for (const familia of familiasSelecionadas) {
            const integrantes = familia.integrantes || [];
            const linhasVazias = 2; // 2 linhas em branco por família
            const totalLinhas = integrantes.length + linhasVazias;

            // Altura necessária para uma família completa
            const alturaBloco = 25 + (totalLinhas * 10); // Cabeçalho (25mm) + linhas (10mm cada)

            // Verificar se cabe na página atual
            if (yAtual + alturaBloco > 280 && !primeiraPagina) {
                doc.addPage();
                yAtual = 10;
            }
            primeiraPagina = false;

            // CABEÇALHO BRANCO COM BORDA (instruções)
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(margemEsq, yAtual, larguraPagina, 15, 'FD');

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');

            let yTexto = yAtual + 4;
            doc.text('AFERIR A PRESSÃO ARTERIAL DOS MORADORES COM MAIS DE 20 ANOS DE IDADE', 105, yTexto, { align: 'center' });
            yTexto += 4;
            doc.text('01 VEZ POR DIA POR 05 (CINCO) DIAS', 105, yTexto, { align: 'center' });
            yTexto += 4;
            doc.text('DE MANHÃ EM JEJUM OU A NOITE ANTES DO JANTAR (NÃO ESCREVER 12X8, USAR 120X80)', 105, yTexto, { align: 'center' });

            yAtual += 15;

            // FAIXA AMARELA (Informações completas do domicílio)
            doc.setFillColor(255, 255, 0);
            doc.rect(margemEsq, yAtual, larguraPagina, 6, 'F');

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');

            const equipe = familia.equipe || '-';
            const microarea = familia.microarea || '-';
            const endereco = familia.endereco || '-';
            const responsavel = familia.nome_responsavel.toUpperCase();

            const textoCompleto = `${equipe} - MICRO-ÁREA: ${microarea} - ${endereco} - ${responsavel}`;
            doc.text(textoCompleto, 105, yAtual + 4.5, { align: 'center' });

            yAtual += 6;

            // TABELA
            const colCidadao = 90; // Largura da coluna CIDADÃO (reduzida)
            const colDia = 20; // Largura de cada coluna de dia (aumentada)

            // Cabeçalho da tabela
            doc.setDrawColor(0);
            doc.setLineWidth(0.3);
            doc.rect(margemEsq, yAtual, colCidadao, 8); // Coluna CIDADÃO

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('CIDADÃO', margemEsq + 2, yAtual + 5.5);

            // 5 colunas para os 5 dias
            for (let i = 0; i < 5; i++) {
                const xCol = margemEsq + colCidadao + (i * colDia);
                doc.rect(xCol, yAtual, colDia, 8);
                doc.setFontSize(7);
                doc.text('___/___/_____', xCol + 2, yAtual + 5.5);
                doc.setFontSize(9);
            }

            yAtual += 8;

            // Linhas dos integrantes
            for (const integrante of integrantes) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                // Coluna CIDADÃO
                doc.rect(margemEsq, yAtual, colCidadao, 10);
                const textoIntegrante = `${integrante.nome_cidadao}, ${integrante.idade_no_rastreamento} anos`;
                doc.text(textoIntegrante, margemEsq + 2, yAtual + 6.5);

                // 5 colunas vazias para preencher
                for (let i = 0; i < 5; i++) {
                    const xCol = margemEsq + colCidadao + (i * colDia);
                    doc.rect(xCol, yAtual, colDia, 10);
                }

                yAtual += 10;
            }

            // 2 LINHAS EM BRANCO (para outros integrantes)
            for (let i = 0; i < linhasVazias; i++) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                // Coluna CIDADÃO
                doc.rect(margemEsq, yAtual, colCidadao, 10);
                doc.text('Nome:', margemEsq + 2, yAtual + 6.5); // Texto "Nome:" alinhado à esquerda

                // 5 colunas vazias
                for (let j = 0; j < 5; j++) {
                    const xCol = margemEsq + colCidadao + (j * colDia);
                    doc.rect(xCol, yAtual, colDia, 10);
                }

                yAtual += 10;
            }

            // Espaço entre famílias
            yAtual += 5;
        }

        // Salvar PDF
        const dataHora = new Date().toISOString().slice(0, 10);
        doc.save(`Triagem_Hipertensao_${dataHora}.pdf`);

        console.log('PDF gerado com sucesso!');
        mostrarNotificacao(`PDF gerado com ${familiasSelecionadas.length} família(s)`, 'success');

        // Limpar seleção
        deselecionarTodasFamiliasPDF();

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Verifique o console.');
    }
};

// ============================================================================
// GERAÇÃO DE PDF - FICHAS DE TRIAGEM INCOMPLETA
// ============================================================================
window.gerarPDFTriagemIncompleta = async function() {
    try {
        // Verificar se há famílias selecionadas
        if (!window.familiasSelecionadasPDF || window.familiasSelecionadasPDF.size === 0) {
            alert('Selecione pelo menos uma família para gerar o PDF.');
            return;
        }

        console.log('Gerando PDF de triagem incompleta...');

        // Buscar dados das famílias incompletas
        const response = await fetch('/api/rastreamento/familias-incompletas-para-pdf');
        const data = await response.json();

        if (!data.success || data.familias.length === 0) {
            alert('Nenhuma família com triagem incompleta para gerar PDF.');
            return;
        }

        // Filtrar apenas famílias selecionadas
        const familiasSelecionadas = data.familias.filter(f =>
            window.familiasSelecionadasPDF.has(f.cod_seq_rastreamento_familia)
        );

        if (familiasSelecionadas.length === 0) {
            alert('Nenhuma das famílias selecionadas foi encontrada.');
            return;
        }

        console.log(`Gerando PDF com ${familiasSelecionadas.length} famílias incompletas selecionadas`);

        // Criar novo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const margemEsq = 10;
        const margemDir = 200;
        const larguraPagina = margemDir - margemEsq;
        let yAtual = 10;
        let primeiraPagina = true;

        // Para cada família selecionada
        for (const familia of familiasSelecionadas) {
            const integrantes = familia.integrantes || []; // Apenas integrantes NÃO triados
            const linhasVazias = 2;
            const totalLinhas = integrantes.length + linhasVazias;

            // Altura necessária para uma família completa
            const alturaBloco = 25 + (totalLinhas * 10);

            // Verificar se cabe na página atual
            if (yAtual + alturaBloco > 280 && !primeiraPagina) {
                doc.addPage();
                yAtual = 10;
            }
            primeiraPagina = false;

            // CABEÇALHO BRANCO COM BORDA (instruções)
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(margemEsq, yAtual, larguraPagina, 15, 'FD');

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');

            let yTexto = yAtual + 4;
            doc.text('AFERIR A PRESSÃO ARTERIAL DOS MORADORES COM MAIS DE 20 ANOS DE IDADE', 105, yTexto, { align: 'center' });
            yTexto += 4;
            doc.text('01 VEZ POR DIA POR 05 (CINCO) DIAS', 105, yTexto, { align: 'center' });
            yTexto += 4;
            doc.text('DE MANHÃ EM JEJUM OU A NOITE ANTES DO JANTAR (NÃO ESCREVER 12X8, USAR 120X80)', 105, yTexto, { align: 'center' });

            yAtual += 15;

            // FAIXA AMARELA (Informações completas do domicílio) - Amarelo para indicar triagem incompleta
            doc.setFillColor(255, 255, 0);
            doc.rect(margemEsq, yAtual, larguraPagina, 6, 'F');

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');

            const equipe = familia.equipe || '-';
            const microarea = familia.microarea || '-';
            const endereco = familia.endereco || '-';
            const responsavel = familia.nome_responsavel.toUpperCase();

            const textoCompleto = `${equipe} - MICRO-ÁREA: ${microarea} - ${endereco} - ${responsavel}`;
            doc.text(textoCompleto, 105, yAtual + 4.5, { align: 'center' });

            yAtual += 6;

            // TABELA
            const colCidadao = 90;
            const colDia = 20;

            // Cabeçalho da tabela
            doc.setDrawColor(0);
            doc.setLineWidth(0.3);
            doc.rect(margemEsq, yAtual, colCidadao, 8);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('CIDADÃO', margemEsq + 2, yAtual + 5.5);

            // 5 colunas para os 5 dias
            for (let i = 0; i < 5; i++) {
                const xCol = margemEsq + colCidadao + (i * colDia);
                doc.rect(xCol, yAtual, colDia, 8);
                doc.setFontSize(7);
                doc.text('___/___/_____', xCol + 2, yAtual + 5.5);
                doc.setFontSize(9);
            }

            yAtual += 8;

            // Linhas dos integrantes NÃO triados
            for (const integrante of integrantes) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                // Coluna CIDADÃO
                doc.rect(margemEsq, yAtual, colCidadao, 10);
                const textoIntegrante = `${integrante.nome_cidadao}, ${integrante.idade_no_rastreamento} anos`;
                doc.text(textoIntegrante, margemEsq + 2, yAtual + 6.5);

                // 5 colunas vazias para preencher
                for (let i = 0; i < 5; i++) {
                    const xCol = margemEsq + colCidadao + (i * colDia);
                    doc.rect(xCol, yAtual, colDia, 10);
                }

                yAtual += 10;
            }

            // 2 LINHAS EM BRANCO (para outros integrantes)
            for (let i = 0; i < linhasVazias; i++) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                // Coluna CIDADÃO
                doc.rect(margemEsq, yAtual, colCidadao, 10);
                doc.text('Nome:', margemEsq + 2, yAtual + 6.5);

                // 5 colunas vazias
                for (let j = 0; j < 5; j++) {
                    const xCol = margemEsq + colCidadao + (j * colDia);
                    doc.rect(xCol, yAtual, colDia, 10);
                }

                yAtual += 10;
            }

            // Espaço entre famílias
            yAtual += 5;
        }

        // Salvar PDF
        const dataHora = new Date().toISOString().slice(0, 10);
        doc.save(`Triagem_Incompleta_Hipertensao_${dataHora}.pdf`);

        console.log('PDF de triagem incompleta gerado com sucesso!');
        mostrarNotificacao(`PDF gerado com ${familiasSelecionadas.length} família(s) incompletas`, 'success');

        // Limpar seleção
        deselecionarTodasFamiliasPDF();

    } catch (error) {
        console.error('Erro ao gerar PDF de triagem incompleta:', error);
        alert('Erro ao gerar PDF. Verifique o console.');
    }
};

// ============================================================================
// MODAL DE REGISTRO DE TRIAGEM (5 DIAS)
// ============================================================================

let dadosFamiliaTriagem = null;
let dadosIntegrantesTriagem = [];

/**
 * Abre modal para registrar resultados da triagem
 */
window.continuarTriagemFamilia = async function(codRastreamentoFamilia) {
    try {
        console.log('Abrindo triagem para família:', codRastreamentoFamilia);

        // Buscar dados completos da família via API
        const response = await fetch(`/api/rastreamento/familia-triagem/${codRastreamentoFamilia}`);
        const data = await response.json();

        if (!data.success) {
            alert('Erro ao carregar dados da família: ' + data.message);
            return;
        }

        dadosFamiliaTriagem = data.familia;
        dadosIntegrantesTriagem = data.integrantes || [];

        // Preparar dados dos integrantes com aferições já salvas
        dadosIntegrantesTriagem = dadosIntegrantesTriagem.map(integrante => {
            // Se já tem aferições salvas, converter para o formato esperado
            if (integrante.afericoes && integrante.afericoes.length > 0) {
                integrante.afericoes = integrante.afericoes.map(af => ({
                    pas: af.pressao_sistolica,
                    pad: af.pressao_diastolica
                }));
            } else {
                integrante.afericoes = [];
            }

            return integrante;
        });

        // Preencher informações da família
        const infoFamilia = document.getElementById('info-familia-triagem');
        infoFamilia.innerHTML = `
            <strong>${dadosFamiliaTriagem.nome_responsavel}</strong> •
            ${dadosFamiliaTriagem.equipe} •
            Microárea: ${dadosFamiliaTriagem.microarea} •
            ${dadosFamiliaTriagem.endereco}
        `;

        // Renderizar tabela de integrantes
        renderizarTabelaIntegrantes();

        // Restaurar valores salvos nos campos
        restaurarAfericoesSalvas();

        // Mostrar modal
        document.getElementById('modal-registro-triagem').classList.remove('hidden');

    } catch (error) {
        console.error('Erro ao abrir modal de triagem:', error);
        alert('Erro ao carregar triagem. Verifique o console.');
    }
};

/**
 * Renderiza tabela com integrantes
 */
function renderizarTabelaIntegrantes() {
    const tbody = document.getElementById('tbody-integrantes-triagem');
    tbody.innerHTML = '';

    dadosIntegrantesTriagem.forEach((integrante, index) => {
        const tr = document.createElement('tr');
        const somenteVisualizacao = integrante.somente_visualizacao === true;

        // Estilo diferente para integrantes em modo visualização
        tr.className = somenteVisualizacao ? 'bg-gray-50' : 'hover:bg-gray-50';

        // Se é apenas visualização, mostrar dados já salvos de forma estática
        if (somenteVisualizacao) {
            // Buscar aferições salvas
            const afericoesSalvas = integrante.afericoes || [];
            const diasHTML = [1,2,3,4,5].map(dia => {
                const afericao = afericoesSalvas.find(a => a.dia_medicao === dia);
                const valor = afericao ? `${afericao.pressao_sistolica}/${afericao.pressao_diastolica}` : '---';
                return `
                    <td class="border border-gray-300 px-2 py-2 text-center bg-gray-100">
                        <span class="text-gray-700 font-medium">${valor}</span>
                    </td>
                `;
            }).join('');

            // Calcular média se tiver aferições
            let mediaHTML = '---';
            let classificacaoHTML = '---';
            let classificacaoClass = '';

            if (integrante.media_pas && integrante.media_pad) {
                // Buscar a data da primeira aferição (data em que foi feita a triagem)
                const primeiraAfericao = afericoesSalvas.length > 0 ? afericoesSalvas[0] : null;
                const dataTriagem = primeiraAfericao && primeiraAfericao.data_afericao
                    ? primeiraAfericao.data_afericao
                    : 'Data não disponível';

                // Montar HTML da média com data e valor
                mediaHTML = `
                    <div class="text-xs text-gray-500 mb-1">${dataTriagem}</div>
                    <div class="font-bold text-gray-900">${integrante.media_pas}/${integrante.media_pad}</div>
                `;

                // Definir classificação e cor (nova nomenclatura)
                const resultado = integrante.resultado_rastreamento || '';
                if (resultado === 'NORMAL' || resultado === 'NAO_HIPERTENSO') {
                    classificacaoHTML = 'Não Hipertenso';
                    classificacaoClass = 'bg-green-100 text-green-700';
                } else if (resultado === 'LIMITROFE') {
                    classificacaoHTML = 'Limítrofe';
                    classificacaoClass = 'bg-yellow-100 text-yellow-700';
                } else if (resultado === 'HIPERTENSO' || resultado === 'SUSPEITO_HAS' || resultado.includes('HAS')) {
                    classificacaoHTML = 'Suspeito de HAS';
                    classificacaoClass = 'bg-red-100 text-red-700';
                }
            }

            tr.innerHTML = `
                <td class="border border-gray-300 px-4 py-3 bg-gray-100">
                    <div class="font-semibold text-gray-900">${integrante.nome_cidadao}</div>
                    <div class="text-sm text-gray-600">${integrante.idade_no_rastreamento} anos • ${integrante.sexo}</div>
                    <div class="text-xs text-blue-600 mt-1"><i class="ri-eye-line"></i> Apenas visualização</div>
                </td>
                ${diasHTML}
                <td class="border border-gray-300 px-4 py-3 text-center bg-gray-100">
                    ${mediaHTML}
                </td>
                <td class="border border-gray-300 px-4 py-3 text-center bg-gray-100">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${classificacaoClass}">
                        ${classificacaoHTML}
                    </span>
                </td>
            `;
        } else {
            // Renderização normal com inputs editáveis
            tr.innerHTML = `
                <td class="border border-gray-300 px-4 py-3">
                    <div class="font-semibold text-gray-900">${integrante.nome_cidadao}</div>
                    <div class="text-sm text-gray-600">${integrante.idade_no_rastreamento} anos • ${integrante.sexo}</div>
                </td>
                ${[1,2,3,4,5].map(dia => `
                    <td class="border border-gray-300 px-2 py-2">
                        <input type="text"
                               class="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 input-pa"
                               placeholder="___/___"
                               maxlength="7"
                               data-integrante-index="${index}"
                               data-dia="${dia}"
                               oninput="validarFormatoPA(this); calcularMediaIntegrante(${index})">
                    </td>
                `).join('')}
                <td class="border border-gray-300 px-4 py-3 text-center">
                    <div class="font-semibold text-gray-900" id="media-${index}">---</div>
                </td>
                <td class="border border-gray-300 px-4 py-3 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold" id="classificacao-${index}">
                        ---
                    </span>
                </td>
            `;
        }

        tbody.appendChild(tr);
    });

    atualizarContadorFinalizados();
}

/**
 * Restaura aferições já salvas anteriormente nos campos do formulário
 */
function restaurarAfericoesSalvas() {
    dadosIntegrantesTriagem.forEach((integrante, index) => {
        // Pular integrantes em modo visualização (não têm campos editáveis)
        if (integrante.somente_visualizacao) {
            return;
        }

        // Se tem aferições salvas, preencher campos
        if (integrante.afericoes && integrante.afericoes.length > 0) {
            integrante.afericoes.forEach((afericao, diaIndex) => {
                const dia = diaIndex + 1;
                const input = document.querySelector(`input[data-integrante-index="${index}"][data-dia="${dia}"]`);
                if (input) {
                    input.value = `${afericao.pas}/${afericao.pad}`;
                }
            });
        }

        // Se tem média salva, recalcular para exibir
        if (integrante.media_pas && integrante.media_pad) {
            calcularMediaIntegrante(index);
        }
    });
}

/**
 * Valida formato de PA (120/80)
 */
window.validarFormatoPA = function(input) {
    let valor = input.value.replace(/[^0-9\/]/g, '');

    // Auto-adicionar barra após 3 dígitos
    if (valor.length === 3 && !valor.includes('/')) {
        valor = valor + '/';
    }

    input.value = valor;
};

/**
 * Calcula média e classificação de um integrante
 */
window.calcularMediaIntegrante = function(index) {
    const inputs = document.querySelectorAll(`input[data-integrante-index="${index}"]`);
    const valores = [];

    inputs.forEach(input => {
        const val = input.value.trim();
        if (val && val.includes('/')) {
            const [pas, pad] = val.split('/').map(v => parseInt(v));
            if (pas && pad) {
                valores.push({ pas, pad });
            }
        }
    });

    // Precisa ter no mínimo 3 valores (até 5)
    if (valores.length >= 3 && valores.length <= 5) {
        const mediaPAS = Math.round(valores.reduce((sum, v) => sum + v.pas, 0) / valores.length);
        const mediaPAD = Math.round(valores.reduce((sum, v) => sum + v.pad, 0) / valores.length);

        // Atualizar média
        document.getElementById(`media-${index}`).textContent = `${mediaPAS}/${mediaPAD}`;

        // Calcular classificação
        const classificacao = classificarPA(mediaPAS, mediaPAD);
        const spanClassif = document.getElementById(`classificacao-${index}`);
        spanClassif.textContent = classificacao.nome;
        spanClassif.className = `px-3 py-1 rounded-full text-xs font-semibold ${classificacao.classe}`;

        // Salvar no objeto
        dadosIntegrantesTriagem[index].media_pas = mediaPAS;
        dadosIntegrantesTriagem[index].media_pad = mediaPAD;
        dadosIntegrantesTriagem[index].classificacao = classificacao.codigo;
        dadosIntegrantesTriagem[index].afericoes = valores;
        dadosIntegrantesTriagem[index].num_afericoes = valores.length;

    } else {
        document.getElementById(`media-${index}`).textContent = '---';
        document.getElementById(`classificacao-${index}`).textContent = '---';
        document.getElementById(`classificacao-${index}`).className = 'px-3 py-1 rounded-full text-xs font-semibold';

        // Limpar dados se não tiver mínimo
        delete dadosIntegrantesTriagem[index].media_pas;
        delete dadosIntegrantesTriagem[index].media_pad;
        delete dadosIntegrantesTriagem[index].classificacao;
        delete dadosIntegrantesTriagem[index].afericoes;
    }

    atualizarContadorFinalizados();
};

/**
 * Classifica PA segundo critérios de MRPA (Monitorização Residencial da Pressão Arterial)
 * Triagem com 3 a 5 medidas
 *
 * Categorias de triagem (2 grupos):
 * - Não Hipertenso: PAS < 130 E PAD < 80 (verde)
 * - Suspeito de Hipertensão: PAS ≥ 130 E/OU PAD ≥ 80 (vermelho)
 */
function classificarPA(pas, pad) {
    // Suspeito de Hipertensão: PAS ≥ 130 E/OU PAD ≥ 80
    if (pas >= 130 || pad >= 80) {
        return { codigo: 'SUSPEITO_HAS', nome: 'Suspeito de HAS', classe: 'bg-red-100 text-red-800' };
    }
    // Não Hipertenso: PAS < 130 E PAD < 80
    else {
        return { codigo: 'NAO_HIPERTENSO', nome: 'Não Hipertenso', classe: 'bg-green-100 text-green-800' };
    }
}

/**
 * Atualiza contador de integrantes finalizados
 */
function atualizarContadorFinalizados() {
    // Contar apenas integrantes que NÃO estão em modo visualização
    const integrantesAtivos = dadosIntegrantesTriagem.filter(i => !i.somente_visualizacao);
    const total = integrantesAtivos.length;
    const finalizados = integrantesAtivos.filter(i => i.media_pas && i.media_pad).length;

    document.getElementById('contador-total').textContent = total;
    document.getElementById('contador-finalizados').textContent = finalizados;

    // Habilitar botão "Salvar Parcial" apenas se pelo menos 1 integrante foi triado
    const btnSalvarParcial = document.getElementById('btn-salvar-parcial');
    if (btnSalvarParcial) {
        btnSalvarParcial.disabled = finalizados === 0;
    }

    // Botão "Finalizar Triagem" está sempre habilitado (não precisa fazer nada)

    // Mostrar mensagem se houver integrantes pendentes
    const msgParcial = document.getElementById('msg-salvamento-parcial');
    if (finalizados > 0 && finalizados < total) {
        msgParcial.classList.remove('hidden');
        msgParcial.textContent = `⚠️ ${total - finalizados} integrante(s) ainda não foi(ram) triado(s).`;
    } else {
        msgParcial.classList.add('hidden');
    }
}

/**
 * Fecha modal de triagem
 */
window.fecharModalTriagem = function() {
    document.getElementById('modal-registro-triagem').classList.add('hidden');
    dadosFamiliaTriagem = null;
    dadosIntegrantesTriagem = [];
};

/**
 * Salva resultados parciais (mantém modal aberto para continuar depois)
 */
window.salvarResultadosParciais = async function() {
    try {
        console.log('Salvando resultados parciais...');

        // Filtrar apenas integrantes que foram triados (têm média calculada)
        const integrantesTriados = dadosIntegrantesTriagem.filter(i => i.media_pas && i.media_pad);

        if (integrantesTriados.length === 0) {
            alert('Nenhum integrante foi triado ainda.');
            return;
        }

        const payload = {
            cod_rastreamento_familia: dadosFamiliaTriagem.cod_seq_rastreamento_familia,
            integrantes: integrantesTriados.map(i => ({
                cod_seq_rastreamento_cidadao: i.cod_seq_rastreamento_cidadao,
                media_pas: i.media_pas,
                media_pad: i.media_pad,
                classificacao: i.classificacao,
                afericoes: i.afericoes
            })),
            salvar_parcial: true  // Indica que é salvamento parcial
        };

        const response = await fetch('/api/rastreamento/salvar-resultados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacao(`Salvamento parcial realizado! ${integrantesTriados.length} de ${dadosIntegrantesTriagem.length} integrante(s) salvos.`, 'success');
            // Fechar modal
            fecharModalTriagem();
            // Recarregar dashboard para atualizar barrinha de progresso
            carregarDashboardAcompanhamento();
        } else {
            alert('Erro ao salvar: ' + data.message);
        }

    } catch (error) {
        console.error('Erro ao salvar resultados parciais:', error);
        alert('Erro ao salvar. Verifique o console.');
    }
};

/**
 * Finaliza a triagem da família
 * - Se nenhum triado: Remove família da triagem (volta para Sem Triagem)
 * - Se algum triado: Salva e marca como Triagem Incompleta
 * - Se todos triados: Salva e marca como Concluído
 */
window.finalizarTriagem = async function() {
    try {
        // Filtrar apenas integrantes ativos (não em modo visualização) e triados
        const integrantesAtivos = dadosIntegrantesTriagem.filter(i => !i.somente_visualizacao);
        const integrantesTriados = integrantesAtivos.filter(i => i.media_pas && i.media_pad);
        const total = integrantesAtivos.length;

        // Confirmar ação
        let mensagemConfirmacao;
        if (integrantesTriados.length === 0) {
            mensagemConfirmacao = 'Nenhum integrante foi triado. Deseja remover esta família da triagem?';
        } else if (integrantesTriados.length < total) {
            mensagemConfirmacao = `Apenas ${integrantesTriados.length} de ${total} integrantes foram triados. Deseja finalizar mesmo assim? A família ficará com triagem incompleta.`;
        } else {
            mensagemConfirmacao = `Todos os ${total} integrantes foram triados. Deseja finalizar a triagem?`;
        }

        if (!confirm(mensagemConfirmacao)) {
            return;
        }

        // Se nenhum foi triado, remover família da triagem
        if (integrantesTriados.length === 0) {
            const response = await fetch('/api/rastreamento/remover-familia-triagem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cod_rastreamento_familia: dadosFamiliaTriagem.cod_seq_rastreamento_familia
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacao('Família removida da triagem.', 'info');
                fecharModalTriagem();
                carregarDashboardAcompanhamento();
            } else {
                alert('Erro ao remover: ' + data.message);
            }
            return;
        }

        // Caso contrário, salvar os triados e finalizar
        const payload = {
            cod_rastreamento_familia: dadosFamiliaTriagem.cod_seq_rastreamento_familia,
            integrantes: integrantesTriados.map(i => ({
                cod_seq_rastreamento_cidadao: i.cod_seq_rastreamento_cidadao,
                media_pas: i.media_pas,
                media_pad: i.media_pad,
                classificacao: i.classificacao,
                afericoes: i.afericoes
            })),
            finalizar: true  // Indica que é finalização
        };

        const response = await fetch('/api/rastreamento/salvar-resultados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            const msg = integrantesTriados.length === total
                ? 'Triagem completa finalizada com sucesso!'
                : `Triagem finalizada! ${integrantesTriados.length} de ${total} integrante(s). A família ficou com triagem incompleta.`;
            mostrarNotificacao(msg, 'success');
            fecharModalTriagem();
            carregarDashboardAcompanhamento();
        } else {
            alert('Erro ao finalizar: ' + data.message);
        }

    } catch (error) {
        console.error('Erro ao finalizar triagem:', error);
        alert('Erro ao finalizar. Verifique o console.');
    }
};

// Exportar função global
window.carregarDashboardAcompanhamento = carregarDashboardAcompanhamento;

// selecionarAba definida globalmente
console.log(">>> selecionarAba function loaded:", typeof window.selecionarAba);

// ============================================================================
// VISUALIZAÇÃO DE RESULTADOS DA TRIAGEM
// ============================================================================

let dadosFamiliaResultado = null; // Armazena dados da família sendo visualizada

/**
 * Abre modal com resultados detalhados da triagem de uma família
 */
window.verResultadosFamilia = async function(codRastreamentoFamilia) {
    try {
        const response = await fetch(`/api/rastreamento/visualizar-triagem/${codRastreamentoFamilia}`);
        const data = await response.json();

        if (!data.success) {
            alert('Erro ao carregar resultados: ' + data.message);
            return;
        }

        dadosFamiliaResultado = data;

        // Preencher informações do cabeçalho
        document.getElementById('resultado-endereco').textContent =
            `${data.familia.nome_responsavel} - ${data.familia.endereco} - Microárea ${data.familia.microarea}`;

        // Preencher estatísticas
        document.getElementById('resultado-total-integrantes').textContent = data.estatisticas.total_integrantes;
        document.getElementById('resultado-total-triados').textContent = data.estatisticas.total_triados;
        document.getElementById('resultado-total-normais').textContent = data.estatisticas.total_normais;
        document.getElementById('resultado-total-hipertensos').textContent = data.estatisticas.total_hipertensos;

        // Configurar status e badge
        const statusContainer = document.getElementById('resultado-status-container');
        const statusBadge = document.getElementById('resultado-status-badge');
        const progressContainer = document.getElementById('resultado-progress-container');
        const progressBar = document.getElementById('resultado-progress-bar');
        const btnContinuarContainer = document.getElementById('resultado-btn-continuar-container');

        if (data.familia.status_rastreamento === 'CONCLUIDO') {
            statusContainer.className = 'mb-6 p-4 rounded-lg bg-green-50 border border-green-200';
            statusBadge.className = 'ml-2 px-3 py-1 rounded-full text-sm font-semibold bg-green-600 text-white';
            statusBadge.textContent = 'Triagem Completa';
            progressContainer.classList.add('hidden');
            btnContinuarContainer.classList.add('hidden');
        } else {
            statusContainer.className = 'mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200';
            statusBadge.className = 'ml-2 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-600 text-white';
            statusBadge.textContent = 'Triagem Incompleta';
            progressContainer.classList.remove('hidden');
            progressBar.style.width = `${data.estatisticas.percentual_completo}%`;
            btnContinuarContainer.classList.remove('hidden');
        }

        // Renderizar lista de integrantes
        renderizarIntegrantesResultado(data.integrantes);

        // Abrir modal
        document.getElementById('modal-visualizar-resultados').classList.remove('hidden');

    } catch (error) {
        console.error('Erro ao visualizar resultados:', error);
        alert('Erro ao carregar resultados. Verifique o console.');
    }
};

/**
 * Renderiza a lista de integrantes com seus resultados
 */
function renderizarIntegrantesResultado(integrantes) {
    const container = document.getElementById('resultado-integrantes-list');

    if (!integrantes || integrantes.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Nenhum integrante encontrado</p>';
        return;
    }

    container.innerHTML = integrantes.map(integrante => {
        const foiTriado = integrante.resultado_rastreamento !== null;

        if (!foiTriado) {
            // Integrante não triado
            return `
                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-semibold text-gray-800">${integrante.nome}</h4>
                            <p class="text-sm text-gray-600">${integrante.idade} anos - ${integrante.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
                        </div>
                        <span class="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-semibold">
                            Não Triado
                        </span>
                    </div>
                </div>
            `;
        }

        // Integrante triado - mostrar detalhes
        // Aceitar tanto nomenclatura antiga quanto nova
        const isHipertenso = ['HIPERTENSO', 'SUSPEITO_HAS'].includes(integrante.resultado_rastreamento);
        const borderColor = isHipertenso ? 'border-red-300' : 'border-teal-300';
        const bgColor = isHipertenso ? 'bg-red-50' : 'bg-teal-50';
        const badgeColor = isHipertenso ? 'bg-red-600' : 'bg-teal-600';
        const badgeText = isHipertenso ? 'Suspeito de HAS' : 'Não Hipertenso';

        // Renderizar aferições
        const afericoesHtml = integrante.afericoes && integrante.afericoes.length > 0
            ? integrante.afericoes.map(af => `
                <span class="inline-block px-2 py-1 bg-white border border-gray-200 rounded text-xs mr-2 mb-1">
                    Dia ${af.dia}: ${af.pas}/${af.pad}
                </span>
            `).join('')
            : '<span class="text-xs text-gray-500">Sem aferições registradas</span>';

        return `
            <div class="border ${borderColor} rounded-lg p-4 ${bgColor}">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h4 class="font-semibold text-gray-800">${integrante.nome}</h4>
                        <p class="text-sm text-gray-600">${integrante.idade} anos - ${integrante.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
                    </div>
                    <span class="px-3 py-1 ${badgeColor} text-white rounded-full text-xs font-semibold">
                        ${badgeText}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <p class="text-xs text-gray-600 mb-1">Média PA:</p>
                        <p class="text-lg font-bold ${isHipertenso ? 'text-red-700' : 'text-teal-700'}">
                            ${integrante.media_pas}/${integrante.media_pad} mmHg
                        </p>
                        <p class="text-xs text-gray-500">${integrante.numero_afericoes || 0} aferições</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600 mb-1">Classificação:</p>
                        <p class="text-sm font-semibold ${isHipertenso ? 'text-red-700' : 'text-teal-700'}">
                            ${integrante.classificacao_risco || 'Não classificado'}
                        </p>
                    </div>
                </div>

                <div>
                    <p class="text-xs text-gray-600 mb-2">Aferições Registradas:</p>
                    <div class="flex flex-wrap">
                        ${afericoesHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Fecha modal de resultados
 */
window.fecharModalResultados = function() {
    document.getElementById('modal-visualizar-resultados').classList.add('hidden');
    dadosFamiliaResultado = null;
};

/**
 * Continua triagem incompleta (abre modal de seleção de integrantes - carrinho)
 */
window.continuarTriagemIncompleta = function() {
    if (!dadosFamiliaResultado) {
        alert('Dados da família não encontrados');
        return;
    }

    // Salvar ID da família antes de fechar o modal (pois fecharModalResultados limpa dadosFamiliaResultado)
    const idFamilia = dadosFamiliaResultado.familia.id_familia;

    // Fechar modal de resultados
    fecharModalResultados();

    // Abrir modal de seleção de integrantes (carrinho) para adicionar ao rastreamento
    abrirModalSelecaoIntegrantes(idFamilia);
};
