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

    // Function to create a future action - MOVIDA PARA ESCOPO GLOBAL
    const createFutureAction = async (codAcao, daysFromNow, status = "PENDENTE", observacaoAdicional = '', codAcaoAtual, dataAcaoAtual, currentPacienteForModal) => {
        const futureDate = new Date(dataAcaoAtual + 'T00:00:00');
        futureDate.setDate(futureDate.getDate() + daysFromNow);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        let actionObservacoes = `Ação criada automaticamente a partir da ação ${codAcaoAtual}.`;
        if (observacaoAdicional) {
            actionObservacoes += ` ${observacaoAdicional}`;
        }

        const futurePayload = {
            cod_cidadao: currentPacienteForModal.cod_paciente,
            cod_acao_atual: codAcao,
            data_acao_atual: futureDateStr,
            data_agendamento: futureDateStr,
            data_realizacao: (status === "REALIZADA") ? futureDateStr : null,
            status_acao: status,
            observacoes: actionObservacoes,
            responsavel_pela_acao: null
        };
        
        try {
            const result = await hiperdiaApi.registrarAcao(futurePayload);
            if (!result.sucesso) {
                console.error(`Erro ao criar ação futura (código ${codAcao}): ${result.erro}`);
            }
            return result;
        } catch (error) {
            console.error(`Erro na requisição para criar ação futura (código ${codAcao}):`, error);
            return { sucesso: false, erro: error.message };
        }
    };

    function updateSummaryCards() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual, // Use current state variables
            microarea: microareaSelecionadaAtual,
            status: currentStatusFilter // Pass the status filter for counting
       });

        // Card: Total de Hipertensos
        hiperdiaApi.fetchTotalHipertensos(params).then(data => {
            hiperdiaDom.updateCard(elements.hipertensosCard, data.total_pacientes); // Corrected: elements.hipertensosCard
        }).catch((error) => {
            console.error('Erro ao buscar total de hipertensos:', error);
            hiperdiaDom.updateCard(elements.hipertensosCard, 'Erro'); // Corrected: elements.hipertensosCard
        });

        // Card: Ações Pendentes/Revisão
        hiperdiaApi.fetchHipertensosMRPAPendente(params).then(data => {
            hiperdiaDom.updateCard(elements.revisaoCard, data.total_pacientes); // Corrected: elements.revisaoCard
        }).catch((error) => {
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

    async function saveHiperdiaAction() {
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

        // Desabilita o botão para evitar cliques duplos
        hiperdiaDom.setSaveButtonLoading(true);

        // CORREÇÃO: Para "Modificar Tratamento" (codAcaoAtual === 3), primeiro verificar se existe uma ação pendente
        if (parseInt(codAcaoAtual) === 3) {
            try {
                // Buscar ação pendente de "Modificar Tratamento" para este paciente
                const pendingAction = await hiperdiaApi.fetchPendingActionByType(currentPacienteForModal.cod_paciente, 3);
                
                if (pendingAction) {
                    // Se existe uma ação pendente, atualizar ela em vez de criar uma nova
                    const tipoAjuste = elements.medicationTypeRadios ? document.querySelector('input[name="medication-type"]:checked')?.value : null;
                    const novosMedicamentos = elements.novosMedicamentos?.value;

                    if (!tipoAjuste) {
                        alert('Por favor, selecione o tipo de ajuste da medicação.');
                        hiperdiaDom.setSaveButtonLoading(false);
                        return;
                    }

                    const updatePayload = {
                        cod_cidadao: currentPacienteForModal.cod_paciente,
                        cod_acao_atual: parseInt(codAcaoAtual),
                        data_acao_atual: dataAcaoAtual,
                        observacoes: observacoes || null,
                        responsavel_pela_acao: responsavelPelaAcao || null,
                        status_acao: "REALIZADA",
                        treatment_modification: {
                            tipo_ajuste: tipoAjuste,
                            medicamentos_novos: novosMedicamentos
                        }
                    };

                    const result = await hiperdiaApi.updateAcao(pendingAction.cod_acompanhamento, updatePayload);
                    
                    if (result.sucesso) {
                        hiperdiaDom.closeRegisterModal();
                        fetchPacientesHiperdia();
                        // Criar ação futura "Solicitar MRPA" para 30 dias
                        await createFutureAction(1, 30, "PENDENTE", "Nova solicitação de MRPA após modificação do tratamento.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                        
                        // Mantém o modal da timeline aberto e o atualiza
                        abrirModalTimelineHiperdia(currentPacienteForModal);
                    } else {
                        alert(`Erro ao atualizar ação: ${result.erro}`);
                    }
                } else {
                    // Se não existe ação pendente, seguir o fluxo normal (criar nova ação)
                    await processNormalAction();
                }
            } catch (error) {
                console.error('Erro ao verificar ação pendente:', error);
                alert('Erro ao verificar ações pendentes. Tente novamente.');
            } finally {
                hiperdiaDom.setSaveButtonLoading(false);
            }
            return; // Sai da função aqui para evitar execução dupla
        }

        // Para outras ações, seguir o fluxo normal
        await processNormalAction();
    }

    // Função para processar ações normais (não "Modificar Tratamento")
    async function processNormalAction() {
        const codAcaoAtual = document.querySelector('.action-type-tab.active')?.dataset.actionValue;
        const dataAcaoAtual = elements.dataAcaoAtualInput.value;
        const observacoes = elements.hiperdiaObservacoes.value;
        const responsavelPelaAcao = elements.hiperdiaResponsavelAcao.value;

        // Payload base
        const payload = {
            cod_cidadao: currentPacienteForModal.cod_paciente,
            cod_acao_atual: parseInt(codAcaoAtual),
            data_acao_atual: dataAcaoAtual,
            observacoes: observacoes || null,
            responsavel_pela_acao: responsavelPelaAcao || null
        };

        // Ação: Agendar Hiperdia (codAcaoAtual === 9)
        if (parseInt(codAcaoAtual) === 9) {
            // Ao agendar Hiperdia (mesmo que fique agendado para hoje), vai inserir apenas esta mesma acao mais ela fica como pendente.
            payload.status_acao = "PENDENTE";
            payload.data_agendamento = dataAcaoAtual; // Data da ação escolhida no calendário
            payload.data_realizacao = null; // Deixar vazio
            payload.cod_acao_origem = null; // Deixar vazio
        }

        // Adiciona dados específicos da ação "Avaliar MRPA" (codAcaoAtual === 2)
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
            // Marcar a ação de Avaliar MRPA como REALIZADA
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }

        // Adiciona dados específicos da ação "Avaliar Exames" (codAcaoAtual === 5)
        if (parseInt(codAcaoAtual) === 5) {
           payload.lab_exam_results = hiperdiaDom.getLabExamResults(); // Já usa _elements internamente
           payload.status_acao = "REALIZADA";
           payload.data_realizacao = dataAcaoAtual;
         }
        // Adiciona dados específicos da ação "Avaliar RCV" (codAcaoAtual === 6)
        if (parseInt(codAcaoAtual) === 6) {
            payload.risk_assessment_data = hiperdiaDom.getRiskAssessmentData();
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }
        // Adiciona dados específicos da ação "Registrar consulta nutrição" (codAcaoAtual === 8)
        if (parseInt(codAcaoAtual) === 8) {
            payload.nutrition_data = hiperdiaDom.getNutritionData();

            if (Object.values(payload.nutrition_data).every(v => v === null || v === '')) {
                alert('Por favor, preencha pelo menos um campo da consulta de nutrição.');
                hiperdiaDom.setSaveButtonLoading(false);
                return;
            }
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }
        // Adiciona dados específicos da ação "Solicitar MRPA" (codAcaoAtual === 1)
        if (parseInt(codAcaoAtual) === 1) {
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }
        // Adiciona dados específicos da ação "Solicitar Exames" (codAcaoAtual === 4)
        if (parseInt(codAcaoAtual) === 4) {
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }
        // Adiciona dados específicos da ação "Encaminhar Nutrição" (codAcaoAtual === 7)
        if (parseInt(codAcaoAtual) === 7) {
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }
        
        // Save the current action and create future actions based on the type
        hiperdiaApi.registrarAcao(payload)
            .then(async result => {
                if (result.sucesso) {
                    hiperdiaDom.closeRegisterModal();
                    fetchPacientesHiperdia();
                    // Create future actions based on the action type
                    switch (parseInt(codAcaoAtual)) {
                            // ############# INÍCIO DA CORREÇÃO #############
                            
                            case 1: // Solicitar MRPA
                                // A LÓGICA FOI REMOVIDA DAQUI.
                                // O backend (app.py) já está corretamente:
                                // 1. Marcando "Agendar Hiperdia" (se houver) como REALIZADA.
                                // 2. Criando a ação pendente "Avaliar MRPA".
                                // Não precisamos fazer nada aqui no frontend.
                                break;

                            // ############# FIM DA CORREÇÃO #############                        case 2: // Avaliar MRPA (c)
                            const decision = document.querySelector('.mrpa-decision-btn.border-primary')?.dataset.decision;
                            if (decision === 'modify') {
                                // Se for modificar o tratamento, vai criar a acao futura Modificar o tratamento como pendente (para hoje mesmo).
                                await createFutureAction(3, 0, "PENDENTE", "Tratamento a ser modificado conforme avaliação do MRPA.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                            } else if (decision === 'maintain') {
                                // Se for manter o tratamento, criar a acao pendente solictar exames para hoje.
                                await createFutureAction(4, 0, "PENDENTE", "Solicitação de exames para acompanhamento.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                            }
                            break;
                        case 4: // Solicitar Exames (f)
                            // REMOVIDO: O backend já está criando automaticamente a ação "Avaliar Exames" para 15 dias
                            // await createFutureAction(5, 15, "PENDENTE", "Aguardando resultados de exames para avaliação.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                            break;
                        case 5: // Avaliar Exames (e)
                            // ao avaliar exames cria a funcao futura avaliar RCV como pendente
                            await createFutureAction(6, 0, "PENDENTE", "Avaliação de RCV após exames.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                            break;
                        case 6: // Avaliar RCV (f)
                            // ao avaliar RCV realizada, cria a acao futura encaminhar para a nutrição
                            await createFutureAction(7, 0, "PENDENTE", "Encaminhamento para avaliação nutricional.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                            break;
                        case 7: // Encaminhar para Nutrição
                            // ao realizar a acao registrar nutrição, cria a acao futura Agendar Hiperdia (pendente)
                            // Note: The user's instruction (g) says "ao realizar a acao registrar nutrição, cria a acao futura Agendar Hiperdia (pendente)".
                            // This means action 7 (Encaminhar Nutrição) does not directly create action 9.
                            // Action 8 (Registrar Nutrição) creates action 9.
                            // So, no action is created here for Encaminhar Nutrição.
                            break;
                        case 8: // Registrar Consulta Nutrição (g)
                            // ao realizar a acao registrar nutrição, cria a acao futura Agendar Hiperdia (pendente)
                            await createFutureAction(9, 0, "PENDENTE", "Novo agendamento de Hiperdia após consulta de nutrição.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                            break;
                        case 9: // Agendar Hiperdia
                            // Não cria nenhuma ação futura automaticamente. Permanece PENDENTE.
                            break;
                    }
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

    // Listener para os botões de filtro de período da linha do tempo
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

    if (elements.itemsPerPageSelect) {
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
