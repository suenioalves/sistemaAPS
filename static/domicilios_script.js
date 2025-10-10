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
            elementos.mediaCidadaosCard.textContent = (stats.media_por_domicilio || 0).toFixed(1);
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
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
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

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" name="domicilio-checkbox" value="${domicilio.id_domicilio}"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">${domicilio.endereco_completo || '-'}</div>
                <div class="text-xs text-gray-500">${domicilio.bairro || ''} ${domicilio.cep ? '- CEP: ' + domicilio.cep : ''}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${domicilio.equipes || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${domicilio.microareas || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${domicilio.total_familias || 0}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${domicilio.total_integrantes || 0}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button class="btn-visualizar text-blue-600 hover:text-blue-900" data-cod="${domicilio.id_domicilio}" title="Visualizar família">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="btn-gerar-pdf text-green-600 hover:text-green-900" data-cod="${domicilio.id_domicilio}" title="Gerar PDF">
                        <i class="ri-file-pdf-line"></i>
                    </button>
                    <button class="btn-editar text-amber-600 hover:text-amber-900" data-cod="${domicilio.id_domicilio}" title="Editar">
                        <i class="ri-edit-line"></i>
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
        const membros = data.membros || [];

        // Preencher informações do domicílio
        elementos.modalEndereco.textContent = domicilio.endereco_completo || '-';
        elementos.modalEquipeMicroarea.textContent = `Equipe/Microárea: ${membros.length > 0 ? (membros[0].equipe || '-') + ' / ' + (membros[0].microarea || '-') : '-'}`;
        elementos.modalCodDomicilio.textContent = domicilio.id_domicilio || '-';
        elementos.modalCnsDomicilio.textContent = `Renda: ${domicilio.renda_familiar || '-'}`;

        // Preencher tabela de membros
        const tbody = elementos.modalMembrosTbody;
        tbody.innerHTML = '';

        if (membros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">Nenhum membro cadastrado</td></tr>';
        } else {
            membros.forEach(membro => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-4 py-3 text-sm text-gray-900">${membro.nome_integrante || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${membro.cns_integrante || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${membro.nascimento_integrante || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${membro.idade_integrante || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${membro.sexo_integrante || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${membro.eh_responsavel === 1 ? 'Sim' : 'Não'}</td>
                `;
                tbody.appendChild(tr);
            });
        }

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
    function gerarPdfFamilia(domicilio) {
        try {
            console.log('Gerando PDF da família...');

            // TODO: Implementar geração de PDF usando jsPDF
            // Estrutura sugerida:
            // 1. Criar documento PDF
            // 2. Adicionar cabeçalho com logo e título
            // 3. Adicionar informações do domicílio
            // 4. Adicionar tabela de membros da família
            // 5. Adicionar rodapé com data de geração
            // 6. Salvar arquivo

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Título
            doc.setFontSize(16);
            doc.text('Ficha de Família - Sistema APS', 105, 20, { align: 'center' });

            // Informações do domicílio
            doc.setFontSize(12);
            doc.text(`Endereço: ${domicilio.endereco_completo || '-'}`, 20, 40);
            doc.text(`Equipe: ${domicilio.nome_equipe || '-'}`, 20, 50);
            doc.text(`Microárea: ${domicilio.microarea || '-'}`, 20, 60);

            // TODO: Adicionar tabela de membros usando autoTable

            // Salvar
            doc.save(`familia_${domicilio.cod_domicilio}.pdf`);

            mostrarMensagemSucesso('PDF gerado com sucesso!');

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarMensagemErro('Erro ao gerar PDF');
        }
    }

    /**
     * Gera PDF em lote dos domicílios selecionados
     */
    function gerarPdfLote() {
        try {
            const checkboxesMarcados = document.querySelectorAll('input[name="domicilio-checkbox"]:checked');

            if (checkboxesMarcados.length === 0) {
                mostrarMensagemErro('Selecione pelo menos um domicílio');
                return;
            }

            console.log(`Gerando PDF para ${checkboxesMarcados.length} domicílios...`);

            // TODO: Implementar geração em lote
            // Opções:
            // 1. Gerar um PDF com todas as famílias
            // 2. Gerar múltiplos PDFs (um por família)

            mostrarMensagemSucesso('PDFs gerados com sucesso!');

        } catch (error) {
            console.error('Erro ao gerar PDFs:', error);
            mostrarMensagemErro('Erro ao gerar PDFs');
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
