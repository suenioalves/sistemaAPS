document.addEventListener('DOMContentLoaded', function () {
    // --- Seletores de Elementos ---
    const equipeButton = document.getElementById('hiperdia-equipe-button'); // Atualize os IDs no seu HTML
    const equipeButtonText = document.getElementById('hiperdia-equipe-button-text');
    const equipeDropdown = document.getElementById('hiperdia-equipe-dropdown');
    const equipeDropdownContent = document.getElementById('hiperdia-equipe-dropdown-content');

    const microareaButton = document.getElementById('hiperdia-microarea-button');
    const hipertensosCard = document.getElementById('hipertensosCard');
    const compensadosCard = document.getElementById('compensadosCard');
    const descompensadosCard = document.getElementById('descompensadosCard');
    const revisaoCard = document.getElementById('revisaoCard');
    const microareaButtonText = document.getElementById('hiperdia-microarea-button-text');
    const microareaDropdown = document.getElementById('hiperdia-microarea-dropdown');
    const microareaDropdownContent = document.getElementById('hiperdia-microarea-dropdown-content');

    const tabelaPacientesBody = document.getElementById('hiperdia-tabela-pacientes-body');
    const paginationContainer = document.getElementById('hiperdia-pagination-container');
    const paginationInfo = document.getElementById('hiperdia-pagination-info');
    const searchInput = document.getElementById('hiperdia-search-input');

       // --- Elementos dos Modais ---
    const timelineModal = document.getElementById('hiperdia-timelineModal');
    const closeTimelineModal = document.getElementById('hiperdia-closeTimelineModal');
    const closeTimelineModalBtn = document.getElementById('hiperdia-closeTimelineModalBtn');
    const timelineRegisterBtn = document.getElementById('hiperdia-timelineRegisterBtn');
    const timelineModalTitle = document.getElementById('hiperdia-timelineModalTitle');
    const timelineModalAvatarIniciais = document.getElementById('hiperdia-timelineModalAvatarIniciais');
    const timelineModalPacienteNome = document.getElementById('hiperdia-timelineModalPacienteNome');
    const timelineModalPacienteIdade = document.getElementById('hiperdia-timelineModalPacienteIdade');
    const timelineModalMicroarea = document.getElementById('hiperdia-timelineModalMicroarea');
    const timelineModalEquipe = document.getElementById('hiperdia-timelineModalEquipe');
    const timelineModalStatus = document.getElementById('hiperdia-timelineModalStatus');
    const timelineModalUltimaPA = document.getElementById('hiperdia-timelineModalUltimaPA');
    const timelineModalRiscoCV = document.getElementById('hiperdia-timelineModalRiscoCV');
    const timelineModalProximaAcao = document.getElementById('hiperdia-timelineModalProximaAcao');
    const timelineModalContentArea = document.getElementById('hiperdia-timelineModalContentArea');

    const registerModal = document.getElementById('hiperdia-registerModal');
    const closeRegisterModal = document.getElementById('hiperdia-closeRegisterModal');
    const cancelRegisterBtn = document.getElementById('hiperdia-cancelRegisterBtn');
    const saveRegisterModalBtn = document.getElementById('hiperdia-saveRegisterModalBtn');
    const registerModalTitle = document.getElementById('hiperdia-registerModalTitle');
    const actionTypeRadios = document.querySelectorAll('input[name="action-type"]');
    const mrpaSection = document.getElementById('hiperdia-mrpaSection');
    const medicationSection = document.getElementById('hiperdia-medicationSection');
    const labExamsSection = document.getElementById('hiperdia-labExamsSection');
    const imageExamsSection = document.getElementById('hiperdia-imageExamsSection');
    const nutritionSection = document.getElementById('hiperdia-nutritionSection');
    const cardiologySection = document.getElementById('hiperdia-cardiologySection');
    const riskSection = document.getElementById('hiperdia-riskSection');


    const acompanhamentoHipertensosTitle = document.getElementById('acompanhamentoHipertensosTitle'); // Crie este elemento no HTML

    // --- Variáveis de Estado ---
     let currentFetchedPacientes = [];
     let todasEquipesComMicroareas = [];
    let currentPacienteForModal = null; // Variável para armazenar o paciente atual do modal
    let equipeSelecionadaAtual = 'Todas';
    let microareaSelecionadaAtual = 'Todas as áreas'; // Alterado para consistência
    let currentPage = 1;
    let currentSearchTerm = '';
    let currentSort = 'nome_asc'; // Exemplo: 'nome_asc', 'idade_desc'

    // --- Funções Auxiliares ---
    function setupDropdown(button, dropdown) {
        if (button && dropdown) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                document.querySelectorAll('.dropdown-menu.absolute').forEach(d => {
                    if (d !== dropdown) d.classList.add('hidden');
                });
                dropdown.classList.toggle('hidden');
            });
        }
    }

    document.addEventListener('click', function (e) {
        if (equipeButton && !equipeButton.contains(e.target) && equipeDropdown && !equipeDropdown.contains(e.target)) {
            equipeDropdown.classList.add('hidden');
        }
        if (microareaButton && !microareaButton.contains(e.target) && microareaDropdown && !microareaDropdown.contains(e.target)) {
            microareaDropdown.classList.add('hidden');
        }
    });

    function updateAcompanhamentoTitle() {
        if (!acompanhamentoHipertensosTitle) return;
        let title = "Acompanhamento de Pacientes com Hipertensão";
        if (equipeSelecionadaAtual && equipeSelecionadaAtual !== 'Todas') {
            title += ` - Equipe: ${equipeSelecionadaAtual}`;
            if (microareaSelecionadaAtual && microareaSelecionadaAtual !== 'Todas as áreas' && microareaSelecionadaAtual !== 'Todas') {
                title += ` - ${microareaSelecionadaAtual}`; // Ajustado para exibir "Área X - Agente Y"
            }
        }
        acompanhamentoHipertensosTitle.textContent = title;
    }

    function updateSummaryCards() {
        fetchTotalHipertensos();
        // Futuramente, buscar os dados dos outros cards aqui
        if (compensadosCard) compensadosCard.textContent = '0';
        if (descompensadosCard) descompensadosCard.textContent = '0';
        if (revisaoCard) revisaoCard.textContent = '0';
    }


    function fetchTotalHipertensos() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: microareaSelecionadaAtual
        });

        fetch(`/api/get_total_hipertensos?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    console.error('Erro ao buscar total de hipertensos:', data.erro);
                   if (hipertensosCard) { // Adiciona verificação de nulidade
                        hipertensosCard.textContent = '-';
                   }

                    return;
                }
                 if (hipertensosCard) { // Adiciona verificação de nulidade
                    hipertensosCard.textContent = data.total_pacientes !== undefined ? data.total_pacientes : '-';
                }
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes com hipertensão:', error);
                if (hipertensosCard) { // Adiciona verificação de nulidade
                    hipertensosCard.textContent = `Erro`;
                }            
            });
    }
    function fetchPacientesHiperdia() {
        if (!tabelaPacientesBody) return;
        tabelaPacientesBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Carregando...</td></tr>`; // Ajuste colspan para 5 colunas

        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: microareaSelecionadaAtual,
            page: currentPage,
            search: currentSearchTerm,
            sort_by: currentSort
        });

        fetch(`/api/pacientes_hiperdia_has?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                currentFetchedPacientes = data.pacientes || [];
                tabelaPacientesBody.innerHTML = '';
                
    const situacaoProblemaMap = {
                    0: '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>',
                    1: '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Compensado</span>'
                };

                if (currentFetchedPacientes.length > 0) {
                    currentFetchedPacientes.forEach(paciente => {
                        const row = tabelaPacientesBody.insertRow();
                        row.className = 'hover:bg-gray-50';
                        
                        let proximaAcaoDisplay = 'A definir';
                        if (paciente.proxima_acao_descricao) {
                            proximaAcaoDisplay = `${paciente.proxima_acao_descricao} <br> <span class="text-xs text-gray-400">(${paciente.proxima_acao_data_formatada || 'Data não definida'})</span>`;
                        }

                        
                        const situacaoDisplay = situacaoProblemaMap[paciente.situacao_problema] || 'N/A';
                        // Adapta as colunas conforme a nova estrutura e dados disponíveis
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente || 'N/A'}, ${paciente.idade_calculada || 'N/A'} anos</div>
                                <div class="text-xs text-gray-500">CNS: ${paciente.cartao_sus || 'N/A'}</div>
                                <div class="text-xs text-gray-500">Equipe ${paciente.nome_equipe || 'N/A'} - Área ${paciente.microarea || 'N/A'} - Agente: ${paciente.nome_agente || 'A definir'}</div>
                            </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${situacaoDisplay}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${paciente.ciap_cronico ? `CIAP: ${paciente.ciap_cronico}` : ''}
                                ${paciente.ciap_cronico && paciente.cid10_cronico ? '<br>' : ''}
                                ${paciente.cid10_cronico ? `CID10: ${paciente.cid10_cronico}` : ''}
                                ${!paciente.ciap_cronico && !paciente.cid10_cronico ? 'N/A' : ''}
                            </td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${proximaAcaoDisplay}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button class="hiperdia-ver-detalhes-btn text-primary hover:text-indigo-900 !rounded-button whitespace-nowrap"
                                        data-cod-paciente="${paciente.cod_paciente}">
                                    Registrar Ações
                                </button>
                            </td>
                        `;
                        tabelaPacientesBody.appendChild(row);
                    });
                } else {
                    tabelaPacientesBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum paciente encontrado.</td></tr>`; // Colspan ajustado para 5 colunas
                }
                renderPaginacaoHiperdia(data.total, data.page, data.limit, data.pages);
                updateAcompanhamentoTitle();
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes com hipertensão:', error);
                tabelaPacientesBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>`; // Colspan ajustado para 5 colunas
            });
    }

    function renderPaginacaoHiperdia(total, page, limit, totalPages) {
        // Implementação similar à renderPagination do plafam_script.js
        // Adapte os IDs dos elementos para #hiperdia-pagination-info e #hiperdia-pagination-container
        // e as classes dos botões para 'hiperdia-page-btn' se quiser estilos diferentes.
        if (!paginationInfo || !paginationContainer) return;
        if (!total || totalPages <= 1) {
            paginationInfo.innerHTML = '';
            paginationContainer.innerHTML = '';
            return;
        }
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        paginationInfo.innerHTML = `Mostrando <span class="font-medium">${start}</span> a <span class="font-medium">${end}</span> de <span class="font-medium">${total}</span> resultados`;

        let paginationHtml = `<button class="pagination-button ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="ri-arrow-left-s-line"></i></button>`;
        // Lógica de paginação (pode ser a mesma do plafam_script.js)
        for (let i = 1; i <= totalPages; i++) { // Simplificado, idealmente usar createPaginationLogic
            paginationHtml += `<button class="pagination-button ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        paginationHtml += `<button class="pagination-button ${page === totalPages ? 'disabled' : ''}" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}"><i class="ri-arrow-right-s-line"></i></button>`;
        paginationContainer.innerHTML = paginationHtml;

        document.querySelectorAll('#hiperdia-pagination-container .pagination-button').forEach(button => {
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

    // Renomeado e adaptado de popularDropdownMicroareasHiperdia para popularDropdownAgentesHiperdia
    function popularDropdownAgentesHiperdia(agentesDaEquipe) {
        if (!microareaDropdownContent || !microareaButtonText) return;
        microareaDropdownContent.innerHTML = '';

        const todasOption = document.createElement('div');
        todasOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
        todasOption.textContent = 'Todas as áreas';
        todasOption.addEventListener('click', () => {
            microareaButtonText.textContent = 'Todas as áreas';
            microareaSelecionadaAtual = 'Todas as áreas';
            if (microareaDropdown) microareaDropdown.classList.add('hidden');
            currentPage = 1;
            fetchPacientesHiperdia();
            updateSummaryCards();
            updateAcompanhamentoTitle();
        });
        microareaDropdownContent.appendChild(todasOption);

        if (agentesDaEquipe && agentesDaEquipe.length > 0) {
            // Agrupar por microárea para listar agentes ou apenas a área
            const microareasUnicas = {};
            agentesDaEquipe.forEach(ag => {
                if (!microareasUnicas[ag.micro_area]) {
                    microareasUnicas[ag.micro_area] = [];
                }
                if (ag.nome_agente) { // Adiciona agente apenas se existir
                    microareasUnicas[ag.micro_area].push(ag.nome_agente);
                }
            });

            Object.keys(microareasUnicas).sort().forEach(ma => {
                const option = document.createElement('div');
                option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                // Se houver agentes, mostra o primeiro. Se não, só a área.
                // Idealmente, se houvesse múltiplos agentes por microárea, precisaria de uma lógica mais complexa
                // ou exibir cada combinação "Área X - Agente Y". Por simplicidade, pegamos o primeiro agente.
                const nomeAgente = microareasUnicas[ma].length > 0 ? microareasUnicas[ma][0] : null;
                const displayText = nomeAgente ? `Área ${ma} - ${nomeAgente}` : `Área ${ma}`;
                option.textContent = displayText;
                option.addEventListener('click', () => {
                    microareaButtonText.textContent = displayText;
                    microareaSelecionadaAtual = ma; // Armazena apenas a microárea para o backend
                    if (microareaDropdown) microareaDropdown.classList.add('hidden');
                    currentPage = 1;
                    fetchPacientesHiperdia();
                    updateSummaryCards();
                    updateAcompanhamentoTitle();
                });
                microareaDropdownContent.appendChild(option);
            });
        }
    }

    function fetchEquipesMicroareasHiperdia() {
        fetch('/api/equipes_microareas_hiperdia')
            .then(response => response.json())
            .then(data => {
                if (data.erro || !Array.isArray(data)) {
                    console.error('Erro ao buscar equipes/microáreas para Hiperdia:', data.erro || 'Formato inválido');
                    return;
                }
                todasEquipesComMicroareas = data;
                if (!equipeDropdownContent || !equipeButtonText) return;
                equipeDropdownContent.innerHTML = '';

                const todasEquipesOption = document.createElement('div');
                todasEquipesOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                todasEquipesOption.textContent = 'Todas as Equipes';
                todasEquipesOption.addEventListener('click', () => {
                    equipeButtonText.textContent = 'Todas as Equipes';
                    equipeSelecionadaAtual = 'Todas';
                    if (equipeDropdown) equipeDropdown.classList.add('hidden');
                    popularDropdownAgentesHiperdia([]); // Limpa agentes
                    if (microareaButtonText) microareaButtonText.textContent = 'Todas as áreas';
                    microareaSelecionadaAtual = 'Todas as áreas';
                    currentPage = 1;
                    fetchPacientesHiperdia();
                    updateSummaryCards();
                });
                equipeDropdownContent.appendChild(todasEquipesOption);

                if (todasEquipesComMicroareas.length === 0) {
                    const noEquipesOption = document.createElement('div');
                    noEquipesOption.className = 'p-2 text-gray-500';
                    noEquipesOption.textContent = 'Nenhuma equipe encontrada.';
                    equipeDropdownContent.appendChild(noEquipesOption);
                } else {
                    todasEquipesComMicroareas.forEach(equipe => {
                        const option = document.createElement('div');
                        option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                        option.textContent = `${equipe.nome_equipe} (${equipe.num_pacientes || 0} pacientes)`;
                        option.addEventListener('click', () => {
                            equipeButtonText.textContent = equipe.nome_equipe;
                            equipeSelecionadaAtual = equipe.nome_equipe;
                            if (equipeDropdown) equipeDropdown.classList.add('hidden');
                            popularDropdownAgentesHiperdia(equipe.agentes); // Passa a lista de agentes da equipe
                            if (microareaButtonText) microareaButtonText.textContent = 'Todas as áreas';
                            microareaSelecionadaAtual = 'Todas as áreas';
                            currentPage = 1;
                            fetchPacientesHiperdia();
                            updateSummaryCards();
                        });
                        equipeDropdownContent.appendChild(option);
                    });
                }
            })
            .catch(error => console.error('Erro de rede ao buscar equipes/microáreas para Hiperdia:', error));
    }

    // --- Event Listeners ---

    // --- Funções dos Modais ---
    function getIniciais(nome) {
        if (!nome) return '--';
        const partes = nome.split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : partes[0][1] || '')).toUpperCase();
    }

    function abrirModalTimelineHiperdia(paciente) {
        if (!paciente || !timelineModal) return;

        currentPacienteForModal = paciente;

        // Preenche o cabeçalho do modal com os dados do paciente
        if (timelineModalTitle) timelineModalTitle.textContent = `Linha do Tempo - ${paciente.nome_paciente || 'Paciente'}`;
        if (timelineModalAvatarIniciais) timelineModalAvatarIniciais.textContent = getIniciais(paciente.nome_paciente);
        if (timelineModalPacienteNome) timelineModalPacienteNome.textContent = paciente.nome_paciente || 'N/A';
        if (timelineModalPacienteIdade) timelineModalPacienteIdade.textContent = `${paciente.idade_calculada || 'N/A'} anos`;
        if (timelineModalMicroarea) timelineModalMicroarea.textContent = paciente.microarea || 'N/A';
        if (timelineModalEquipe) timelineModalEquipe.textContent = paciente.nome_equipe || 'N/A';

        // Preenche os campos de status (usando dados da tabela, pois não temos API de detalhes ainda)
        const situacaoProblemaMap = { 0: 'Ativo', 1: 'Compensado' };
        if (timelineModalStatus) timelineModalStatus.textContent = situacaoProblemaMap[paciente.situacao_problema] || 'N/A';
        if (timelineModalUltimaPA) timelineModalUltimaPA.textContent = paciente.ultima_pa || 'N/A'; // Coluna não existe, será N/A
        if (timelineModalRiscoCV) timelineModalRiscoCV.textContent = paciente.risco_cv || 'N/A'; // Coluna não existe, será N/A

        if (timelineModalProximaAcao) {
            timelineModalProximaAcao.textContent = paciente.proxima_acao_descricao ? `${paciente.proxima_acao_descricao} (${paciente.proxima_acao_data_formatada})` : 'A definir';
        }

        // Por enquanto, o conteúdo da timeline é estático no HTML.
        // No futuro, aqui seria o local para fazer um fetch dos eventos da timeline do paciente.

        timelineModal.classList.remove('hidden');
    }

    function handleActionTypeChange() {
        const selectedValue = document.querySelector('input[name="action-type"]:checked')?.value;
        if (!selectedValue) return;

        // Oculta todas as seções dinâmicas primeiro
        const sections = [
            mrpaSection, medicationSection, labExamsSection, imageExamsSection,
            nutritionSection, cardiologySection, riskSection
        ];
        sections.forEach(section => {
            if (section) section.classList.add('hidden');
        });

        // Mostra a seção relevante com base no tipo de ação selecionado
        switch (selectedValue) {
            case '2': // Avaliar MRPA
                if (mrpaSection) mrpaSection.classList.remove('hidden');
                break;
            case '3': // Modificar tratamento
                if (medicationSection) medicationSection.classList.remove('hidden');
                break;
            case '5': // Avaliar Exames
                if (labExamsSection) labExamsSection.classList.remove('hidden');
                if (imageExamsSection) imageExamsSection.classList.remove('hidden');
                break;
            case '6': // Avaliar RCV (Risco Cardiovascular)
                if (riskSection) riskSection.classList.remove('hidden');
                break;
            case '8': // Registrar consulta nutrição
                if (nutritionSection) nutritionSection.classList.remove('hidden');
                break;
            // Para '1', '4', '7', '9', nenhuma seção específica é mostrada.
        }
    }

    function abrirModalRegistroHiperdia() {
        if (!currentPacienteForModal || !registerModal) return;

        if (registerModalTitle) registerModalTitle.textContent = `Registrar Nova Ação - ${currentPacienteForModal.nome_paciente}`;

        // Limpa o formulário (opcional, mas boa prática)
        const form = document.getElementById('hiperdia-registerForm');
        if (form) form.reset();

        // Define a data atual como padrão
        const dataInput = document.getElementById('hiperdia-data-acao-atual');
        if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];

        handleActionTypeChange(); // Garante que a visibilidade das seções esteja correta ao abrir
        registerModal.classList.remove('hidden');
    }

    function saveHiperdiaAction() {
        if (!currentPacienteForModal) {
            alert('Erro: Paciente não selecionado.');
            return;
        }

        const codAcaoAtual = document.querySelector('input[name="action-type"]:checked')?.value;
        const dataAcaoAtual = document.getElementById('hiperdia-data-acao-atual')?.value;

        if (!codAcaoAtual || !dataAcaoAtual) {
            alert('Por favor, preencha o tipo e a data da ação.');
            return;
        }

        // Payload base
        const payload = {
            cod_cidadao: currentPacienteForModal.cod_paciente,
            cod_acao_atual: parseInt(codAcaoAtual),
            data_acao_atual: dataAcaoAtual,
        };

        // Desabilita o botão para evitar cliques duplos
        saveRegisterModalBtn.disabled = true;
        saveRegisterModalBtn.textContent = 'Salvando...';

        fetch('/api/hiperdia/registrar_acao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('Ação registrada com sucesso!');
                registerModal.classList.add('hidden');
                fetchPacientesHiperdia(); // Atualiza a tabela para refletir a nova "Próxima Ação"
                if (timelineModal && !timelineModal.classList.contains('hidden')) {
                    timelineModal.classList.add('hidden');
                }
            } else {
                alert(`Erro ao registrar ação: ${data.erro}`);
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            alert('Ocorreu um erro de comunicação com o servidor.');
        })
        .finally(() => {
            saveRegisterModalBtn.disabled = false;
            saveRegisterModalBtn.textContent = 'Salvar registro';
        });
    }

    // --- Event Listeners ---
    if (tabelaPacientesBody) {
        tabelaPacientesBody.addEventListener('click', function (event) {
            const target = event.target;
            if (target.classList.contains('hiperdia-ver-detalhes-btn') || target.closest('.hiperdia-ver-detalhes-btn')) {
                const button = target.closest('.hiperdia-ver-detalhes-btn');
                const codPaciente = button.dataset.codPaciente;
                const paciente = currentFetchedPacientes.find(p => String(p.cod_paciente) === codPaciente);
                if (paciente) {
                    abrirModalTimelineHiperdia(paciente);
                } else {
                    console.error("Paciente não encontrado no cache:", codPaciente);
                    alert("Erro: não foi possível encontrar os damodidos do paciente.");
                }
            }
        });
    }

    // Listeners para fechar os modais
    if (closeTimelineModal) closeTimelineModal.addEventListener('click', () => timelineModal.classList.add('hidden'));
    if (closeTimelineModalBtn) closeTimelineModalBtn.addEventListener('click', () => timelineModal.classList.add('hidden'));
    if (closeRegisterModal) closeRegisterModal.addEventListener('click', () => registerModal.classList.add('hidden'));
    if (cancelRegisterBtn) cancelRegisterBtn.addEventListener('click', () => registerModal.classList.add('hidden'));

    // Listener para abrir o modal de registro a partir do modal da timeline
    if (timelineRegisterBtn) {
        timelineRegisterBtn.addEventListener('click', abrirModalRegistroHiperdia);
    }

    // Listener para mudanças no tipo de ação no modal de registro
    if (actionTypeRadios) {
        actionTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleActionTypeChange);
        });
    }

    // Listener para o botão de salvar
    if (saveRegisterModalBtn) {
        saveRegisterModalBtn.addEventListener('click', saveHiperdiaAction);
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                currentSearchTerm = event.target.value;
                currentPage = 1;
                fetchPacientesHiperdia();
            }
        });
    }

    // --- Inicialização ---
    setupDropdown(equipeButton, equipeDropdown);
    setupDropdown(microareaButton, microareaDropdown);
    fetchEquipesMicroareasHiperdia();
    fetchPacientesHiperdia();
    updateSummaryCards(); // Carga inicial dos cards
});