document.addEventListener('DOMContentLoaded', function () {
    const teamTabsContainer = document.getElementById('team-tabs-container');
    const tabelaPacientesBody = document.getElementById('tabela-pacientes-body');
    const paginationContainer = document.getElementById('pagination-container');

    // Botões de rolagem
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');

    let activeTeam = 'Todas';
    let currentPage = 1;

    // Função para controlar a visibilidade das setas de rolagem
    function checkScrollButtons() {
        const container = teamTabsContainer.querySelector('.scrollbar-hide');
        if (container) {
            const { scrollWidth, clientWidth, scrollLeft } = container;
            scrollLeftBtn.classList.toggle('hidden', scrollLeft <= 0);
            scrollRightBtn.classList.toggle('hidden', scrollLeft >= scrollWidth - clientWidth - 1);
        }
    }

    function setupScrollButtons() {
        const container = teamTabsContainer.querySelector('.scrollbar-hide');
        if (container) {
            scrollLeftBtn.addEventListener('click', () => {
                container.scrollBy({ left: -200, behavior: 'smooth' });
            });
            scrollRightBtn.addEventListener('click', () => {
                container.scrollBy({ left: 200, behavior: 'smooth' });
            });
            container.addEventListener('scroll', checkScrollButtons);
            checkScrollButtons();
            setTimeout(checkScrollButtons, 500);
        }
    }

    function fetchEquipes() {
        fetch('/api/equipes')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const equipes = data;
                    const tabsHtml = `
                        <div class="flex items-center space-x-1 overflow-x-auto pb-2 flex-grow scrollbar-hide" style="scroll-snap-type: x mandatory;">
                            <button class="team-tab px-4 py-2 text-sm font-medium whitespace-nowrap" data-equipe="Todas" style="scroll-snap-align: start;">Todas as Equipes</button>
                            ${equipes.map(equipe => `
                                <button class="team-tab px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap" data-equipe="${equipe}" style="scroll-snap-align: start;">${equipe}</button>
                            `).join('')}
                        </div>
                    `;
                    teamTabsContainer.innerHTML = tabsHtml;
                    setActiveTab('Todas');

                    document.querySelectorAll('.team-tab').forEach(tab => {
                        tab.addEventListener('click', () => {
                            activeTeam = tab.dataset.equipe;
                            currentPage = 1;
                            fetchPacientes(activeTeam, currentPage);
                            setActiveTab(activeTeam);
                        });
                    });

                    setupScrollButtons();
                } else {
                    console.error('Erro ao buscar equipes:', data.erro || 'Resposta inválida da API');
                }
            })
            .catch(error => console.error('Erro de rede ao buscar equipes:', error));
    }

    function setActiveTab(equipeName) {
        document.querySelectorAll('.team-tab').forEach(tab => {
            if (tab.dataset.equipe === equipeName) {
                tab.classList.add('text-primary', 'border-primary');
                tab.classList.remove('text-gray-500', 'border-transparent', 'hover:border-gray-300');
            } else {
                tab.classList.remove('text-primary', 'border-primary');
                tab.classList.add('text-gray-500', 'border-transparent', 'hover:border-gray-300');
            }
        });
    }

    function fetchPacientes(equipe, page) {
        tabelaPacientesBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Carregando...</td></tr>';

        fetch(`/api/pacientes_plafam?equipe=${equipe}&page=${page}`)
            .then(response => response.json())
            .then(data => {
                tabelaPacientesBody.innerHTML = '';
                if (data.pacientes && data.pacientes.length > 0) {
                    data.pacientes.forEach(paciente => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente || ''}</div>
                                        <div class="text-xs text-gray-500">Cartão SUS: ${paciente.cartao_sus || ''}</div>
                                        <div class="text-xs text-gray-500">micro-área: ${paciente.micro_area || ''}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">${paciente.idade_calculada !== null ? paciente.idade_calculada + ' anos' : ''}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="method-badge">${paciente.metodo || ''}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap"></td>
                            <td class="px-6 py-4 whitespace-nowrap"></td>
                            <td class="px-6 py-4 whitespace-nowrap"></td>
                        `;
                        tabelaPacientesBody.appendChild(row);
                    });
                } else {
                    tabelaPacientesBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhum paciente encontrado.</td></tr>';
                }
                renderPagination(data.total, data.page, data.limit, data.pages);
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes:', error);
                tabelaPacientesBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>';
            });
    }

    function createPaginationLogic(currentPage, totalPages) {
        let pages = [];
        const maxPagesToShow = 5; // Total de números de página a exibir (excluindo '...')
        const halfPages = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) { // Mostra todos os números se forem poucos
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1); // Sempre mostra a primeira página

            let startPage = Math.max(2, currentPage - halfPages);
            let endPage = Math.min(totalPages - 1, currentPage + halfPages);

            if (currentPage - halfPages <= 2) {
                endPage = maxPagesToShow;
            }
            if (currentPage + halfPages >= totalPages - 1) {
                startPage = totalPages - maxPagesToShow + 1;
            }

            if (startPage > 2) {
                pages.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            pages.push(totalPages); // Sempre mostra a última página
        }
        return pages;
    }

    function renderPagination(total, page, limit, pages) {
        if (!total || pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        let paginationHtml = `
            <div class="text-sm text-gray-700">
                Mostrando <span class="font-medium">${start}</span> a <span class="font-medium">${end}</span> de <span class="font-medium">${total}</span> resultados
            </div>
            <div class="flex items-center space-x-1">
        `;

        paginationHtml += `<button class="pagination-button ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="ri-arrow-left-s-line"></i></button>`;

        const pagesToShow = createPaginationLogic(page, pages);

        pagesToShow.forEach(p => {
            if (p === '...') {
                paginationHtml += `<span class="pagination-button">...</span>`;
            } else {
                paginationHtml += `<button class="pagination-button ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
            }
        });

        paginationHtml += `<button class="pagination-button ${page === pages ? 'opacity-50 cursor-not-allowed' : ''}" ${page === pages ? 'disabled' : ''} data-page="${page + 1}"><i class="ri-arrow-right-s-line"></i></button>`;

        paginationHtml += '</div>';
        paginationContainer.innerHTML = paginationHtml;

        document.querySelectorAll('.pagination-button').forEach(button => {
            if (button.dataset.page) {
                button.addEventListener('click', () => {
                    const newPage = parseInt(button.dataset.page);
                    if (newPage && newPage !== currentPage && !button.disabled) {
                        currentPage = newPage;
                        fetchPacientes(activeTeam, currentPage);
                    }
                });
            }
        });
    }

    fetchEquipes();
    fetchPacientes(activeTeam, currentPage);

    window.addEventListener('resize', checkScrollButtons);
});