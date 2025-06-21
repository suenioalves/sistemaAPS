document.addEventListener('DOMContentLoaded', function () {
    // --- Seletores de Elementos ---
    const equipeButton = document.getElementById('hiperdia-equipe-button'); // Atualize os IDs no seu HTML
    const equipeButtonText = document.getElementById('hiperdia-equipe-button-text');
    const equipeDropdown = document.getElementById('hiperdia-equipe-dropdown');
    const equipeDropdownContent = document.getElementById('hiperdia-equipe-dropdown-content');

    const microareaButton = document.getElementById('hiperdia-microarea-button');
    const hipertensosCard = document.getElementById('hipertensosCard');
    const microareaButtonText = document.getElementById('hiperdia-microarea-button-text');
    const microareaDropdown = document.getElementById('hiperdia-microarea-dropdown');
    const microareaDropdownContent = document.getElementById('hiperdia-microarea-dropdown-content');

    const tabelaPacientesBody = document.getElementById('hiperdia-tabela-pacientes-body');
    const paginationContainer = document.getElementById('hiperdia-pagination-container');
    const paginationInfo = document.getElementById('hiperdia-pagination-info');
    const searchInput = document.getElementById('hiperdia-search-input');

    let currentPacienteForModal = null; // Variável para armazenar o paciente atual do modal

    const acompanhamentoHipertensosTitle = document.getElementById('acompanhamentoHipertensosTitle'); // Crie este elemento no HTML

    // --- Variáveis de Estado ---
    let todasEquipesComMicroareas = [];
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
                    hipertensosCard.textContent = '-';
                    return;
                }
                hipertensosCard.textContent = data.total_pacientes !== undefined ? data.total_pacientes : '-';

            })
            .catch(error => {
                console.error('Erro ao carregar pacientes com hipertensão:', error);
                hipertensosCard.textContent = `Erro`;
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
                tabelaPacientesBody.innerHTML = '';
                if (data.pacientes && data.pacientes.length > 0) {
                    // Adiciona evento de clique genérico para os botões "Registrar Ações"
                    // A lógica completa do modal precisaria ser portada do adolescentes_script.js
                    // Certifique-se de que este event listener seja adicionado apenas uma vez ou gerenciado adequadamente
                    // para evitar múltiplos listeners se fetchPacientesHiperdia for chamado várias vezes.
                    // Uma abordagem seria remover um listener antigo antes de adicionar um novo,
                    // ou usar delegação de eventos em um elemento pai estável.
                    // Por simplicidade, estamos adicionando diretamente aqui.
                    tabelaPacientesBody.addEventListener('click', function (event) {
                        const target = event.target;
                        if (target.classList.contains('hiperdia-ver-detalhes-btn') || target.closest('.hiperdia-ver-detalhes-btn')) {
                            const button = target.classList.contains('hiperdia-ver-detalhes-btn') ? target : target.closest('.hiperdia-ver-detalhes-btn');
                            const codPaciente = button.dataset.codPaciente;
                            if (codPaciente) {
                                // TODO: Implementar a função abrirModalTimelineHiperdia(codPaciente)
                                alert('Funcionalidade de modal ainda não implementada para Hiperdia. Paciente: ' + codPaciente);
                            }
                        }
                    });

                    data.pacientes.forEach(paciente => {
                        const row = tabelaPacientesBody.insertRow();
                        row.className = 'hover:bg-gray-50';
                        // Adapta as colunas conforme a nova estrutura e dados disponíveis
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente || 'N/A'}, ${paciente.idade_calculada || 'N/A'} anos</div>
                                <div class="text-xs text-gray-500">CNS: ${paciente.cartao_sus || 'N/A'}</div>
                                <div class="text-xs text-gray-500">Equipe ${paciente.nome_equipe || 'N/A'} - Área ${paciente.microarea || 'N/A'} - Agente: ${paciente.nome_agente || 'A definir'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.situacao_problema || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${paciente.ciap_cronico ? `CIAP: ${paciente.ciap_cronico}` : ''}
                                ${paciente.ciap_cronico && paciente.cid10_cronico ? '<br>' : ''}
                                ${paciente.cid10_cronico ? `CID10: ${paciente.cid10_cronico}` : ''}
                                ${!paciente.ciap_cronico && !paciente.cid10_cronico ? 'N/A' : ''}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">A definir</td> <!-- Próxima Ação - Data não disponível na API atual -->
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
            currentPage = 1; fetchPacientesHiperdia();
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
                    microareaSelecionadaAtual = displayText; // Armazena "Área X - Agente Y" ou "Área X"
                    if (microareaDropdown) microareaDropdown.classList.add('hidden');
                    currentPage = 1; fetchPacientesHiperdia();
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
                    currentPage = 1; fetchPacientesHiperdia();
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
                            currentPage = 1; fetchPacientesHiperdia();
                        });
                        equipeDropdownContent.appendChild(option);
                    });
                }
            })
            .catch(error => console.error('Erro de rede ao buscar equipes/microáreas para Hiperdia:', error));
    }

    // --- Event Listeners ---
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
    fetchPacientesHiperdia(); // Carga inicial
    fetchTotalHipertensos();
});