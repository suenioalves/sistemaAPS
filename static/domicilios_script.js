/**
 * PAINEL DE DOMICÍLIOS E FAMÍLIAS - SCRIPT PRINCIPAL
 *
 * Este módulo ES6 gerencia toda a lógica do painel de domicílios e famílias.
 * Segue o padrão modular do sistema APS.
 *
 * FUNCIONALIDADES PRINCIPAIS:
 * - Busca e filtragem de domicílios (equipe, microárea, busca textual)
 * - Exibição de estatísticas em cards de resumo
 * - Renderização de tabela paginada de domicílios
 * - Visualização detalhada de famílias em modal
 * - Geração de PDFs individuais e em lote
 * - Sistema de paginação com navegação
 *
 * ARQUITETURA:
 * - Estado da aplicação gerenciado por variáveis locais
 * - Comunicação com backend via Fetch API
 * - Renderização dinâmica do DOM
 * - Event listeners para interatividade
 */

// ============================================================================
// ESPERAR CARREGAMENTO DO DOM
// ============================================================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Painel de Domicílios - Inicializando...');

    // ========================================================================
    // VARIÁVEIS DE ESTADO DA APLICAÇÃO
    // ========================================================================

    /**
     * Estado global do painel
     * Armazena dados e configurações atuais da aplicação
     */
    let estadoAtual = {
        // Dados carregados
        domicilios: [],                    // Lista de domicílios da página atual
        todasEquipes: [],                  // Lista de todas as equipes disponíveis

        // Filtros ativos
        equipeSelecionada: 'Todas',        // Equipe filtrada
        microareaSelecionada: 'Todas',     // Microárea filtrada
        termoBusca: '',                    // Texto de busca (endereço/família)
        statusFiltro: 'Todos',             // Status: Todos, Ativos, Inativos, Inconsistencias

        // Paginação
        paginaAtual: 1,                    // Página atual (começa em 1)
        registrosPorPagina: 10,            // Quantidade de registros por página
        totalRegistros: 0,                 // Total de registros (considerando filtros)
        totalPaginas: 0,                   // Total de páginas

        // Controle de modais
        domicilioAtualModal: null,         // Dados do domicílio exibido no modal
    };

    // ========================================================================
    // REFERÊNCIAS A ELEMENTOS DO DOM
    // ========================================================================

    /**
     * Cache de elementos DOM para melhor performance
     * Evita múltiplas queries ao DOM
     */
    const elementos = {
        // Filtros - Equipe
        equipeButton: document.getElementById('domicilio-equipe-button'),
        equipeDropdown: document.getElementById('domicilio-equipe-dropdown'),
        equipeDropdownContent: document.getElementById('domicilio-equipe-dropdown-content'),
        equipeButtonText: document.getElementById('domicilio-equipe-button-text'),

        // Filtros - Microárea
        microareaButton: document.getElementById('domicilio-microarea-button'),
        microareaDropdown: document.getElementById('domicilio-microarea-dropdown'),
        microareaDropdownContent: document.getElementById('domicilio-microarea-dropdown-content'),
        microareaButtonText: document.getElementById('domicilio-microarea-button-text'),

        // Filtro - Busca
        buscaInput: document.getElementById('domicilio-busca-input'),

        // Cards de resumo
        totalDomiciliosCard: document.getElementById('total-domicilios'),
        totalFamiliasCard: document.getElementById('total-familias'),
        totalCidadaosCard: document.getElementById('total-cidadaos'),
        mediaCidadaosCard: document.getElementById('media-cidadaos'),
        totalInconsistenciasCard: document.getElementById('total-inconsistencias'),

        // Abas de status
        statusTabs: document.querySelectorAll('.domicilio-status-tab-btn'),

        // Tabela de domicílios
        domiciliosContainer: document.getElementById('domicilios-container'),
        domiciliosTbody: document.getElementById('domicilios-tbody'),
        loadingDiv: document.getElementById('domicilios-loading'),

        // Checkbox de seleção
        selectAllCheckbox: document.getElementById('select-all-checkbox'),

        // Botões de ação
        selecionarTodos: document.getElementById('selecionar-todos-domicilios'),
        desmarcarTodos: document.getElementById('desmarcar-todos-domicilios'),
        gerarPdfLote: document.getElementById('gerar-pdf-lote'),
        exportarRelatorio: document.getElementById('exportar-relatorio'),

        // Paginação
        pageStart: document.getElementById('page-start'),
        pageEnd: document.getElementById('page-end'),
        totalRecords: document.getElementById('total-records'),
        pageInfo: document.getElementById('page-info'),
        btnPrimeiraPagina: document.getElementById('btn-primeira-pagina'),
        btnPaginaAnterior: document.getElementById('btn-pagina-anterior'),
        btnProximaPagina: document.getElementById('btn-proxima-pagina'),
        btnUltimaPagina: document.getElementById('btn-ultima-pagina'),

        // Modal - Visualizar Família
        modalVisualizarFamilia: document.getElementById('modal-visualizar-familia'),
        closeModalFamilia: document.getElementById('close-modal-familia'),
        btnFecharModalFamilia: document.getElementById('btn-fechar-modal-familia'),
        btnGerarPdfFamilia: document.getElementById('btn-gerar-pdf-familia'),
        modalEndereco: document.getElementById('modal-endereco'),
        modalEquipeMicroarea: document.getElementById('modal-equipe-microarea'),
        modalCodDomicilio: document.getElementById('modal-cod-domicilio'),
        modalCnsDomicilio: document.getElementById('modal-cns-domicilio'),
        modalMembrosTbody: document.getElementById('modal-membros-tbody'),

        // Modal - Editar Domicílio
        modalEditarDomicilio: document.getElementById('modal-editar-domicilio'),
        closeModalEditar: document.getElementById('close-modal-editar'),
        btnSalvarEdicao: document.getElementById('btn-salvar-edicao'),
        btnCancelarEdicao: document.getElementById('btn-cancelar-edicao'),
        formEditarDomicilio: document.getElementById('form-editar-domicilio'),
        editEndereco: document.getElementById('edit-endereco'),
        editEquipe: document.getElementById('edit-equipe'),
        editMicroarea: document.getElementById('edit-microarea'),
        editObservacoes: document.getElementById('edit-observacoes'),

        // Modal - Opções de PDF
        modalOpcoesPdf: document.getElementById('modal-opcoes-pdf'),
        closeModalOpcoesPdf: document.getElementById('close-modal-opcoes-pdf'),
        btnConfirmarGerarPdf: document.getElementById('btn-confirmar-gerar-pdf'),
        btnCancelarOpcoesPdf: document.getElementById('btn-cancelar-opcoes-pdf'),
        pdfTotalSelecionados: document.getElementById('pdf-total-selecionados'),
    };

    // ========================================================================
    // INICIALIZAÇÃO DO PAINEL
    // ========================================================================

    /**
     * Inicializa todos os componentes do painel
     * Ordem de execução:
     * 1. Configurar dropdowns customizados
     * 2. Carregar equipes do backend
     * 3. Configurar event listeners
     * 4. Carregar dados iniciais
     */
    function inicializarPainel() {
        console.log('Configurando componentes do painel...');

        // Configurar dropdowns customizados
        configurarDropdown(elementos.equipeButton, elementos.equipeDropdown);
        configurarDropdown(elementos.microareaButton, elementos.microareaDropdown);

        // Carregar dados de equipes
        carregarEquipes();

        // Configurar event listeners
        configurarEventListeners();

        // Carregar dados iniciais
        carregarDomicilios();
        carregarEstatisticas();
    }

    // ========================================================================
    // CONFIGURAÇÃO DE DROPDOWNS CUSTOMIZADOS
    // ========================================================================

    /**
     * Configura comportamento de dropdown customizado
     * @param {HTMLElement} button - Botão do dropdown
     * @param {HTMLElement} dropdown - Container do dropdown
     */
    function configurarDropdown(button, dropdown) {
        // Abrir/fechar dropdown ao clicar no botão
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');

            // Fechar outros dropdowns abertos
            document.querySelectorAll('[id$="-dropdown"]').forEach(dd => {
                if (dd !== dropdown) {
                    dd.classList.add('hidden');
                }
            });
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!button.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // ========================================================================
    // CONFIGURAÇÃO DE EVENT LISTENERS
    // ========================================================================

    /**
     * Configura todos os event listeners do painel
     * Organizado por categoria de funcionalidade
     */
    function configurarEventListeners() {
        // --- FILTROS ---

        // Busca textual (com debounce para evitar requisições excessivas)
        let timeoutBusca;
        elementos.buscaInput.addEventListener('input', function() {
            clearTimeout(timeoutBusca);
            timeoutBusca = setTimeout(() => {
                estadoAtual.termoBusca = this.value.trim();
                estadoAtual.paginaAtual = 1; // Resetar para primeira página
                carregarDomicilios();
            }, 500); // Aguardar 500ms após parar de digitar
        });

        // Abas de status
        elementos.statusTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const novoStatus = this.getAttribute('data-status-filter');
                ativarAbaStatus(this);
                estadoAtual.statusFiltro = novoStatus;
                estadoAtual.paginaAtual = 1;
                carregarDomicilios();
                atualizarCardsResumo(); // Atualizar cards conforme filtro
            });
        });

        // --- SELEÇÃO DE DOMICÍLIOS ---

        // Checkbox "Selecionar todos"
        elementos.selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('input[name="domicilio-checkbox"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });

        // Botão "Selecionar Todos"
        elementos.selecionarTodos.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="domicilio-checkbox"]');
            checkboxes.forEach(cb => cb.checked = true);
            elementos.selectAllCheckbox.checked = true;
        });

        // Botão "Desmarcar Todos"
        elementos.desmarcarTodos.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="domicilio-checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
            elementos.selectAllCheckbox.checked = false;
        });

        // --- AÇÕES EM LOTE ---

        // Gerar PDF em lote dos domicílios selecionados
        elementos.gerarPdfLote.addEventListener('click', gerarPdfLote);

        // Exportar relatório completo
        elementos.exportarRelatorio.addEventListener('click', exportarRelatorio);

        // --- PAGINAÇÃO ---

        elementos.btnPrimeiraPagina.addEventListener('click', () => {
            if (estadoAtual.paginaAtual > 1) {
                estadoAtual.paginaAtual = 1;
                carregarDomicilios();
            }
        });

        elementos.btnPaginaAnterior.addEventListener('click', () => {
            if (estadoAtual.paginaAtual > 1) {
                estadoAtual.paginaAtual--;
                carregarDomicilios();
            }
        });

        elementos.btnProximaPagina.addEventListener('click', () => {
            if (estadoAtual.paginaAtual < estadoAtual.totalPaginas) {
                estadoAtual.paginaAtual++;
                carregarDomicilios();
            }
        });

        elementos.btnUltimaPagina.addEventListener('click', () => {
            if (estadoAtual.paginaAtual < estadoAtual.totalPaginas) {
                estadoAtual.paginaAtual = estadoAtual.totalPaginas;
                carregarDomicilios();
            }
        });

        // --- MODAIS ---

        // Modal Visualizar Família - Fechar
        elementos.closeModalFamilia.addEventListener('click', fecharModalFamilia);
        elementos.btnFecharModalFamilia.addEventListener('click', fecharModalFamilia);

        // Modal Visualizar Família - Gerar PDF
        elementos.btnGerarPdfFamilia.addEventListener('click', () => {
            if (estadoAtual.domicilioAtualModal) {
                gerarPdfFamilia(estadoAtual.domicilioAtualModal);
            }
        });

        // Modal Editar - Fechar
        elementos.closeModalEditar.addEventListener('click', fecharModalEditar);
        elementos.btnCancelarEdicao.addEventListener('click', fecharModalEditar);

        // Modal Editar - Salvar
        elementos.btnSalvarEdicao.addEventListener('click', salvarEdicaoDomicilio);

        // Modal Opções PDF - Fechar
        elementos.closeModalOpcoesPdf.addEventListener('click', fecharModalOpcoesPdf);
        elementos.btnCancelarOpcoesPdf.addEventListener('click', fecharModalOpcoesPdf);

        // Modal Opções PDF - Confirmar
        elementos.btnConfirmarGerarPdf.addEventListener('click', confirmarGerarPdfLote);

        // Fechar modais ao clicar no overlay
        elementos.modalVisualizarFamilia.addEventListener('click', function(e) {
            if (e.target === this) fecharModalFamilia();
        });

        elementos.modalEditarDomicilio.addEventListener('click', function(e) {
            if (e.target === this) fecharModalEditar();
        });
    }

    // ========================================================================
    // FUNÇÕES DE COMUNICAÇÃO COM BACKEND (API)
    // ========================================================================

    /**
     * Carrega lista de equipes e microáreas do backend
     * Popula os dropdowns de filtro
     */
    async function carregarEquipes() {
        try {
            console.log('Carregando equipes...');
            // TODO: Implementar endpoint /api/equipes
            const response = await fetch('/api/equipes');

            if (!response.ok) {
                throw new Error('Erro ao carregar equipes');
            }

            const data = await response.json();
            estadoAtual.todasEquipes = data.equipes || [];

            // Renderizar dropdown de equipes
            renderizarDropdownEquipes();

        } catch (error) {
            console.error('Erro ao carregar equipes:', error);
            mostrarMensagemErro('Erro ao carregar equipes');
        }
    }

    /**
     * Carrega lista de domicílios do backend
     * Aplica filtros ativos e paginação
     */
    async function carregarDomicilios() {
        try {
            console.log('Carregando domicílios...');

            // Mostrar loading
            elementos.loadingDiv.classList.remove('hidden');
            elementos.domiciliosContainer.classList.add('hidden');

            // Construir query string com parâmetros de filtro
            const params = new URLSearchParams({
                equipe: estadoAtual.equipeSelecionada,
                microarea: estadoAtual.microareaSelecionada,
                search: estadoAtual.termoBusca,
                status: estadoAtual.statusFiltro,
                page: estadoAtual.paginaAtual,
                limit: estadoAtual.registrosPorPagina
            });

            const response = await fetch(`/api/domicilios/list?${params}`);

            if (!response.ok) {
                throw new Error('Erro ao carregar domicílios');
            }

            const data = await response.json();

            // Atualizar estado
            estadoAtual.domicilios = data.domicilios || [];
            estadoAtual.totalRegistros = data.total || 0;
            estadoAtual.totalPaginas = Math.ceil(estadoAtual.totalRegistros / estadoAtual.registrosPorPagina);

            // Renderizar tabela
            renderizarTabelaDomicilios();

            // Atualizar paginação
            atualizarPaginacao();

            // Ocultar loading
            elementos.loadingDiv.classList.add('hidden');
            elementos.domiciliosContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao carregar domicílios:', error);
            mostrarMensagemErro('Erro ao carregar domicílios');
            elementos.loadingDiv.classList.add('hidden');
        }
    }

    /**
     * Carrega estatísticas gerais para os cards de resumo
     */
    async function carregarEstatisticas() {
        try {
            console.log('Carregando estatísticas...');

            // Construir query com filtros ativos
            const params = new URLSearchParams({
                equipe: estadoAtual.equipeSelecionada,
                microarea: estadoAtual.microareaSelecionada,
                status: estadoAtual.statusFiltro
            });

            const response = await fetch(`/api/domicilios/stats?${params}`);

            if (!response.ok) {
                throw new Error('Erro ao carregar estatísticas');
            }

            const data = await response.json();
            const stats = data.stats || {};

            // Atualizar cards de resumo
            elementos.totalDomiciliosCard.textContent = stats.total_domicilios || 0;
            elementos.totalFamiliasCard.textContent = stats.total_familias || 0;
            elementos.totalCidadaosCard.textContent = stats.total_cidadaos || 0;

            // Converter para número antes de usar toFixed
            const media = parseFloat(stats.media_por_domicilio || 0);
            elementos.mediaCidadaosCard.textContent = media.toFixed(1);

            elementos.totalInconsistenciasCard.textContent = stats.inconsistencias || 0;

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            // Não mostrar erro ao usuário, apenas logar
        }
    }

    /**
     * Carrega detalhes de uma família específica
     * @param {number} codDomicilio - Código do domicílio
     */
    async function carregarDetalhesFamilia(codDomicilio) {
        try {
            console.log(`Carregando família do domicílio ${codDomicilio}...`);

            const response = await fetch(`/api/domicilios/${codDomicilio}/familia`);

            if (!response.ok) {
                throw new Error('Erro ao carregar detalhes da família');
            }

            const data = await response.json();

            if (!data.sucesso) {
                throw new Error(data.erro || 'Erro desconhecido');
            }

            // Armazenar no estado e abrir modal
            estadoAtual.domicilioAtualModal = data;
            abrirModalVisualizarFamilia(data);

        } catch (error) {
            console.error('Erro ao carregar família:', error);
            mostrarMensagemErro('Erro ao carregar detalhes da família');
        }
    }

    // ========================================================================
    // FUNÇÕES DE RENDERIZAÇÃO DO DOM
    // ========================================================================

    /**
     * Renderiza dropdown de equipes
     * Cria lista de opções baseada em estadoAtual.todasEquipes
     */
    function renderizarDropdownEquipes() {
        const content = elementos.equipeDropdownContent;
        content.innerHTML = '';

        // Opção "Todas"
        const opcaoTodas = criarOpcaoDropdown('Todas as equipes', 'Todas', () => {
            selecionarEquipe('Todas', 'Todas as equipes');
        });
        content.appendChild(opcaoTodas);

        // Opções individuais de equipes
        estadoAtual.todasEquipes.forEach(equipe => {
            const opcao = criarOpcaoDropdown(equipe.nome, equipe.nome, () => {
                selecionarEquipe(equipe.nome, equipe.nome);
            });
            content.appendChild(opcao);
        });
    }

    /**
     * Renderiza dropdown de microáreas
     * Baseado na equipe selecionada
     */
    function renderizarDropdownMicroareas() {
        const content = elementos.microareaDropdownContent;
        content.innerHTML = '';

        // Opção "Todas"
        const opcaoTodas = criarOpcaoDropdown('Todas as microáreas', 'Todas', () => {
            selecionarMicroarea('Todas', 'Todas as microáreas');
        });
        content.appendChild(opcaoTodas);

        // Se uma equipe específica está selecionada, mostrar suas microáreas
        if (estadoAtual.equipeSelecionada !== 'Todas') {
            const equipeSelecionada = estadoAtual.todasEquipes.find(
                e => e.nome === estadoAtual.equipeSelecionada
            );

            if (equipeSelecionada && equipeSelecionada.microareas) {
                equipeSelecionada.microareas.forEach(microarea => {
                    const opcao = criarOpcaoDropdown(microarea, microarea, () => {
                        selecionarMicroarea(microarea, microarea);
                    });
                    content.appendChild(opcao);
                });
            }
        }
    }

    /**
     * Cria elemento de opção para dropdown
     * @param {string} texto - Texto exibido
     * @param {string} valor - Valor da opção
     * @param {Function} onClick - Callback ao clicar
     * @returns {HTMLElement} Elemento da opção
     */
    function criarOpcaoDropdown(texto, valor, onClick) {
        const div = document.createElement('div');
        div.className = 'px-3 py-2 hover:bg-gray-100 cursor-pointer rounded text-sm';
        div.textContent = texto;
        div.addEventListener('click', onClick);
        return div;
    }

    /**
     * Renderiza tabela de domicílios
     * Popula tbody com dados de estadoAtual.domicilios
     */
    function renderizarTabelaDomicilios() {
        const tbody = elementos.domiciliosTbody;
        tbody.innerHTML = '';

        if (estadoAtual.domicilios.length === 0) {
            // Mensagem quando não há dados
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="ri-home-4-line text-4xl mb-2"></i>
                        <p>Nenhum domicílio encontrado</p>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
            return;
        }

        // Renderizar cada domicílio
        estadoAtual.domicilios.forEach(domicilio => {
            const tr = criarLinhaDomicilio(domicilio);
            tbody.appendChild(tr);
        });
    }

    /**
     * Função auxiliar para obter ícone e cor baseado em idade e sexo
     */
    function obterIconeResponsavel(idade, sexo) {
        idade = parseInt(idade) || 0;
        const sexoUpper = (sexo || '').toUpperCase();
        const isFeminino = sexoUpper.includes('FEMININO') || sexoUpper.includes('F');

        let icone = '';
        let cor = '';

        if (idade < 2) {
            icone = 'ri-baby-line';
            cor = 'text-pink-500';
        } else if (idade < 12) {
            icone = 'ri-user-smile-line';
            cor = 'text-purple-500';
        } else if (idade < 65) {
            icone = isFeminino ? 'ri-user-3-line' : 'ri-user-line';
            cor = isFeminino ? 'text-pink-600' : 'text-blue-600';
        } else {
            icone = isFeminino ? 'ri-user-3-line' : 'ri-user-line';
            cor = 'text-orange-600';
        }

        return { icone, cor };
    }

    /**
     * Cria elemento TR (linha) para um domicílio
     * @param {Object} domicilio - Dados do domicílio
     * @returns {HTMLElement} Elemento TR
     */
    function criarLinhaDomicilio(domicilio) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';

        // Determinar status baseado nos dados
        let status = 'ativo';
        if (!domicilio.tem_responsavel || domicilio.tem_responsavel === 0) {
            status = 'inconsistencia';
        } else if (domicilio.total_integrantes === 0) {
            status = 'inativo';
        }

        const statusBadge = obterBadgeStatus(status);

        // Processar responsáveis
        let responsaveisHtml = '<span class="text-gray-400 text-xs">Nenhum responsável cadastrado</span>';
        if (domicilio.responsaveis_info) {
            const responsaveis = domicilio.responsaveis_info.split(';;').filter(r => r && r.trim());
            if (responsaveis.length > 0) {
                responsaveisHtml = responsaveis.map(resp => {
                    const [nome, idade, sexo] = resp.split('|');
                    const { icone, cor } = obterIconeResponsavel(idade, sexo);
                    return `
                        <div class="flex items-center space-x-1.5 py-0.5">
                            <i class="${icone} ${cor} text-base"></i>
                            <span class="text-xs text-gray-900">${nome || 'Sem nome'}, ${idade || '0'} anos</span>
                        </div>
                    `;
                }).join('');
            }
        }

        tr.innerHTML = `
            <td class="px-4 py-4 whitespace-nowrap align-top">
                <input type="checkbox" name="domicilio-checkbox" value="${domicilio.id_domicilio}"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
            </td>
            <td class="px-4 py-4 align-top">
                <div class="flex items-start space-x-2">
                    <i class="ri-home-4-line text-blue-600 text-lg mt-0.5"></i>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${domicilio.endereco_completo || '-'}</div>
                        <div class="text-xs text-gray-500 mt-0.5">${domicilio.bairro || ''} ${domicilio.cep ? '- CEP: ' + domicilio.cep : ''}</div>
                        <div class="text-xs text-gray-600 mt-1">
                            <span class="font-medium">Equipe:</span> ${domicilio.equipes || '-'} -
                            <span class="font-medium">Microárea:</span> ${domicilio.microareas || '-'}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-4 align-top">
                ${responsaveisHtml}
            </td>
            <td class="px-4 py-4 text-center align-top">
                <div class="text-xs text-gray-900">
                    <div class="font-medium">Nº de famílias: ${domicilio.total_familias || 0}</div>
                    <div class="text-gray-600 mt-0.5">Nº de cidadãos: ${domicilio.total_integrantes || 0}</div>
                </div>
            </td>
            <td class="px-4 py-4 text-center whitespace-nowrap align-top">
                ${statusBadge}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                <div class="flex justify-end space-x-2">
                    <button class="btn-visualizar text-blue-600 hover:text-blue-900" data-cod="${domicilio.id_domicilio}" title="Visualizar família">
                        <i class="ri-eye-line text-lg"></i>
                    </button>
                    <button class="btn-gerar-pdf text-green-600 hover:text-green-900" data-cod="${domicilio.id_domicilio}" title="Gerar PDF">
                        <i class="ri-file-pdf-line text-lg"></i>
                    </button>
                    <button class="btn-editar text-amber-600 hover:text-amber-900" data-cod="${domicilio.id_domicilio}" title="Editar">
                        <i class="ri-edit-line text-lg"></i>
                    </button>
                </div>
            </td>
        `;

        // Event listeners para botões de ação
        const btnVisualizar = tr.querySelector('.btn-visualizar');
        const btnGerarPdf = tr.querySelector('.btn-gerar-pdf');
        const btnEditar = tr.querySelector('.btn-editar');

        btnVisualizar.addEventListener('click', () => carregarDetalhesFamilia(domicilio.id_domicilio));
        btnGerarPdf.addEventListener('click', () => gerarPdfFamilia(domicilio));
        btnEditar.addEventListener('click', () => abrirModalEditar(domicilio));

        return tr;
    }

    /**
     * Retorna HTML de badge de status
     * @param {string} status - Status do domicílio
     * @returns {string} HTML do badge
     */
    function obterBadgeStatus(status) {
        const badges = {
            'ativo': '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>',
            'inativo': '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inativo</span>',
            'inconsistencia': '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inconsistência</span>',
        };
        return badges[status] || badges['ativo'];
    }

    // ========================================================================
    // FUNÇÕES DE INTERAÇÃO COM FILTROS
    // ========================================================================

    /**
     * Seleciona uma equipe no filtro
     * @param {string} valor - Valor da equipe
     * @param {string} texto - Texto a exibir
     */
    function selecionarEquipe(valor, texto) {
        estadoAtual.equipeSelecionada = valor;
        elementos.equipeButtonText.textContent = texto;
        elementos.equipeDropdown.classList.add('hidden');

        // Resetar microárea quando trocar equipe
        estadoAtual.microareaSelecionada = 'Todas';
        elementos.microareaButtonText.textContent = 'Todas as microáreas';

        // Atualizar dropdown de microáreas
        renderizarDropdownMicroareas();

        // Recarregar dados
        estadoAtual.paginaAtual = 1;
        carregarDomicilios();
        carregarEstatisticas();
    }

    /**
     * Seleciona uma microárea no filtro
     * @param {string} valor - Valor da microárea
     * @param {string} texto - Texto a exibir
     */
    function selecionarMicroarea(valor, texto) {
        estadoAtual.microareaSelecionada = valor;
        elementos.microareaButtonText.textContent = texto;
        elementos.microareaDropdown.classList.add('hidden');

        // Recarregar dados
        estadoAtual.paginaAtual = 1;
        carregarDomicilios();
        carregarEstatisticas();
    }

    /**
     * Ativa uma aba de status
     * @param {HTMLElement} tab - Elemento da aba clicada
     */
    function ativarAbaStatus(tab) {
        // Remover classe active de todas as abas
        elementos.statusTabs.forEach(t => {
            t.classList.remove('active', 'text-blue-600', 'border-blue-500');
            t.classList.add('text-gray-700', 'border-transparent');
        });

        // Adicionar classe active na aba clicada
        tab.classList.add('active', 'text-blue-600', 'border-blue-500');
        tab.classList.remove('text-gray-700', 'border-transparent');
    }

    /**
     * Atualiza cards de resumo considerando filtros ativos
     */
    function atualizarCardsResumo() {
        // Recarregar estatísticas com filtros atuais
        carregarEstatisticas();
    }

    // ========================================================================
    // FUNÇÕES DE PAGINAÇÃO
    // ========================================================================

    /**
     * Atualiza elementos visuais da paginação
     */
    function atualizarPaginacao() {
        const inicio = (estadoAtual.paginaAtual - 1) * estadoAtual.registrosPorPagina + 1;
        const fim = Math.min(estadoAtual.paginaAtual * estadoAtual.registrosPorPagina, estadoAtual.totalRegistros);

        elementos.pageStart.textContent = estadoAtual.totalRegistros > 0 ? inicio : 0;
        elementos.pageEnd.textContent = fim;
        elementos.totalRecords.textContent = estadoAtual.totalRegistros;
        elementos.pageInfo.textContent = `Página ${estadoAtual.paginaAtual} de ${estadoAtual.totalPaginas || 1}`;

        // Habilitar/desabilitar botões
        elementos.btnPrimeiraPagina.disabled = estadoAtual.paginaAtual === 1;
        elementos.btnPaginaAnterior.disabled = estadoAtual.paginaAtual === 1;
        elementos.btnProximaPagina.disabled = estadoAtual.paginaAtual >= estadoAtual.totalPaginas;
        elementos.btnUltimaPagina.disabled = estadoAtual.paginaAtual >= estadoAtual.totalPaginas;
    }

    // ========================================================================
    // FUNÇÕES DE MODAIS
    // ========================================================================

    /**
     * Abre modal de visualização de família
     * @param {Object} data - Dados da família e domicílio retornados pela API
     */
    function abrirModalVisualizarFamilia(data) {
        const domicilio = data.domicilio || {};
        const familias = data.familias || [];

        // Preencher informações do domicílio
        elementos.modalEndereco.textContent = domicilio.endereco_completo || '-';

        // Pegar equipe/microarea do primeiro membro da primeira família
        let equipeMicroarea = '-';
        if (familias.length > 0 && familias[0].membros.length > 0) {
            const primeiroMembro = familias[0].membros[0];
            equipeMicroarea = `${primeiroMembro.equipe || '-'} / ${primeiroMembro.microarea || '-'}`;
        }
        elementos.modalEquipeMicroarea.textContent = `Equipe/Microárea: ${equipeMicroarea}`;

        elementos.modalCodDomicilio.textContent = domicilio.id_domicilio || '-';
        elementos.modalCnsDomicilio.textContent = `Renda: ${familias.length > 0 ? (familias[0].renda_familiar || '-') : '-'}`;

        // Determinar equipe e microárea predominantes do domicílio (dos responsáveis)
        let equipePredominante = null;
        let microareaPredominante = null;
        if (familias.length > 0) {
            const responsaveis = familias.flatMap(f => f.membros.filter(m => m.eh_responsavel === 1));
            if (responsaveis.length > 0) {
                equipePredominante = responsaveis[0].equipe;
                microareaPredominante = responsaveis[0].microarea;
            }
        }

        // Pegar container para substituir conteúdo
        const container = document.getElementById('container-familias');
        if (!container) {
            console.error('Container familias não encontrado');
            return;
        }

        // Criar container de famílias
        let familiasHtml = '';

        if (familias.length === 0) {
            familiasHtml = '<div class="text-center py-8 text-gray-500">Nenhuma família cadastrada</div>';
        } else {
            familias.forEach((familia, index) => {
                const responsavel = familia.membros.find(m => m.eh_responsavel === 1);
                const nomeFamilia = responsavel ? responsavel.nome : (familia.membros[0]?.nome || 'Família sem nome');

                familiasHtml += `
                    <div class="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <!-- Cabeçalho da Família -->
                        <div class="bg-blue-50 border-b border-blue-200 px-4 py-3">
                            <div class="flex items-center justify-between">
                                <h4 class="font-bold text-gray-900">Família de ${nomeFamilia}</h4>
                                <div class="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>Nº prontuário: ${familia.id_familia || 'Não informado'}</span>
                                    <span>Renda: ${familia.renda_familiar || 'Não informado'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Membros da Família -->
                        <div class="p-4 space-y-3">
                            ${familia.membros.map(membro => {
                                const isResponsavel = membro.eh_responsavel === 1;
                                const idade = parseInt(membro.idade) || 0;
                                const sexo = (membro.sexo || '').toUpperCase();
                                const isFeminino = sexo.includes('FEMININO') || sexo.includes('F');

                                // Determinar ícone e cor baseado em idade e sexo
                                let icone = '';
                                let corIcone = '';
                                let labelIdade = '';
                                let corBadge = '';

                                if (idade < 2) {
                                    // Bebê (0-1 ano)
                                    icone = 'ri-baby-line';
                                    corIcone = 'text-pink-500';
                                    labelIdade = 'Bebê';
                                    corBadge = 'bg-pink-100 text-pink-700';
                                } else if (idade < 12) {
                                    // Criança (2-11 anos)
                                    icone = 'ri-user-smile-line';
                                    corIcone = 'text-purple-500';
                                    labelIdade = 'Criança';
                                    corBadge = 'bg-purple-100 text-purple-700';
                                } else if (idade < 65) {
                                    // Adulto (12-64 anos)
                                    icone = isFeminino ? 'ri-user-3-line' : 'ri-user-line';
                                    corIcone = isFeminino ? 'text-pink-600' : 'text-blue-600';
                                    labelIdade = 'Adulto';
                                    corBadge = isFeminino ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700';
                                } else {
                                    // Idoso (65+ anos)
                                    icone = isFeminino ? 'ri-user-3-line' : 'ri-user-line';
                                    corIcone = 'text-orange-600';
                                    labelIdade = 'Idoso';
                                    corBadge = 'bg-orange-100 text-orange-700';
                                }

                                // Verificar se equipe/microárea diferem do domicílio
                                const equipeDiferente = membro.equipe && equipePredominante && membro.equipe !== equipePredominante;
                                const microareaDiferente = membro.microarea && microareaPredominante && membro.microarea !== microareaPredominante;
                                const temInconsistencia = equipeDiferente || microareaDiferente;

                                // Estilo de borda se houver inconsistência
                                const bordaClasse = temInconsistencia ? 'border-2 border-yellow-400 bg-yellow-50' : (isResponsavel ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200');

                                console.log(`Membro: ${membro.nome}, Equipe: ${membro.equipe}, MicroArea: ${membro.microarea}`);

                                return `
                                    <div class="${bordaClasse} rounded-lg p-3 relative">
                                        ${temInconsistencia ? '<div class="absolute top-2 right-2"><i class="ri-alert-line text-yellow-600 text-xl"></i></div>' : ''}
                                        <div class="flex items-start space-x-3">
                                            <!-- Ícone representativo -->
                                            <div class="flex-shrink-0 mt-1">
                                                <i class="${icone} ${corIcone} text-3xl"></i>
                                            </div>

                                            <!-- Informações do membro -->
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2 mb-1 flex-wrap">
                                                    ${isResponsavel ? '<span class="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Responsável familiar</span>' : ''}
                                                    <span class="px-2 py-1 ${corBadge} text-xs font-semibold rounded-full">
                                                        ${labelIdade}
                                                    </span>
                                                </div>
                                                <p class="font-semibold text-gray-900">${membro.nome || '-'}</p>
                                                <p class="text-sm text-gray-600">
                                                    ${membro.sexo || '-'} |
                                                    ${membro.idade || '-'} anos |
                                                    Nasceu em ${membro.data_nascimento || '-'}
                                                </p>
                                                <p class="text-xs text-gray-500 mt-1">
                                                    CPF: ${membro.cpf || '-'}
                                                </p>
                                                <div class="mt-2 flex items-center gap-3 text-xs">
                                                    <span class="${equipeDiferente ? 'text-red-600 font-semibold' : 'text-gray-600'}">
                                                        <i class="ri-team-line"></i> Equipe: ${membro.equipe || '-'}
                                                    </span>
                                                    <span class="${microareaDiferente ? 'text-red-600 font-semibold' : 'text-gray-600'}">
                                                        <i class="ri-map-pin-line"></i> Microárea: ${membro.microarea || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            });
        }

        // Substituir conteúdo com scroll
        container.innerHTML = `
            <div>
                <h4 class="text-lg font-medium text-gray-900 mb-3">
                    Famílias e Cidadãos do Imóvel
                </h4>
                <div class="max-h-96 overflow-y-auto pr-2">
                    ${familiasHtml}
                </div>
            </div>
        `;

        // Exibir modal
        elementos.modalVisualizarFamilia.classList.remove('hidden');
    }

    /**
     * Fecha modal de visualização de família
     */
    function fecharModalFamilia() {
        elementos.modalVisualizarFamilia.classList.add('hidden');
        estadoAtual.domicilioAtualModal = null;
    }

    /**
     * Abre modal de edição de domicílio
     * @param {Object} domicilio - Dados do domicílio
     */
    function abrirModalEditar(domicilio) {
        // Preencher formulário com dados atuais
        elementos.editEndereco.value = domicilio.endereco_completo || '';
        elementos.editObservacoes.value = domicilio.observacoes || '';

        // TODO: Preencher selects de equipe e microárea

        // Armazenar domicílio sendo editado
        estadoAtual.domicilioAtualModal = domicilio;

        // Exibir modal
        elementos.modalEditarDomicilio.classList.remove('hidden');
    }

    /**
     * Fecha modal de edição
     */
    function fecharModalEditar() {
        elementos.modalEditarDomicilio.classList.add('hidden');
        elementos.formEditarDomicilio.reset();
        estadoAtual.domicilioAtualModal = null;
    }

    /**
     * Salva edição de domicílio
     * Envia dados atualizados para o backend
     */
    async function salvarEdicaoDomicilio() {
        try {
            const codDomicilio = estadoAtual.domicilioAtualModal.cod_domicilio;

            const dadosAtualizados = {
                endereco: elementos.editEndereco.value,
                equipe: elementos.editEquipe.value,
                microarea: elementos.editMicroarea.value,
                observacoes: elementos.editObservacoes.value
            };

            // TODO: Implementar endpoint PUT /api/domicilios/:id
            const response = await fetch(`/api/domicilios/${codDomicilio}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar domicílio');
            }

            // Recarregar dados
            carregarDomicilios();
            fecharModalEditar();
            mostrarMensagemSucesso('Domicílio atualizado com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar domicílio:', error);
            mostrarMensagemErro('Erro ao salvar domicílio');
        }
    }

    // ========================================================================
    // FUNÇÕES DE GERAÇÃO DE PDF
    // ========================================================================

    /**
     * Gera PDF de uma família específica
     * @param {Object} domicilio - Dados do domicílio e família
     */
    /**
     * Gera PDF com informações completas do domicílio e famílias
     * Chamado ao clicar no botão "Gerar PDF" na tabela ou no modal
     */
    async function gerarPdfFamilia(domicilio) {
        try {
            console.log('Gerando PDF do domicílio...', domicilio);

            // Buscar dados completos do domicílio (com famílias)
            const response = await fetch(`/api/domicilios/${domicilio.id_domicilio}/familia`);
            const data = await response.json();

            if (!data.sucesso) {
                throw new Error(data.erro || 'Erro ao buscar dados do domicílio');
            }

            const domicilioCompleto = data.domicilio;
            const familias = data.familias || [];

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape (paisagem)
            const pageWidth = 297; // Largura em paisagem (A4)
            const pageHeight = 210; // Altura em paisagem (A4)
            const margin = 10;
            let currentY = 20;

            // ==== CABEÇALHO ====
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(29, 112, 184); // Azul
            doc.text('FICHA DO DOMICÍLIO', pageWidth / 2, currentY, { align: 'center' });

            currentY += 10;
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('Sistema de Atenção Primária à Saúde', pageWidth / 2, currentY, { align: 'center' });

            currentY += 12;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, currentY, pageWidth - margin, currentY);

            // ==== INFORMAÇÕES DO DOMICÍLIO ====
            currentY += 10;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Informações do Domicílio', margin, currentY);

            currentY += 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            // Endereço
            doc.setFont("helvetica", "bold");
            doc.text('Endereço:', margin, currentY);
            doc.setFont("helvetica", "normal");
            const enderecoText = domicilioCompleto.endereco_completo || 'Não informado';
            const splitEndereco = doc.splitTextToSize(enderecoText, pageWidth - margin - 40);
            doc.text(splitEndereco, margin + 25, currentY);
            currentY += (splitEndereco.length * 5) + 3;

            // Bairro e CEP
            if (domicilioCompleto.bairro || domicilioCompleto.cep) {
                doc.setFont("helvetica", "bold");
                doc.text('Bairro/CEP:', margin, currentY);
                doc.setFont("helvetica", "normal");
                doc.text(`${domicilioCompleto.bairro || '-'} - CEP: ${domicilioCompleto.cep || '-'}`, margin + 25, currentY);
                currentY += 6;
            }

            // Equipe
            if (domicilioCompleto.equipes) {
                doc.setFont("helvetica", "bold");
                doc.text('Equipe:', margin, currentY);
                doc.setFont("helvetica", "normal");
                doc.text(`${domicilioCompleto.equipes}`, margin + 25, currentY);
                currentY += 6;
            }

            // Microárea
            if (domicilioCompleto.microareas) {
                doc.setFont("helvetica", "bold");
                doc.text('Microárea:', margin, currentY);
                doc.setFont("helvetica", "normal");
                doc.text(`${domicilioCompleto.microareas}`, margin + 25, currentY);
                currentY += 6;
            }

            // Código do domicílio
            doc.setFont("helvetica", "bold");
            doc.text('Código:', margin, currentY);
            doc.setFont("helvetica", "normal");
            doc.text(`${domicilioCompleto.id_domicilio || '-'}`, margin + 25, currentY);

            // Resumo
            currentY += 8;
            doc.setFillColor(240, 248, 255);
            doc.rect(margin, currentY, pageWidth - (margin * 2), 12, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(`Total de Famílias: ${familias.length}`, margin + 5, currentY + 8);
            const totalCidadaos = familias.reduce((sum, fam) => sum + fam.membros.length, 0);
            doc.text(`Total de Cidadãos: ${totalCidadaos}`, margin + 80, currentY + 8);

            currentY += 18;

            // Determinar equipe e microárea predominante do domicílio
            const equipesCount = {};
            const microareasCount = {};
            familias.forEach(fam => {
                fam.membros.forEach(m => {
                    if (m.equipe) {
                        equipesCount[m.equipe] = (equipesCount[m.equipe] || 0) + 1;
                    }
                    if (m.microarea) {
                        microareasCount[m.microarea] = (microareasCount[m.microarea] || 0) + 1;
                    }
                });
            });

            const equipePredominante = Object.keys(equipesCount).reduce((a, b) =>
                equipesCount[a] > equipesCount[b] ? a : b, null);
            const microareaPredominante = Object.keys(microareasCount).reduce((a, b) =>
                microareasCount[a] > microareasCount[b] ? a : b, null);

            // ==== FAMÍLIAS E MEMBROS ====
            familias.forEach((familia, index) => {
                // Verificar se precisa de nova página
                if (currentY > 180) { // Ajustado para paisagem
                    doc.addPage();
                    currentY = 20;
                }

                // Encontrar responsável
                const responsavel = familia.membros.find(m => m.eh_responsavel === 1);
                const nomeFamilia = responsavel ? responsavel.nome : (familia.membros[0]?.nome || 'Família sem nome');

                // Cabeçalho da família
                doc.setFillColor(29, 112, 184);
                doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(255, 255, 255);
                doc.text(`Família ${index + 1}: ${nomeFamilia}`, margin + 3, currentY + 6.5);

                currentY += 12;

                // Informações da família
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                doc.setFont("helvetica", "normal");
                doc.text(`Prontuário: ${familia.id_familia || 'Não informado'} | Renda Familiar: ${familia.renda_familiar || 'Não informado'}`, margin + 2, currentY);

                currentY += 6;

                // Tabela de membros com novas colunas
                const membrosData = familia.membros.map(membro => {
                    // Determinar sexo (F ou M)
                    const sexoCompleto = (membro.sexo || '').toUpperCase();
                    let sexoAbreviado = '-';
                    if (sexoCompleto.includes('FEMININO') || sexoCompleto.includes('F')) {
                        sexoAbreviado = 'F';
                    } else if (sexoCompleto.includes('MASCULINO') || sexoCompleto.includes('M')) {
                        sexoAbreviado = 'M';
                    }

                    // Priorizar CPF, senão CNS
                    let cpfCns = '-';
                    if (membro.cpf) {
                        cpfCns = String(membro.cpf);
                    } else if (membro.cns) {
                        cpfCns = String(membro.cns);
                    }

                    return [
                        membro.nome || '-',
                        sexoAbreviado,
                        membro.idade || '0',
                        cpfCns,
                        membro.equipe || '-',
                        membro.microarea || '-',
                        '' // Coluna observação em branco
                    ];
                });

                doc.autoTable({
                    startY: currentY,
                    head: [['Nome', 'Sexo', 'Idade', 'CPF/CNS', 'Equipe', 'Microárea', 'Observação']],
                    body: membrosData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [70, 130, 180],
                        textColor: 255,
                        fontSize: 8,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 7,
                        textColor: 50
                    },
                    columnStyles: {
                        0: { cellWidth: 80 }, // Nome
                        1: { cellWidth: 15, halign: 'center' }, // Sexo
                        2: { cellWidth: 18, halign: 'center' }, // Idade
                        3: { cellWidth: 35, halign: 'center' }, // CPF/CNS
                        4: { cellWidth: 50 }, // Equipe
                        5: { cellWidth: 25, halign: 'center' }, // Microárea
                        6: { cellWidth: 50 } // Observação
                    },
                    margin: { left: margin, right: margin },
                    didParseCell: function(data) {
                        // Colorir linha de amarelo se equipe OU microárea forem diferentes
                        if (data.section === 'body') {
                            const membro = familia.membros[data.row.index];
                            const equipeDiferente = membro.equipe && membro.equipe !== equipePredominante;
                            const microareaDiferente = membro.microarea && membro.microarea !== microareaPredominante;

                            if (equipeDiferente || microareaDiferente) {
                                data.cell.styles.fillColor = [255, 255, 153]; // Amarelo claro
                            }
                        }
                    }
                });

                currentY = doc.lastAutoTable.finalY + 8;
            });

            // ==== RODAPÉ ====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.setFont("helvetica", "normal");

                const dataGeracao = new Date().toLocaleString('pt-BR');
                doc.text(`Gerado em: ${dataGeracao}`, margin, 290);
                doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, 290);
            }

            // Salvar PDF
            const nomeArquivo = `domicilio_${domicilioCompleto.id_domicilio}_${new Date().getTime()}.pdf`;
            doc.save(nomeArquivo);

            mostrarMensagemSucesso('PDF gerado com sucesso!');

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarMensagemErro('Erro ao gerar PDF: ' + error.message);
        }
    }

    /**
     * Abre modal de opções para geração de PDF em lote
     */
    function gerarPdfLote() {
        const checkboxesMarcados = document.querySelectorAll('input[name="domicilio-checkbox"]:checked');

        if (checkboxesMarcados.length === 0) {
            mostrarMensagemErro('Selecione pelo menos um domicílio');
            return;
        }

        // Atualizar quantidade no modal
        elementos.pdfTotalSelecionados.textContent = checkboxesMarcados.length;

        // Abrir modal
        elementos.modalOpcoesPdf.classList.remove('hidden');
    }

    /**
     * Fecha modal de opções de PDF
     */
    function fecharModalOpcoesPdf() {
        elementos.modalOpcoesPdf.classList.add('hidden');
    }

    /**
     * Confirma geração de PDF após escolher opção no modal
     */
    async function confirmarGerarPdfLote() {
        try {
            // Fechar modal
            fecharModalOpcoesPdf();

            const checkboxesMarcados = document.querySelectorAll('input[name="domicilio-checkbox"]:checked');

            if (checkboxesMarcados.length === 0) {
                mostrarMensagemErro('Selecione pelo menos um domicílio');
                return;
            }

            // Obter opção selecionada
            const opcaoSelecionada = document.querySelector('input[name="pdf-layout"]:checked').value;
            const umaPorPagina = opcaoSelecionada === 'uma-pagina';

            console.log(`Gerando PDF para ${checkboxesMarcados.length} domicílios... Modo: ${opcaoSelecionada}`);

            // Extrair IDs dos domicílios selecionados
            const idsDomicilios = Array.from(checkboxesMarcados).map(cb => cb.value);

            // Buscar dados completos de cada domicílio
            const promises = idsDomicilios.map(id =>
                fetch(`/api/domicilios/${id}/familia`).then(res => res.json())
            );

            const resultados = await Promise.all(promises);

            // Verificar erros
            const erros = resultados.filter(r => !r.sucesso);
            if (erros.length > 0) {
                throw new Error(`Erro ao buscar ${erros.length} domicílio(s)`);
            }

            // Gerar PDF único com todos os domicílios em PAISAGEM
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape (paisagem)
            const pageWidth = 297; // Largura em paisagem
            const pageHeight = 210; // Altura em paisagem
            const margin = 10;
            let currentY = 20;

            // ==== PÁGINA DE CAPA ====
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.setTextColor(29, 112, 184);
            doc.text('RELATÓRIO DE DOMICÍLIOS E FAMÍLIAS', pageWidth / 2, 80, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);
            doc.text('Sistema de Atenção Primária à Saúde', pageWidth / 2, 95, { align: 'center' });

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            const dataGeracao = new Date().toLocaleString('pt-BR');
            doc.text(`Data: ${dataGeracao}`, pageWidth / 2, 130, { align: 'center' });
            doc.text(`Total de Domicílios: ${resultados.length}`, pageWidth / 2, 140, { align: 'center' });

            // ==== PROCESSAR CADA DOMICÍLIO ====
            resultados.forEach((data, domicilioIndex) => {
                const domicilioCompleto = data.domicilio;
                const familias = data.familias || [];

                // Nova página para cada domicílio (se opção selecionada) ou se sequencial e primeira iteração
                if (umaPorPagina || domicilioIndex === 0) {
                    doc.addPage();
                    currentY = 20;
                } else {
                    // Modo sequencial: verificar se tem espaço na página atual (paisagem)
                    if (currentY > 170) {
                        doc.addPage();
                        currentY = 20;
                    } else {
                        // Adicionar separador entre domicílios
                        currentY += 5;
                        doc.setDrawColor(150, 150, 150);
                        doc.setLineWidth(0.5);
                        doc.line(margin, currentY, pageWidth - margin, currentY);
                        currentY += 8;
                    }
                }

                // Cabeçalho do domicílio (tamanho ajustado conforme modo)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(umaPorPagina ? 16 : 12);
                doc.setTextColor(29, 112, 184);
                if (umaPorPagina) {
                    doc.text(`DOMICÍLIO ${domicilioIndex + 1}`, pageWidth / 2, currentY, { align: 'center' });
                    currentY += 10;
                } else {
                    doc.text(`DOMICÍLIO ${domicilioIndex + 1}`, margin, currentY);
                    currentY += 6;
                }

                doc.setDrawColor(200, 200, 200);
                doc.line(margin, currentY, pageWidth - margin, currentY);

                // Informações do domicílio
                currentY += umaPorPagina ? 10 : 6;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(umaPorPagina ? 12 : 10);
                doc.setTextColor(0, 0, 0);
                if (umaPorPagina) {
                    doc.text('Informações do Domicílio', margin, currentY);
                }

                currentY += 7;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);

                // Endereço
                doc.setFont("helvetica", "bold");
                doc.text('Endereço:', margin, currentY);
                doc.setFont("helvetica", "normal");
                const enderecoText = domicilioCompleto.endereco_completo || 'Não informado';
                const splitEndereco = doc.splitTextToSize(enderecoText, pageWidth - margin - 30);
                doc.text(splitEndereco, margin + 22, currentY);
                currentY += (splitEndereco.length * 4.5) + 2;

                // Bairro/CEP
                if (domicilioCompleto.bairro || domicilioCompleto.cep) {
                    doc.setFont("helvetica", "bold");
                    doc.text('Bairro/CEP:', margin, currentY);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${domicilioCompleto.bairro || '-'} - CEP: ${domicilioCompleto.cep || '-'}`, margin + 22, currentY);
                    currentY += 5;
                }

                // Equipe
                if (domicilioCompleto.equipes) {
                    doc.setFont("helvetica", "bold");
                    doc.text('Equipe:', margin, currentY);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${domicilioCompleto.equipes}`, margin + 22, currentY);
                    currentY += 5;
                }

                // Microárea
                if (domicilioCompleto.microareas) {
                    doc.setFont("helvetica", "bold");
                    doc.text('Microárea:', margin, currentY);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${domicilioCompleto.microareas}`, margin + 22, currentY);
                    currentY += 5;
                }

                // Resumo
                currentY += 3;
                doc.setFillColor(240, 248, 255);
                doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.text(`Famílias: ${familias.length}`, margin + 5, currentY + 6.5);
                const totalCidadaos = familias.reduce((sum, fam) => sum + fam.membros.length, 0);
                doc.text(`Cidadãos: ${totalCidadaos}`, margin + 60, currentY + 6.5);

                currentY += 14;

                // Determinar equipe e microárea predominante do domicílio
                const equipesCount = {};
                const microareasCount = {};
                familias.forEach(fam => {
                    fam.membros.forEach(m => {
                        if (m.equipe) {
                            equipesCount[m.equipe] = (equipesCount[m.equipe] || 0) + 1;
                        }
                        if (m.microarea) {
                            microareasCount[m.microarea] = (microareasCount[m.microarea] || 0) + 1;
                        }
                    });
                });

                const equipePredominante = Object.keys(equipesCount).reduce((a, b) =>
                    equipesCount[a] > equipesCount[b] ? a : b, null);
                const microareaPredominante = Object.keys(microareasCount).reduce((a, b) =>
                    microareasCount[a] > microareasCount[b] ? a : b, null);

                // Famílias e membros
                familias.forEach((familia, index) => {
                    // Verificar se precisa de nova página (ajustado para paisagem)
                    if (currentY > 175) { // Altura limite em paisagem
                        doc.addPage();
                        currentY = 20;
                    }

                    const responsavel = familia.membros.find(m => m.eh_responsavel === 1);
                    const nomeFamilia = responsavel ? responsavel.nome : (familia.membros[0]?.nome || 'Família sem nome');

                    // Cabeçalho da família
                    doc.setFillColor(70, 130, 180);
                    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(10);
                    doc.setTextColor(255, 255, 255);
                    doc.text(`Família ${index + 1}: ${nomeFamilia}`, margin + 2, currentY + 5.5);

                    currentY += 10;

                    // Tabela de membros com novas colunas em formato paisagem
                    const membrosData = familia.membros.map(membro => {
                        // Determinar sexo (F ou M)
                        const sexoCompleto = (membro.sexo || '').toUpperCase();
                        let sexoAbreviado = '-';
                        if (sexoCompleto.includes('FEMININO') || sexoCompleto.includes('F')) {
                            sexoAbreviado = 'F';
                        } else if (sexoCompleto.includes('MASCULINO') || sexoCompleto.includes('M')) {
                            sexoAbreviado = 'M';
                        }

                        // Priorizar CPF, senão CNS (garantir que seja string)
                        let cpfCns = '-';
                        if (membro.cpf) {
                            cpfCns = String(membro.cpf);
                        } else if (membro.cns) {
                            cpfCns = String(membro.cns);
                        }

                        return [
                            membro.nome || '-',
                            sexoAbreviado,
                            membro.idade || '0',
                            cpfCns,
                            membro.equipe || '-',
                            membro.microarea || '-',
                            '' // Coluna observação em branco
                        ];
                    });

                    doc.autoTable({
                        startY: currentY,
                        head: [['Nome', 'Sexo', 'Idade', 'CPF/CNS', 'Equipe', 'Microárea', 'Observação']],
                        body: membrosData,
                        theme: 'grid',
                        headStyles: {
                            fillColor: [70, 130, 180],
                            textColor: 255,
                            fontSize: 8,
                            fontStyle: 'bold',
                            halign: 'center'
                        },
                        bodyStyles: {
                            fontSize: 7,
                            textColor: 50
                        },
                        columnStyles: {
                            0: { cellWidth: 80 }, // Nome
                            1: { cellWidth: 15, halign: 'center' }, // Sexo
                            2: { cellWidth: 18, halign: 'center' }, // Idade
                            3: { cellWidth: 35, halign: 'center' }, // CPF/CNS
                            4: { cellWidth: 50 }, // Equipe
                            5: { cellWidth: 25, halign: 'center' }, // Microárea
                            6: { cellWidth: 50 } // Observação (em branco)
                        },
                        margin: { left: margin, right: margin },
                        didParseCell: function(data) {
                            // Colorir linha de amarelo se equipe OU microárea forem diferentes
                            if (data.section === 'body') {
                                const membro = familia.membros[data.row.index];
                                const equipeDiferente = membro.equipe && membro.equipe !== equipePredominante;
                                const microareaDiferente = membro.microarea && membro.microarea !== microareaPredominante;

                                if (equipeDiferente || microareaDiferente) {
                                    data.cell.styles.fillColor = [255, 255, 153]; // Amarelo claro
                                }
                            }
                        }
                    });

                    currentY = doc.lastAutoTable.finalY + 6;
                });
            });

            // ==== RODAPÉ ====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.setFont("helvetica", "normal");

                const dataGeracaoRodape = new Date().toLocaleString('pt-BR');
                const rodapeY = pageHeight - 5; // Altura em paisagem (210mm)
                doc.text(`Gerado em: ${dataGeracaoRodape}`, margin, rodapeY);
                doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, rodapeY);
            }

            // Salvar PDF
            const nomeArquivo = `relatorio_domicilios_${new Date().getTime()}.pdf`;
            doc.save(nomeArquivo);

            mostrarMensagemSucesso(`PDF gerado com ${resultados.length} domicílio(s)`);

        } catch (error) {
            console.error('Erro ao gerar PDFs:', error);
            mostrarMensagemErro('Erro ao gerar PDFs: ' + error.message);
        }
    }

    /**
     * Exporta relatório completo em formato Excel/CSV
     */
    function exportarRelatorio() {
        try {
            console.log('Exportando relatório...');

            // TODO: Implementar exportação
            // Opções:
            // 1. Gerar CSV client-side
            // 2. Requisitar arquivo do backend

            mostrarMensagemSucesso('Relatório exportado com sucesso!');

        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            mostrarMensagemErro('Erro ao exportar relatório');
        }
    }

    // ========================================================================
    // FUNÇÕES UTILITÁRIAS
    // ========================================================================

    /**
     * Exibe mensagem de sucesso ao usuário
     * @param {string} mensagem - Mensagem a exibir
     */
    function mostrarMensagemSucesso(mensagem) {
        // TODO: Implementar sistema de notificações toast
        console.log('SUCESSO:', mensagem);
        alert(mensagem);
    }

    /**
     * Exibe mensagem de erro ao usuário
     * @param {string} mensagem - Mensagem a exibir
     */
    function mostrarMensagemErro(mensagem) {
        // TODO: Implementar sistema de notificações toast
        console.error('ERRO:', mensagem);
        alert(mensagem);
    }

    // ========================================================================
    // INICIAR APLICAÇÃO
    // ========================================================================

    inicializarPainel();

}); // Fim do DOMContentLoaded
