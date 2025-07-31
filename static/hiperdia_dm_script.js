import { hiperdiaApi } from './hiperdiaApi.js';
import { hiperdiaDom } from './hiperdiaDom.js';

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar elementos do DOM adaptados para diabetes
    initDiabetesDomElements();
    
    // --- Variáveis de Estado para Diabetes ---
    let currentFetchedPacientes = [];
    let todasEquipesComMicroareas = [];
    let currentPacienteForModal = null;
    let equipeSelecionadaAtual = 'Todas';
    let microareaSelecionadaAtual = 'Todas as áreas';
    let currentPage = 1;
    let currentSearchTerm = '';
    let currentStatusFilter = 'Todos';
    let currentLimit = 10;

    // Elementos do DOM específicos para diabetes
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
        cancelActionBtn: document.getElementById('cancel-action-btn-diabetes'),
        mrgFields: document.getElementById('mrg-fields-diabetes'),
        medicamentoFields: document.getElementById('medicamento-fields-diabetes')
    };

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
            
            // Ocultar todos os campos específicos
            elements.mrgFields.classList.add('hidden');
            elements.medicamentoFields.classList.add('hidden');
            
            // Mostrar campos baseado na ação
            if (codAcao === 11) { // Avaliar MRG
                elements.mrgFields.classList.remove('hidden');
            } else if (codAcao === 3) { // Modificar tratamento
                elements.medicamentoFields.classList.remove('hidden');
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
            const data = await hiperdiaApi.fetchEquipesMicroareas();
            todasEquipesComMicroareas = data;
            populateEquipeDropdown(data);
        } catch (error) {
            console.error('Erro ao buscar equipes e microáreas:', error);
        }
    }

    // Função para popular dropdown de equipes
    function populateEquipeDropdown(equipesData) {
        elements.equipeDropdownContent.innerHTML = '';
        
        // Opção "Todas as equipes"
        const allOption = document.createElement('div');
        allOption.innerHTML = `
            <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-equipe="Todas">
                Todas as equipes
            </button>
        `;
        elements.equipeDropdownContent.appendChild(allOption);

        // Adicionar equipes
        equipesData.forEach(equipe => {
            const equipeItem = document.createElement('div');
            equipeItem.innerHTML = `
                <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-equipe="${equipe.equipe}">
                    ${equipe.equipe}
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

    // Função para popular dropdown de microáreas
    function populateMicroareaDropdown(selectedEquipe) {
        elements.microareaDropdownContent.innerHTML = '';
        
        // Opção "Todas as microáreas"
        const allOption = document.createElement('div');
        allOption.innerHTML = `
            <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-microarea="Todas">
                Todas as microáreas
            </button>
        `;
        elements.microareaDropdownContent.appendChild(allOption);

        if (selectedEquipe !== 'Todas') {
            const equipeData = todasEquipesComMicroareas.find(e => e.equipe === selectedEquipe);
            if (equipeData && equipeData.microareas) {
                equipeData.microareas.forEach(microarea => {
                    const microareaItem = document.createElement('div');
                    microareaItem.innerHTML = `
                        <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-md" data-microarea="${microarea}">
                            ${microarea}
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
                elements.microareaButtonText.textContent = selectedMicroarea === 'Todas' ? 'Todas as microáreas' : selectedMicroarea;
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

        // Placeholder - implementar APIs específicas para diabetes
        updateCard(elements.diabeticosCard, 'N/A');
        updateCard(elements.controladosCard, 'N/A');
        updateCard(elements.descompensadosCard, 'N/A');
        updateCard(elements.tratamentoCard, 'N/A');
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
            // Placeholder - implementar API específica para diabetes
            // const data = await hiperdiaApi.fetchPacientesDiabetes(params);
            
            // Por enquanto, simular dados vazios
            const data = { pacientes: [], total: 0 };
            
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
                                Idade
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Equipe
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        pacientes.forEach(paciente => {
            const statusClass = getStatusClass(paciente.status);
            const idade = calculateAge(paciente.dt_nascimento);
            
            tableHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" name="paciente-checkbox-diabetes" value="${paciente.cod_paciente}" class="rounded border-gray-300 focus:ring-amber-500">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-full mr-3">
                                <i class="ri-user-line text-amber-600"></i>
                            </div>
                            <div>
                                <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente}</div>
                                <div class="text-sm text-gray-500">CNS: ${paciente.cartao_sus || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${idade} anos
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${paciente.nome_equipe}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${statusClass}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-amber-600 hover:text-amber-900 mr-3" onclick="abrirModalTimelineDiabetes(${JSON.stringify(paciente).replace(/"/g, '&quot;')})">
                            <i class="ri-timeline-line"></i> Timeline
                        </button>
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

    // Função para obter classe de status
    function getStatusClass(status) {
        switch (status) {
            case 'controlado':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Controlado</span>';
            case 'descompensado':
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Descompensado</span>';
            default:
                return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">N/A</span>';
        }
    }

    // Função para abrir modal da timeline (disponível globalmente)
    window.abrirModalTimelineDiabetes = function(paciente) {
        currentPacienteForModal = paciente;
        elements.timelineModalTitle.textContent = `Timeline - ${paciente.nome_paciente}`;
        elements.timelineModal.classList.remove('hidden');
        
        // Carregar timeline
        loadTimelineDiabetes(paciente.cod_paciente);
    };

    // Função para carregar timeline
    async function loadTimelineDiabetes(codPaciente) {
        elements.timelineContent.innerHTML = '<div class="flex justify-center p-4"><div class="text-gray-500">Carregando timeline...</div></div>';
        
        try {
            // Placeholder - implementar API de timeline para diabetes
            elements.timelineContent.innerHTML = '<div class="p-4 text-center text-gray-500">Timeline não implementada ainda</div>';
        } catch (error) {
            console.error('Erro ao carregar timeline:', error);
            elements.timelineContent.innerHTML = '<div class="p-4 text-center text-red-500">Erro ao carregar timeline</div>';
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
        elements.mrgFields.classList.add('hidden');
        elements.medicamentoFields.classList.add('hidden');
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

        // Implementar salvamento da ação
        console.log('Salvar ação diabetes:', { codAcao, dataAcao, observacoes, responsavel });
        
        elements.registerModal.classList.add('hidden');
        resetActionForm();
    }

    // Função para gerar receituário
    function handleGerarReceituario() {
        const checkboxes = document.querySelectorAll('input[name="paciente-checkbox-diabetes"]:checked');
        if (checkboxes.length === 0) {
            alert('Selecione pelo menos um paciente.');
            return;
        }

        // Implementar geração de receituário para diabetes
        console.log('Gerar receituário para diabetes:', checkboxes.length, 'pacientes');
    }

    // Inicialização
    fetchEquipesMicroareasDiabetes();
    fetchPacientesDiabetes();
    updateSummaryCards();
});