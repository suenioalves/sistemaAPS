import { hiperdiaApi } from './hiperdiaApi.js';
import { hiperdiaDom } from './hiperdiaDom.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Hiperdia script loading...');
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
        
        // Usar apenas o observacaoAdicional se fornecido, caso contrário usar texto padrão
        let actionObservacoes = observacaoAdicional || `Ação criada automaticamente a partir da ação ${codAcaoAtual}.`;

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

        return hiperdiaApi.fetchPacientesHiperdia(params)
            .then(data => {
                currentFetchedPacientes = data.pacientes || [];
                hiperdiaDom.renderPacientesTable(currentFetchedPacientes, situacaoProblemaMap);
                renderPaginacaoHiperdia(data.total, data.page, data.limit, data.pages);
                hiperdiaDom.updateAcompanhamentoTitle(equipeSelecionadaAtual, microareaSelecionadaAtual, todasEquipesComMicroareas);
                hiperdiaDom.updateTimelineTitle(equipeSelecionadaAtual, microareaSelecionadaAtual, todasEquipesComMicroareas);
                return data; // Return the data for chaining
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes com hipertensão:', error);
                hiperdiaDom.setTableError();
                throw error; // Re-throw for proper error handling
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

    async function abrirModalTratamento(paciente) {
        if (!paciente) return;

        currentPacienteForModal = paciente;
        hiperdiaDom.openTreatmentModal(paciente);
        
        try {
            // Carregar medicamentos disponíveis no dropdown
            await hiperdiaDom.carregarMedicamentosDisponiveis(hiperdiaApi);
            
            // Buscar medicamentos atuais do paciente
            const medicamentos = await hiperdiaApi.fetchMedicamentosAtuais(paciente.cod_paciente);
            hiperdiaDom.renderMedicamentosAtuais(medicamentos);
            hiperdiaDom.populateMedicamentosDropdown(medicamentos);
        } catch (error) {
            console.error('Erro ao buscar medicamentos:', error);
            hiperdiaDom.renderMedicamentosAtuais([]);
        }
    }

    async function carregarTratamentoAtual(paciente) {
        try {
            const medicamentos = await hiperdiaApi.fetchMedicamentosAtuais(paciente.cod_paciente);
            const tratamentoContainer = document.getElementById(`tratamento-atual-${paciente.cod_paciente}`);
            
            if (tratamentoContainer) {
                if (medicamentos && medicamentos.length > 0) {
                    const medicamentosAtivos = medicamentos.filter(med => !med.data_fim);
                    if (medicamentosAtivos.length > 0) {
                        const medicamentosList = medicamentosAtivos.map(med => 
                            `${med.nome_medicamento} (${med.frequencia}x/dia)`
                        ).join('<br>');
                        tratamentoContainer.innerHTML = medicamentosList;
                    } else {
                        tratamentoContainer.innerHTML = '<span class="text-gray-400">Sem medicamentos ativos</span>';
                    }
                } else {
                    tratamentoContainer.innerHTML = '<span class="text-gray-400">Nenhum tratamento cadastrado</span>';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar tratamento atual:', error);
            const tratamentoContainer = document.getElementById(`tratamento-atual-${paciente.cod_paciente}`);
            if (tratamentoContainer) {
                tratamentoContainer.innerHTML = '<span class="text-red-400">Erro ao carregar</span>';
            }
        }
    }

    async function salvarTratamento() {
        if (!currentPacienteForModal) {
            alert('Erro: Paciente não selecionado.');
            return;
        }

        const activeAction = document.querySelector('.treatment-action-tab.active')?.dataset.action;
        
        if (activeAction === 'add') {
            await adicionarNovoMedicamento();
        } else if (activeAction === 'modify') {
            await modificarMedicamento();
        }
    }

    async function adicionarNovoMedicamento() {
        const medicamentoData = hiperdiaDom.getNovoMedicamentoData();
        
        if (!medicamentoData.nome_medicamento || !medicamentoData.dose || !medicamentoData.frequencia) {
            alert('Por favor, preencha o nome do medicamento, dose e frequência.');
            return;
        }

        try {
            medicamentoData.codcidadao = currentPacienteForModal.cod_paciente;
            
            const result = await hiperdiaApi.adicionarMedicamento(medicamentoData);
            
            if (result.sucesso) {
                alert('Medicamento adicionado com sucesso!');
                // Recarregar medicamentos
                const medicamentos = await hiperdiaApi.fetchMedicamentosAtuais(currentPacienteForModal.cod_paciente);
                hiperdiaDom.renderMedicamentosAtuais(medicamentos);
                hiperdiaDom.populateMedicamentosDropdown(medicamentos);
                
                // Limpar formulário
                hiperdiaDom.resetTreatmentForm();
                
                // Atualizar tabela principal
                fetchPacientesHiperdia();
            } else {
                alert(`Erro ao adicionar medicamento: ${result.erro}`);
            }
        } catch (error) {
            console.error('Erro ao adicionar medicamento:', error);
            alert('Erro ao adicionar medicamento. Tente novamente.');
        }
    }

    async function modificarMedicamento() {
        const modificacaoData = hiperdiaDom.getModificacaoMedicamentoData();
        
        if (!modificacaoData.cod_seq_medicamentos || !modificacaoData.tipo_modificacao) {
            alert('Por favor, selecione um medicamento e o tipo de modificação.');
            return;
        }

        try {
            let result;
            
            if (modificacaoData.tipo_modificacao === 'stop' || modificacaoData.tipo_modificacao === 'pause') {
                result = await hiperdiaApi.interromperMedicamento(
                    modificacaoData.cod_seq_medicamentos, 
                    modificacaoData.motivo || 'Interrupção solicitada'
                );
            } else if (modificacaoData.tipo_modificacao === 'frequency') {
                if (!modificacaoData.nova_frequencia) {
                    alert('Por favor, informe a nova frequência.');
                    return;
                }
                result = await hiperdiaApi.atualizarMedicamento(
                    modificacaoData.cod_seq_medicamentos,
                    {
                        frequencia: modificacaoData.nova_frequencia,
                        observacoes: modificacaoData.motivo
                    }
                );
            }
            
            if (result && result.sucesso) {
                alert('Medicamento modificado com sucesso!');
                // Recarregar medicamentos
                const medicamentos = await hiperdiaApi.fetchMedicamentosAtuais(currentPacienteForModal.cod_paciente);
                hiperdiaDom.renderMedicamentosAtuais(medicamentos);
                hiperdiaDom.populateMedicamentosDropdown(medicamentos);
                
                // Limpar formulário
                hiperdiaDom.resetTreatmentForm();
                
                // Atualizar tabela principal
                fetchPacientesHiperdia();
            } else {
                alert(`Erro ao modificar medicamento: ${result?.erro || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Erro ao modificar medicamento:', error);
            alert('Erro ao modificar medicamento. Tente novamente.');
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

    function abrirModalRegistroHiperdiaComAcao(actionValue) {
        if (!currentPacienteForModal) return;
        
        // Abrir o modal de registro
        hiperdiaDom.openRegisterModal(currentPacienteForModal);
        
        // Aguardar que o modal seja renderizado antes de selecionar a ação
        setTimeout(() => {
            // Encontrar e ativar a aba específica
            const targetTab = document.querySelector(`.action-type-tab[data-action-value="${actionValue}"]`);
            if (targetTab) {
                // Remover active de todas as abas
                elements.actionTypeTabs.forEach(t => {
                    t.classList.remove('active', 'border-primary', 'bg-primary/10', 'text-primary');
                    t.classList.add('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                });
                
                // Ativar a aba específica
                targetTab.classList.add('active', 'border-primary', 'bg-primary/10', 'text-primary');
                targetTab.classList.remove('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                
                // Atualizar as seções do formulário
                handleActionTypeChange();
            }
        }, 100);

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

        // CORREÇÃO: Para "Encaminhar Nutrição" (codAcaoAtual === 7), primeiro verificar se existe uma ação pendente
        if (parseInt(codAcaoAtual) === 7) {
            try {
                console.log('[LOG] Processando ação Encaminhar Nutrição (cod_acao = 7)');
                // Buscar ação pendente de "Encaminhar Nutrição" para este paciente
                const pendingAction = await hiperdiaApi.fetchPendingActionByType(currentPacienteForModal.cod_paciente, 7);

                if (pendingAction) {
                    console.log('[LOG] Ação pendente de Encaminhar Nutrição encontrada:', pendingAction);
                    // Se existe uma ação pendente, atualizar ela
                    const updatePayload = {
                        cod_cidadao: currentPacienteForModal.cod_paciente,
                        cod_acao_atual: 7,
                        data_acao_atual: dataAcaoAtual,
                        observacoes: observacoes || null,
                        responsavel_pela_acao: responsavelPelaAcao || null,
                        status_acao: "REALIZADA"
                    };
                    console.log('[LOG] Payload para atualizar ação pendente:', updatePayload);
                    const result = await hiperdiaApi.updateAcao(pendingAction.cod_acompanhamento, updatePayload);
                    if (result.sucesso) {
                        console.log('[LOG] Ação de Encaminhar Nutrição atualizada com sucesso');
                        hiperdiaDom.closeRegisterModal();
                        fetchPacientesHiperdia();
                        abrirModalTimelineHiperdia(currentPacienteForModal);
                    } else {
                        alert(`Erro ao atualizar ação: ${result.erro}`);
                    }
                } else {
                    console.log('[LOG] Nenhuma ação pendente de Encaminhar Nutrição encontrada, criando nova ação');
                    // Se não existe ação pendente, criar uma nova ação realizada
                    const payload = {
                        cod_cidadao: currentPacienteForModal.cod_paciente,
                        cod_acao_atual: 7,
                        data_acao_atual: dataAcaoAtual,
                        observacoes: observacoes || null,
                        responsavel_pela_acao: responsavelPelaAcao || null,
                        status_acao: "REALIZADA"
                    };
                    console.log('[LOG] Payload para criar nova ação:', payload);
                    const result = await hiperdiaApi.registrarAcao(payload);
                    if (result.sucesso) {
                        console.log('[LOG] Nova ação de Encaminhar Nutrição criada com sucesso');
                        hiperdiaDom.closeRegisterModal();
                        fetchPacientesHiperdia();
                        abrirModalTimelineHiperdia(currentPacienteForModal);
                    } else {
                        alert(`Erro ao registrar ação: ${result.erro}`);
                    }
                }
            } catch (error) {
                console.error('Erro ao processar ação Encaminhar Nutrição:', error);
                alert('Erro ao processar ação Encaminhar Nutrição. Tente novamente.');
            } finally {
                hiperdiaDom.setSaveButtonLoading(false);
            }
            return; // Sai da função aqui para evitar execução dupla
        }

        // Payload base para todas as ações
        const payload = {
            cod_cidadao: currentPacienteForModal.cod_paciente,
            cod_acao_atual: parseInt(codAcaoAtual),
            data_acao_atual: dataAcaoAtual,
            observacoes: observacoes || null,
            responsavel_pela_acao: responsavelPelaAcao || null
        };

        // CORREÇÃO: Para "Registrar Nutrição" (codAcaoAtual === 8), primeiro verificar se existe uma ação pendente
        if (parseInt(codAcaoAtual) === 8) {
            try {
                console.log('[LOG] Processando ação Registrar Nutrição (cod_acao = 8)');
                // Buscar ação pendente de "Registrar Nutrição" para este paciente
                const pendingAction = await hiperdiaApi.fetchPendingActionByType(currentPacienteForModal.cod_paciente, 8);

                if (pendingAction) {
                    console.log('[LOG] Ação pendente de Registrar Nutrição encontrada:', pendingAction);
                    // Se existe, atualizar para REALIZADA
                    const updatePayload = {
                        ...payload,
                        status_acao: "REALIZADA",
                        nutrition_data: hiperdiaDom.getNutritionData()
                    };
                    const result = await hiperdiaApi.updateAcao(pendingAction.cod_acompanhamento, updatePayload);
                    if (result.sucesso) {
                        console.log('[LOG] Ação de Registrar Nutrição atualizada com sucesso');
                        // Cria ação futura Agendar Hiperdia (cod_acao=9) para daqui a 1 ano
                        await createFutureAction(9, 365, 'PENDENTE', '<span style="color: #1e40af; font-weight: bold;">Hiperdia concluído!</span> Agendar novo hiperdia para daqui 6 meses há 1 ano, conforme seja necessário.', codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                        hiperdiaDom.closeRegisterModal();
                        fetchPacientesHiperdia();
                        abrirModalTimelineHiperdia(currentPacienteForModal);
                    } else {
                        alert(`Erro ao atualizar ação: ${result.erro}`);
                    }
                } else {
                    // Se não existe, criar nova ação
                    const result = await hiperdiaApi.registrarAcao(payload);
                    if (result.sucesso) {
                        console.log('[LOG] Nova ação de Registrar Nutrição criada com sucesso');
                        hiperdiaDom.closeRegisterModal();
                        fetchPacientesHiperdia();
                        abrirModalTimelineHiperdia(currentPacienteForModal);
                    } else {
                        alert(`Erro ao registrar ação: ${result.erro}`);
                    }
                }
            } catch (error) {
                console.error('Erro ao processar ação Registrar Nutrição:', error);
                alert('Erro ao processar ação Registrar Nutrição. Tente novamente.');
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

        console.log('[LOG] Iniciando processNormalAction');
        console.log('[LOG] codAcaoAtual:', codAcaoAtual);
        console.log('[LOG] dataAcaoAtual:', dataAcaoAtual);
        console.log('[LOG] observacoes:', observacoes);
        console.log('[LOG] responsavelPelaAcao:', responsavelPelaAcao);

        // CORREÇÃO: Para "Avaliar RCV" (codAcaoAtual === 6), primeiro verificar se existe uma ação pendente
        if (parseInt(codAcaoAtual) === 6) {
            try {
                console.log('[LOG] Processando ação Avaliar RCV (cod_acao = 6)');
                const riskAssessmentData = hiperdiaDom.getRiskAssessmentData();
                console.log('[LOG] Dados do RCV obtidos:', riskAssessmentData);
                
                // Buscar ação pendente de "Avaliar RCV" para este paciente
                const pendingAction = await hiperdiaApi.fetchPendingActionByType(currentPacienteForModal.cod_paciente, 6);
                
                if (pendingAction) {
                    console.log('[LOG] Ação pendente de Avaliar RCV encontrada:', pendingAction);
                    // Se existe uma ação pendente, atualizar ela
                    const updatePayload = {
                        cod_cidadao: currentPacienteForModal.cod_paciente,
                        cod_acao_atual: parseInt(codAcaoAtual),
                        data_acao_atual: dataAcaoAtual,
                        observacoes: observacoes || null,
                        responsavel_pela_acao: responsavelPelaAcao || null,
                        status_acao: "REALIZADA",
                        risk_assessment_data: riskAssessmentData
                    };

                    console.log('[LOG] Payload para atualizar ação pendente:', updatePayload);
                    const result = await hiperdiaApi.updateAcao(pendingAction.cod_acompanhamento, updatePayload);
                    
                    if (result.sucesso) {
                        console.log('[LOG] Ação de Avaliar RCV atualizada com sucesso');
                        hiperdiaDom.closeRegisterModal();
                        fetchPacientesHiperdia();
                        // Manter o modal da timeline aberto e atualizá-lo
                        abrirModalTimelineHiperdia(currentPacienteForModal);
                    } else {
                        alert(`Erro ao atualizar ação: ${result.erro}`);
                    }
                } else {
                    console.log('[LOG] Nenhuma ação pendente de Avaliar RCV encontrada, criando nova ação');
                    // Se não existe ação pendente, criar uma nova ação realizada
                    const payload = {
                        cod_cidadao: currentPacienteForModal.cod_paciente,
                        cod_acao_atual: parseInt(codAcaoAtual),
                        data_acao_atual: dataAcaoAtual,
                        observacoes: observacoes || null,
                        responsavel_pela_acao: responsavelPelaAcao || null,
                        status_acao: "REALIZADA",
                        risk_assessment_data: riskAssessmentData
                    };

                    console.log('[LOG] Payload para criar nova ação:', payload);
                    const result = await hiperdiaApi.registrarAcao(payload);
                    
                    if (result.sucesso) {
                        console.log('[LOG] Nova ação de Avaliar RCV criada com sucesso');
                        hiperdiaDom.closeRegisterModal();
                        fetchPacientesHiperdia();
                        // Manter o modal da timeline aberto e atualizá-lo
                        abrirModalTimelineHiperdia(currentPacienteForModal);
                    } else {
                        alert(`Erro ao registrar ação: ${result.erro}`);
                    }
                }
            } catch (error) {
                console.error('Erro ao processar ação Avaliar RCV:', error);
                alert('Erro ao processar ação Avaliar RCV. Tente novamente.');
            } finally {
                hiperdiaDom.setSaveButtonLoading(false);
            }
            return; // Sai da função aqui para evitar execução dupla
        }

        // Payload base para outras ações
        const payload = {
            cod_cidadao: currentPacienteForModal.cod_paciente,
            cod_acao_atual: parseInt(codAcaoAtual),
            data_acao_atual: dataAcaoAtual,
            observacoes: observacoes || null,
            responsavel_pela_acao: responsavelPelaAcao || null
        };

        console.log('[LOG] Payload base:', payload);

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

        // Adiciona dados específicos da ação "Encaminhar Cardiologia" (codAcaoAtual === 10)
        if (parseInt(codAcaoAtual) === 10) {
            // Para encaminhar cardiologia, usamos apenas os campos padrão (responsável e observações do final do modal)
            payload.cardiologia_data = {
                profissional_responsavel: responsavelPelaAcao,
                observacoes: observacoes
            };
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }

        // Adiciona dados específicos da ação "Registrar Cardiologia" (codAcaoAtual === 11)
        if (parseInt(codAcaoAtual) === 11) {
            const consultaCardiologia = document.getElementById('hiperdia-cardiologia-consulta')?.value;
            const recomendacoesCardiologia = document.getElementById('hiperdia-cardiologia-recomendacoes')?.value;
            const profissionalResponsavel = document.getElementById('hiperdia-cardiologia-reg-profissional')?.value;

            // Validação dos campos obrigatórios
            if (!consultaCardiologia || !recomendacoesCardiologia) {
                alert('Por favor, preencha a consulta cardiológica e as recomendações.');
                hiperdiaDom.setSaveButtonLoading(false);
                return;
            }

            payload.cardiologia_data = {
                consulta_cardiologia: consultaCardiologia,
                recomendacoes_cardiologia: recomendacoesCardiologia,
                tipo_consulta: 'Presencial', // Valor padrão
                profissional_responsavel: profissionalResponsavel || responsavelPelaAcao,
                observacoes: observacoes // Usa apenas as observações do campo padrão
            };
            payload.status_acao = "REALIZADA";
            payload.data_realizacao = dataAcaoAtual;
        }
        
        console.log('[LOG] Payload final antes de enviar:', payload);
        
        // Save the current action and create future actions based on the type
        try {
            console.log('[LOG] Enviando requisição para registrarAcao');
            const result = await hiperdiaApi.registrarAcao(payload);
            console.log('[LOG] Resposta do registrarAcao:', result);
            
            if (result.sucesso) {
                console.log('[LOG] Ação registrada com sucesso');
                hiperdiaDom.closeRegisterModal();
                fetchPacientesHiperdia();
                // Create future actions based on the action type
                switch (parseInt(codAcaoAtual)) {
                        // ############# INÍCIO DA CORREÇÃO #############
                        
                        case 1: // Solicitar MRPA
                            // A LÓGICA FOI REMOVIDA DAQUI.
                            // O backend (app.py) já está corretamente:
                            // 1. Marcando "Agendar Hiperdia" (se houver) como REALIZADA.
                            // 2. Criando a ação "Solicitar MRPA" como REALIZADA.
                            // 3. Criando automaticamente a ação "Avaliar MRPA" como PENDENTE para 7 dias.
                            // Não precisamos fazer nada aqui no frontend.
                            break;

                        // ############# FIM DA CORREÇÃO #############                        case 2: // Avaliar MRPA (c)
                        // REMOVIDO: O backend já está criando automaticamente as ações futuras baseadas na decisão
                        // - Se "manter tratamento": cria ação "Solicitar Exames" (código 4)
                        // - Se "modificar tratamento": cria ação "Modificar tratamento" (código 3)
                        break;
                    case 4: // Solicitar Exames (f)
                        // REMOVIDO: O backend já está criando automaticamente a ação "Avaliar Exames" para 15 dias
                        // await createFutureAction(5, 15, "PENDENTE", "Aguardando resultados de exames para avaliação.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
                        break;
                    case 5: // Avaliar Exames (e)
                        // REMOVIDO: O backend já está criando automaticamente a ação "Avaliar RCV" para hoje
                        // await createFutureAction(6, 0, "PENDENTE", "Avaliação de RCV após exames.", codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
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
                        await createFutureAction(9, 0, "PENDENTE", '<span style="color: #1e40af; font-weight: bold;">Hiperdia concluído!</span> Agendar novo hiperdia para daqui 6 meses há 1 ano, conforme seja necessário.', codAcaoAtual, dataAcaoAtual, currentPacienteForModal);
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
        } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Ocorreu um erro de comunicação com o servidor.');
        } finally {
                hiperdiaDom.setSaveButtonLoading(false);
        }
    }

    // --- Event Listeners ---
    if (elements.timelineModalContentArea) {
        elements.timelineModalContentArea.addEventListener('click', async (event) => {
            const button = event.target;
            const codAcompanhamento = button.dataset.codAcompanhamento;
            
            // Handler para o botão "Ação Realizada"
            if (button.classList.contains('action-realizada-btn')) {
                const codAcao = parseInt(button.dataset.codAcao);
                
                // Se for "Iniciar Hiperdia" (cod_acao === 9), abrir modal de registro com "Iniciar MRPA" selecionado
                if (codAcao === 9) {
                    abrirModalRegistroHiperdiaComAcao('1'); // Abrir com "Iniciar MRPA" (cod_acao 1)
                    return;
                }
                
                // Se for "Avaliar MRPA" (cod_acao === 2), abrir modal de registro com "Avaliar MRPA" selecionado
                if (codAcao === 2) {
                    abrirModalRegistroHiperdiaComAcao('2'); // Abrir com "Avaliar MRPA" (cod_acao 2)
                    return;
                }
                
                // Para outras ações, comportamento original
                const confirmacao = confirm('Confirma que a ação foi realizada?');
                if (!confirmacao) return;
                
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = 'Processando...';
                button.classList.add('opacity-50');
                
                try {
                    const data = await hiperdiaApi.atualizarStatusAcao(codAcompanhamento, 'REALIZADA');
                    if (data.sucesso) {
                        // Feedback visual temporário
                        button.textContent = '✓ Realizada';
                        button.classList.remove('bg-green-600', 'hover:bg-green-700');
                        button.classList.add('bg-green-800');
                        
                        // Recarrega a timeline
                        if (currentPacienteForModal) {
                            await abrirModalTimelineHiperdia(currentPacienteForModal);
                        }
                        
                        setTimeout(() => {
                            alert('Ação marcada como realizada com sucesso!');
                        }, 100);
                    } else {
                        alert(`Erro: ${data.erro}`);
                        button.disabled = false;
                        button.textContent = originalText;
                        button.classList.remove('opacity-50');
                    }
                } catch (error) {
                    console.error('Erro ao marcar ação como realizada:', error);
                    alert('Ocorreu um erro ao marcar a ação como realizada.');
                    button.disabled = false;
                    button.textContent = originalText;
                    button.classList.remove('opacity-50');
                }
            }
            
            // Handler para o botão "Ação Cancelada"
            if (button.classList.contains('action-cancelada-btn')) {
                const confirmacao = confirm('Confirma que a ação foi cancelada?');
                if (!confirmacao) return;
                
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = 'Processando...';
                button.classList.add('opacity-50');
                
                try {
                    const data = await hiperdiaApi.atualizarStatusAcao(codAcompanhamento, 'CANCELADA');
                    if (data.sucesso) {
                        // Feedback visual temporário
                        button.textContent = '✓ Cancelada';
                        button.classList.remove('bg-red-600', 'hover:bg-red-700');
                        button.classList.add('bg-red-800');
                        
                        // Recarrega a timeline
                        if (currentPacienteForModal) {
                            await abrirModalTimelineHiperdia(currentPacienteForModal);
                        }
                        
                        setTimeout(() => {
                            alert('Ação marcada como cancelada com sucesso!');
                        }, 100);
                    } else {
                        alert(`Erro: ${data.erro}`);
                        button.disabled = false;
                        button.textContent = originalText;
                        button.classList.remove('opacity-50');
                    }
                } catch (error) {
                    console.error('Erro ao marcar ação como cancelada:', error);
                    alert('Ocorreu um erro ao marcar a ação como cancelada.');
                    button.disabled = false;
                    button.textContent = originalText;
                    button.classList.remove('opacity-50');
                }
            }
            
            // Handler para o botão "Excluir"
            if (button.classList.contains('action-excluir-btn')) {
                const confirmacao = confirm(
                    'ATENÇÃO: Esta ação será completamente removida da base de dados, junto com todas as ações posteriores que dependem dela.\n\n' +
                    'Esta operação não pode ser desfeita.\n\n' +
                    'Tem certeza que deseja continuar?'
                );
                if (!confirmacao) return;
                
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = 'Excluindo...';
                button.classList.add('opacity-50');
                
                try {
                    const data = await hiperdiaApi.excluirAcao(codAcompanhamento);
                    if (data.sucesso) {
                        // Feedback visual temporário
                        button.textContent = '✓ Excluída';
                        button.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                        button.classList.add('bg-green-800');
                        
                        // Recarrega a timeline
                        if (currentPacienteForModal) {
                            await abrirModalTimelineHiperdia(currentPacienteForModal);
                        }
                        
                        setTimeout(() => {
                            alert(data.mensagem || 'Ação excluída com sucesso!');
                        }, 100);
                    } else {
                        alert(`Erro: ${data.erro}`);
                        button.disabled = false;
                        button.textContent = originalText;
                        button.classList.remove('opacity-50');
                    }
                } catch (error) {
                    console.error('Erro ao excluir ação:', error);
                    alert('Ocorreu um erro ao excluir a ação.');
                    button.disabled = false;
                    button.textContent = originalText;
                    button.classList.remove('opacity-50');
                }
            }
        });
    }

    if (elements.tabelaPacientesBody) {
        elements.tabelaPacientesBody.addEventListener('click', async function (event) { // Made async
            // Botão para abrir modal de timeline
            const timelineButton = event.target.closest('.hiperdia-ver-detalhes-btn');
            if (timelineButton) {
                const codPaciente = timelineButton.dataset.codPaciente;
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
                return;
            }

            // Botão para abrir modal de tratamento (nome do paciente)
            const treatmentButton = event.target.closest('.hiperdia-treatment-btn');
            if (treatmentButton) {
                const codPaciente = treatmentButton.dataset.codPaciente;
                const paciente = currentFetchedPacientes.find(p => String(p.cod_paciente) === codPaciente);
                if (paciente) {
                    try {
                        await abrirModalTratamento(paciente);
                    } catch (error) {
                        console.error("Erro ao abrir modal de tratamento:", error);
                        alert("Erro ao carregar informações do tratamento.");
                    }
                } else {
                    console.error("Paciente não encontrado no cache:", codPaciente);
                    alert("Erro: não foi possível encontrar os dados do paciente.");
                }
                return;
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

    // Event listeners para o modal de tratamento
    if (elements.closeTreatmentModal) {
        elements.closeTreatmentModal.addEventListener('click', () => hiperdiaDom.closeTreatmentModal());
    }
    if (elements.cancelTreatmentBtn) {
        elements.cancelTreatmentBtn.addEventListener('click', () => hiperdiaDom.closeTreatmentModal());
    }
    if (elements.saveTreatmentBtn) {
        elements.saveTreatmentBtn.addEventListener('click', salvarTratamento);
    }

    // Event listeners para as abas de ação do tratamento
    if (elements.treatmentActionTabs) {
        elements.treatmentActionTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove o estado ativo de todas as abas
                elements.treatmentActionTabs.forEach(t => {
                    t.classList.remove('active', 'border-primary', 'bg-primary/10', 'text-primary');
                    t.classList.add('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                });
                // Adiciona o estado ativo à aba clicada
                this.classList.add('active', 'border-primary', 'bg-primary/10', 'text-primary');
                this.classList.remove('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                
                // Alternar seções
                hiperdiaDom.toggleTreatmentSections(this.dataset.action);
            });
        });
    }

    // Event listener para o tipo de modificação
    if (elements.modificationTypeRadios) {
        elements.modificationTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'frequency') {
                    elements.newFrequencySection?.classList.remove('hidden');
                } else {
                    elements.newFrequencySection?.classList.add('hidden');
                }
            });
        });
    }

    // Event listener para carregar tratamento atual na tabela
    function carregarTratamentosNaTabela() {
        currentFetchedPacientes.forEach(paciente => {
            carregarTratamentoAtual(paciente);
        });
    }

    // Função modificada para carregar tratamentos após carregar pacientes
    const originalFetchPacientes = fetchPacientesHiperdia;
    fetchPacientesHiperdia = function() {
        return originalFetchPacientes().then(() => {
            // Carregar tratamentos atuais para todos os pacientes
            setTimeout(carregarTratamentosNaTabela, 100);
            // Restaurar seleções da página
            setTimeout(restorePageSelections, 200);
        });
    };

    // Variável global para armazenar todos os pacientes selecionados (multi-página)
    let selectedPatientsGlobal = new Set();

    // Função para gerenciar seleção multi-página
    function updateGlobalSelection() {
        // Adicionar pacientes selecionados da página atual
        document.querySelectorAll('.hiperdia-print-checkbox:checked').forEach(checkbox => {
            selectedPatientsGlobal.add(checkbox.getAttribute('data-cod-paciente'));
        });

        // Remover pacientes desmarcados da página atual
        document.querySelectorAll('.hiperdia-print-checkbox:not(:checked)').forEach(checkbox => {
            selectedPatientsGlobal.delete(checkbox.getAttribute('data-cod-paciente'));
        });
    }

    // Função para restaurar seleções da página atual com base na seleção global
    function restorePageSelections() {
        document.querySelectorAll('.hiperdia-print-checkbox').forEach(checkbox => {
            const codPaciente = checkbox.getAttribute('data-cod-paciente');
            if (selectedPatientsGlobal.has(codPaciente)) {
                checkbox.checked = true;
            }
        });
    }

    // Função para buscar medicamentos de um paciente via API
    async function fetchMedicamentosForExport(codPaciente) {
        try {
            // Tentar primeiro com fetchMedicamentosAtuais
            let medicamentos = await hiperdiaApi.fetchMedicamentosAtuais(codPaciente);
            
            // Se não funcionou, tentar com fetchMedicamentos
            if (!medicamentos || medicamentos.length === 0) {
                medicamentos = await hiperdiaApi.fetchMedicamentos(codPaciente);
            }
            
            return medicamentos || [];
        } catch (error) {
            console.error(`Erro ao buscar medicamentos do paciente ${codPaciente}:`, error);
            // Tentar método alternativo em caso de erro
            try {
                const medicamentos = await hiperdiaApi.fetchMedicamentos(codPaciente);
                return medicamentos || [];
            } catch (error2) {
                console.error(`Erro no método alternativo para paciente ${codPaciente}:`, error2);
                return [];
            }
        }
    }

    // Função para coletar dados dos pacientes para exportação
    async function getSelectedPatientsData() {
        const selectedData = [];
        
        if (selectedPatientsGlobal.size === 0) {
            // Se nenhum paciente selecionado, buscar TODOS os pacientes da tabulação atual (todas as páginas)
            try {
                console.log('Buscando todos os pacientes para exportação...');
                const params = new URLSearchParams({
                    equipe: equipeSelecionadaAtual,
                    microarea: microareaSelecionadaAtual,
                    page: 1,
                    limit: 1000, // Buscar muitos pacientes de uma vez
                    search: currentSearchTerm,
                    sort_by: currentSort,
                    status: currentStatusFilter
                });
                
                const allPatientsData = await hiperdiaApi.fetchPacientesHiperdia(params);
                const allPatients = allPatientsData.pacientes || [];
                
                console.log(`Buscando medicamentos para ${allPatients.length} pacientes...`);
                
                // Para cada paciente, buscar medicamentos via API
                for (let i = 0; i < allPatients.length; i++) {
                    const paciente = allPatients[i];
                    console.log(`Processando paciente ${i + 1}/${allPatients.length}: ${paciente.nome_paciente}`);
                    
                    const medicamentos = await fetchMedicamentosForExport(paciente.cod_paciente);
                    selectedData.push(formatPatientForExport(paciente, medicamentos));
                }
            } catch (error) {
                console.error('Erro ao buscar todos os pacientes:', error);
                // Fallback para os pacientes da página atual (sem medicamentos via API)
                currentFetchedPacientes.forEach(paciente => {
                    selectedData.push(formatPatientForExport(paciente));
                });
            }
        } else {
            // Usar apenas os pacientes selecionados - buscar todos os dados para garantir que temos todos os selecionados
            try {
                console.log(`Buscando ${selectedPatientsGlobal.size} pacientes selecionados para exportação...`);
                const params = new URLSearchParams({
                    equipe: equipeSelecionadaAtual,
                    microarea: microareaSelecionadaAtual,
                    page: 1,
                    limit: 1000, // Buscar todos os pacientes para pegar os selecionados
                    search: currentSearchTerm,
                    sort_by: currentSort,
                    status: currentStatusFilter
                });
                
                const allPatientsData = await hiperdiaApi.fetchPacientesHiperdia(params);
                const allPatients = allPatientsData.pacientes || [];
                
                // Filtrar apenas os pacientes que estão selecionados globalmente e buscar medicamentos
                const selectedPatients = allPatients.filter(paciente => 
                    selectedPatientsGlobal.has(String(paciente.cod_paciente))
                );
                
                console.log(`Buscando medicamentos para ${selectedPatients.length} pacientes selecionados...`);
                
                for (let i = 0; i < selectedPatients.length; i++) {
                    const paciente = selectedPatients[i];
                    console.log(`Processando paciente selecionado ${i + 1}/${selectedPatients.length}: ${paciente.nome_paciente}`);
                    
                    const medicamentos = await fetchMedicamentosForExport(paciente.cod_paciente);
                    selectedData.push(formatPatientForExport(paciente, medicamentos));
                }
            } catch (error) {
                console.error('Erro ao buscar pacientes selecionados:', error);
                // Fallback: usar apenas os da página atual (sem medicamentos via API)
                currentFetchedPacientes.forEach(paciente => {
                    if (selectedPatientsGlobal.has(String(paciente.cod_paciente))) {
                        selectedData.push(formatPatientForExport(paciente));
                    }
                });
            }
        }
        
        console.log(`Exportação concluída: ${selectedData.length} pacientes processados`);
        return selectedData;
    }

    // Função para formatar dados do paciente para exportação (sem buscar medicamentos - será feito separadamente)
    function formatPatientForExport(paciente, tratamentoAtual = null) {
        let tratamento = 'Nenhum tratamento cadastrado';
        
        if (tratamentoAtual) {
            // Se os medicamentos foram fornecidos via API
            if (tratamentoAtual.length > 0) {
                const medicamentosFormatados = tratamentoAtual.map(med => 
                    `${med.nome_medicamento || ''} ${med.dose_texto || ''} (${med.frequencia_texto || ''})`
                ).join('\n');
                tratamento = medicamentosFormatados || 'Nenhum tratamento cadastrado';
            }
        } else {
            // Tentar buscar do DOM (apenas para pacientes da página atual)
            const tratamentoContainer = document.getElementById(`tratamento-atual-${paciente.cod_paciente}`);
            if (tratamentoContainer && tratamentoContainer.innerHTML) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = tratamentoContainer.innerHTML;
                tratamento = tempDiv.textContent || tempDiv.innerText || 'Nenhum tratamento cadastrado';
            }
        }
        
        return {
            'Nome': paciente.nome_paciente || '',
            'CNS': paciente.cartao_sus || '',
            'Idade': paciente.idade_calculada || '',
            'Equipe': paciente.nome_equipe || '',
            'Area - Agente': `${paciente.microarea || ''} - ${paciente.nome_agente || ''}`,
            'Tratamento Atual': tratamento,
            'Próxima Ação': paciente.proxima_acao_descricao || '',
            'Status': getSituacaoText(paciente.situacao_problema)
        };
    }

    // Função auxiliar para converter situação para texto
    function getSituacaoText(situacao) {
        switch(situacao) {
            case 0: return 'Ativo';
            case 1: return 'Compensado';
            default: return 'N/A';
        }
    }

    // Funções de exportação
    function exportToExcel(data) {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join('\t'),
            ...data.map(row => headers.map(header => row[header] || '').join('\t'))
        ].join('\n');
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `hiperdia_pacientes_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportToCSV(data) {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `hiperdia_pacientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function exportToPDF(data) {
        try {
            const response = await fetch('/api/hiperdia/export_pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    pacientes: data,
                    filtros: {
                        equipe: equipeSelecionadaAtual,
                        microarea: microareaSelecionadaAtual,
                        status: currentStatusFilter
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `hiperdia_pacientes_${new Date().toISOString().split('T')[0]}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar arquivo PDF. Tente novamente.');
        }
    }

    // Setup dos botões de exportação
    function setupExportButtons() {
        if (elements.exportExcelBtn) {
            elements.exportExcelBtn.addEventListener('click', async () => {
                const data = await getSelectedPatientsData();
                if (data.length === 0) {
                    alert('Nenhum paciente disponível para exportação.');
                    return;
                }
                exportToExcel(data);
                elements.exportDropdown.classList.add('hidden');
            });
        }

        if (elements.exportCsvBtn) {
            elements.exportCsvBtn.addEventListener('click', async () => {
                const data = await getSelectedPatientsData();
                if (data.length === 0) {
                    alert('Nenhum paciente disponível para exportação.');
                    return;
                }
                exportToCSV(data);
                elements.exportDropdown.classList.add('hidden');
            });
        }

        if (elements.exportPdfBtn) {
            elements.exportPdfBtn.addEventListener('click', async () => {
                const data = await getSelectedPatientsData();
                if (data.length === 0) {
                    alert('Nenhum paciente disponível para exportação.');
                    return;
                }
                await exportToPDF(data);
                elements.exportDropdown.classList.add('hidden');
            });
        }
    }

    // Função para gerenciar checkboxes de impressão
    function setupPrintCheckboxes() {
        const selectAllCheckbox = document.getElementById('hiperdia-select-all-print');
        const printButton = document.getElementById('hiperdia-print-prescriptions-btn');

        // Selecionar/deselecionar todos
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('.hiperdia-print-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                updateGlobalSelection();
            });
        }

        // Listener para checkboxes individuais
        document.addEventListener('change', function(event) {
            if (event.target.classList.contains('hiperdia-print-checkbox')) {
                updateGlobalSelection();
            }
        });

        // Botão de imprimir receituários
        if (printButton) {
            printButton.addEventListener('click', async function() {
                const selectedCheckboxes = document.querySelectorAll('.hiperdia-print-checkbox:checked');
                
                if (selectedCheckboxes.length === 0) {
                    alert('Por favor, selecione pelo menos um paciente para imprimir o receituário.');
                    return;
                }

                const selectedPatients = Array.from(selectedCheckboxes).map(checkbox => ({
                    cod_paciente: checkbox.getAttribute('data-cod-paciente'),
                    nome_paciente: checkbox.getAttribute('data-nome-paciente'),
                    cpf: checkbox.getAttribute('data-cpf'),
                    equipe: checkbox.getAttribute('data-equipe'),
                    microarea: checkbox.getAttribute('data-microarea')
                }));

                try {
                    await generatePrescriptionPDF(selectedPatients);
                } catch (error) {
                    console.error('Erro ao gerar PDF:', error);
                    alert('Erro ao gerar receituários. Tente novamente.');
                }
            });
        }
    }

    // Função para gerar múltiplos PDFs dos receituários
    async function generatePrescriptionPDF(patients) {
        try {
            const totalPatients = patients.length;
            let processedCount = 0;
            
            // Mostrar progresso se mais de 1 paciente
            if (totalPatients > 1) {
                console.log(`Gerando ${totalPatients} receituários individuais...`);
            }
            
            // Gerar PDF para cada paciente individualmente
            for (const patient of patients) {
                try {
                    const response = await fetch('/api/hiperdia/generate_prescription_pdf_individual', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ patient })
                    });

                    if (!response.ok) {
                        console.error(`Erro ao gerar PDF para ${patient.nome_paciente}: ${response.status}`);
                        continue;
                    }

                    // Download do PDF individual
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    
                    // Formato: RECEITUARIO (data) - HIPERTENSAO - NOME DO PACIENTE.PDF
                    const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
                    const patientName = patient.nome_paciente.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
                    link.download = `RECEITUARIO (${currentDate}) - HIPERTENSAO - ${patientName}.pdf`;
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    
                    processedCount++;
                    
                    // Pequena pausa entre downloads para não sobrecarregar o browser
                    if (totalPatients > 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                } catch (patientError) {
                    console.error(`Erro específico para paciente ${patient.nome_paciente}:`, patientError);
                }
            }
            
            if (processedCount === 0) {
                alert('Erro: Nenhum receituário pôde ser gerado.');
            }

        } catch (error) {
            console.error('Erro geral ao gerar PDFs:', error);
            throw error;
        }
    }

    // --- Inicialização ---
    hiperdiaDom.setupDropdown(elements.equipeButton, elements.equipeDropdown);
    hiperdiaDom.setupDropdown(elements.microareaButton, elements.microareaDropdown);
    hiperdiaDom.setupExportMenu();

    fetchEquipesMicroareasHiperdia();
    fetchPacientesHiperdia();
    updateSummaryCards();
    hiperdiaDom.updateStatusFilterButtons(document.querySelector('.hiperdia-status-tab-btn[data-status-filter="Todos"]'));
    setupPrintCheckboxes();
    setupExportButtons();
});
