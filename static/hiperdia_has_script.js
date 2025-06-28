import { hiperdiaApi } from './hiperdiaApi.js';
import { hiperdiaDom } from './hiperdiaDom.js';

document.addEventListener('DOMContentLoaded', function () {
    hiperdiaDom.initDomElements();
     // Access elements via hiperdiaDom.elements and functions via hiperdiaDom
    const elements = hiperdiaDom.elements;
       
    // --- Variáveis de Estado ---
    let currentFetchedPacientes = [];
    let todasEquipesComMicroareas = [];
    let currentPacienteForModal = null; // Variável para armazenar o paciente atual do modal
    let equipeSelecionadaAtual = 'Todas';
    let microareaSelecionadaAtual = 'Todas as áreas';
    let currentPage = 1;
    let currentSearchTerm = '';
    let currentTimelinePeriodFilter = 'all'; // Novo: Filtro de período para a linha do tempo
    let currentStatusFilter = 'Todos';
    let currentLimit = 10; // Itens por página
    let currentSort = 'nome_asc'; // Exemplo: 'nome_asc', 'idade_desc'

    // Mapa de situação problema para display na tabela
    const situacaoProblemaMap = {
        0: '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>', // Ativo
        1: '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Compensado</span>' // Compensado
    };

    // --- Funções de API (Fetch) ---
    // --- Funções de Manipulação do DOM ---
    // --- Funções de Lógica Principal ---
    function updateSummaryCards() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual, // Use current state variables
            microarea: microareaSelecionadaAtual,
            status: currentStatusFilter // Pass the status filter for counting
       });

        // Card: Total de Hipertensos
        hiperdiaApi.fetchTotalHipertensos(params).then(data => {
            hiperdiaDom.updateCard(elements.hipertensosCard, data.total_pacientes); // Corrected: elements.hipertensosCard
        }).catch(() => {
            console.error('Erro ao buscar total de hipertensos:', error);
            hiperdiaDom.updateCard(elements.hipertensosCard, 'Erro'); // Corrected: elements.hipertensosCard
        });

        // Card: Ações Pendentes/Revisão
        hiperdiaApi.fetchHipertensosMRPAPendente(params).then(data => {
            hiperdiaDom.updateCard(elements.revisaoCard, data.total_pacientes); // Corrected: elements.revisaoCard
        }).catch(() => {
            console.error('Erro ao buscar hipertensos com ações pendentes:', error);
            hiperdiaDom.updateCard(elements.revisaoCard, 'Erro'); // Corrected: elements.revisaoCard
        });

        // Cards de Compensados e Descompensados (lógica a ser implementada se houver API)
        hiperdiaDom.updateCard(elements.compensadosCard, 'N/A');
        hiperdiaDom.updateCard(elements.descompensadosCard, 'N/A');
    }

    function fetchPacientesHiperdia() {
         hiperdiaDom.setTableLoading();

        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: microareaSelecionadaAtual,
            page: currentPage,
            limit: currentLimit, // Adiciona o limite de itens por página
            search: currentSearchTerm,
            sort_by: currentSort,
            status: currentStatusFilter
        });

        hiperdiaApi.fetchPacientesHiperdia(params)
            .then(data => {
                currentFetchedPacientes = data.pacientes || [];
                hiperdiaDom.renderPacientesTable(currentFetchedPacientes, situacaoProblemaMap);
                renderPaginacaoHiperdia(data.total, data.page, data.limit, data.pages);
                hiperdiaDom.updateAcompanhamentoTitle(equipeSelecionadaAtual, microareaSelecionadaAtual, todasEquipesComMicroareas);
                hiperdiaDom.updateTimelineTitle(equipeSelecionadaAtual, microareaSelecionadaAtual, todasEquipesComMicroareas);
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes com hipertensão:', error);
                hiperdiaDom.setTableError();
            });
    }

    function renderPaginacaoHiperdia(total, page, limit, totalPages) {
         hiperdiaDom.renderPagination(total, page, limit, totalPages);

        elements.paginationContainer.querySelectorAll('.pagination-button').forEach(button => { // Corrected: elements.paginationContainer
            if (button.dataset.page) {
                button.addEventListener('click', () => {
                    const newPage = parseInt(button.dataset.page);
                    if (newPage && newPage !== currentPage && !button.disabled) {
                        currentPage = newPage;
                        fetchPacientesHiperdia();
                    }
                });
            }
        });
    }

    function fetchEquipesMicroareasHiperdia() {
        hiperdiaApi.fetchEquipesMicroareasHiperdia()
            .then(data => {
                todasEquipesComMicroareas = data;
                hiperdiaDom.populateEquipesDropdown(data, equipeSelecionadaAtual, (nomeEquipe, valorEquipe, agentes) => {
                    // Atualiza o botão e o estado da equipe
                    elements.equipeButtonText.textContent = nomeEquipe;
                    equipeSelecionadaAtual = valorEquipe;

                    // Reseta a microárea para "Todas as áreas" ao trocar de equipe
                    elements.microareaButtonText.textContent = 'Todas as áreas';
                    microareaSelecionadaAtual = 'Todas as áreas';

                    // Repopula o dropdown de agentes/microáreas para a nova equipe
                    hiperdiaDom.populateAgentesDropdown(agentes, microareaSelecionadaAtual, (texto, valorMicroarea) => {
                        elements.microareaButtonText.textContent = texto;
                        microareaSelecionadaAtual = valorMicroarea;
                        currentPage = 1;
                        fetchPacientesHiperdia();
                        updateSummaryCards();
                    });
                    fetchPacientesHiperdia(); // Busca inicial para a nova equipe com "Todas as áreas"
                    updateSummaryCards();
                });
            })
            .catch(error => {
                console.error('Erro de rede ao buscar equipes/microáreas para Hiperdia:', error);
            });
    }

    // --- Funções dos Modais ---
    async function abrirModalTimelineHiperdia(paciente) {
        if (!paciente) return;

        currentPacienteForModal = paciente; // Define o paciente atual para o modal de registro
        hiperdiaDom.openTimelineModal(paciente); // Adicionado: Abre o modal e preenche os dados do paciente
        // Atualiza o botão de filtro de período ativo ao abrir o modal
        hiperdiaDom.updateTimelinePeriodFilterButtons(document.querySelector(`.timeline-period-filter-btn[data-period-filter="${currentTimelinePeriodFilter}"]`));
        try {
            const timelineEvents = await hiperdiaApi.fetchTimelineEvents(paciente.cod_paciente, currentTimelinePeriodFilter);
            hiperdiaDom.renderTimelineEvents(timelineEvents, hiperdiaDom.getIniciais); // Corrected: hiperdiaDom.getIniciais
        } catch (error) {
            console.error("Erro ao buscar linha do tempo:", error);
            if (elements.timelineModalContentArea) elements.timelineModalContentArea.innerHTML = '<p class="text-center text-red-500 py-8">Não foi possível carregar a linha do tempo.</p>';
        }
    }

    function handleActionTypeChange() {
        const selectedValue = document.querySelector('.action-type-tab.active')?.dataset.actionValue || '1';
        const dataAcaoAtual = new Date(elements.dataAcaoAtualInput.value + 'T00:00:00');
        hiperdiaDom.toggleRegisterSections(selectedValue, dataAcaoAtual);
    }

    function abrirModalRegistroHiperdia() {
        if (!currentPacienteForModal) return;
        hiperdiaDom.openRegisterModal(currentPacienteForModal);
        handleActionTypeChange();

        hiperdiaApi.fetchMedicamentos(currentPacienteForModal.cod_paciente)
            .then(medicamentos => {
                hiperdiaDom.renderMedicamentosCards(medicamentos);
            })
            .catch(error => {
                console.error('Erro ao buscar medicamentos:', error);
                hiperdiaDom.renderMedicamentosCards([]); // Renderiza como vazio em caso de erro
            });
    }

    function saveHiperdiaAction() {
        if (!currentPacienteForModal) {
            alert('Erro: Paciente não selecionado.');
            return;
        }

        const codAcaoAtual = document.querySelector('.action-type-tab.active')?.dataset.actionValue;
       const dataAcaoAtual = elements.dataAcaoAtualInput.value;
       const observacoes = elements.hiperdiaObservacoes.value;

        const responsavelPelaAcao = elements.hiperdiaResponsavelAcao.value;
        
        if (!codAcaoAtual || !dataAcaoAtual) {
            alert('Por favor, preencha o tipo e a data da ação.');
            return;
        }

        // Payload base
        const payload = {
            cod_cidadao: currentPacienteForModal.cod_paciente,
            cod_acao_atual: parseInt(codAcaoAtual),
            data_acao_atual: dataAcaoAtual,
            observacoes: observacoes || null,
            responsavel_pela_acao: responsavelPelaAcao || null
        
        };

        // Desabilita o botão para evitar cliques duplos
        hiperdiaDom.setSaveButtonLoading(true);

        // Adiciona dados específicos da ação "Avaliar MRPA"
        if (parseInt(codAcaoAtual) === 2) {
            const sistolica = elements.mrpaSistolica?.value;
            const diastolica = elements.mrpaDiastolica?.value;
            const analise = elements.mrpaAnalise?.value;
            const decision = document.querySelector('.mrpa-decision-btn.border-primary')?.dataset.decision;

            if (!sistolica || !diastolica) {
               alert('Por favor, preencha os valores de média sistólica e diastólica para avaliar o MRPA.');
               hiperdiaDom.setSaveButtonLoading(false);
               return; // Impede o envio
            }

            if (!decision) {
                alert('Por favor, selecione se o tratamento será mantido ou modificado.');
                hiperdiaDom.setSaveButtonLoading(false);
                return;
            }

            payload.mrpa_results = {
                media_pa_sistolica: parseInt(sistolica),
                media_pa_diastolica: parseInt(diastolica),
                analise_mrpa: analise,
                decision: decision
            };
        }
        // Adiciona dados específicos da ação "Modificar Tratamento"
        if (parseInt(codAcaoAtual) === 3) {
            const tipoAjuste = elements.medicationTypeRadios ? document.querySelector('input[name="medication-type"]:checked')?.value : null;
            const novosMedicamentos = elements.novosMedicamentos?.value;

            if (!tipoAjuste) {
                alert('Por favor, selecione o tipo de ajuste da medicação.');
                hiperdiaDom.setSaveButtonLoading(false);
                return;
            }

            payload.treatment_modification = {
                tipo_ajuste: tipoAjuste,
                medicamentos_novos: novosMedicamentos
            };
        }
        // Adiciona dados específicos da ação "Avaliar Exames"
        if (parseInt(codAcaoAtual) === 5) {
           payload.lab_exam_results = hiperdiaDom.getLabExamResults(); // Já usa _elements internamente
         }
        // Adiciona dados específicos da ação "Avaliar RCV"
        if (parseInt(codAcaoAtual) === 6) {
            payload.risk_assessment_data = hiperdiaDom.getRiskAssessmentData();
        }
        // Adiciona dados específicos da ação "Registrar consulta nutrição"
        if (parseInt(codAcaoAtual) === 8) {
            payload.nutrition_data = hiperdiaDom.getNutritionData();

            if (Object.values(payload.nutrition_data).every(v => v === null || v === '')) {
                alert('Por favor, preencha pelo menos um campo da consulta de nutrição.');
                hiperdiaDom.setSaveButtonLoading(false);
                return;
            }
        }
        // Adiciona dados específicos da ação "Agendar Hiperdia"
        if (parseInt(codAcaoAtual) === 9) {
            payload.status_acao = "PENDENTE";
            payload.data_agendamento = dataAcaoAtual; // Data da ação escolhida no calendário
            payload.data_realizacao = null; // Deixar vazio
            payload.cod_acao_origem = null; // Deixar vazio
        }

        hiperdiaApi.registrarAcao(payload)
            .then(result => {
                if (result.sucesso) {
                    // alert(result.mensagem || "Ação registrada com sucesso!"); // Removido para não exibir pop-up de sucesso
                    hiperdiaDom.closeRegisterModal(); // Use the function to close
                    fetchPacientesHiperdia();
                    // Mantém o modal da timeline aberto e o atualiza para exibir a última ação inserida
                    abrirModalTimelineHiperdia(currentPacienteForModal);
                } else {
                    alert(`Erro ao registrar ação: ${result.erro}`);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                alert('Ocorreu um erro de comunicação com o servidor.');
            })
            .finally(() => {
                hiperdiaDom.setSaveButtonLoading(false);
            });
    }

    // --- Event Listeners ---
    if (elements.timelineModalContentArea) { // Corrected: elements.timelineModalContentArea
        elements.timelineModalContentArea.addEventListener('click', async (event) => { // Corrected: elements.timelineModalContentArea
            if (event.target.classList.contains('cancel-action-btn')) {
                const button = event.target;
                const codAcompanhamento = button.dataset.codAcompanhamento;

                if (confirm('Tem certeza que deseja cancelar esta ação pendente?')) {
                    button.disabled = true;
                    button.textContent = 'Cancelando...';
                    try {
                        const data = await hiperdiaApi.cancelarAcao(codAcompanhamento);
                        if (data.sucesso) {
                            // Recarrega a timeline para refletir a mudança
                            if (currentPacienteForModal) {
                                await abrirModalTimelineHiperdia(currentPacienteForModal);
                            }
                        } else {
                            alert(`Erro ao cancelar ação: ${data.erro}`);
                            button.disabled = false;
                            button.textContent = 'Cancelar';
                        }
                    } catch (error) {
                        console.error('Erro na requisição de cancelamento:', error);
                        alert('Ocorreu um erro de comunicação ao tentar cancelar a ação.');
                        button.disabled = false;
                        button.textContent = 'Cancelar';
                    }
                }
            }
        });
    }

    if (elements.tabelaPacientesBody) {
        elements.tabelaPacientesBody.addEventListener('click', async function (event) { // Made async
            const button = event.target.closest('.hiperdia-ver-detalhes-btn');
            if (button) {
                const codPaciente = button.dataset.codPaciente;
                const paciente = currentFetchedPacientes.find(p => String(p.cod_paciente) === codPaciente);
                if (paciente) {
                    try {
                        await abrirModalTimelineHiperdia(paciente); // Await the async function
                    } catch (error) {
                        console.error("Erro ao abrir modal da timeline:", error);
                        alert("Erro ao carregar detalhes do paciente.");
                    }
                } else {
                    console.error("Paciente não encontrado no cache:", codPaciente);
                    alert("Erro: não foi possível encontrar os dados do paciente.");
                }
            }
        });
    }

    // Listeners para fechar os modais
    if (elements.closeTimelineModal) elements.closeTimelineModal.addEventListener('click', () => hiperdiaDom.closeTimelineModal());
    if (elements.closeTimelineModalBtn) elements.closeTimelineModalBtn.addEventListener('click', () => hiperdiaDom.closeTimelineModal());
    if (elements.closeRegisterModal) elements.closeRegisterModal.addEventListener('click', () => hiperdiaDom.closeRegisterModal());
    if (elements.cancelRegisterBtn) elements.cancelRegisterBtn.addEventListener('click', () => hiperdiaDom.closeRegisterModal());

    // Listener para abrir o modal de registro a partir do modal da timeline
    if (elements.timelineRegisterBtn) {
        elements.timelineRegisterBtn.addEventListener('click', abrirModalRegistroHiperdia);
    }

    // Listener para mudanças no tipo de ação no modal de registro
    if (elements.actionTypeTabs) {
        elements.actionTypeTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove o estado ativo de todas as abas
                elements.actionTypeTabs.forEach(t => {
                    t.classList.remove('active', 'border-primary', 'bg-primary/10', 'text-primary');
                    t.classList.add('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                });
                // Adiciona o estado ativo à aba clicada
                this.classList.add('active', 'border-primary', 'bg-primary/10', 'text-primary');
                this.classList.remove('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                handleActionTypeChange(); // Chama a função para atualizar as seções do formulário
            });
        });
    }
    // Listener para o botão de salvar
    if (elements.saveRegisterModalBtn) {
        elements.saveRegisterModalBtn.addEventListener('click', saveHiperdiaAction);
    }

    if (elements.searchInput) {
        elements.searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                currentSearchTerm = event.target.value;
                currentPage = 1;
                fetchPacientesHiperdia();
                updateSummaryCards();
            }
        });
    }

    // Listener para os botões de filtro de status
    if (elements.statusFilterButtons) {
        elements.statusFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const newStatusFilter = this.dataset.statusFilter;
                if (newStatusFilter !== currentStatusFilter) {
                    currentStatusFilter = newStatusFilter;
                    currentPage = 1;
                    fetchPacientesHiperdia();
                    updateSummaryCards();
                    hiperdiaDom.updateStatusFilterButtons(this);
                }
            });
        });
    }

    """    // Listener para os botões de filtro de período da linha do tempo
    if (elements.timelinePeriodFilterButtons) {
        elements.timelinePeriodFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const newPeriodFilter = this.dataset.periodFilter;
                if (newPeriodFilter !== currentTimelinePeriodFilter) {
                    currentTimelinePeriodFilter = newPeriodFilter;
                    abrirModalTimelineHiperdia(currentPacienteForModal); // Re-fetch timeline events with the new filter
                    hiperdiaDom.updateTimelinePeriodFilterButtons(this);
                }
            });
        });
    }

    // Listener para os botões de decisão do MRPA
    if (elements.mrpaDecisionBtns) {
        elements.mrpaDecisionBtns.forEach(button => {
            button.addEventListener('click', function() {
                // Remove a classe 'active' de todos os botões de decisão
                elements.mrpaDecisionBtns.forEach(btn => {
                    btn.classList.remove('border-primary', 'bg-primary/10', 'text-primary');
                    btn.classList.add('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
                });

                // Adiciona a classe 'active' ao botão clicado
                this.classList.add('border-primary', 'bg-primary/10', 'text-primary');
                this.classList.remove('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            });
        });
    }

    if (elements.itemsPerPageSelect) {""
        elements.itemsPerPageSelect.value = currentLimit;
        elements.itemsPerPageSelect.addEventListener('change', (event) => {
            currentLimit = parseInt(event.target.value);
            currentPage = 1; // Reseta para a primeira página ao mudar o limite
            fetchPacientesHiperdia();
        });
    }

    // --- Inicialização ---
    hiperdiaDom.setupDropdown(elements.equipeButton, elements.equipeDropdown);
    hiperdiaDom.setupDropdown(elements.microareaButton, elements.microareaDropdown);
    fetchEquipesMicroareasHiperdia();
    fetchPacientesHiperdia();
    updateSummaryCards();
    hiperdiaDom.updateStatusFilterButtons(document.querySelector('.hiperdia-status-tab-btn[data-status-filter="Todos"]'));
});
