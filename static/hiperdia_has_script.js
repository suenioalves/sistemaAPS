document.addEventListener('DOMContentLoaded', function () {
    // --- Seletores de Elementos ---
    const equipeButton = document.getElementById('hiperdia-equipe-button'); // Atualize os IDs no seu HTML
    const equipeButtonText = document.getElementById('hiperdia-equipe-button-text');
    const equipeDropdown = document.getElementById('hiperdia-equipe-dropdown');
    const equipeDropdownContent = document.getElementById('hiperdia-equipe-dropdown-content');

    const microareaButton = document.getElementById('hiperdia-microarea-button');
    const microareaButtonText = document.getElementById('hiperdia-microarea-button-text');
    const microareaDropdown = document.getElementById('hiperdia-microarea-dropdown');
    const microareaDropdownContent = document.getElementById('hiperdia-microarea-dropdown-content');

    const tabelaPacientesBody = document.getElementById('hiperdia-tabela-pacientes-body');
    const paginationContainer = document.getElementById('hiperdia-pagination-container');
    const paginationInfo = document.getElementById('hiperdia-pagination-info');
    const searchInput = document.getElementById('hiperdia-search-input');
    const acompanhamentoHipertensosTitle = document.getElementById('acompanhamentoHipertensosTitle'); // Crie este elemento no HTML

    // --- Variáveis de Estado ---
    let todasEquipesComMicroareas = [];
    let equipeSelecionadaAtual = 'Todas';
    let microareaSelecionadaAtual = 'Todas';
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
        if (equipeSelecionadaAtual !== 'Todas') {
            title += ` - Equipe: ${equipeSelecionadaAtual}`;
            if (microareaSelecionadaAtual !== 'Todas') {
                title += ` - Microárea: ${microareaSelecionadaAtual}`;
            }
        }
        acompanhamentoHipertensosTitle.textContent = title;
    }

    function fetchPacientesHiperdia() {
        if (!tabelaPacientesBody) return;
        tabelaPacientesBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">Carregando...</td></tr>`; // Ajuste colspan conforme as colunas

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
                    data.pacientes.forEach(paciente => {
                        const row = tabelaPacientesBody.insertRow();
                        row.className = 'hover:bg-gray-50';
                        // Adapte as colunas conforme os dados da mv_hiperdia_hipertensao
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente || 'N/A'}</div>
                                <div class="text-xs text-gray-500">CNS: ${paciente.cartao_sus || 'N/A'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.idade_calculada || 'N/A'} anos</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.dt_nascimento || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.nome_equipe || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.microarea || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.ciap_cronico || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.cid10_cronico || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${paciente.situacao_problema || 'N/A'}</td>
                            <!-- Adicione mais colunas conforme necessário -->
                        `;
                    });
                } else {
                    tabelaPacientesBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">Nenhum paciente encontrado.</td></tr>`;
                }
                renderPaginacaoHiperdia(data.total, data.page, data.limit, data.pages);
                updateAcompanhamentoTitle();
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes com hipertensão:', error);
                tabelaPacientesBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>`;
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

    function popularDropdownMicroareasHiperdia(microareas) {
        // Implementação similar à popularDropdownAgentes do plafam_script.js
        // mas usando 'microareas' diretamente.
        if (!microareaDropdownContent || !microareaButtonText) return;
        microareaDropdownContent.innerHTML = '';
        const todasOption = document.createElement('div');
        todasOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
        todasOption.textContent = 'Todas as Microáreas';
        todasOption.addEventListener('click', () => {
            microareaButtonText.textContent = 'Todas as Microáreas';
            microareaSelecionadaAtual = 'Todas';
            if (microareaDropdown) microareaDropdown.classList.add('hidden');
            currentPage = 1; fetchPacientesHiperdia();
        });
        microareaDropdownContent.appendChild(todasOption);

        if (microareas && microareas.length > 0) {
            microareas.forEach(ma => {
                const option = document.createElement('div');
                option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                option.textContent = `Microárea ${ma}`;
                option.addEventListener('click', () => {
                    microareaButtonText.textContent = `Microárea ${ma}`;
                    microareaSelecionadaAtual = ma;
                    if (microareaDropdown) microareaDropdown.classList.add('hidden');
                    currentPage = 1; fetchPacientesHiperdia();
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
                    popularDropdownMicroareasHiperdia([]);
                    if (microareaButtonText) microareaButtonText.textContent = 'Todas as Microáreas';
                    microareaSelecionadaAtual = 'Todas';
                    currentPage = 1; fetchPacientesHiperdia();
                });
                equipeDropdownContent.appendChild(todasEquipesOption);

                todasEquipesComMicroareas.forEach(equipe => {
                    const option = document.createElement('div');
                    option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                    option.textContent = `${equipe.nome_equipe} (${equipe.num_pacientes || 0})`;
                    option.addEventListener('click', () => {
                        equipeButtonText.textContent = equipe.nome_equipe;
                        equipeSelecionadaAtual = equipe.nome_equipe;
                        if (equipeDropdown) equipeDropdown.classList.add('hidden');
                        popularDropdownMicroareasHiperdia(equipe.microareas);
                        if (microareaButtonText) microareaButtonText.textContent = 'Todas as Microáreas';
                        microareaSelecionadaAtual = 'Todas';
                        currentPage = 1; fetchPacientesHiperdia();
                    });
                    equipeDropdownContent.appendChild(option);
                });
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
});