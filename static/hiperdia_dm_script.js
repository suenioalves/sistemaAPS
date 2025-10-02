import { hiperdiaApi } from './hiperdiaApi.js';
import { hiperdiaDom } from './hiperdiaDom.js';

document.addEventListener('DOMContentLoaded', function () {
    // --- Variáveis de Estado para Diabetes ---
    let currentFetchedPacientes = [];
    let todasEquipesComMicroareas = [];
    let currentPacienteForModal = null;
    let equipeSelecionadaAtual = 'Todas';
    let microareaSelecionadaAtual = 'Todas';
    let currentPage = 1;
    let currentSearchTerm = '';
    let currentStatusFilter = 'Todos';
    let currentLimit = 10;

    // Elementos do DOM específicos para diabetes - MOVIDO PARA ANTES DA FUNÇÃO
    const elements = {
        equipeButton: document.getElementById('diabetes-equipe-button'),
        equipeDropdown: document.getElementById('diabetes-equipe-dropdown'),
        equipeDropdownContent: document.getElementById('diabetes-equipe-dropdown-content'),
        equipeButtonText: document.getElementById('diabetes-equipe-button-text'),
        microareaButton: document.getElementById('diabetes-microarea-button'),
        microareaDropdown: document.getElementById('diabetes-microarea-dropdown'),
        microareaDropdownContent: document.getElementById('diabetes-microarea-dropdown-content'),
        microareaButtonText: document.getElementById('diabetes-microarea-button-text'),
        buscaInput: document.getElementById('diabetes-busca-input'),
        diabeticosCard: document.getElementById('total-diabeticos'),
        controladosCard: document.getElementById('total-controlados'),
        descompensadosCard: document.getElementById('total-descompensados'),
        tratamentoCard: document.getElementById('total-tratamento'),
        pacientesContainer: document.getElementById('diabetes-pacientes-container'),
        pacientesLista: document.getElementById('diabetes-pacientes-lista'),
        loadingDiv: document.getElementById('diabetes-loading'),
        statusTabs: document.querySelectorAll('.diabetes-status-tab-btn'),
        selecionarTodos: document.getElementById('selecionar-todos-diabetes'),
        desmarcarTodos: document.getElementById('desmarcar-todos-diabetes'),
        gerarReceituario: document.getElementById('gerar-receituario-diabetes'),
        timelineModal: document.getElementById('timeline-modal-diabetes'),
        timelineModalTitle: document.getElementById('timeline-modal-title-diabetes'),
        closeTimelineModal: document.getElementById('close-timeline-modal-diabetes'),
        timelineContent: document.getElementById('timeline-content-diabetes'),
        timelineFilters: document.querySelectorAll('.timeline-filter-btn-diabetes'),
        addActionBtn: document.getElementById('add-action-btn-diabetes'),
        registerModal: document.getElementById('register-action-modal-diabetes'),
        closeRegisterModal: document.getElementById('close-register-modal-diabetes'),
        actionForm: document.getElementById('action-form-diabetes'),
        codAcaoSelect: document.getElementById('cod-acao-diabetes'),
        dataAcaoInput: document.getElementById('data-acao-diabetes'),
        observacoesTextarea: document.getElementById('observacoes-diabetes'),
        responsavelInput: document.getElementById('responsavel-diabetes'),
        saveActionBtn: document.getElementById('save-action-btn-diabetes'),
        cancelActionBtn: document.getElementById('cancel-action-btn-diabetes')
    };

    // Inicializar elementos do DOM adaptados para diabetes - CHAMADA APÓS DEFINIÇÃO DE ELEMENTS
    initDiabetesDomElements();
    
    // Configurar event listeners do modal de tratamento
    setupTreatmentModalEventListeners();

    // Função para inicializar elementos específicos do diabetes
    function initDiabetesDomElements() {
        // Configurar dropdowns
        setupDropdown(elements.equipeButton, elements.equipeDropdown);
        setupDropdown(elements.microareaButton, elements.microareaDropdown);

        // Event listeners para filtros
        elements.buscaInput.addEventListener('input', function() {
            currentSearchTerm = this.value;
            currentPage = 1;
            fetchPacientesDiabetes();
        });

        // Status tabs
        elements.statusTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const statusFilter = this.getAttribute('data-status-filter');
                setActiveStatusTab(this, statusFilter);
                currentStatusFilter = statusFilter;
                currentPage = 1;
                fetchPacientesDiabetes();
                updateSummaryCards();
            });
        });

        // Botões de seleção
        elements.selecionarTodos.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="paciente-checkbox-diabetes"]');
            checkboxes.forEach(cb => cb.checked = true);
        });

        elements.desmarcarTodos.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="paciente-checkbox-diabetes"]');
            checkboxes.forEach(cb => cb.checked = false);
        });

        // Gerar receituário
        elements.gerarReceituario.addEventListener('click', handleGerarReceituario);

        // Modal timeline
        elements.closeTimelineModal.addEventListener('click', () => {
            elements.timelineModal.classList.add('hidden');
        });

        // Filtros da timeline
        elements.timelineFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                const filterType = this.getAttribute('data-filter');
                setActiveTimelineFilter(this);
                filterTimelineActions(filterType);
            });
        });

        // Modal registro de ação
        elements.addActionBtn.addEventListener('click', () => {
            elements.registerModal.classList.remove('hidden');
            elements.dataAcaoInput.value = new Date().toISOString().split('T')[0];
        });

        elements.closeRegisterModal.addEventListener('click', () => {
            elements.registerModal.classList.add('hidden');
            resetActionForm();
        });

        elements.cancelActionBtn.addEventListener('click', () => {
            elements.registerModal.classList.add('hidden');
            resetActionForm();
        });

        // Mostrar/ocultar campos específicos baseado na ação selecionada
        elements.codAcaoSelect.addEventListener('change', function() {
            const codAcao = parseInt(this.value);
            
            // Fechar todos os modais secundários primeiro
            const evaluateModal = document.getElementById('evaluate-treatment-modal-diabetes');
            if (evaluateModal) evaluateModal.classList.add('hidden');

            // Não há mais campos específicos para ocultar

            // Mostrar campos baseado na ação
            if (codAcao === 4) { // Avaliar Tratamento
                openEvaluateTreatmentModal();
            } else if (codAcao === 5) { // Modificar tratamento
                // Modificar tratamento agora apenas registra a ação na timeline
                // O tratamento real será modificado através do modal de tratamento separadamente
            }
        });

        elements.saveActionBtn.addEventListener('click', handleSaveAction);
    }

    // Função para configurar dropdowns
    function setupDropdown(button, dropdown) {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function(e) {
            if (!button.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Função para definir aba ativa
    function setActiveStatusTab(activeTab, statusFilter) {
        elements.statusTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.classList.remove('border-amber-500', 'border-green-500', 'border-red-500', 'border-purple-500');
            tab.classList.add('border-transparent', 'text-gray-700');
            
            const activeTextClass = tab.getAttribute('data-active-text');
            const activeBorderClass = tab.getAttribute('data-active-border');
            tab.classList.remove(activeTextClass, activeBorderClass);
        });

        activeTab.classList.add('active');
        const activeTextClass = activeTab.getAttribute('data-active-text');
        const activeBorderClass = activeTab.getAttribute('data-active-border');
        activeTab.classList.add(activeTextClass, activeBorderClass);
        activeTab.classList.remove('border-transparent', 'text-gray-700');
    }

    // Função para definir filtro ativo da timeline
    function setActiveTimelineFilter(activeFilter) {
        elements.timelineFilters.forEach(filter => {
            filter.classList.remove('active', 'bg-amber-100', 'text-amber-800');
            filter.classList.add('bg-gray-100', 'text-gray-600');
        });
        
        activeFilter.classList.add('active', 'bg-amber-100', 'text-amber-800');
        activeFilter.classList.remove('bg-gray-100', 'text-gray-600');
    }

    // Função para buscar equipes e microáreas
    async function fetchEquipesMicroareasDiabetes() {
        try {
            // Usar endpoint específico para diabetes (com fallback para hipertensão)
            const response = await fetch('/api/equipes_microareas_diabetes');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Dados recebidos das equipes:', data);
            todasEquipesComMicroareas = data;
            populateEquipeDropdown(data);
        } catch (error) {
            console.error('Erro ao buscar equipes e microáreas:', error);
            // Em caso de erro, ao menos permitir que a interface funcione
            todasEquipesComMicroareas = [];
            populateEquipeDropdown([]);
        }
    }

    // Função para popular dropdown de equipes
    function populateEquipeDropdown(equipesData) {
        console.log('Populando dropdown com:', equipesData);
        elements.equipeDropdownContent.innerHTML = '';
        
        // Opção "Todas as equipes"
        const allOption = document.createElement('div');
        allOption.innerHTML = `
            <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-equipe="Todas">
                Todas as equipes
            </button>
        `;
        elements.equipeDropdownContent.appendChild(allOption);

        // Adicionar equipes - ajustado para estrutura do endpoint
        equipesData.forEach(equipe => {
            const equipeItem = document.createElement('div');
            equipeItem.innerHTML = `
                <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-equipe="${equipe.nome_equipe}">
                    ${equipe.nome_equipe}
                </button>
            `;
            elements.equipeDropdownContent.appendChild(equipeItem);
        });

        // Event listeners para seleção de equipe
        elements.equipeDropdownContent.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const selectedEquipe = e.target.getAttribute('data-equipe');
                elements.equipeButtonText.textContent = selectedEquipe === 'Todas' ? 'Todas as equipes' : selectedEquipe;
                elements.equipeDropdown.classList.add('hidden');
                
                equipeSelecionadaAtual = selectedEquipe;
                populateMicroareaDropdown(selectedEquipe);
                currentPage = 1;
                fetchPacientesDiabetes();
                updateSummaryCards();
            }
        });
    }

    // Função para popular dropdown de microáreas (com nomes dos agentes)
    function populateMicroareaDropdown(selectedEquipe) {
        elements.microareaDropdownContent.innerHTML = '';
        
        // Opção "Todas as microáreas"
        const allOption = document.createElement('div');
        allOption.innerHTML = `
            <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-microarea="Todas">
                Todas as áreas
            </button>
        `;
        elements.microareaDropdownContent.appendChild(allOption);

        if (selectedEquipe !== 'Todas') {
            const equipeData = todasEquipesComMicroareas.find(e => e.nome_equipe === selectedEquipe);
            if (equipeData && equipeData.agentes) {
                // Agrupar agentes por microárea
                const microareasUnicas = {};
                equipeData.agentes.forEach(agente => {
                    if (!microareasUnicas[agente.micro_area]) {
                        microareasUnicas[agente.micro_area] = [];
                    }
                    if (agente.nome_agente) {
                        microareasUnicas[agente.micro_area].push(agente.nome_agente);
                    }
                });
                
                // Ordenar microáreas numericamente
                Object.keys(microareasUnicas).sort((a, b) => parseInt(a) - parseInt(b)).forEach(microarea => {
                    const nomeAgente = microareasUnicas[microarea].length > 0 ? microareasUnicas[microarea][0] : null;
                    const displayText = nomeAgente ? `Área ${microarea} - ${nomeAgente}` : `Área ${microarea}`;
                    
                    const microareaItem = document.createElement('div');
                    microareaItem.innerHTML = `
                        <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-microarea="${microarea}">
                            ${displayText}
                        </button>
                    `;
                    elements.microareaDropdownContent.appendChild(microareaItem);
                });
            }
        }

        // Event listeners para seleção de microárea
        elements.microareaDropdownContent.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const selectedMicroarea = e.target.getAttribute('data-microarea');
                const buttonText = e.target.textContent.trim();
                elements.microareaButtonText.textContent = selectedMicroarea === 'Todas' ? 'Todas as áreas' : buttonText;
                elements.microareaDropdown.classList.add('hidden');
                
                microareaSelecionadaAtual = selectedMicroarea;
                currentPage = 1;
                fetchPacientesDiabetes();
                updateSummaryCards();
            }
        });
    }

    // Função para atualizar cards de resumo
    function updateSummaryCards() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: microareaSelecionadaAtual,
            status: currentStatusFilter
        });

        // APIs específicas para diabetes
        
        // Card: Total de Diabéticos
        fetch(`/api/get_total_diabeticos?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                updateCard(elements.diabeticosCard, data.total_pacientes || 0);
            })
            .catch(error => {
                console.error('Erro ao buscar total de diabéticos:', error);
                updateCard(elements.diabeticosCard, 'Erro');
            });

        // Card: Controlados
        const paramsControlados = new URLSearchParams(params);
        paramsControlados.set('status', 'Controlados');
        fetch(`/api/get_total_diabeticos?${paramsControlados.toString()}`)
            .then(response => response.json())
            .then(data => {
                updateCard(elements.controladosCard, data.total_pacientes || 0);
            })
            .catch(error => {
                console.error('Erro ao buscar diabéticos controlados:', error);
                updateCard(elements.controladosCard, 'Erro');
            });

        // Card: Descompensados
        const paramsDescompensados = new URLSearchParams(params);
        paramsDescompensados.set('status', 'Descompensados');
        fetch(`/api/get_total_diabeticos?${paramsDescompensados.toString()}`)
            .then(response => response.json())
            .then(data => {
                updateCard(elements.descompensadosCard, data.total_pacientes || 0);
            })
            .catch(error => {
                console.error('Erro ao buscar diabéticos descompensados:', error);
                updateCard(elements.descompensadosCard, 'Erro');
            });

        // Card: Com Tratamento
        const paramsTratamento = new URLSearchParams(params);
        paramsTratamento.set('status', 'ComTratamento');
        fetch(`/api/get_total_diabeticos?${paramsTratamento.toString()}`)
            .then(response => response.json())
            .then(data => {
                updateCard(elements.tratamentoCard, data.total_pacientes || 0);
            })
            .catch(error => {
                console.error('Erro ao buscar diabéticos com tratamento:', error);
                updateCard(elements.tratamentoCard, 'Erro');
            });
    }

    // Função para atualizar card individual
    function updateCard(cardElement, value) {
        if (cardElement) {
            cardElement.textContent = value;
        }
    }

    // Função para buscar pacientes diabéticos
    async function fetchPacientesDiabetes() {
        setTableLoading();

        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: microareaSelecionadaAtual,
            page: currentPage,
            limit: currentLimit,
            search: currentSearchTerm,
            status: currentStatusFilter
        });

        try {
            // API específica para diabetes
            const response = await fetch(`/api/pacientes_hiperdia_dm?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            currentFetchedPacientes = data.pacientes || [];
            populatePacientesTable(data.pacientes || []);
            setTableLoaded();
        } catch (error) {
            console.error('Erro ao buscar pacientes diabéticos:', error);
            setTableError();
        }
    }

    // Função para definir estado de carregamento
    function setTableLoading() {
        elements.loadingDiv.classList.remove('hidden');
        elements.pacientesContainer.classList.add('hidden');
    }

    // Função para definir estado carregado
    function setTableLoaded() {
        elements.loadingDiv.classList.add('hidden');
        elements.pacientesContainer.classList.remove('hidden');
    }

    // Função para definir estado de erro
    function setTableError() {
        elements.loadingDiv.innerHTML = '<div class="text-red-500">Erro ao carregar pacientes</div>';
        elements.pacientesContainer.classList.add('hidden');
    }

    // Função para popular tabela de pacientes
    function populatePacientesTable(pacientes) {
        if (!pacientes || pacientes.length === 0) {
            elements.pacientesLista.innerHTML = `
                <div class="p-8 text-center text-gray-500">
                    <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-gray-300">
                        <i class="ri-user-search-line text-4xl"></i>
                    </div>
                    <p class="text-lg font-medium">Nenhum paciente diabético encontrado</p>
                    <p class="text-sm">Tente ajustar os filtros de busca</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" id="select-all-diabetes" class="rounded border-gray-300 focus:ring-amber-500">
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Paciente
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tratamento atual
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ação Atual
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        pacientes.forEach(paciente => {
            const statusClass = getStatusClass(paciente.status_dm_novo, paciente.status_dm);
            const idade = calculateAge(paciente.dt_nascimento);
            
            tableHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" name="paciente-checkbox-diabetes" value="${paciente.cod_paciente}" class="rounded border-gray-300 focus:ring-amber-500">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                            ${paciente.nome_paciente}, ${idade} anos
                        </div>
                        <div class="text-xs text-gray-500">CNS: ${paciente.cartao_sus || 'N/A'}</div>
                        <div class="text-xs text-gray-500">Equipe ${paciente.nome_equipe || 'N/A'} - Área ${paciente.microarea || 'N/A'} - Agente: ${paciente.nome_agente || 'A definir'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div id="tratamento-atual-${paciente.cod_paciente}" class="text-sm text-gray-700">
                            <i class="ri-medicine-bottle-line text-gray-400"></i> Carregando...
                        </div>
                        <div class="mt-1">
                            <button class="text-purple-600 hover:text-purple-900 text-xs font-medium" onclick="abrirModalTratamentoDiabetes(${JSON.stringify(paciente).replace(/"/g, '&quot;')})">
                                <i class="ri-edit-line"></i> Gerenciar Tratamento
                            </button>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${statusClass}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        ${getAcaoAtualDisplay(paciente)}
                        <div class="mt-2">
                            <button class="text-amber-600 hover:text-amber-900 font-medium" onclick="abrirModalTimelineDiabetes(${JSON.stringify(paciente).replace(/"/g, '&quot;')})">
                                <i class="ri-edit-line"></i> Editar Ações
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        elements.pacientesLista.innerHTML = tableHTML;
        
        // Carregar tratamento atual para cada paciente
        pacientes.forEach(paciente => {
            loadTreatmentSummaryForPatient(paciente.cod_paciente);
        });
    }

    // Função para calcular idade
    function calculateAge(birthDate) {
        if (!birthDate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    // Função para obter classe de status específica para diabetes com nova lógica avançada
    function getStatusClass(statusNovo, statusAntigo) {
        // Usar status novo se disponível, senão usar status antigo
        const status = statusNovo || statusAntigo;
        
        switch (status) {
            case 'sem_avaliacao':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Sem avaliação</span>';
            case 'em_analise':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">EM ANÁLISE</span>';
            case 'diabetes_compensada':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">DIABETES COMPENSADA</span>';
            case 'controlado':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Controlado</span>';
            case 'descompensado':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Descompensado</span>';
            case 'indefinido':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Indefinido</span>';
            default:
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">Acompanhamento</span>';
        }
    }

    // Função para exibir a ação atual do paciente
    function getAcaoAtualDisplay(paciente) {
        if (!paciente.acao_atual_nome) {
            return '<div class="text-xs text-gray-500 italic">Nenhuma ação registrada</div>';
        }

        // Substituir texto longo por versão curta
        let nomeAcao = paciente.acao_atual_nome;
        nomeAcao = nomeAcao.replace('Solicitar Mapeamento Residencial de Glicemias', 'Solicitar Glicemias');

        const status = paciente.acao_atual_status;
        const dataAgendamento = paciente.acao_atual_data_agendamento;
        const dataRealizacao = paciente.acao_atual_data_realizacao;

        let displayText = '';
        let colorClass = '';
        let data = '';

        switch (status) {
            case 'AGUARDANDO':
                displayText = `${nomeAcao}`;
                colorClass = 'text-yellow-600';
                data = dataAgendamento ? `(${new Date(dataAgendamento).toLocaleDateString('pt-BR')})` : '';
                break;
            case 'REALIZADA':
                displayText = `${nomeAcao} - Realizado`;
                colorClass = 'text-green-600';
                data = dataRealizacao ? `(${new Date(dataRealizacao).toLocaleDateString('pt-BR')})` : '';
                break;
            case 'CANCELADA':
                displayText = `${nomeAcao} - Cancelado`;
                colorClass = 'text-red-600';
                data = dataRealizacao ? `(${new Date(dataRealizacao).toLocaleDateString('pt-BR')})` : '';
                break;
            case 'FINALIZADO':
                displayText = `${nomeAcao} - Finalizado`;
                colorClass = 'text-green-600 font-semibold';
                data = dataRealizacao ? `(${new Date(dataRealizacao).toLocaleDateString('pt-BR')})` : '';
                break;
            default:
                displayText = `${nomeAcao} - ${status}`;
                colorClass = 'text-gray-600';
                break;
        }

        return `<div class="text-xs ${colorClass}">
                    ${displayText} ${data}
                </div>`;
    }

    // Função para carregar e exibir tratamento atual de um paciente
    async function loadTreatmentSummaryForPatient(codCidadao) {
        const treatmentDiv = document.getElementById(`tratamento-atual-${codCidadao}`);
        if (!treatmentDiv) return;

        try {
            // Buscar medicamentos e insulinas em paralelo
            const [medicamentosResponse, insulinasResponse] = await Promise.all([
                fetch(`/api/diabetes/medicamentos_atuais/${codCidadao}`),
                fetch(`/api/diabetes/insulinas/${codCidadao}`)
            ]);

            // Processar medicamentos
            const medicamentosData = await medicamentosResponse.json();
            const medicamentos = medicamentosData.medicamentos || [];

            // Processar insulinas
            let insulinas = [];
            if (insulinasResponse.ok) {
                const insulinasData = await insulinasResponse.json();
                insulinas = insulinasData.insulinas || [];
            }

            // Combinar medicamentos e insulinas para exibição
            const tratamentoCompleto = {
                medicamentos: medicamentos,
                insulinas: insulinas
            };

            treatmentDiv.innerHTML = formatTreatmentSummary(tratamentoCompleto);

        } catch (error) {
            console.error(`Erro ao carregar tratamento para paciente ${codCidadao}:`, error);
            treatmentDiv.innerHTML = '<span class="text-gray-400"><i class="ri-medicine-bottle-line"></i> Sem dados</span>';
        }
    }

    // Função para formatar resumo do tratamento
    function formatTreatmentSummary(tratamento) {
        const medicamentos = tratamento.medicamentos || [];
        const insulinas = tratamento.insulinas || [];
        const totalTratamentos = medicamentos.length + insulinas.length;

        if (totalTratamentos === 0) {
            return '<span class="text-gray-400"><i class="ri-medicine-bottle-line"></i> Sem medicamentos</span>';
        }

        // Determinar classe de fonte baseada no número total de tratamentos
        let fontSizeClass, iconSize;
        if (totalTratamentos === 1 || totalTratamentos === 2) {
            fontSizeClass = 'text-sm'; // Fonte atual (14px)
            iconSize = 'text-base'; // Ícone normal
        } else if (totalTratamentos === 3) {
            fontSizeClass = 'text-xs'; // Fonte menor (12px)
            iconSize = 'text-sm'; // Ícone menor
        } else { // 4+ tratamentos
            fontSizeClass = 'text-xs'; // Fonte ainda menor
            iconSize = 'text-xs'; // Ícone ainda menor
        }

        // Palette de cores vibrantes para os ícones de medicamentos
        const iconColors = [
            'text-purple-600',   // Roxo vibrante
            'text-blue-600',     // Azul vibrante
            'text-emerald-500',  // Verde esmeralda
            'text-red-500',      // Vermelho
            'text-amber-500',    // Âmbar (amarelo dourado)
            'text-pink-500',     // Rosa
            'text-indigo-600',   // Índigo profundo
            'text-teal-600',     // Teal escuro
            'text-orange-500',   // Laranja
            'text-cyan-600',     // Ciano escuro
            'text-violet-500',   // Violeta
            'text-lime-500',     // Verde lima
            'text-rose-500',     // Rosa mais suave
            'text-sky-500',      // Azul céu
            'text-fuchsia-500'   // Fúcsia
        ];

        // Mapeamento de cores específicas para insulinas baseado no tipo
        const insulinColors = {
            'Insulina NPH': 'text-green-600',        // NPH - Verde
            'Insulina Regular': 'text-yellow-600',   // Regular - Amarelo
            'Insulina Glargina': 'text-purple-600',  // Glargina - Roxo
            'Insulina Lispro': 'text-blue-600'       // Lispro - Azul
        };

        let tratamentoHTML = '';
        let itemIndex = 0;
        
        // Exibir medicamentos orais primeiro
        medicamentos.forEach((med) => {
            const separator = itemIndex > 0 ? '<br>' : '';
            const iconColor = iconColors[itemIndex % iconColors.length]; // Cicla pelas cores
            tratamentoHTML += `${separator}<i class="ri-medicine-bottle-fill ${iconColor} ${iconSize}"></i> 
                              <span class="${fontSizeClass} text-gray-700">${med.nome_medicamento} - ${med.dose || 1} comp ${med.frequencia || 1}x/dia</span>`;
            itemIndex++;
        });

        // Exibir insulinas com formatação especial
        insulinas.forEach((insulin) => {
            const separator = itemIndex > 0 ? '<br>' : '';
            const insulinColor = insulinColors[insulin.tipo_insulina] || 'text-orange-600'; // Cor padrão se não mapeado
            
            // Formatar doses no formato U (unidades)
            const dosesFormatadas = formatInsulinDoses(insulin.doses_estruturadas);
            
            tratamentoHTML += `${separator}<i class="ri-syringe-line ${insulinColor} ${iconSize}"></i> 
                              <span class="${fontSizeClass} text-gray-700">${insulin.tipo_insulina} - ${dosesFormatadas}</span>`;
            itemIndex++;
        });

        return `<div class="text-sm">${tratamentoHTML}</div>`;
    }

    // Função auxiliar para formatar doses de insulina no formato solicitado (12U/20U/30U)
    function formatInsulinDoses(dosesEstruturadas) {
        if (!dosesEstruturadas) {
            return 'Dose não definida';
        }

        try {
            let doses = dosesEstruturadas;
            
            // Se for string JSON, fazer parse
            if (typeof dosesEstruturadas === 'string') {
                try {
                    doses = JSON.parse(dosesEstruturadas);
                } catch (parseError) {
                    console.error('Erro ao fazer parse do JSON de doses:', parseError);
                    return 'Erro no formato da dose';
                }
            }
            
            // Verificar se é array válido
            if (!Array.isArray(doses) || doses.length === 0) {
                return 'Dose não definida';
            }
            
            // Formatar doses no formato U (unidades)
            const dosesFormatadas = doses
                .map(dose => {
                    if (dose && typeof dose.dose === 'number') {
                        return `${dose.dose}U`;
                    } else {
                        console.warn('Dose inválida encontrada:', dose);
                        return '0U';
                    }
                })
                .join('/');
                
            return dosesFormatadas || 'Dose não definida';
            
        } catch (error) {
            console.error('Erro ao formatar doses de insulina:', error);
            return 'Erro na dose';
        }
    }

    // Função para abrir modal da timeline (disponível globalmente)
    window.abrirModalTimelineDiabetes = function(paciente) {
        currentPacienteForModal = paciente;
        elements.timelineModalTitle.textContent = `Editar Ações - ${paciente.nome_paciente}`;
        elements.timelineModal.classList.remove('hidden');
        
        // Carregar timeline
        loadTimelineDiabetes(paciente.cod_paciente);
    };

    // Função para carregar timeline
    async function loadTimelineDiabetes(codPaciente) {
        elements.timelineContent.innerHTML = '<div class="flex justify-center p-4"><div class="text-gray-500">Carregando timeline...</div></div>';
        
        try {
            // API de timeline para diabetes
            const response = await fetch(`/api/diabetes/timeline/${codPaciente}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const timeline = data.timeline || [];
            
            if (timeline.length === 0) {
                elements.timelineContent.innerHTML = '<div class="p-4 text-center text-gray-500">Nenhuma ação registrada ainda</div>';
                return;
            }
            
            let timelineHTML = '';
            timeline.forEach(item => {
                const dataDisplay = item.data_realizacao || item.data_agendamento;
                const dataFormatada = dataDisplay ? new Date(dataDisplay).toLocaleDateString('pt-BR') : 'Data não definida';
                const statusClass = (item.status_acao === 'REALIZADA' || item.status_acao === 'FINALIZADO') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                
                // Processar dados de Exames Laboratoriais e MRG se existirem
                let labTestsHtml = '';
                let mrgDetailsHtml = '';
                let treatmentStatusHtml = '';

                // Função para determinar cor e símbolo baseado nas metas SBD 2023-2024
                const getGlicemiaStatus = (value, tipo) => {
                    if (value === null || value === undefined) return { color: 'text-gray-500', symbol: '⚪', status: 'N/A' };

                    const val = parseFloat(value);

                    // Metas SBD 2023-2024:
                    // Jejum/Pré-prandial: 80-130 mg/dL
                    // Pós-prandial: < 180 mg/dL

                    if (tipo === 'pre-prandial') {
                        // Jejum e antes das refeições
                        if (val < 80) return { color: 'text-red-600', symbol: '🔴', status: 'Hipoglicemia' };
                        if (val >= 80 && val <= 130) return { color: 'text-green-600', symbol: '🟢', status: 'Meta' };
                        return { color: 'text-red-600', symbol: '🔴', status: 'Acima da meta' };
                    } else {
                        // Pós-prandial (após refeições e ao deitar)
                        if (val < 80) return { color: 'text-red-600', symbol: '🔴', status: 'Hipoglicemia' };
                        if (val < 180) return { color: 'text-green-600', symbol: '🟢', status: 'Meta' };
                        return { color: 'text-red-600', symbol: '🔴', status: 'Acima da meta' };
                    }
                };

                // Gerar visualização de Exames Laboratoriais para ação tipo 4
                if (item.cod_acao === 4 && item.lab_tests) {
                    const lab = item.lab_tests;

                    // Função para determinar cor da HbA1c
                    const getHbA1cStatus = (value) => {
                        if (value === null || value === undefined) return { color: 'text-gray-500', icon: '⚪', status: 'N/A' };
                        const val = parseFloat(value);
                        if (val < 7.0) return { color: 'text-green-600', icon: '🟢', status: 'Meta (<7%)' };
                        if (val <= 8.0) return { color: 'text-yellow-600', icon: '🟡', status: 'Aceitável (7-8%)' };
                        return { color: 'text-red-600', icon: '🔴', status: 'Elevada (>8%)' };
                    };

                    // Função para determinar cor da glicemia
                    const getGlicemiaLabStatus = (value, tipo) => {
                        if (value === null || value === undefined) return { color: 'text-gray-500', icon: '⚪', status: 'N/A' };
                        const val = parseFloat(value);

                        if (tipo === 'jejum') {
                            if (val < 80) return { color: 'text-red-600', icon: '🔴', status: 'Baixa (<80)' };
                            if (val <= 130) return { color: 'text-green-600', icon: '🟢', status: 'Meta (80-130)' };
                            return { color: 'text-red-600', icon: '🔴', status: 'Elevada (>130)' };
                        } else {
                            if (val < 80) return { color: 'text-red-600', icon: '🔴', status: 'Baixa (<80)' };
                            if (val <= 140) return { color: 'text-green-600', icon: '🟢', status: 'Adequada (≤140)' };
                            return { color: 'text-yellow-600', icon: '🟡', status: 'Elevada (>140)' };
                        }
                    };

                    const hbA1cStatus = getHbA1cStatus(lab.hemoglobina_glicada);
                    const glicemiaMediaStatus = getGlicemiaLabStatus(lab.glicemia_media, 'media');
                    const glicemiaJejumStatus = getGlicemiaLabStatus(lab.glicemia_jejum, 'jejum');

                    const labTestsId = `lab-tests-${item.cod_acompanhamento}`;

                    labTestsHtml = `
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <div class="w-5 h-5 flex items-center justify-center text-blue-600 mr-2">
                                        <i class="ri-flask-line"></i>
                                    </div>
                                    <h5 class="font-medium text-gray-700 text-sm">Exames Laboratoriais</h5>
                                    ${lab.data_exame ? `<span class="ml-2 text-xs text-gray-500">(${new Date(lab.data_exame).toLocaleDateString('pt-BR')})</span>` : ''}
                                </div>
                                <button
                                    class="lab-tests-toggle-btn flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors duration-200"
                                    data-target="${labTestsId}"
                                    title="Expandir/Recolher exames laboratoriais"
                                >
                                    <span class="toggle-text mr-1">Expandir</span>
                                    <div class="w-4 h-4 flex items-center justify-center toggle-icon">
                                        <i class="ri-arrow-down-s-line"></i>
                                    </div>
                                </button>
                            </div>

                            <div id="${labTestsId}" class="lab-tests-content hidden">
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="text-center">
                                        <div class="text-xs text-gray-600 mb-1">Hemoglobina Glicada</div>
                                        <div class="flex items-center justify-center mb-1">
                                            <span class="text-2xl mr-1" title="${hbA1cStatus.status}">${hbA1cStatus.icon}</span>
                                            <span class="text-lg font-bold ${hbA1cStatus.color}">
                                                ${lab.hemoglobina_glicada ? lab.hemoglobina_glicada + '%' : 'N/A'}
                                            </span>
                                        </div>
                                        <div class="text-xs ${hbA1cStatus.color}">${hbA1cStatus.status}</div>
                                    </div>

                                    <div class="text-center">
                                        <div class="text-xs text-gray-600 mb-1">Glicemia Média</div>
                                        <div class="flex items-center justify-center mb-1">
                                            <span class="text-2xl mr-1" title="${glicemiaMediaStatus.status}">${glicemiaMediaStatus.icon}</span>
                                            <span class="text-lg font-bold ${glicemiaMediaStatus.color}">
                                                ${lab.glicemia_media ? lab.glicemia_media + ' mg/dL' : 'N/A'}
                                            </span>
                                        </div>
                                        <div class="text-xs ${glicemiaMediaStatus.color}">${glicemiaMediaStatus.status}</div>
                                    </div>

                                    <div class="text-center">
                                        <div class="text-xs text-gray-600 mb-1">Glicemia de Jejum</div>
                                        <div class="flex items-center justify-center mb-1">
                                            <span class="text-2xl mr-1" title="${glicemiaJejumStatus.status}">${glicemiaJejumStatus.icon}</span>
                                            <span class="text-lg font-bold ${glicemiaJejumStatus.color}">
                                                ${lab.glicemia_jejum ? lab.glicemia_jejum + ' mg/dL' : 'N/A'}
                                            </span>
                                        </div>
                                        <div class="text-xs ${glicemiaJejumStatus.color}">${glicemiaJejumStatus.status}</div>
                                    </div>
                                </div>
                                ${lab.observacoes ? `<div class="mt-3 pt-2 border-t border-blue-300 text-xs text-gray-700">${lab.observacoes}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;

                    // Adicionar seção de avaliação do tratamento com base nos resultados dos exames
                    treatmentStatusHtml = generateTreatmentEvaluationStatus(lab, item);
                }

                // Processar múltiplos mapeamentos MRG para ação tipo 4
                if (item.cod_acao === 4 && item.mrg_mappings && item.mrg_mappings.length > 0) {
                    const mrgId = `mrg-details-${item.cod_acompanhamento}`;

                    let mappingsHtml = '';
                    item.mrg_mappings.forEach((mapping, index) => {
                        const glicemiaItems = [
                            { label: 'Jejum', field: 'g_jejum', tipo: 'pre-prandial' },
                            { label: 'Após Café', field: 'g_apos_cafe', tipo: 'pos-prandial' },
                            { label: 'Antes Almoço', field: 'g_antes_almoco', tipo: 'pre-prandial' },
                            { label: 'Após Almoço', field: 'g_apos_almoco', tipo: 'pos-prandial' },
                            { label: 'Antes Jantar', field: 'g_antes_jantar', tipo: 'pre-prandial' },
                            { label: 'Ao Deitar', field: 'g_ao_deitar', tipo: 'pos-prandial' }
                        ].map(item => {
                            const value = mapping[item.field];
                            const status = getGlicemiaStatus(value, item.tipo);
                            return {
                                label: item.label,
                                value: value !== null && value !== undefined ? value + ' mg/dL' : 'N/A',
                                color: status.color,
                                symbol: status.symbol,
                                status: status.status
                            };
                        });

                        mappingsHtml += `
                            <div class="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                                <div class="flex items-center justify-between mb-2">
                                    <h6 class="font-medium text-gray-800">${mapping.periodo_mapeamento}</h6>
                                    <div class="text-xs text-gray-600">
                                        ${mapping.data_mrg ? new Date(mapping.data_mrg).toLocaleDateString('pt-BR') : 'N/A'}
                                        • ${mapping.dias_mapeamento} dias
                                    </div>
                                </div>

                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs border-collapse border border-green-300">
                                        <thead>
                                            <tr class="bg-green-100">
                                                ${glicemiaItems.map(item => `
                                                    <th class="border border-green-300 px-2 py-1 text-center font-medium text-gray-700">
                                                        ${item.label}
                                                    </th>
                                                `).join('')}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr class="bg-white">
                                                ${glicemiaItems.map(item => `
                                                    <td class="border border-green-300 px-2 py-2 text-center">
                                                        <div class="flex flex-col items-center">
                                                            <span class="text-sm font-bold ${item.color}">
                                                                ${item.value}
                                                            </span>
                                                            <span class="text-lg" title="${item.status}">${item.symbol}</span>
                                                        </div>
                                                    </td>
                                                `).join('')}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                ${mapping.analise_mrg ? `<div class="mt-2 text-xs text-gray-700">${mapping.analise_mrg}</div>` : ''}
                            </div>
                        `;
                    });

                    mrgDetailsHtml = `
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <div class="w-5 h-5 flex items-center justify-center text-green-600 mr-2">
                                        <i class="ri-pulse-line"></i>
                                    </div>
                                    <h5 class="font-medium text-gray-700 text-sm">Mapeamentos Residenciais de Glicemia</h5>
                                    <span class="ml-2 text-xs text-gray-500">(${item.mrg_mappings.length} período${item.mrg_mappings.length > 1 ? 's' : ''})</span>
                                </div>
                                <button
                                    class="mrg-toggle-btn flex items-center text-xs text-gray-500 hover:text-green-600 transition-colors duration-200"
                                    data-target="${mrgId}"
                                    title="Expandir/Recolher detalhes da MRG"
                                >
                                    <span class="toggle-text mr-1">Expandir</span>
                                    <div class="w-4 h-4 flex items-center justify-center toggle-icon">
                                        <i class="ri-arrow-down-s-line"></i>
                                    </div>
                                </button>
                            </div>

                            <div id="${mrgId}" class="mrg-details-content hidden">
                                ${mappingsHtml}
                            </div>
                        </div>
                    `;
                } else if (item.mrg_details) {
                    const details = item.mrg_details;
                    const mrgId = `mrg-details-${item.cod_acompanhamento}`;

                    // Construir dados das glicemias com cores baseadas nas metas SBD
                    const glicemiaItems = [
                        { label: 'Jejum', value: details.g_jejum, tipo: 'pre-prandial' },
                        { label: 'Após Café', value: details.g_apos_cafe, tipo: 'pos-prandial' },
                        { label: 'Antes Almoço', value: details.g_antes_almoco, tipo: 'pre-prandial' },
                        { label: 'Após Almoço', value: details.g_apos_almoco, tipo: 'pos-prandial' },
                        { label: 'Antes Jantar', value: details.g_antes_jantar, tipo: 'pre-prandial' },
                        { label: 'Ao Deitar', value: details.g_ao_deitar, tipo: 'pos-prandial' }
                    ].filter(item => item.value !== null && item.value !== undefined)
                    .map(item => {
                        const status = getGlicemiaStatus(item.value, item.tipo);
                        return { ...item, ...status };
                    });

                    mrgDetailsHtml = `
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <div class="w-5 h-5 flex items-center justify-center text-amber-600 mr-2">
                                        <i class="ri-pulse-line"></i>
                                    </div>
                                    <p class="font-medium text-gray-700 text-sm">Dados da Monitorização Residencial da Glicemia</p>
                                </div>
                                <button 
                                    class="mrg-toggle-btn flex items-center text-xs text-gray-500 hover:text-amber-600 transition-colors duration-200"
                                    data-target="${mrgId}"
                                    title="Expandir/Recolher detalhes da MRG"
                                >
                                    <span class="toggle-text mr-1">Expandir</span>
                                    <div class="w-4 h-4 flex items-center justify-center toggle-icon">
                                        <i class="ri-arrow-down-s-line"></i>
                                    </div>
                                </button>
                            </div>
                            
                            <div id="${mrgId}" class="mrg-details-content hidden">
                                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                    <p class="text-xs text-gray-600 mb-3">Data do mapeamento: <span class="font-medium text-gray-800">${details.data_mrg ? new Date(details.data_mrg).toLocaleDateString('pt-BR') : 'N/A'}</span></p>
                                    
                                    <!-- Tabela de Glicemias -->
                                    <div class="overflow-x-auto mb-3">
                                        <table class="w-full text-xs border-collapse border border-amber-300">
                                            <thead>
                                                <tr class="bg-amber-100">
                                                    ${glicemiaItems.map(item => `
                                                        <th class="border border-amber-300 px-2 py-1 text-center font-medium text-gray-700">
                                                            ${item.label}
                                                        </th>
                                                    `).join('')}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr class="bg-white">
                                                    ${glicemiaItems.map(item => `
                                                        <td class="border border-amber-300 px-2 py-2 text-center">
                                                            <div class="flex flex-col items-center">
                                                                <span class="text-sm font-bold ${item.color}">
                                                                    ${item.value}
                                                                </span>
                                                                <span class="text-lg" title="${item.status}">${item.symbol}</span>
                                                            </div>
                                                        </td>
                                                    `).join('')}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div class="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded border">
                                        <strong>Metas SBD 2023-2024:</strong><br>
                                        🟢 Jejum/Pré-prandial: 80-130 mg/dL<br>
                                        🟢 Pós-prandial: &lt; 180 mg/dL<br>
                                        🔴 Fora da meta ou hipoglicemia (&lt; 80 mg/dL)
                                    </div>
                                    
                                    ${details.analise_mrg ? `
                                        <div class="pt-2 border-t border-amber-300">
                                            <p class="text-xs text-gray-600 mb-1">Análise do Mapeamento Residencial de Glicemias:</p>
                                            <div class="bg-white rounded p-2 border border-amber-200">
                                                <p class="text-xs font-medium text-gray-800 whitespace-pre-wrap">${details.analise_mrg}</p>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // Determinar classe do status com cores atualizadas
                let statusBadgeClass;
                switch (item.status_acao) {
                    case 'REALIZADA':
                        statusBadgeClass = 'bg-green-100 text-green-800';
                        break;
                    case 'FINALIZADO':
                        statusBadgeClass = 'bg-green-100 text-green-800 font-semibold';
                        break;
                    case 'CANCELADA':
                        statusBadgeClass = 'bg-red-100 text-red-800';
                        break;
                    case 'AGUARDANDO':
                    case 'PENDENTE':
                    default:
                        statusBadgeClass = 'bg-yellow-100 text-yellow-800';
                        break;
                }
                
                timelineHTML += `
                    <div class="border-l-4 border-amber-500 pl-4 pb-4 mb-4">
                        <div class="flex justify-between items-start">
                            <div class="w-full">
                                <h4 class="font-medium text-gray-900">${item.dsc_acao}</h4>
                                <p class="text-sm text-gray-600">${dataFormatada}</p>
                                ${item.observacoes ? `<p class="text-sm text-gray-700 mt-1">${item.observacoes}</p>` : ''}
                                ${item.responsavel_pela_acao ? `<p class="text-xs text-gray-500 mt-1">Responsável: ${item.responsavel_pela_acao}</p>` : ''}
                                ${treatmentStatusHtml}
                                ${labTestsHtml}
                                ${mrgDetailsHtml}
                                
                                <!-- Botões de ação da timeline -->
                                <div class="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-200">
                                    ${(item.status_acao !== 'REALIZADA' && item.status_acao !== 'FINALIZADO') ? `
                                        <button 
                                            class="timeline-action-btn timeline-action-complete text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                                            data-cod-acompanhamento="${item.cod_acompanhamento}"
                                            data-action="complete"
                                            title="Marcar como concluída"
                                        >
                                            <i class="ri-check-line mr-1"></i>
                                            Ação Concluída
                                        </button>
                                    ` : ''}
                                    
                                    ${(item.status_acao !== 'CANCELADA' && item.status_acao !== 'FINALIZADO') ? `
                                        <button 
                                            class="timeline-action-btn timeline-action-cancel text-xs px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center"
                                            data-cod-acompanhamento="${item.cod_acompanhamento}"
                                            data-action="cancel"
                                            title="Marcar como cancelada"
                                        >
                                            <i class="ri-close-line mr-1"></i>
                                            Ação Cancelada
                                        </button>
                                    ` : ''}
                                    
                                    <button 
                                        class="timeline-action-btn timeline-action-delete text-xs px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 flex items-center"
                                        data-cod-acompanhamento="${item.cod_acompanhamento}"
                                        data-action="delete"
                                        title="Excluir ação"
                                    >
                                        <i class="ri-delete-bin-line mr-1"></i>
                                        Excluir
                                    </button>
                                </div>
                            </div>
                            <span class="px-2 py-1 text-xs rounded-full ${statusBadgeClass} ml-2 whitespace-nowrap">${item.status_acao}</span>
                        </div>
                    </div>
                `;
            });
            
            elements.timelineContent.innerHTML = timelineHTML;
            
            // Adicionar event listeners para os botões de expandir/recolher MRG
            document.querySelectorAll('.mrg-toggle-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const content = document.getElementById(targetId);
                    const toggleText = this.querySelector('.toggle-text');
                    const toggleIcon = this.querySelector('.toggle-icon i');
                    
                    if (content && content.classList.contains('hidden')) {
                        // Expandir
                        content.classList.remove('hidden');
                        content.style.maxHeight = 'none';
                        toggleText.textContent = 'Recolher';
                        toggleIcon.className = 'ri-arrow-up-s-line';
                        
                        // Animação suave
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-10px)';
                        requestAnimationFrame(() => {
                            content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            content.style.opacity = '1';
                            content.style.transform = 'translateY(0)';
                        });
                    } else if (content) {
                        // Recolher
                        content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-10px)';
                        
                        setTimeout(() => {
                            content.classList.add('hidden');
                            content.style.maxHeight = '0';
                            toggleText.textContent = 'Expandir';
                            toggleIcon.className = 'ri-arrow-down-s-line';
                        }, 200);
                    }
                });
            });

            // Adicionar event listeners para os botões de expandir/recolher Exames Laboratoriais
            document.querySelectorAll('.lab-tests-toggle-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const content = document.getElementById(targetId);
                    const toggleText = this.querySelector('.toggle-text');
                    const toggleIcon = this.querySelector('.toggle-icon i');

                    if (content && content.classList.contains('hidden')) {
                        // Expandir
                        content.classList.remove('hidden');
                        content.style.maxHeight = 'none';
                        toggleText.textContent = 'Recolher';
                        toggleIcon.className = 'ri-arrow-up-s-line';

                        // Animação suave
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-10px)';
                        requestAnimationFrame(() => {
                            content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            content.style.opacity = '1';
                            content.style.transform = 'translateY(0)';
                        });
                    } else if (content) {
                        // Recolher
                        content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-10px)';

                        setTimeout(() => {
                            content.classList.add('hidden');
                            content.style.maxHeight = '0';
                            toggleText.textContent = 'Expandir';
                            toggleIcon.className = 'ri-arrow-down-s-line';
                        }, 200);
                    }
                });
            });

            // Adicionar event listeners para os botões de expandir/recolher Avaliação do Tratamento
            document.querySelectorAll('.evaluation-toggle-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const content = document.getElementById(targetId);
                    const toggleText = this.querySelector('.toggle-text');
                    const toggleIcon = this.querySelector('.toggle-icon i');

                    if (content && content.classList.contains('hidden')) {
                        // Expandir
                        content.classList.remove('hidden');
                        content.style.maxHeight = 'none';
                        toggleText.textContent = 'Recolher';
                        toggleIcon.className = 'ri-arrow-up-s-line';

                        // Animação suave
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-10px)';
                        requestAnimationFrame(() => {
                            content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            content.style.opacity = '1';
                            content.style.transform = 'translateY(0)';
                        });
                    } else if (content) {
                        // Recolher
                        content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-10px)';

                        setTimeout(() => {
                            content.classList.add('hidden');
                            content.style.maxHeight = '0';
                            toggleText.textContent = 'Expandir';
                            toggleIcon.className = 'ri-arrow-down-s-line';
                        }, 200);
                    }
                });
            });

            // Adicionar event listeners para os botões de ação da timeline
            document.querySelectorAll('.timeline-action-btn').forEach(button => {
                button.addEventListener('click', async function() {
                    const codAcompanhamento = this.getAttribute('data-cod-acompanhamento');
                    const action = this.getAttribute('data-action');
                    
                    if (!codAcompanhamento) {
                        console.error('Código do acompanhamento não encontrado');
                        return;
                    }
                    
                    try {
                        await handleTimelineAction(codAcompanhamento, action, this);
                    } catch (error) {
                        console.error('Erro ao executar ação da timeline:', error);
                        alert('Erro ao executar ação. Tente novamente.');
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao carregar timeline:', error);
            elements.timelineContent.innerHTML = '<div class="p-4 text-center text-red-500">Erro ao carregar timeline</div>';
        }
    }

    // Função para gerenciar ações da timeline (Concluída, Cancelada, Excluir)
    async function handleTimelineAction(codAcompanhamento, action, buttonElement) {
        let confirmMessage = '';
        let apiEndpoint = '';
        let requestMethod = 'PUT';
        let requestBody = {};
        
        switch (action) {
            case 'complete':
                confirmMessage = 'Tem certeza que deseja marcar esta ação como concluída?';
                apiEndpoint = `/api/diabetes/timeline/${codAcompanhamento}/status`;
                requestBody = { status: 'REALIZADA', data_realizacao: new Date().toISOString().split('T')[0] };
                break;
            case 'cancel':
                confirmMessage = 'Tem certeza que deseja cancelar esta ação?';
                apiEndpoint = `/api/diabetes/timeline/${codAcompanhamento}/status`;
                requestBody = { status: 'CANCELADA', data_realizacao: new Date().toISOString().split('T')[0] };
                break;
            case 'delete':
                confirmMessage = 'Tem certeza que deseja excluir esta ação? Esta operação não pode ser desfeita.';
                apiEndpoint = `/api/diabetes/timeline/${codAcompanhamento}`;
                requestMethod = 'DELETE';
                break;
            default:
                throw new Error(`Ação não reconhecida: ${action}`);
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Desabilitar botão durante a requisição
        const originalText = buttonElement.innerHTML;
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="ri-loader-4-line animate-spin mr-1"></i>Processando...';
        
        try {
            const response = await fetch(apiEndpoint, {
                method: requestMethod,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestMethod !== 'DELETE' ? JSON.stringify(requestBody) : undefined
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.sucesso) {
                alert(result.mensagem || 'Ação executada com sucesso!');
                
                // Recarregar timeline para refletir as mudanças
                if (currentPacienteForModal && currentPacienteForModal.cod_paciente) {
                    await loadTimelineDiabetes(currentPacienteForModal.cod_paciente);
                }
            } else {
                throw new Error(result.erro || 'Erro desconhecido');
            }
        } catch (error) {
            console.error(`Erro ao executar ação da timeline (${action}):`, error);
            alert(`Erro ao executar ação: ${error.message}`);
            
            // Restaurar botão em caso de erro
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalText;
        }
    }

    // Função para filtrar ações da timeline
    function filterTimelineActions(filterType) {
        // Implementar filtro da timeline
        console.log('Filtrar timeline por:', filterType);
    }

    // Função para resetar formulário de ação
    function resetActionForm() {
        elements.actionForm.reset();
    }

    // Função para salvar ação
    async function handleSaveAction() {
        const codAcao = parseInt(elements.codAcaoSelect.value);
        const dataAcao = elements.dataAcaoInput.value;
        const observacoes = elements.observacoesTextarea.value;
        const responsavel = elements.responsavelInput.value;

        if (!codAcao || !dataAcao) {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }

        if (!currentPacienteForModal) {
            alert('Erro: Paciente não identificado.');
            return;
        }

        // Preparar payload base
        const payload = {
            cod_cidadao: currentPacienteForModal.cod_paciente,
            cod_acao_atual: codAcao,
            data_acao_atual: dataAcao,
            observacoes: observacoes || null,
            responsavel_pela_acao: responsavel || null,
            // Finalizar Acompanhamento é marcado como FINALIZADO imediatamente
            status_acao: codAcao === 12 ? 'FINALIZADO' : 'AGUARDANDO'
        };

        // Adicionar dados específicos baseado na ação
        if (codAcao === 11) { // Avaliar Mapeamento Residencial de Glicemias
            const mrgData = {
                g_jejum: document.getElementById('g-jejum-diabetes').value || null,
                g_apos_cafe: document.getElementById('g-apos-cafe-diabetes').value || null,
                g_antes_almoco: document.getElementById('g-antes-almoco-diabetes').value || null,
                g_apos_almoco: document.getElementById('g-apos-almoco-diabetes').value || null,
                g_antes_jantar: document.getElementById('g-antes-jantar-diabetes').value || null,
                g_ao_deitar: document.getElementById('g-ao-deitar-diabetes').value || null,
                analise_mrg: document.getElementById('analise-mrg-diabetes').value || null
            };
            payload.mrg_data = mrgData;
        } else if (codAcao === 3) { // Modificar tratamento
            // Modificar tratamento agora apenas registra a ação na timeline
            // Não há dados adicionais necessários - a ação será registrada como AGUARDANDO (padrão)
        }

        try {
            elements.saveActionBtn.disabled = true;
            elements.saveActionBtn.textContent = 'Salvando...';

            const response = await fetch('/api/diabetes/registrar_acao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.sucesso) {
                alert('Ação registrada com sucesso!');
                elements.registerModal.classList.add('hidden');
                resetActionForm();
                
                // Recarregar timeline
                loadTimelineDiabetes(currentPacienteForModal.cod_paciente);
                
                // Atualizar lista de pacientes
                fetchPacientesDiabetes();
            } else {
                alert(`Erro ao registrar ação: ${result.erro}`);
            }
        } catch (error) {
            console.error('Erro ao salvar ação:', error);
            alert('Erro ao registrar ação. Tente novamente.');
        } finally {
            elements.saveActionBtn.disabled = false;
            elements.saveActionBtn.textContent = 'Salvar';
        }
    }

    // Função para gerar receituário
    async function handleGerarReceituario() {
        const checkboxes = document.querySelectorAll('input[name="paciente-checkbox-diabetes"]:checked');
        if (checkboxes.length === 0) {
            alert('Selecione pelo menos um paciente.');
            return;
        }

        // Coletar dados dos pacientes selecionados
        const pacientesSelecionados = [];
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    pacientesSelecionados.push({
                        cod_paciente: parseInt(checkbox.value),
                        nome_paciente: cells[1] ? cells[1].textContent.trim() : '',
                        dt_nascimento: cells[2] ? cells[2].textContent.trim() : '',
                        sexo: cells[3] ? cells[3].textContent.trim() : ''
                    });
                }
            }
        });

        if (pacientesSelecionados.length === 0) {
            alert('Erro ao coletar dados dos pacientes selecionados.');
            return;
        }

        console.log('Pacientes selecionados para receituário:', pacientesSelecionados);

        // Mostrar loading
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'loading-receituario-diabetes';
        loadingMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-size: 18px;
        `;
        loadingMessage.innerHTML = `
            <div style="text-align: center;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <div>Gerando receituários de diabetes...</div>
            </div>
        `;
        
        // Adicionar CSS para animação de loading
        if (!document.getElementById('loading-spin-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spin-style';
            style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loadingMessage);

        try {
            let response;
            
            if (pacientesSelecionados.length === 1) {
                // Gerar receituário individual
                response = await fetch('/api/diabetes/generate_prescription_pdf_individual', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ patient: pacientesSelecionados[0] })
                });
            } else {
                // Gerar receituário em lote
                response = await fetch('/api/diabetes/generate_prescriptions_pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ patients: pacientesSelecionados })
                });
            }

            if (response.ok) {
                // Download do PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                // Nome do arquivo baseado na quantidade
                if (pacientesSelecionados.length === 1) {
                    const nomeFormatado = pacientesSelecionados[0].nome_paciente.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
                    a.download = `receituario_diabetes_${nomeFormatado}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
                } else {
                    a.download = `receituarios_diabetes_${pacientesSelecionados.length}_pacientes_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
                }
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                // Feedback de sucesso
                alert(`Receituário${pacientesSelecionados.length > 1 ? 's' : ''} gerado${pacientesSelecionados.length > 1 ? 's' : ''} com sucesso!`);
                
                // Desmarcar checkboxes
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                
            } else {
                const errorData = await response.json();
                console.error('Erro na resposta:', errorData);
                alert(`Erro ao gerar receituário: ${errorData.erro || 'Erro desconhecido'}`);
            }
            
        } catch (error) {
            console.error('Erro ao gerar receituário:', error);
            alert(`Erro ao gerar receituário: ${error.message}`);
        } finally {
            // Remover loading
            const loading = document.getElementById('loading-receituario-diabetes');
            if (loading) {
                document.body.removeChild(loading);
            }
        }
    }

    // --- Funcionalidades de Gerenciamento de Tratamento para Diabetes ---

    // Função para abrir modal de tratamento (disponível globalmente)
    window.abrirModalTratamentoDiabetes = function(paciente) {
        currentPacienteForModal = paciente;
        
        // Elementos do modal de tratamento
        const modal = document.getElementById('diabetes-treatmentModal');
        const modalTitle = document.getElementById('diabetes-treatmentModalTitle');
        const avatarIniciais = document.getElementById('diabetes-treatmentModalAvatarIniciais');
        const pacienteNome = document.getElementById('diabetes-treatmentModalPacienteNome');
        const pacienteIdade = document.getElementById('diabetes-treatmentModalPacienteIdade');
        const pacienteInfo = document.getElementById('diabetes-treatmentModalPacienteInfo');
        
        if (!modal) {
            console.error('Modal de tratamento não encontrado');
            return;
        }
        
        // Preencher informações do paciente
        modalTitle.textContent = 'Gerenciar Tratamento - ' + paciente.nome_paciente;
        avatarIniciais.textContent = getInitials(paciente.nome_paciente);
        pacienteNome.textContent = paciente.nome_paciente;
        pacienteIdade.textContent = `${calculateAge(paciente.dt_nascimento)} anos`;
        pacienteInfo.textContent = `${paciente.nome_equipe} - Área ${paciente.microarea}`;
        
        // Carregar medicamentos atuais
        loadMedicamentosAtuaisDiabetes(paciente.cod_paciente);
        
        // Carregar lista de medicamentos para diabetes
        loadMedicamentosDisponiveisDiabetes();
        
        // Mostrar modal
        modal.classList.remove('hidden');
    };

    // Função para obter iniciais do nome
    function getInitials(nome) {
        if (!nome) return '??';
        const words = nome.trim().split(' ');
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    // Função para carregar medicamentos atuais do paciente diabético
    async function loadMedicamentosAtuaisDiabetes(codCidadao) {
        const container = document.getElementById('diabetes-medicamentosAtuaisContainer');
        const countDiv = document.getElementById('diabetes-medicamentosAtivosCount');
        const noMedicamentosMessage = document.getElementById('diabetes-noMedicamentosMessage');
        
        if (!container) {
            console.error('Container diabetes-medicamentosAtuaisContainer não encontrado');
            return;
        }
        
        // Log para debug se outros elementos não forem encontrados
        if (!countDiv) console.warn('Elemento diabetes-medicamentosAtivosCount não encontrado');
        if (!noMedicamentosMessage) console.warn('Elemento diabetes-noMedicamentosMessage não encontrado');
        
        try {
            container.innerHTML = '<div class="text-center py-4 text-gray-500">Carregando medicamentos...</div>';
            
            const response = await fetch(`/api/diabetes/medicamentos_atuais/${codCidadao}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.erro || 'Erro ao carregar medicamentos');
            }
            
            const medicamentos = data.medicamentos || [];
            
            if (medicamentos.length === 0) {
                container.innerHTML = '';
                if (noMedicamentosMessage) {
                    noMedicamentosMessage.classList.remove('hidden');
                }
                if (countDiv) {
                    countDiv.textContent = '0 medicamentos';
                }
                return;
            }
            
            if (noMedicamentosMessage) {
                noMedicamentosMessage.classList.add('hidden');
            }
            if (countDiv) {
                countDiv.textContent = `${medicamentos.length} medicamento${medicamentos.length > 1 ? 's' : ''}`;
            }
            
            let medicamentosHTML = '';
            medicamentos.forEach(med => {
                const dataInicio = med.data_inicio ? new Date(med.data_inicio).toLocaleDateString('pt-BR') : 'Não informado';
                
                medicamentosHTML += `
                    <div class="border rounded-lg p-3 bg-gray-50">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h6 class="font-medium text-gray-900">${med.nome_medicamento}</h6>
                                <p class="text-sm text-gray-600">
                                    ${med.dose || 1} comp ${med.frequencia || 1}x/dia
                                </p>
                                <p class="text-xs text-gray-500">Início: ${dataInicio}</p>
                                ${med.observacoes ? `<p class="text-xs text-gray-600 mt-1">${med.observacoes}</p>` : ''}
                            </div>
                            <div class="flex space-x-1">
                                <button class="text-blue-600 hover:text-blue-800 p-1" onclick="modificarMedicamentoDiabetes(${med.cod_seq_medicamento})" title="Modificar">
                                    <i class="ri-edit-line"></i>
                                </button>
                                <button class="text-red-600 hover:text-red-800 p-1" onclick="interromperMedicamentoDiabetes(${med.cod_seq_medicamento})" title="Interromper">
                                    <i class="ri-stop-line"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = medicamentosHTML;
            
        } catch (error) {
            console.error('Erro ao carregar medicamentos para paciente', codCidadao, ':', error);
            container.innerHTML = `<div class="text-center py-4 text-red-500">Erro ao carregar medicamentos: ${error.message}</div>`;
        }
    }

    // Função para carregar medicamentos disponíveis para diabetes
    async function loadMedicamentosDisponiveisDiabetes() {
        const select = document.getElementById('diabetes-novoMedicamentoNome');
        if (!select) return;
        
        try {
            const response = await fetch('/api/diabetes/medicamentos_diabetes');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.erro || 'Erro ao carregar medicamentos');
            }
            
            select.innerHTML = '<option value="">Selecione o medicamento</option>';
            
            data.medicamentos.forEach(med => {
                select.innerHTML += `<option value="${med}">${med}</option>`;
            });
            
        } catch (error) {
            console.error('Erro ao carregar medicamentos disponíveis:', error);
        }
    }

    // Função para configurar event listeners do modal de tratamento
    function setupTreatmentModalEventListeners() {
        // Botão fechar modal
        const closeBtn = document.getElementById('diabetes-closeTreatmentModal');
        const cancelBtn = document.getElementById('diabetes-cancelTreatmentBtn');
        const saveBtn = document.getElementById('diabetes-saveTreatmentBtn');
        
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.onclick = () => {
                    document.getElementById('diabetes-treatmentModal').classList.add('hidden');
                };
            }
        });
        
        // Botão salvar
        if (saveBtn) {
            saveBtn.onclick = salvarTratamentoDiabetes;
        }
        
        // Abas de ação (adicionar/modificar)
        const actionTabs = document.querySelectorAll('.diabetes-treatment-action-tab');
        actionTabs.forEach(tab => {
            tab.onclick = () => {
                // Remover active de todas as abas
                actionTabs.forEach(t => {
                    t.classList.remove('active', 'border-amber-500', 'bg-amber-50', 'text-amber-600');
                    t.classList.add('border-gray-200', 'bg-white', 'text-gray-600');
                });
                
                // Ativar aba clicada
                tab.classList.add('active', 'border-amber-500', 'bg-amber-50', 'text-amber-600');
                tab.classList.remove('border-gray-200', 'bg-white', 'text-gray-600');
                
                // Mostrar/esconder seções
                const action = tab.dataset.action;
                toggleTreatmentSectionsDiabetes(action);
            };
        });
        
        // Radio buttons para tipo de modificação
        const modificationRadios = document.querySelectorAll('input[name="diabetes-modification-type"]');
        modificationRadios.forEach(radio => {
            radio.onchange = () => {
                const newFrequencySection = document.getElementById('diabetes-newFrequencySection');
                if (radio.value === 'frequency' && radio.checked) {
                    newFrequencySection.classList.remove('hidden');
                } else {
                    newFrequencySection.classList.add('hidden');
                }
            };
        });
    }

    // Função para alternar seções do tratamento
    function toggleTreatmentSectionsDiabetes(action) {
        const addSection = document.getElementById('diabetes-addMedicationSection');
        const addInsulinSection = document.getElementById('diabetes-addInsulinSection');
        const modifySection = document.getElementById('diabetes-modifyMedicationSection');
        const modifyInsulinSection = document.getElementById('diabetes-modifyInsulinSection');
        
        // Ocultar todas as seções primeiro
        addSection.classList.add('hidden');
        addInsulinSection.classList.add('hidden');
        modifySection.classList.add('hidden');
        modifyInsulinSection.classList.add('hidden');
        
        if (action === 'add') {
            addSection.classList.remove('hidden');
        } else if (action === 'add-insulin') {
            addInsulinSection.classList.remove('hidden');
            // Configurar listeners para insulina
            setupInsulinEventListeners();
        } else if (action === 'modify') {
            modifySection.classList.remove('hidden');
            // Carregar medicamentos para modificar
            loadMedicamentosParaModificarDiabetes();
        } else if (action === 'modify-insulin') {
            modifyInsulinSection.classList.remove('hidden');
            // Configurar listeners para modificação de insulina
            setupModifyInsulinEventListeners();
        }
    }

    // Função para carregar medicamentos para modificar
    async function loadMedicamentosParaModificarDiabetes() {
        if (!currentPacienteForModal) return;
        
        const select = document.getElementById('diabetes-selectMedicamentoModificar');
        if (!select) return;
        
        try {
            const response = await fetch(`/api/diabetes/medicamentos_atuais/${currentPacienteForModal.cod_paciente}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.erro || 'Erro ao carregar medicamentos');
            }
            
            select.innerHTML = '<option value="">Selecione um medicamento</option>';
            
            data.medicamentos.forEach(med => {
                select.innerHTML += `<option value="${med.cod_seq_medicamento}">${med.nome_medicamento} - ${med.dose}comp ${med.frequencia}x/dia</option>`;
            });
            
        } catch (error) {
            console.error('Erro ao carregar medicamentos para modificar:', error);
        }
    }

    // Função para salvar tratamento
    async function salvarTratamentoDiabetes() {
        if (!currentPacienteForModal) return;
        
        const activeTab = document.querySelector('.diabetes-treatment-action-tab.active');
        if (!activeTab) return;
        
        const action = activeTab.dataset.action;
        
        if (action === 'add') {
            await adicionarNovoMedicamentoDiabetes();
        } else if (action === 'add-insulin') {
            await adicionarNovaInsulina();
        } else if (action === 'modify') {
            await modificarMedicamentoDiabetes();
        } else if (action === 'modify-insulin') {
            await modificarInsulinaAtual();
        }
    }

    // Função para adicionar novo medicamento
    async function adicionarNovoMedicamentoDiabetes() {
        const nome = document.getElementById('diabetes-novoMedicamentoNome').value;
        const dose = document.getElementById('diabetes-novoMedicamentoDose').value;
        const frequencia = document.getElementById('diabetes-novoMedicamentoFrequencia').value;
        const dataInicio = document.getElementById('diabetes-novoMedicamentoDataInicio').value;
        const observacoes = document.getElementById('diabetes-novoMedicamentoObservacoes').value;
        
        if (!nome || !dose || !frequencia) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }
        
        try {
            const response = await fetch('/api/diabetes/medicamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codcidadao: currentPacienteForModal.cod_paciente,
                    nome_medicamento: nome,
                    dose: parseInt(dose),
                    frequencia: parseInt(frequencia),
                    data_inicio: dataInicio || null,
                    observacoes: observacoes
                })
            });
            
            const result = await response.json();
            
            if (result.sucesso) {
                alert('Medicamento adicionado com sucesso!');
                
                // Limpar formulário
                document.getElementById('diabetes-novoMedicamentoNome').value = '';
                document.getElementById('diabetes-novoMedicamentoDose').value = '';
                document.getElementById('diabetes-novoMedicamentoFrequencia').value = '';
                document.getElementById('diabetes-novoMedicamentoDataInicio').value = '';
                document.getElementById('diabetes-novoMedicamentoObservacoes').value = '';
                
                // Recarregar medicamentos no modal
                await loadMedicamentosAtuaisDiabetes(currentPacienteForModal.cod_paciente);
                
                // Atualizar coluna de tratamento na tabela principal
                await loadTreatmentSummaryForPatient(currentPacienteForModal.cod_paciente);
                
            } else {
                alert(`Erro: ${result.erro}`);
            }
            
        } catch (error) {
            console.error('Erro ao adicionar medicamento:', error);
            alert('Erro ao adicionar medicamento. Tente novamente.');
        }
    }

    // Função para modificar medicamento existente
    async function modificarMedicamentoDiabetes() {
        const codMedicamento = document.getElementById('diabetes-selectMedicamentoModificar').value;
        const modificationType = document.querySelector('input[name="diabetes-modification-type"]:checked');
        const observacoes = document.getElementById('diabetes-modificacaoObservacoes').value;
        
        if (!codMedicamento || !modificationType) {
            alert('Selecione um medicamento e o tipo de modificação.');
            return;
        }
        
        try {
            if (modificationType.value === 'stop' || modificationType.value === 'pause') {
                // Interromper medicamento
                const response = await fetch(`/api/diabetes/medicamentos/${codMedicamento}/interromper`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        motivo_interrupcao: observacoes || `Medicamento ${modificationType.value === 'stop' ? 'interrompido' : 'pausado'} pelo profissional`
                    })
                });
                
                const result = await response.json();
                
                if (result.sucesso) {
                    alert('Medicamento interrompido com sucesso!');
                    await loadMedicamentosAtuaisDiabetes(currentPacienteForModal.cod_paciente);
                    await loadTreatmentSummaryForPatient(currentPacienteForModal.cod_paciente);
                } else {
                    alert(`Erro: ${result.erro}`);
                }
                
            } else if (modificationType.value === 'frequency') {
                // Alterar frequência
                const novaFrequencia = document.getElementById('diabetes-novaFrequencia').value;
                
                if (!novaFrequencia) {
                    alert('Selecione a nova frequência.');
                    return;
                }
                
                const response = await fetch(`/api/diabetes/medicamentos/${codMedicamento}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        frequencia: parseInt(novaFrequencia),
                        observacoes: observacoes || `Frequência alterada para ${novaFrequencia}x ao dia`
                    })
                });
                
                const result = await response.json();
                
                if (result.sucesso) {
                    alert('Frequência alterada com sucesso!');
                    await loadMedicamentosAtuaisDiabetes(currentPacienteForModal.cod_paciente);
                    await loadTreatmentSummaryForPatient(currentPacienteForModal.cod_paciente);
                } else {
                    alert(`Erro: ${result.erro}`);
                }
            }
            
        } catch (error) {
            console.error('Erro ao modificar medicamento:', error);
            alert('Erro ao modificar medicamento. Tente novamente.');
        }
    }

    // Funções globais para os botões dos medicamentos
    window.modificarMedicamentoDiabetes = function(codSeqMedicamento) {
        // Mudar para aba de modificar
        const modifyTab = document.querySelector('.diabetes-treatment-action-tab[data-action="modify"]');
        if (modifyTab) {
            modifyTab.click();
            
            // Selecionar o medicamento após carregar a lista
            setTimeout(() => {
                const select = document.getElementById('diabetes-selectMedicamentoModificar');
                if (select) {
                    select.value = codSeqMedicamento;
                }
            }, 500);
        }
    };

    window.interromperMedicamentoDiabetes = function(codSeqMedicamento) {
        if (confirm('Tem certeza que deseja interromper este medicamento?')) {
            fetch(`/api/diabetes/medicamentos/${codSeqMedicamento}/interromper`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    motivo_interrupcao: 'Medicamento interrompido pelo profissional'
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.sucesso) {
                    alert('Medicamento interrompido com sucesso!');
                    loadMedicamentosAtuaisDiabetes(currentPacienteForModal.cod_paciente);
                    loadTreatmentSummaryForPatient(currentPacienteForModal.cod_paciente);
                } else {
                    alert(`Erro: ${result.erro}`);
                }
            })
            .catch(error => {
                console.error('Erro ao interromper medicamento:', error);
                alert('Erro ao interromper medicamento. Tente novamente.');
            });
        }
    };

    // --- Funcionalidades Específicas de Insulina ---

    // Configurar event listeners para insulina
    function setupInsulinEventListeners() {
        const frequenciaSelect = document.getElementById('diabetes-frequenciaInsulina');
        if (frequenciaSelect) {
            frequenciaSelect.addEventListener('change', function() {
                const frequencia = parseInt(this.value);
                if (frequencia >= 1 && frequencia <= 4) {
                    generateDoseInputs(frequencia);
                    document.getElementById('diabetes-dosesContainer').classList.remove('hidden');
                } else {
                    document.getElementById('diabetes-dosesContainer').classList.add('hidden');
                }
            });
        }
    }

    // Gerar inputs de dose baseado na frequência
    function generateDoseInputs(frequencia) {
        const container = document.getElementById('diabetes-dosesInputs');
        if (!container) return;

        container.innerHTML = '';

        const horariosDefault = ['08:00', '12:00', '18:00', '22:00'];
        
        for (let i = 0; i < frequencia; i++) {
            const doseDiv = document.createElement('div');
            doseDiv.className = 'flex items-center space-x-3 p-2 bg-orange-25 rounded border';
            
            const aplicacaoLabel = ['1ª aplicação', '2ª aplicação', '3ª aplicação', '4ª aplicação'][i];
            
            doseDiv.innerHTML = `
                <div class="flex-shrink-0 text-sm font-medium text-gray-700 w-24">
                    ${aplicacaoLabel}:
                </div>
                <div class="flex items-center space-x-2">
                    <select class="insulin-dose-input border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" data-index="${i}">
                        ${Array.from({length: 100}, (_, idx) => idx + 1).map(num => 
                            `<option value="${num}">${num}</option>`
                        ).join('')}
                    </select>
                    <span class="text-sm text-gray-600">Unidades às</span>
                    <input type="time" class="insulin-time-input border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                           value="${horariosDefault[i] || '08:00'}" data-index="${i}">
                </div>
            `;
            
            container.appendChild(doseDiv);
        }
    }

    // Função para adicionar nova insulina
    async function adicionarNovaInsulina() {
        const tipoInsulina = document.getElementById('diabetes-tipoInsulina').value;
        const frequenciaDia = parseInt(document.getElementById('diabetes-frequenciaInsulina').value);
        const dataInicio = document.getElementById('diabetes-insulinaDataInicio').value;
        const observacoes = document.getElementById('diabetes-insulinaObservacoes').value;

        if (!tipoInsulina || !frequenciaDia) {
            alert('Preencha o tipo de insulina e a frequência.');
            return;
        }

        // Coletar dados das doses
        const dosesInputs = document.querySelectorAll('.insulin-dose-input');
        const timesInputs = document.querySelectorAll('.insulin-time-input');
        
        if (dosesInputs.length !== frequenciaDia || timesInputs.length !== frequenciaDia) {
            alert('Erro na configuração das doses. Tente novamente.');
            return;
        }

        const dosesEstruturadas = [];
        for (let i = 0; i < frequenciaDia; i++) {
            const dose = parseInt(dosesInputs[i].value);
            const horario = timesInputs[i].value;
            
            if (!dose || !horario) {
                alert(`Preencha a dose e horário da ${i + 1}ª aplicação.`);
                return;
            }
            
            dosesEstruturadas.push({
                dose: dose,
                horario: horario
            });
        }

        try {
            const saveBtn = document.getElementById('diabetes-saveTreatmentBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';

            const response = await fetch('/api/diabetes/insulinas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codcidadao: currentPacienteForModal.cod_paciente,
                    tipo_insulina: tipoInsulina,
                    frequencia_dia: frequenciaDia,
                    doses_estruturadas: dosesEstruturadas,
                    data_inicio: dataInicio || null,
                    observacoes: observacoes
                })
            });

            const result = await response.json();

            if (result.sucesso) {
                alert(`${tipoInsulina} adicionada com sucesso!`);
                
                // Limpar formulário
                document.getElementById('diabetes-tipoInsulina').value = '';
                document.getElementById('diabetes-frequenciaInsulina').value = '';
                document.getElementById('diabetes-insulinaDataInicio').value = '';
                document.getElementById('diabetes-insulinaObservacoes').value = '';
                document.getElementById('diabetes-dosesContainer').classList.add('hidden');
                
                // Recarregar medicamentos no modal (incluindo insulinas)
                await loadMedicamentosAtuaisDiabetes(currentPacienteForModal.cod_paciente);
                
                // Atualizar coluna de tratamento na tabela principal
                await loadTreatmentSummaryForPatient(currentPacienteForModal.cod_paciente);
                
            } else {
                alert(`Erro: ${result.erro}`);
            }
            
        } catch (error) {
            console.error('Erro ao adicionar insulina:', error);
            alert('Erro ao adicionar insulina. Tente novamente.');
        } finally {
            const saveBtn = document.getElementById('diabetes-saveTreatmentBtn');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar Alterações';
        }
    }

    // Atualizar função de carregar medicamentos para incluir insulinas
    const originalLoadMedicamentosAtuais = loadMedicamentosAtuaisDiabetes;
    loadMedicamentosAtuaisDiabetes = async function(codCidadao) {
        await originalLoadMedicamentosAtuais(codCidadao);
        await loadInsulinas(codCidadao);
    };

    // Carregar insulinas ativas do paciente
    async function loadInsulinas(codCidadao) {
        const container = document.getElementById('diabetes-medicamentosAtuaisContainer');
        if (!container) return;

        try {
            const response = await fetch(`/api/diabetes/insulinas/${codCidadao}`);
            const data = await response.json();

            if (!response.ok || !data.sucesso) {
                console.warn('Erro ou sem insulinas:', data.erro || 'Dados indisponíveis');
                return;
            }

            const insulinas = data.insulinas || [];
            if (insulinas.length === 0) return;

            // Adicionar insulinas ao container existente
            insulinas.forEach(insulina => {
                const dataInicio = insulina.data_inicio ? new Date(insulina.data_inicio).toLocaleDateString('pt-BR') : 'Não informado';
                
                const insulinaHTML = `
                    <div class="border rounded-lg p-3 bg-orange-50 border-orange-200">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <div class="w-5 h-5 flex items-center justify-center text-orange-600 mr-2">
                                        <i class="ri-medicine-bottle-fill"></i>
                                    </div>
                                    <h6 class="font-medium text-gray-900">${insulina.tipo_insulina}</h6>
                                </div>
                                <p class="text-sm text-gray-600">
                                    ${insulina.doses_resumo || 'Dosagem não configurada'}
                                </p>
                                <p class="text-xs text-gray-500">Início: ${dataInicio}</p>
                                ${insulina.observacoes ? `<p class="text-xs text-gray-600 mt-1">${insulina.observacoes}</p>` : ''}
                            </div>
                            <div class="flex space-x-1">
                                <button class="text-blue-600 hover:text-blue-800 p-1" onclick="modificarInsulina(${insulina.cod_seq_insulina})" title="Modificar">
                                    <i class="ri-edit-line"></i>
                                </button>
                                <button class="text-red-600 hover:text-red-800 p-1" onclick="interromperInsulina(${insulina.cod_seq_insulina})" title="Interromper">
                                    <i class="ri-stop-line"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                container.insertAdjacentHTML('beforeend', insulinaHTML);
            });

            // Atualizar contador
            const countDiv = document.getElementById('diabetes-medicamentosAtivosCount');
            if (countDiv) {
                const currentText = countDiv.textContent;
                const currentCount = parseInt(currentText.match(/\d+/)?.[0] || 0);
                const newCount = currentCount + insulinas.length;
                countDiv.textContent = `${newCount} medicamento${newCount > 1 ? 's' : ''} (incluindo ${insulinas.length} insulina${insulinas.length > 1 ? 's' : ''})`;
            }

        } catch (error) {
            console.error('Erro ao carregar insulinas:', error);
        }
    }

    // Variáveis para controle da modificação de insulina
    let insulinaParaModificar = null;

    // Função para configurar listeners da modificação de insulina
    function setupModifyInsulinEventListeners() {
        const frequenciaSelect = document.getElementById('diabetes-editFrequenciaInsulina');
        if (frequenciaSelect) {
            frequenciaSelect.addEventListener('change', () => {
                generateEditDoseInputs(parseInt(frequenciaSelect.value));
            });
        }
    }

    // Função para gerar campos de dose para edição
    function generateEditDoseInputs(frequencia) {
        const container = document.getElementById('diabetes-editDosesInputs');
        if (!container) return;

        container.innerHTML = '';
        
        const horarios = [
            ['08:00'],
            ['08:00', '20:00'],
            ['08:00', '14:00', '20:00'],
            ['08:00', '12:00', '18:00', '22:00']
        ];

        const horariosParaFreq = horarios[frequencia - 1] || horarios[0];

        horariosParaFreq.forEach((horario, index) => {
            const doseGroup = document.createElement('div');
            doseGroup.className = 'grid grid-cols-2 gap-3';
            
            doseGroup.innerHTML = `
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Dose ${index + 1} (unidades)</label>
                    <input type="number" id="diabetes-editDose${index}" min="1" max="100"
                        class="w-full border border-gray-300 rounded py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Ex: 12">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Horário</label>
                    <input type="time" id="diabetes-editHorario${index}" value="${horario}"
                        class="w-full border border-gray-300 rounded py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500">
                </div>
            `;
            
            container.appendChild(doseGroup);
        });
    }

    // Funções globais para gerenciar insulinas
    window.modificarInsulina = async function(codSeqInsulina) {
        console.log('Modificar insulina:', codSeqInsulina);
        
        try {
            // Buscar detalhes da insulina
            const response = await fetch(`/api/diabetes/insulinas/${codSeqInsulina}/detalhes`);
            const result = await response.json();
            
            if (!result.sucesso) {
                alert(`Erro: ${result.erro}`);
                return;
            }
            
            insulinaParaModificar = result.insulina;
            
            // Abrir modal de tratamento
            const modal = document.getElementById('diabetes-treatmentModal');
            if (modal) {
                modal.classList.remove('hidden');
                
                // Configurar informações do paciente se necessário
                if (currentPacienteForModal) {
                    document.getElementById('diabetes-treatmentModalPacienteNome').textContent = currentPacienteForModal.nome_paciente;
                    document.getElementById('diabetes-treatmentModalPacienteIdade').textContent = `${currentPacienteForModal.idade} anos`;
                    document.getElementById('diabetes-treatmentModalPacienteInfo').textContent = `${currentPacienteForModal.nome_equipe} - ${currentPacienteForModal.nome_microarea}`;
                    
                    const avatarDiv = document.getElementById('diabetes-treatmentModalAvatarIniciais');
                    const iniciais = currentPacienteForModal.nome_paciente.split(' ')
                        .slice(0, 2)
                        .map(n => n[0])
                        .join('')
                        .toUpperCase();
                    avatarDiv.innerHTML = `<span>${iniciais}</span>`;
                }
                
                // Ativar o botão de modificar insulina
                const modifyInsulinTab = document.querySelector('[data-action="modify-insulin"]');
                if (modifyInsulinTab) {
                    modifyInsulinTab.click();
                }
                
                // Preencher dados da insulina no formulário
                await preencherFormularioModificacaoInsulina(insulinaParaModificar);
            }
            
        } catch (error) {
            console.error('Erro ao carregar detalhes da insulina:', error);
            alert('Erro ao carregar insulina para edição. Tente novamente.');
        }
    };

    // Função para preencher o formulário de modificação
    async function preencherFormularioModificacaoInsulina(insulina) {
        // Tipo de insulina
        const tipoSelect = document.getElementById('diabetes-editTipoInsulina');
        if (tipoSelect) {
            tipoSelect.value = insulina.tipo_insulina;
        }
        
        // Frequência
        const frequenciaSelect = document.getElementById('diabetes-editFrequenciaInsulina');
        if (frequenciaSelect) {
            frequenciaSelect.value = insulina.frequencia_dia.toString();
            // Gerar campos de dose baseados na frequência
            generateEditDoseInputs(insulina.frequencia_dia);
        }
        
        // Aguardar a geração dos campos de dose e depois preenchê-los
        setTimeout(() => {
            // Preencher doses
            if (insulina.doses_estruturadas && Array.isArray(insulina.doses_estruturadas)) {
                insulina.doses_estruturadas.forEach((dose, index) => {
                    const doseInput = document.getElementById(`diabetes-editDose${index}`);
                    const horarioInput = document.getElementById(`diabetes-editHorario${index}`);
                    
                    if (doseInput && dose.dose) {
                        doseInput.value = dose.dose;
                    }
                    if (horarioInput && dose.horario) {
                        horarioInput.value = dose.horario;
                    }
                });
            }
        }, 100);
        
        // Data de início
        const dataInicioInput = document.getElementById('diabetes-editInsulinaDataInicio');
        if (dataInicioInput && insulina.data_inicio) {
            dataInicioInput.value = insulina.data_inicio;
        }
        
        // Observações
        const observacoesTextarea = document.getElementById('diabetes-editInsulinaObservacoes');
        if (observacoesTextarea) {
            observacoesTextarea.value = insulina.observacoes || '';
        }
        
        // Limpar motivo da modificação
        const motivoTextarea = document.getElementById('diabetes-editInsulinaMotivoModificacao');
        if (motivoTextarea) {
            motivoTextarea.value = '';
        }
    }

    // Função para modificar insulina atual
    async function modificarInsulinaAtual() {
        if (!insulinaParaModificar) {
            alert('Nenhuma insulina selecionada para modificação.');
            return;
        }
        
        try {
            // Coletasdados do formulário
            const tipoInsulina = document.getElementById('diabetes-editTipoInsulina').value;
            const frequenciaDia = parseInt(document.getElementById('diabetes-editFrequenciaInsulina').value);
            const dataInicio = document.getElementById('diabetes-editInsulinaDataInicio').value;
            const observacoes = document.getElementById('diabetes-editInsulinaObservacoes').value;
            const motivoModificacao = document.getElementById('diabetes-editInsulinaMotivoModificacao').value;
            
            // Validações
            if (!tipoInsulina) {
                alert('Selecione o tipo de insulina.');
                return;
            }
            
            if (!motivoModificacao.trim()) {
                alert('Informe o motivo da modificação.');
                return;
            }
            
            // Coletar doses estruturadas
            const dosesEstruturadas = [];
            for (let i = 0; i < frequenciaDia; i++) {
                const doseInput = document.getElementById(`diabetes-editDose${i}`);
                const horarioInput = document.getElementById(`diabetes-editHorario${i}`);
                
                if (!doseInput || !horarioInput || !doseInput.value || !horarioInput.value) {
                    alert(`Preencha a dose e horário ${i + 1}.`);
                    return;
                }
                
                const dose = parseInt(doseInput.value);
                if (dose < 1 || dose > 100) {
                    alert(`Dose ${i + 1} deve ser entre 1 e 100 unidades.`);
                    return;
                }
                
                dosesEstruturadas.push({
                    dose: dose,
                    horario: horarioInput.value
                });
            }
            
            // Dados para envio
            const dadosModificacao = {
                tipo_insulina: tipoInsulina,
                frequencia_dia: frequenciaDia,
                doses_estruturadas: dosesEstruturadas,
                data_inicio: dataInicio || null,
                observacoes: observacoes.trim(),
                motivo_modificacao: motivoModificacao.trim()
            };
            
            // Enviar modificação
            const response = await fetch(`/api/diabetes/insulinas/${insulinaParaModificar.cod_seq_insulina}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosModificacao)
            });
            
            const result = await response.json();
            
            if (result.sucesso) {
                alert('Insulina modificada com sucesso!');
                
                // Fechar modal
                const modal = document.getElementById('diabetes-treatmentModal');
                if (modal) {
                    modal.classList.add('hidden');
                }
                
                // Recarregar medicamentos atuais
                await loadMedicamentosAtuaisDiabetes(currentPacienteForModal.cod_paciente);
                
                // Atualizar coluna de tratamento na tabela principal
                await loadTreatmentSummaryForPatient(currentPacienteForModal.cod_paciente);
                
                // Limpar variável
                insulinaParaModificar = null;
                
                // Botão de modificar insulina permanece sempre visível
                
            } else {
                alert(`Erro ao modificar insulina: ${result.erro}`);
            }
            
        } catch (error) {
            console.error('Erro ao modificar insulina:', error);
            alert('Erro ao modificar insulina. Tente novamente.');
        }
    }

    window.interromperInsulina = function(codSeqInsulina) {
        if (confirm('Tem certeza que deseja interromper esta insulina?')) {
            fetch(`/api/diabetes/insulinas/${codSeqInsulina}/interromper`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    motivo_interrupcao: 'Insulina interrompida pelo profissional'
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.sucesso) {
                    alert('Insulina interrompida com sucesso!');
                    loadMedicamentosAtuaisDiabetes(currentPacienteForModal.cod_paciente);
                    loadTreatmentSummaryForPatient(currentPacienteForModal.cod_paciente);
                } else {
                    alert(`Erro: ${result.erro}`);
                }
            })
            .catch(error => {
                console.error('Erro ao interromper insulina:', error);
                alert('Erro ao interromper insulina. Tente novamente.');
            });
        }
    };

    // Funções para novos modais de ação


    // Função para abrir modal de avaliação de tratamento
    function openEvaluateTreatmentModal() {
        // NÃO esconder o modal principal - manter disponível para mudança de tipo de ação
        const evaluateModal = document.getElementById('evaluate-treatment-modal-diabetes');
        evaluateModal.classList.remove('hidden');

        // Definir data atual
        document.getElementById('eval-assessment-date-diabetes').value = new Date().toISOString().split('T')[0];

        // Event listeners para o modal (verificar se já existem para evitar duplicação)
        const closeBtn = document.getElementById('close-evaluate-treatment-modal-diabetes');
        const cancelBtn = document.getElementById('cancel-evaluate-treatment-btn-diabetes');
        const saveBtn = document.getElementById('save-evaluate-treatment-btn-diabetes');
        const addMappingBtn = document.getElementById('add-mapping-btn-diabetes');

        // Remover listeners anteriores se existirem
        closeBtn.onclick = null;
        cancelBtn.onclick = null;
        saveBtn.onclick = null;
        addMappingBtn.onclick = null;

        closeBtn.onclick = () => {
            evaluateModal.classList.add('hidden');
            elements.registerModal.classList.add('hidden'); // Fechar também o modal principal
            clearEvaluateTreatmentModal();
            resetActionForm(); // Limpar o formulário principal
        };

        cancelBtn.onclick = () => {
            evaluateModal.classList.add('hidden');
            elements.registerModal.classList.add('hidden'); // Fechar também o modal principal
            clearEvaluateTreatmentModal();
            resetActionForm(); // Limpar o formulário principal
        };

        saveBtn.onclick = handleSaveEvaluateTreatmentAction;
        addMappingBtn.onclick = addMappingPeriod;

        // Adicionar primeiro período de mapeamento
        addMappingPeriod();
    }

    // Função para adicionar período de mapeamento
    function addMappingPeriod() {
        const container = document.getElementById('mappings-container-diabetes');
        const periodCount = container.children.length + 1;

        const mappingDiv = document.createElement('div');
        mappingDiv.className = 'bg-white border border-green-200 rounded-lg p-4';
        mappingDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h5 class="font-medium text-gray-900">Período ${periodCount}</h5>
                <button type="button" class="text-red-600 hover:text-red-700 text-sm remove-mapping-btn">
                    <i class="ri-delete-bin-line mr-1"></i>Remover
                </button>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Data do Mapeamento</label>
                    <input type="date" class="mapping-date w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Dias Mapeados</label>
                    <input type="number" value="7" class="mapping-days w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-2">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Jejum (mg/dL)</label>
                    <input type="number" class="mapping-jejum w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Após Café (mg/dL)</label>
                    <input type="number" class="mapping-cafe w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Antes Almoço (mg/dL)</label>
                    <input type="number" class="mapping-antes-almoco w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Após Almoço (mg/dL)</label>
                    <input type="number" class="mapping-apos-almoco w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Antes Jantar (mg/dL)</label>
                    <input type="number" class="mapping-antes-jantar w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Ao Deitar (mg/dL)</label>
                    <input type="number" class="mapping-deitar w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                </div>
            </div>
        `;

        container.appendChild(mappingDiv);

        // Event listener para remover período
        mappingDiv.querySelector('.remove-mapping-btn').addEventListener('click', () => {
            if (container.children.length > 1) {
                mappingDiv.remove();
                // Renumerar períodos
                Array.from(container.children).forEach((child, index) => {
                    child.querySelector('h5').textContent = `Período ${index + 1}`;
                });
            } else {
                alert('Deve haver pelo menos um período de mapeamento.');
            }
        });
    }

    // Função para salvar avaliação de tratamento
    async function handleSaveEvaluateTreatmentAction() {
        const hemoglobina = document.getElementById('eval-hemoglobina-diabetes').value;
        const glicemiaMedia = document.getElementById('eval-glicemia-media-diabetes').value;
        const glicemiaJejum = document.getElementById('eval-glicemia-jejum-diabetes').value;
        const dataExames = document.getElementById('eval-exams-date-diabetes').value;
        const statusControle = document.getElementById('eval-control-status-diabetes').value;
        const dataAvaliacao = document.getElementById('eval-assessment-date-diabetes').value;
        const observacoes = document.getElementById('eval-observations-diabetes').value;
        const responsavel = document.getElementById('eval-responsible-diabetes').value;

        if (!dataAvaliacao || !responsavel) {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }

        if (!currentPacienteForModal) {
            alert('Erro: paciente não selecionado.');
            return;
        }

        // Coletar dados dos mapeamentos
        const mappings = [];
        const mappingContainers = document.querySelectorAll('#mappings-container-diabetes > div');
        mappingContainers.forEach((container, index) => {
            const data = container.querySelector('.mapping-date').value;
            const dias = container.querySelector('.mapping-days').value;
            const jejum = container.querySelector('.mapping-jejum').value;
            const cafe = container.querySelector('.mapping-cafe').value;
            const antesAlmoco = container.querySelector('.mapping-antes-almoco').value;
            const aposAlmoco = container.querySelector('.mapping-apos-almoco').value;
            const antesJantar = container.querySelector('.mapping-antes-jantar').value;
            const deitar = container.querySelector('.mapping-deitar').value;

            if (data && dias) {
                mappings.push({
                    periodo: `Período ${index + 1}`,
                    data_mrg: data,
                    dias_mapeamento: parseInt(dias),
                    g_jejum: jejum ? parseInt(jejum) : null,
                    g_apos_cafe: cafe ? parseInt(cafe) : null,
                    g_antes_almoco: antesAlmoco ? parseInt(antesAlmoco) : null,
                    g_apos_almoco: aposAlmoco ? parseInt(aposAlmoco) : null,
                    g_antes_jantar: antesJantar ? parseInt(antesJantar) : null,
                    g_ao_deitar: deitar ? parseInt(deitar) : null
                });
            }
        });

        try {
            const response = await fetch('/api/diabetes/avaliar_tratamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cod_cidadao: currentPacienteForModal.cod_paciente,
                    cod_acao: 4,
                    data_agendamento: dataAvaliacao,
                    observacoes: observacoes || 'Avaliação de tratamento com dados laboratoriais e mapeamentos',
                    responsavel_pela_acao: responsavel,
                    status_controle: statusControle,
                    exames: {
                        hemoglobina_glicada: hemoglobina ? parseFloat(hemoglobina) : null,
                        glicemia_media: glicemiaMedia ? parseInt(glicemiaMedia) : null,
                        glicemia_jejum: glicemiaJejum ? parseInt(glicemiaJejum) : null,
                        data_exame: dataExames
                    },
                    mapeamentos: mappings
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                alert('Avaliação de tratamento salva com sucesso!');
                document.getElementById('evaluate-treatment-modal-diabetes').classList.add('hidden');
                elements.registerModal.classList.add('hidden'); // Fechar também o modal principal
                clearEvaluateTreatmentModal();
                resetActionForm(); // Limpar o formulário principal
                loadTimelineDiabetes(currentPacienteForModal.cod_paciente);
            } else {
                alert('Erro ao salvar avaliação: ' + (result.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao salvar avaliação:', error);
            alert('Erro ao salvar avaliação. Tente novamente.');
        }
    }

    // Função para limpar modal de avaliação de tratamento
    function clearEvaluateTreatmentModal() {
        // Limpar campos de exames
        document.getElementById('eval-hemoglobina-diabetes').value = '';
        document.getElementById('eval-glicemia-media-diabetes').value = '';
        document.getElementById('eval-glicemia-jejum-diabetes').value = '';
        document.getElementById('eval-exams-date-diabetes').value = '';

        // Limpar campos de avaliação
        document.getElementById('eval-control-status-diabetes').value = '';
        document.getElementById('eval-assessment-date-diabetes').value = '';
        document.getElementById('eval-observations-diabetes').value = '';
        document.getElementById('eval-responsible-diabetes').value = '';

        // Limpar container de mapeamentos
        const mappingsContainer = document.getElementById('mappings-container-diabetes');
        mappingsContainer.innerHTML = '';
    }

    // Função para gerar avaliação do status do tratamento com base nos exames laboratoriais
    function generateTreatmentEvaluationStatus(labData, timelineItem) {
        if (!labData || !timelineItem) return '';

        // Avaliar status do controle diabético baseado nas diretrizes SBD 2023-2024
        const evaluateDiabeticControl = (hbA1c, glicemiaMedia, glicemiaJejum) => {
            let score = 0;
            let criteriaMet = [];
            let criteriaFailed = [];

            // Critérios baseados nas metas SBD 2023-2024
            if (hbA1c !== null && hbA1c !== undefined) {
                if (parseFloat(hbA1c) < 7.0) {
                    score += 3;
                    criteriaMet.push('HbA1c na meta (<7%)');
                } else if (parseFloat(hbA1c) <= 8.0) {
                    score += 1;
                    criteriaMet.push('HbA1c aceitável (7-8%)');
                } else {
                    criteriaFailed.push('HbA1c elevada (>8%)');
                }
            }

            if (glicemiaJejum !== null && glicemiaJejum !== undefined) {
                const valor = parseFloat(glicemiaJejum);
                if (valor >= 80 && valor <= 130) {
                    score += 2;
                    criteriaMet.push('Glicemia de jejum na meta (80-130 mg/dL)');
                } else if (valor < 80) {
                    criteriaFailed.push('Hipoglicemia de jejum (<80 mg/dL)');
                } else {
                    criteriaFailed.push('Glicemia de jejum elevada (>130 mg/dL)');
                }
            }

            if (glicemiaMedia !== null && glicemiaMedia !== undefined) {
                const valor = parseFloat(glicemiaMedia);
                if (valor <= 140) {
                    score += 2;
                    criteriaMet.push('Glicemia média adequada (≤140 mg/dL)');
                } else {
                    criteriaFailed.push('Glicemia média elevada (>140 mg/dL)');
                }
            }

            // Determinar status com base na pontuação
            let status, color, icon, recommendation;
            if (score >= 6) {
                status = 'CONTROLADO';
                color = 'text-green-600';
                icon = '🟢';
                recommendation = 'Diabetes bem controlada. Manter tratamento atual e acompanhamento regular.';
            } else if (score >= 3) {
                status = 'EM TRATAMENTO';
                color = 'text-yellow-600';
                icon = '🟡';
                recommendation = 'Controle parcial. Considerar ajustes no tratamento e monitorização mais frequente.';
            } else {
                status = 'DESCOMPENSADO';
                color = 'text-red-600';
                icon = '🔴';
                recommendation = 'Diabetes descompensada. Revisão urgente do tratamento e acompanhamento intensivo necessário.';
            }

            return {
                status,
                color,
                icon,
                score,
                recommendation,
                criteriaMet,
                criteriaFailed
            };
        };

        const evaluation = evaluateDiabeticControl(
            labData.hemoglobina_glicada,
            labData.glicemia_media,
            labData.glicemia_jejum
        );

        const evaluationId = `evaluation-details-${timelineItem.cod_acompanhamento}`;

        return `
            <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                        <div class="w-5 h-5 flex items-center justify-center text-purple-600 mr-2">
                            <i class="ri-stethoscope-line"></i>
                        </div>
                        <h5 class="font-medium text-gray-700 text-sm">Avaliação do Tratamento</h5>
                    </div>
                    <button
                        class="evaluation-toggle-btn flex items-center text-xs text-gray-500 hover:text-purple-600 transition-colors duration-200"
                        data-target="${evaluationId}"
                        title="Expandir/Recolher detalhes da avaliação"
                    >
                        <span class="toggle-text mr-1">Expandir</span>
                        <div class="w-4 h-4 flex items-center justify-center toggle-icon">
                            <i class="ri-arrow-down-s-line"></i>
                        </div>
                    </button>
                </div>

                <!-- Status da Avaliação (sempre visível) -->
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                    <div class="flex items-center justify-center">
                        <span class="text-3xl mr-3" title="Status do Controle">${evaluation.icon}</span>
                        <div class="text-center">
                            <div class="text-lg font-bold ${evaluation.color}">${evaluation.status}</div>
                            <div class="text-xs text-gray-600">Pontuação: ${evaluation.score}/7</div>
                        </div>
                    </div>
                </div>

                <!-- Detalhes da Avaliação (expansível) -->
                <div id="${evaluationId}" class="evaluation-details-content hidden">
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">

                    <!-- Observações da Avaliação do Tratamento -->
                    ${timelineItem.observacoes ? `
                        <div class="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                            <div class="text-xs text-blue-700 font-medium mb-2">
                                <i class="ri-file-text-line mr-1"></i>Observações da Avaliação do Tratamento:
                            </div>
                            <div class="text-sm text-blue-800 whitespace-pre-wrap">${timelineItem.observacoes}</div>
                        </div>
                    ` : ''}

                    <!-- Recomendação -->
                    <div class="mb-4 p-3 bg-white border border-purple-300 rounded-lg">
                        <div class="text-xs text-gray-600 mb-1">
                            <i class="ri-lightbulb-line mr-1"></i>Recomendação Clínica:
                        </div>
                        <div class="text-sm text-gray-800 font-medium">${evaluation.recommendation}</div>
                    </div>

                    <!-- Critérios Atendidos -->
                    ${evaluation.criteriaMet.length > 0 ? `
                        <div class="mb-3">
                            <div class="text-xs text-green-700 font-medium mb-2">
                                <i class="ri-check-line mr-1"></i>Critérios Atendidos:
                            </div>
                            <div class="bg-green-100 border border-green-300 rounded p-2">
                                ${evaluation.criteriaMet.map(criteria =>
                                    `<div class="text-xs text-green-800">• ${criteria}</div>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Critérios Não Atendidos -->
                    ${evaluation.criteriaFailed.length > 0 ? `
                        <div class="mb-3">
                            <div class="text-xs text-red-700 font-medium mb-2">
                                <i class="ri-alert-line mr-1"></i>Necessita Atenção:
                            </div>
                            <div class="bg-red-100 border border-red-300 rounded p-2">
                                ${evaluation.criteriaFailed.map(criteria =>
                                    `<div class="text-xs text-red-800">• ${criteria}</div>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Próximas Ações Sugeridas -->
                    <div class="mt-3 pt-2 border-t border-purple-300">
                        <div class="text-xs text-gray-600 mb-2">
                            <i class="ri-roadmap-line mr-1"></i>Próximas Ações Recomendadas:
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded p-2">
                            ${evaluation.status === 'CONTROLADO' ? `
                                <div class="text-xs text-gray-700">• Manter medicação atual</div>
                                <div class="text-xs text-gray-700">• Retorno em 3-6 meses</div>
                                <div class="text-xs text-gray-700">• Reforçar orientações de estilo de vida</div>
                            ` : evaluation.status === 'EM TRATAMENTO' ? `
                                <div class="text-xs text-gray-700">• Considerar ajuste de medicação</div>
                                <div class="text-xs text-gray-700">• Retorno em 1-3 meses</div>
                                <div class="text-xs text-gray-700">• Intensificar orientações dietéticas</div>
                                <div class="text-xs text-gray-700">• Solicitar nova MRG em 2-4 semanas</div>
                            ` : `
                                <div class="text-xs text-gray-700">• Revisão urgente da medicação</div>
                                <div class="text-xs text-gray-700">• Retorno em 2-4 semanas</div>
                                <div class="text-xs text-gray-700">• Encaminhamento para endocrinologista</div>
                                <div class="text-xs text-gray-700">• Acompanhamento intensivo</div>
                                <div class="text-xs text-gray-700">• MRG imediata</div>
                            `}
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Inicialização
    fetchEquipesMicroareasDiabetes();
    fetchPacientesDiabetes();
    updateSummaryCards();
});