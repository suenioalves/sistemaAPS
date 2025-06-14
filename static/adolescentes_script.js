document.addEventListener('DOMContentLoaded', function () {
    // Elementos do Painel de Controle
    const equipeButton = document.getElementById('equipeButton');
    const equipeButtonText = document.getElementById('equipeButtonText');
    const equipeDropdown = document.getElementById('equipeDropdown');
    const equipeDropdownContent = document.getElementById('equipeDropdownContent');

    const microareaButton = document.getElementById('microareaButton');
    const microareaButtonText = document.getElementById('microareaButtonText');
    const microareaDropdown = document.getElementById('microareaDropdown');
    const microareaDropdownContent = document.getElementById('microareaDropdownContent');

    const nomeEquipeSelecionadaDisplay = document.getElementById('nomeEquipeSelecionadaDisplay');

    // Elementos dos Cards de Estatísticas
    const totalAdolescentesValor = document.getElementById('totalAdolescentesValor');
    const visitasSemanaValor = document.getElementById('visitasSemanaValor');
    const labelEquipeCardAdolescentes = document.getElementById('labelEquipeCardAdolescentes');
    const labelEquipeCardVisitasSemana = document.getElementById('labelEquipeCardVisitasSemana');
    const adolescentesSemMetodoValor = document.getElementById('adolescentesSemMetodoValor');
    const labelEquipeCardSemMetodo = document.getElementById('labelEquipeCardSemMetodo');
    const adolescentesMetodoAtrasadoValor = document.getElementById('adolescentesMetodoAtrasadoValor');
    const labelEquipeCardMetodoAtrasado = document.getElementById('labelEquipeCardMetodoAtrasado');

    let todasEquipesComAgentes = [];
    let equipeSelecionadaAtual = 'Todas';
    let agenteSelecionadoAtual = 'Todas as áreas';

    // --- Elementos da Tabela de Timeline ---
    const timelineTableBody = document.getElementById('timeline-table-body');
    const timelinePaginationInfo = document.getElementById('timeline-pagination-info');
    const timelinePaginationContainer = document.getElementById('timeline-pagination-container');
    const searchTimelineInput = document.getElementById('search-timeline-input');
    const timelineStatusFilterButtons = document.querySelectorAll('.timeline-status-filter-btn');
    const timelineSortBtn = document.getElementById('timeline-sort-btn');
    const timelineSortBtnText = document.getElementById('timeline-sort-btn-text');
    const timelineSortDropdown = document.getElementById('timeline-sort-dropdown');
    const timelineSortOptions = document.querySelectorAll('.timeline-sort-option');
    let currentTimelinePage = 1;
    let currentTimelineSearch = '';
    let currentTimelineStatusFilter = 'Todos'; // 'Todos', 'SemMetodo', 'MetodoVencido'
    let currentTimelineSort = 'nome_asc';
    let currentFetchedTimelineAdolescents = []; // Cache for adolescents on the currently displayed timeline page

    // --- Elementos dos Modais ---
    const timelineModal = document.getElementById('timelineModal');
    const timelineModalTitle = timelineModal ? timelineModal.querySelector('h3') : null; // Ex: Linha do Tempo - Juliana Costa
    const timelineModalAdolescenteNome = timelineModal ? timelineModal.querySelector('#timelineModalAdolescenteNome') : null; // Adicionar este ID no HTML
    const timelineModalAdolescenteIdade = timelineModal ? timelineModal.querySelector('#timelineModalAdolescenteIdade') : null; // Adicionar este ID
    const timelineModalMicroarea = timelineModal ? timelineModal.querySelector('#timelineModalMicroarea') : null; // Adicionar este ID
    const timelineModalEquipe = timelineModal ? timelineModal.querySelector('#timelineModalEquipe') : null; // Adicionar este ID
    const timelineModalStatus = timelineModal ? timelineModal.querySelector('#timelineModalStatus') : null; // Adicionar este ID
    const timelineModalProximaAcao = timelineModal ? timelineModal.querySelector('#timelineModalProximaAcao') : null; // Adicionar este ID
    const timelineModalAvatarIniciais = timelineModal ? timelineModal.querySelector('#timelineModalAvatarIniciais') : null; // Adicionar este ID
    const timelineModalContent = timelineModal ? timelineModal.querySelector('#timelineModalContentArea') : null; // Adicionar ID à área de conteúdo da timeline
    const closeTimelineModalBtn = document.getElementById('closeTimelineModal');
    const closeTimelineModalFooterBtn = document.getElementById('closeTimelineModalBtn');
    const timelineRegisterBtn = document.getElementById('timelineRegisterBtn');

    const registerModal = document.getElementById('registerModal');
    const registerModalTitle = registerModal ? registerModal.querySelector('h3') : null;
    const closeRegisterModalBtn = document.getElementById('closeRegisterModal');
    const cancelRegisterModalFooterBtn = document.getElementById('cancelRegisterBtn');
    const saveRegisterModalBtn = registerModal ? registerModal.querySelector('button.bg-primary') : null; // Botão Salvar Registro
    let currentAdolescenteForModal = null; // Para guardar a adolescente selecionada

    // Função para controlar dropdowns
    function setupDropdown(button, dropdown) {
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            // Fecha outros dropdowns
            document.querySelectorAll('.dropdown-menu.absolute').forEach(d => {
                if (d !== dropdown) d.classList.add('hidden');
            });
            dropdown.classList.toggle('hidden');
        });
    }

    setupDropdown(equipeButton, equipeDropdown);
    setupDropdown(microareaButton, microareaDropdown);

    // Fecha dropdowns se clicar fora
    document.addEventListener('click', function (e) {
        if (!equipeButton.contains(e.target) && !equipeDropdown.contains(e.target)) {
            equipeDropdown.classList.add('hidden');
        }
        if (!microareaButton.contains(e.target) && !microareaDropdown.contains(e.target)) {
            microareaDropdown.classList.add('hidden');
        }
    });

    function atualizarLabelsDosCards() {
        let textoLabelEquipeBase = "Todas as Equipes";
        if (equipeSelecionadaAtual === 'Todas') {
            textoLabelEquipeBase = "Todas as Equipes";
        } else {
            if (agenteSelecionadoAtual === 'Todas as áreas') {
                textoLabelEquipeBase = `Equipe ${equipeSelecionadaAtual}`;
            } else {
                textoLabelEquipeBase = `Equipe ${equipeSelecionadaAtual} - ${agenteSelecionadoAtual}`;
            }
        }

        labelEquipeCardAdolescentes.textContent = textoLabelEquipeBase;
        labelEquipeCardSemMetodo.textContent = textoLabelEquipeBase;
        labelEquipeCardMetodoAtrasado.textContent = textoLabelEquipeBase;

        // Card Visitas/semana (mostra apenas a equipe, mesmo se agente selecionado)
        let textoLabelEquipeVisitas = "Todas as Equipes";
        if (equipeSelecionadaAtual === 'Todas') {
            textoLabelEquipeVisitas = "Todas as Equipes";
        } else {
            textoLabelEquipeVisitas = `Equipe ${equipeSelecionadaAtual}`;
        }
        labelEquipeCardVisitasSemana.textContent = textoLabelEquipeVisitas;

        // Se os cards não tiverem equipe selecionada (ex: ao carregar "Todas as equipes")
        // os valores numéricos são para o geral.
        // Se uma equipe for selecionada, os valores são para aquela equipe/agente.
    }

    function fetchEstatisticas() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            agente_selecionado: agenteSelecionadoAtual
        });
        // console.log("Fetching stats with params:", params.toString());

        fetch(`/api/estatisticas_painel_adolescentes?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    console.error('Erro ao buscar estatísticas:', data.erro);
                    totalAdolescentesValor.textContent = '-';
                    visitasSemanaValor.textContent = '-';
                    adolescentesSemMetodoValor.textContent = '-';
                    adolescentesMetodoAtrasadoValor.textContent = '-';
                    return;
                }
                totalAdolescentesValor.textContent = data.total_adolescentes !== undefined ? data.total_adolescentes : '-';
                visitasSemanaValor.textContent = data.visitas_semana_media !== undefined ? data.visitas_semana_media : '-';
                adolescentesSemMetodoValor.textContent = data.adolescentes_sem_metodo !== undefined ? data.adolescentes_sem_metodo : '-';
                adolescentesMetodoAtrasadoValor.textContent = data.adolescentes_com_metodo_atrasado !== undefined ? data.adolescentes_com_metodo_atrasado : '-';
            })
            .finally(atualizarLabelsDosCards) // Atualiza os labels após buscar as estatísticas
            .catch(error => {
                console.error('Erro de rede ao buscar estatísticas:', error);
                totalAdolescentesValor.textContent = 'Erro';
                visitasSemanaValor.textContent = 'Erro';
                adolescentesSemMetodoValor.textContent = 'Erro';
                adolescentesMetodoAtrasadoValor.textContent = 'Erro';
            });
    }

    function popularDropdownAgentes(agentes) {
        microareaDropdownContent.innerHTML = ''; // Limpa opções anteriores

        // Opção "Todas as áreas"
        const todasAgenciasOption = document.createElement('div');
        todasAgenciasOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
        todasAgenciasOption.textContent = 'Todas as áreas';
        todasAgenciasOption.addEventListener('click', () => {
            microareaButtonText.textContent = 'Todas as áreas';
            agenteSelecionadoAtual = 'Todas as áreas';
            microareaDropdown.classList.add('hidden');
            fetchEstatisticas();
            fetchTimelineData(); // Atualiza a tabela da timeline
        });
        microareaDropdownContent.appendChild(todasAgenciasOption);

        if (agentes && agentes.length > 0) {
            agentes.forEach(agente => {
                const option = document.createElement('div');
                option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                const displayText = `Área ${agente.micro_area} - ${agente.nome_agente}`;
                option.textContent = displayText;
                option.addEventListener('click', () => {
                    microareaButtonText.textContent = displayText;
                    agenteSelecionadoAtual = displayText; // Envia "Área MA - Agente NOME"
                    microareaDropdown.classList.add('hidden');
                    fetchEstatisticas();
                    fetchTimelineData(); // Atualiza a tabela da timeline
                });
                microareaDropdownContent.appendChild(option);
            });
        } else {
            microareaButtonText.textContent = 'Nenhuma área/agente';
        }
    }

    function fetchEquipesEAgentes() {
        fetch('/api/equipes_com_agentes_adolescentes')
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    console.error('Erro ao buscar equipes e agentes:', data.erro);
                    return;
                }
                todasEquipesComAgentes = data;
                equipeDropdownContent.innerHTML = ''; // Limpa

                // Opção "Todas as equipes"
                const todasEquipesOption = document.createElement('div');
                todasEquipesOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                todasEquipesOption.textContent = 'Todas as equipes';
                todasEquipesOption.addEventListener('click', () => {
                    equipeButtonText.textContent = 'Todas as equipes';
                    nomeEquipeSelecionadaDisplay.textContent = 'Todas as Equipes';
                    equipeSelecionadaAtual = 'Todas';
                    equipeDropdown.classList.add('hidden');
                    popularDropdownAgentes([]); // Limpa agentes ou mostra "Todas as áreas"
                    microareaButtonText.textContent = 'Todas as áreas'; // Reset agente dropdown
                    agenteSelecionadoAtual = 'Todas as áreas';
                    fetchEstatisticas();
                    fetchTimelineData(); // Atualiza a tabela da timeline
                });
                equipeDropdownContent.appendChild(todasEquipesOption);

                todasEquipesComAgentes.forEach(equipe => {
                    const option = document.createElement('div');
                    option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                    option.textContent = equipe.nome_equipe;
                    option.addEventListener('click', () => {
                        equipeButtonText.textContent = equipe.nome_equipe;
                        nomeEquipeSelecionadaDisplay.textContent = `Equipe ${equipe.nome_equipe}`;
                        equipeSelecionadaAtual = equipe.nome_equipe;
                        equipeDropdown.classList.add('hidden');
                        popularDropdownAgentes(equipe.agentes);
                        microareaButtonText.textContent = 'Todas as áreas'; // Reset agente dropdown
                        agenteSelecionadoAtual = 'Todas as áreas';
                        fetchEstatisticas(); // Busca estatísticas para a equipe (todos os agentes)
                        fetchTimelineData(); // Atualiza a tabela da timeline
                    });
                    equipeDropdownContent.appendChild(option);
                });

                // Carrega estatísticas iniciais para "Todas as equipes"
                fetchEstatisticas();
            })
            .catch(error => console.error('Erro de rede ao buscar equipes e agentes:', error));
    }

    // --- Funções para a Tabela de Timeline ---

    function getTimelineMetodoStatusContent(ado) {
        let metodoTexto = ado.metodo || 'Sem método';
        let statusTexto = '';
        let statusClass = 'text-gray-600';

        if (ado.status_gravidez === 'Grávida') {
            metodoTexto = 'GESTANTE';
            statusTexto = ado.data_provavel_parto ? `DPP: ${ado.data_provavel_parto}` : 'DPP não informada';
            statusClass = 'text-pink-600 font-semibold';
        } else if (!ado.metodo) {
            statusTexto = 'Não utiliza método contraceptivo.';
            statusClass = 'text-yellow-700';
        } else if (ado.data_aplicacao) {
            const dataAplicacao = new Date(ado.data_aplicacao + 'T00:00:00'); // Considerar como data local
            const hoje = new Date();
            hoje.setHours(0,0,0,0); // Normalizar hoje para meia-noite para comparação de dias
            
            let limiteDias = Infinity;
            const metodoLower = ado.metodo.toLowerCase();

            if (metodoLower.includes('mensal') || metodoLower.includes('pílula')) limiteDias = 30;
            else if (metodoLower.includes('trimestral')) limiteDias = 90;

            const dataVencimento = new Date(dataAplicacao);
            dataVencimento.setDate(dataVencimento.getDate() + limiteDias);

            const dataAplicacaoFormatada = dataAplicacao.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

            if (limiteDias !== Infinity) { // Métodos com data de vencimento clara
                if (hoje >= dataVencimento) {
                    statusTexto = `Vencido desde: ${dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
                    statusClass = 'text-red-600 font-semibold';
                } else {
                    statusTexto = `Em dia - Próx. dose/venc: ${dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
                    statusClass = 'text-green-600';
                }
            } else { // Métodos de longa duração sem data de vencimento clara (DIU, Implante, Laqueadura)
                statusTexto = `Em uso desde: ${dataAplicacaoFormatada}`;
                statusClass = 'text-green-600';
            }
        } else { // Tem método mas não tem data de aplicação (pode acontecer se o dado for inconsistente)
            statusTexto = 'Data de aplicação não informada.';
            statusClass = 'text-gray-500';
        }

        return `
            <div class="text-sm font-medium text-gray-900">${metodoTexto}</div>
            <div class="text-xs ${statusClass}">${statusTexto}</div>
        `;
    }

    function renderTimelineTable(data) {
        timelineTableBody.innerHTML = '';
        if (!data || !data.adolescentes || data.adolescentes.length === 0) {
            timelineTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhuma adolescente encontrada.</td></tr>`;
            renderTimelinePagination(0, 1, 5, 0);
            return;
        }

        data.adolescentes.forEach(ado => {
            const row = timelineTableBody.insertRow();
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${ado.nome_paciente || 'N/A'}</div>
                    <div class="text-xs text-gray-500">CNS: ${ado.cartao_sus || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ado.idade_calculada || 'N/A'} anos</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${ado.nome_equipe || 'N/A'}</div>
                    <div class="text-xs text-gray-500">${ado.nome_agente || `Microárea ${ado.microarea || 'N/A'}`}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${getTimelineMetodoStatusContent(ado)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${ado.proxima_acao_data || 'A definir'} <br>
                    <span class="text-xs">${ado.proxima_acao_tipo || ''}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="timeline-ver-detalhes-btn text-primary hover:text-indigo-700 !rounded-button whitespace-nowrap" 
                            data-cod-paciente="${ado.cod_paciente}"
                            data-nome-paciente="${ado.nome_paciente || ''}">
                        Ver detalhes</button>
                </td>
            `;
        });
        renderTimelinePagination(data.total, data.page, data.limit, data.pages);
    }

    // Função para criar a lógica de quais páginas mostrar (adaptada de plafam_script.js)
    function createTimelinePaginationLogic(currentPage, totalPages) {
        let pages = [];
        const maxPagesToShow = 5; // Máximo de botões numéricos

        if (totalPages <= maxPagesToShow + 2) { // Se for 7 ou menos, mostra todos os números
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1); // Sempre mostra a primeira página
            if (currentPage > 3) {
                pages.push('...');
            }

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            pages.push(totalPages); // Sempre mostra a última página
        }
        return pages;
    }

    function renderTimelinePagination(total, page, limit, totalPages) {
        timelinePaginationInfo.innerHTML = '';
        timelinePaginationContainer.innerHTML = '';

        if (!total || totalPages <= 0) return;

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        timelinePaginationInfo.innerHTML = `Mostrando <span class="font-medium">${start}</span> a <span class="font-medium">${end}</span> de <span class="font-medium">${total}</span> resultados`;

        let paginationHtml = '';
        // Botão Anterior
        paginationHtml += `<button data-page="${page - 1}" class="timeline-page-btn px-3 py-1 border border-gray-300 text-sm rounded-md ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" ${page === 1 ? 'disabled' : ''}>Anterior</button>`;

        const pagesToShow = createTimelinePaginationLogic(page, totalPages);

        pagesToShow.forEach(p => {
            if (p === '...') {
                paginationHtml += `<span class="timeline-page-btn px-3 py-1 border-none text-sm rounded-md opacity-50 cursor-default">...</span>`;
            } else if (p === page) {
                paginationHtml += `<button data-page="${p}" class="timeline-page-btn px-3 py-1 border border-primary bg-primary text-white text-sm rounded-md">${p}</button>`;
            } else {
                paginationHtml += `<button data-page="${p}" class="timeline-page-btn px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-100">${p}</button>`;
            }
        });
        // Botão Próximo
        paginationHtml += `<button data-page="${page + 1}" class="timeline-page-btn px-3 py-1 border border-gray-300 text-sm rounded-md ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" ${page === totalPages ? 'disabled' : ''}>Próximo</button>`;
        
        timelinePaginationContainer.innerHTML = paginationHtml;

        document.querySelectorAll('.timeline-page-btn').forEach(button => {
            button.addEventListener('click', function() {
                if (this.disabled || this.dataset.page === undefined) return; // Ignora reticências e botões desabilitados
                currentTimelinePage = parseInt(this.dataset.page);
                fetchTimelineData();
            });
        });
    }

    function fetchTimelineData() {
        timelineTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Carregando...</td></tr>`;
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            agente_selecionado: agenteSelecionadoAtual,
            page_timeline: currentTimelinePage,
            search_timeline: currentTimelineSearch,
            status_timeline: currentTimelineStatusFilter,
            sort_by_timeline: currentTimelineSort
        });

        fetch(`/api/timeline_adolescentes?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if(data.erro) {
                    console.error("Erro ao buscar dados da timeline:", data.erro);
                    timelineTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>`;
                    renderTimelinePagination(0,1,5,0);
                    return;
                }
                currentFetchedTimelineAdolescents = data.adolescentes || []; // Update cache
                renderTimelineTable(data);
            })
            .catch(error => {
                // Limpar a tabela e a paginação em caso de erro de rede
                if (timelineTableBody) {
                    timelineTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Erro de comunicação ao carregar dados.</td></tr>`;
                }
                if (timelinePaginationInfo) timelinePaginationInfo.innerHTML = '';
                if (timelinePaginationContainer) timelinePaginationContainer.innerHTML = '';

                currentFetchedTimelineAdolescents = []; // Clear cache on error

                console.error('Erro de rede ao buscar dados da timeline:', error);
                timelineTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Erro de comunicação.</td></tr>`;
                renderTimelinePagination(0,1,5,0);
            });
    }


    // --- Funções para os Modais Dinâmicos ---
    function getIniciais(nome) {
        if (!nome) return 'N/A';
        const partes = nome.split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    async function abrirModalTimeline(codPaciente) {
        // Idealmente, buscar dados completos da adolescente, incluindo histórico
        // fetch(`/api/detalhes_adolescente/${codPaciente}`) ...
        // Por agora, vamos usar os dados que já temos na tabela e o cache da página atual.

        // Try to find in the cache of the currently displayed timeline page first
        let adoDetalhes = currentFetchedTimelineAdolescents.find(a => String(a.cod_paciente) === String(codPaciente));

        if (!adoDetalhes) {
            // If not found in the current page's cache, then try the fallback.
            // This might happen if the click event is somehow stale or data is inconsistent.
            // The warning is still relevant here.
            console.warn("Adolescente não encontrado na cache da página atual da timeline, tentando fallback para a API (re-fetch da página atual)...");
            // ou ter uma API /api/adolescente_detalhes/<cod_paciente>
            // Por ora, se não achar, não abre o modal ou mostra erro.
            // Para este exemplo, vamos assumir que os dados da tabela são suficientes para o cabeçalho do modal.
            // E que a timeline de eventos viria de outra chamada.
            
            // Tentativa de encontrar na última leva de dados da timeline
            const params = new URLSearchParams({
                equipe: equipeSelecionadaAtual,
                agente_selecionado: agenteSelecionadoAtual,
                page_timeline: currentTimelinePage, // ou 1 se quiser buscar sempre
                search_timeline: '', // Limpa busca para tentar achar pelo ID
                status_timeline: 'Todos',
                sort_by_timeline: 'nome_asc'
            });
            try {
                const response = await fetch(`/api/timeline_adolescentes?${params.toString()}`);
                const data = await response.json();
                if (data.adolescentes) {
                    adoDetalhes = data.adolescentes.find(a => String(a.cod_paciente) === String(codPaciente));
                }
            } catch (error) {
                console.error("Erro ao tentar buscar detalhes do adolescente via fallback:", error);
            }
        }

        if (!adoDetalhes) {
            // If still not found after cache and fallback
            alert("Não foi possível carregar os detalhes da adolescente.");
            return;
        }
        currentAdolescenteForModal = adoDetalhes; // Guarda para o modal de registro

        if (timelineModalTitle) timelineModalTitle.textContent = `Linha do Tempo - ${adoDetalhes.nome_paciente || 'Desconhecida'}`;
        if (timelineModalAvatarIniciais) timelineModalAvatarIniciais.textContent = getIniciais(adoDetalhes.nome_paciente);
        if (timelineModalAdolescenteNome) timelineModalAdolescenteNome.textContent = adoDetalhes.nome_paciente || 'N/A';
        if (timelineModalAdolescenteIdade) timelineModalAdolescenteIdade.textContent = `${adoDetalhes.idade_calculada || 'N/A'} anos`;
        if (timelineModalMicroarea) timelineModalMicroarea.textContent = adoDetalhes.microarea || 'N/A';
        if (timelineModalEquipe) timelineModalEquipe.textContent = adoDetalhes.nome_equipe || 'N/A';
        
        // Status e Próxima Ação (simplificado, idealmente viria de dados mais detalhados)
        const statusContent = getTimelineMetodoStatusContent(adoDetalhes); // Reutiliza a função
        if (timelineModalStatus) timelineModalStatus.innerHTML = statusContent.split('<div class="text-xs')[0]; // Pega só a parte principal do status
        if (timelineModalProximaAcao) timelineModalProximaAcao.textContent = adoDetalhes.proxima_acao_data || 'A definir'; // Placeholder

        // Popular a área da linha do tempo (timelineModalContentArea)
        // Esta parte é complexa e depende de como você quer buscar e renderizar o histórico.
        // Por enquanto, vamos deixar o conteúdo estático do HTML ou limpar.
        if (timelineModalContent) {
            // timelineModalContent.innerHTML = '<p class="text-center text-gray-500">Histórico de acompanhamento será carregado aqui...</p>';
            // Ou, para manter o estático por enquanto:
            // console.log("Mantendo conteúdo estático da linha do tempo por enquanto.");
        }

        if (timelineModal) timelineModal.classList.remove('hidden');
    }

    function abrirModalRegistro() {
        if (!currentAdolescenteForModal) {
            alert("Nenhuma adolescente selecionada para registrar ação.");
            return;
        }
        if (registerModalTitle) registerModalTitle.textContent = `Registrar Nova Ação - ${currentAdolescenteForModal.nome_paciente || 'Desconhecida'}`;
        // Limpar campos do formulário de registro aqui, se necessário
        if (registerModal) registerModal.classList.remove('hidden');
        if (timelineModal) timelineModal.classList.add('hidden'); // Fecha o modal da timeline
    }

    // Inicialização
    fetchEquipesEAgentes();
    fetchTimelineData(); // Carrega dados da timeline na inicialização
    // A primeira chamada a fetchEstatisticas (dentro de fetchEquipesEAgentes) já vai chamar atualizarLabelsDosCards.


    // --- Event Listeners para a Tabela de Timeline ---
    if (searchTimelineInput) {
        searchTimelineInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                currentTimelineSearch = this.value;
                currentTimelinePage = 1;
                fetchTimelineData();
            }
        });
    }

    timelineStatusFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Define o botão clicado como ativo e os outros como inativos
            timelineStatusFilterButtons.forEach(btn => {
                if (btn === this) {
                    btn.className = `timeline-status-filter-btn py-1 px-3 rounded-full text-sm !rounded-button whitespace-nowrap ${this.dataset.activeClass}`;
                } else {
                    btn.className = `timeline-status-filter-btn py-1 px-3 rounded-full text-sm !rounded-button whitespace-nowrap ${btn.dataset.inactiveClass}`;
                }
            });
            
            currentTimelineStatusFilter = this.dataset.statusFilter;
            currentTimelinePage = 1;
            fetchTimelineData();
        });
    });

    if (timelineSortBtn) {
        timelineSortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            timelineSortDropdown.classList.toggle('hidden');
        });
    }

    timelineSortOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            currentTimelineSort = e.currentTarget.dataset.sort;
            timelineSortBtnText.textContent = e.currentTarget.dataset.text;
            currentTimelinePage = 1;
            fetchTimelineData();
            timelineSortDropdown.classList.add('hidden');
        });
    });

    // Fechar dropdown de ordenação da timeline
    document.addEventListener('click', function (e) {
        if (timelineSortBtn && !timelineSortBtn.contains(e.target) && timelineSortDropdown && !timelineSortDropdown.contains(e.target)) {
            timelineSortDropdown.classList.add('hidden');
        }
    });

    // Event listener para os botões "Ver detalhes" na tabela da timeline
    timelineTableBody.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('timeline-ver-detalhes-btn') || target.closest('.timeline-ver-detalhes-btn')) {
            const button = target.classList.contains('timeline-ver-detalhes-btn') ? target : target.closest('.timeline-ver-detalhes-btn');
            const codPaciente = button.dataset.codPaciente;
            if (codPaciente) {
                abrirModalTimeline(codPaciente);
            }
        }
    });

    // --- Event Listeners para os Modais ---
    if (closeTimelineModalBtn) {
        closeTimelineModalBtn.addEventListener('click', () => timelineModal.classList.add('hidden'));
    }
    if (closeTimelineModalFooterBtn) {
        closeTimelineModalFooterBtn.addEventListener('click', () => timelineModal.classList.add('hidden'));
    }
    if (timelineRegisterBtn) { // Botão "Registrar ação" DENTRO do modal da timeline
        timelineRegisterBtn.addEventListener('click', abrirModalRegistro);
    }

    if (closeRegisterModalBtn) {
        closeRegisterModalBtn.addEventListener('click', () => registerModal.classList.add('hidden'));
    }
    if (cancelRegisterModalFooterBtn) {
        cancelRegisterModalFooterBtn.addEventListener('click', () => registerModal.classList.add('hidden'));
    }
    if (saveRegisterModalBtn) {
        saveRegisterModalBtn.addEventListener('click', function() {
            // Lógica para salvar o registro da ação
            // Precisa pegar os dados do formulário do registerModal
            // Enviar para uma API /api/registrar_acao_adolescente
            // Atualizar a linha do tempo no modal da timeline (se estiver aberto) ou a tabela principal
            console.log("Salvar registro clicado para:", currentAdolescenteForModal);
            // Exemplo:
            // const tipoAcao = registerModal.querySelector('input[name="action-type"]:checked').value;
            // const dataAcao = registerModal.querySelector('input[type="date"]').value; // Ajustar seletor
            // ... pegar outros campos ...
            // fetch('/api/registrar_acao_adolescente', { method: 'POST', body: JSON.stringify(...) }) ...
            if (registerModal) registerModal.classList.add('hidden');
            // Opcionalmente, reabrir o modal da timeline ou atualizar a tabela principal
        });
    }

});
