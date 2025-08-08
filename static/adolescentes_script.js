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
    const labelEquipeCardTotalAdolescentes = document.getElementById('labelEquipeCardTotalAdolescentes');
    
    const adolescentesMetodoDiaValor = document.getElementById('adolescentesMetodoDiaValor');
    const labelEquipeCardMetodoDia = document.getElementById('labelEquipeCardMetodoDia');
    const adolescentesSemMetodoValor = document.getElementById('adolescentesSemMetodoValor');
    const labelEquipeCardSemMetodo = document.getElementById('labelEquipeCardSemMetodo');
    const adolescentesMetodoAtrasadoValor = document.getElementById('adolescentesMetodoAtrasadoValor');
    const labelEquipeCardMetodoAtrasado = document.getElementById('labelEquipeCardMetodoAtrasado');
    const adolescentesGestantesValor = document.getElementById('adolescentesGestantesValor');
    const labelEquipeCardGestantes = document.getElementById('labelEquipeCardGestantes');

    let todasEquipesComAgentes = [];
    let equipeSelecionadaAtual = 'Todas';
    let agenteSelecionadoAtual = 'Todas as áreas';

    const acompanhamentoAdolescentesTitle = document.getElementById('acompanhamentoAdolescentesTitle');
    const sugestaoAbordagemContainer = document.getElementById('sugestaoAbordagemContainer');
    let teamLevelStatsForSuggestion = null; // To store team-level stats for the suggestion
    // --- Elementos da Tabela de Timeline ---
    const timelineTableBody = document.getElementById('timeline-table-body');
    const timelinePaginationInfo = document.getElementById('timeline-pagination-info');
    const timelinePaginationContainer = document.getElementById('timeline-pagination-container');
    const searchTimelineInput = document.getElementById('search-timeline-input');
    const timelineStatusFilterButtons = document.querySelectorAll('.timeline-status-tab-btn'); // Alterado para nova classe das abas
    const timelineSortBtn = document.getElementById('timeline-sort-btn');
    const timelineSortBtnText = document.getElementById('timeline-sort-btn-text');
    const timelineSortDropdown = document.getElementById('timeline-sort-dropdown');
    const timelineSortOptions = document.querySelectorAll('.timeline-sort-option');
    let currentTimelinePage = 1; 
    let currentTimelineLimit = 10; // Limite de 10 nomes por página
    let currentTimelineSearch = '';
    let currentTimelineStatusFilter = 'Todos'; // 'Todos', 'SemMetodo', 'MetodoVencido'
    let currentTimelineSort = 'nome_asc';
    let currentFetchedTimelineAdolescents = []; // Cache for adolescents on the currently displayed timeline page
    let currentProximaAcaoFilter = 'all'; // Filtro de próxima ação
    let currentMetodoFilter = 'all'; // Filtro de método contraceptivo
    const imprimirInformativosMaeBtn = document.getElementById('imprimir-informativos-mae-btn');

    // --- Elementos dos Modais ---
    const timelineModal = document.getElementById('timelineModal');
    const timelineModalTitle = timelineModal ? timelineModal.querySelector('h3') : null; // Ex: Linha do Tempo - Juliana Costa
    const timelineModalAdolescenteNome = timelineModal ? timelineModal.querySelector('#timelineModalAdolescenteNome') : null; // Adicionar este ID no HTML
    const timelineModalAdolescenteIdade = timelineModal ? timelineModal.querySelector('#timelineModalAdolescenteIdade') : null; // Adicionar este ID
    const timelineModalMicroarea = timelineModal ? timelineModal.querySelector('#timelineModalMicroarea') : null; // Adicionar este ID
    const timelineModalEquipe = timelineModal ? timelineModal.querySelector('#timelineModalEquipe') : null; // Adicionar este ID
    const timelineModalNomeMae = timelineModal ? timelineModal.querySelector('#timelineModalNomeMae') : null; // Novo ID para nome da mãe
    const timelineModalStatus = timelineModal ? timelineModal.querySelector('#timelineModalStatus') : null; // Adicionar este ID
    const timelineModalProximaAcao = timelineModal ? timelineModal.querySelector('#timelineModalProximaAcao') : null; // Adicionar este ID
    const timelineModalAvatarIniciais = timelineModal ? timelineModal.querySelector('#timelineModalAvatarIniciais') : null; // Adicionar este ID
    const timelineModalContent = timelineModal ? timelineModal.querySelector('#timelineModalContentArea') : null; // Adicionar ID à área de conteúdo da timeline
    const closeTimelineModalBtn = document.getElementById('closeTimelineModal');
    const closeTimelineModalFooterBtn = document.getElementById('closeTimelineModalBtn');
    const timelineRegisterBtn = document.getElementById('timelineRegisterBtn');

    const timelineEventIcons = {
        1: 'ri-parent-line',        // Abordagem com pais
        2: 'ri-user-voice-line',    // Abordagem direta com adolescente
        3: 'ri-hospital-line',      // Iniciar método na UBS
        4: 'ri-mail-send-line',     // Entrega de convite
        5: 'ri-map-pin-line',       // Mudou de área
        6: 'ri-home-line',          // Iniciar método em domicílio
        7: 'ri-user-unfollow-line', // Remover do acompanhamento
        'default': 'ri-calendar-event-line'
    };
    const timelineEventColors = { // Tailwind CSS color classes for icon background
        1: 'bg-blue-100 text-blue-600',
        2: 'bg-teal-100 text-teal-600',
        3: 'bg-purple-100 text-purple-600',
        4: 'bg-orange-100 text-orange-600',
        5: 'bg-red-100 text-red-600',
        6: 'bg-green-100 text-green-600',
        7: 'bg-gray-100 text-gray-800',
        'default': 'bg-gray-100 text-gray-600'
    };
    const tipoAbordagemMap = {
        1: "Abordagem com pais",
        2: "Abordagem direta com adolescente",
        5: "Mudou de área", 
        7: "Remover do acompanhamento",
        8: "Atualizar no PEC"
    };
    const resultadoAbordagemMap = {
        1: "Deseja iniciar um método contraceptivo",
        2: "Recusou método contraceptivo",
        3: "Ausente em domicílio",
        4: "Já usa um método"
    };

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

        // Aplicar a label base para todos os cards
        if(labelEquipeCardTotalAdolescentes) labelEquipeCardTotalAdolescentes.textContent = textoLabelEquipeBase;
        if(labelEquipeCardMetodoDia) labelEquipeCardMetodoDia.textContent = textoLabelEquipeBase;
        if(labelEquipeCardSemMetodo) labelEquipeCardSemMetodo.textContent = textoLabelEquipeBase;
        if(labelEquipeCardMetodoAtrasado) labelEquipeCardMetodoAtrasado.textContent = textoLabelEquipeBase;
        if(labelEquipeCardGestantes) labelEquipeCardGestantes.textContent = textoLabelEquipeBase;

        // O card "Total de Adolescentes" usa uma label um pouco diferente no HTML,
        // mas o texto da equipe/agente é o mesmo.
        // Se precisar de lógica diferente para a label do card "Total de Adolescentes", ajuste aqui.

        // Se os cards não tiverem equipe selecionada (ex: ao carregar "Todas as equipes")
        // os valores numéricos são para o geral.
        // Se uma equipe for selecionada, os valores são para aquela equipe/agente.
    }
    
    function updateAcompanhamentoTitle() {
        if (!acompanhamentoAdolescentesTitle) return;

        let title = "Acompanhamento de Adolescentes";
        if (equipeSelecionadaAtual !== 'Todas') {
            title += ` - Equipe: ${equipeSelecionadaAtual}`;
            if (agenteSelecionadoAtual !== 'Todas as áreas') {
                // agenteSelecionadoAtual já vem formatado como "Área X - Agente Y" ou "Área X"
                title += ` - ${agenteSelecionadoAtual}`;
            }
        }
        // Se equipeSelecionadaAtual for 'Todas', o título permanece o base.
        acompanhamentoAdolescentesTitle.textContent = title;
    }

    function updateSugestaoAbordagem() { // No longer takes estatisticasData directly
        if (!sugestaoAbordagemContainer) return;

        // Show suggestion only if a specific team is selected and we have team-level stats
        if (equipeSelecionadaAtual !== 'Todas' && teamLevelStatsForSuggestion) {
            const semMetodo = teamLevelStatsForSuggestion.semMetodo || 0;
            const metodoAtrasado = teamLevelStatsForSuggestion.metodoAtrasado || 0;
            const totalParaAbordagem = semMetodo + metodoAtrasado;
            
            const semanasPeriodo = 25; // Aproximadamente 6 meses
            let sugestaoX = 0;

            if (totalParaAbordagem > 0 && semanasPeriodo > 0) {
                sugestaoX = Math.ceil(totalParaAbordagem / semanasPeriodo);
            }
            
            // Garantir um mínimo de 2 abordagens por semana, se houver alguma adolescente para abordar
            if (totalParaAbordagem > 0 && sugestaoX < 2) {
                sugestaoX = 2;
            }

            sugestaoAbordagemContainer.innerHTML = `
                <i class="ri-information-line align-middle mr-1"></i>Para acompanhar todas as adolescentes da equipe ${equipeSelecionadaAtual} no período de 6 meses sugerimos ${sugestaoX} abordagem (consultas ou visitas) por semana.
            `;
            sugestaoAbordagemContainer.classList.remove('hidden');
        } else {
            sugestaoAbordagemContainer.classList.add('hidden');
            sugestaoAbordagemContainer.innerHTML = '';
        }
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
                    adolescentesSemMetodoValor.textContent = '-';
                    adolescentesMetodoAtrasadoValor.textContent = '-';
                    adolescentesMetodoDiaValor.textContent = '-';
                    adolescentesGestantesValor.textContent = '-';
                    return;
                }
                totalAdolescentesValor.textContent = data.total_adolescentes !== undefined ? data.total_adolescentes : '-';
                adolescentesSemMetodoValor.textContent = data.adolescentes_sem_metodo !== undefined ? data.adolescentes_sem_metodo : '-';
                adolescentesMetodoAtrasadoValor.textContent = data.adolescentes_com_metodo_atrasado !== undefined ? data.adolescentes_com_metodo_atrasado : '-';
                adolescentesMetodoDiaValor.textContent = data.adolescentes_metodo_em_dia !== undefined ? data.adolescentes_metodo_em_dia : '-';
                adolescentesGestantesValor.textContent = data.adolescentes_gestantes !== undefined ? data.adolescentes_gestantes : '-';

                // If a specific team is selected AND we are looking at "Todas as áreas" for that team,
                // it means these are the team-level stats we need for the suggestion.
                if (equipeSelecionadaAtual !== 'Todas' && agenteSelecionadoAtual === 'Todas as áreas') {
                    teamLevelStatsForSuggestion = {
                        semMetodo: data.adolescentes_sem_metodo || 0,
                        metodoAtrasado: data.adolescentes_com_metodo_atrasado || 0
                    };
                }
                updateSugestaoAbordagem(); // Update suggestion (it will use teamLevelStatsForSuggestion)
            })
            .finally(atualizarLabelsDosCards) // Atualiza os labels após buscar as estatísticas
            .catch(error => {
                console.error('Erro de rede ao buscar estatísticas:', error);
                totalAdolescentesValor.textContent = 'Erro';
                adolescentesSemMetodoValor.textContent = 'Erro';
                adolescentesMetodoAtrasadoValor.textContent = 'Erro';
                adolescentesMetodoDiaValor.textContent = 'Erro';
                adolescentesGestantesValor.textContent = 'Erro';
                teamLevelStatsForSuggestion = null; // Clear stored stats on error
                updateSugestaoAbordagem(); // Limpa a sugestão em caso de erro
            });
    }

    // Função combinada para atualizar tudo após seleção
    function atualizarPainelCompleto() { fetchEstatisticas(); fetchTimelineData(); updateAcompanhamentoTitle(); fetchGraficosData(); }

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
            atualizarPainelCompleto();
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
                    atualizarPainelCompleto();
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
                    teamLevelStatsForSuggestion = null; // Clear team-level stats when going to "Todas as equipes"
                    atualizarPainelCompleto();
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
                        atualizarPainelCompleto();
                    });
                    equipeDropdownContent.appendChild(option);
                });

                // Carrega estatísticas iniciais para "Todas as equipes"
                // e atualiza o título do acompanhamento
                atualizarPainelCompleto();
            })
            .catch(error => console.error('Erro de rede ao buscar equipes e agentes:', error));
    }

    // --- Funções para os Gráficos ---
    let statusChartInstance = null;
    let ageChartInstance = null; // Renomearemos para pizzaChartInstance mentalmente

    const statusColors = {
        gestantes: 'rgb(236, 72, 153)', // Rosa (Tailwind pink-500)
        sem_metodo: 'rgb(250, 204, 21)', // Amarelo (Tailwind yellow-400)
        metodo_atraso: 'rgb(239, 68, 68)', // Vermelho (Tailwind red-500)
        metodo_em_dia: 'rgb(34, 197, 94)'  // Verde (Tailwind green-500)
    };
    const statusLabels = {
        gestantes: 'Grávidas',
        sem_metodo: 'Sem Método',
        metodo_atraso: 'Método em Atraso',
        metodo_em_dia: 'Método em Dia'
    };

    function initCharts() {
        const chartStatusEl = document.getElementById('chartStatus');
        const chartAgeEl = document.getElementById('chartAge'); // Este será o de pizza

        if (chartStatusEl) {
            statusChartInstance = echarts.init(chartStatusEl);
        }
        if (chartAgeEl) {
            ageChartInstance = echarts.init(chartAgeEl);
        }
        // Redimensionar gráficos quando a janela mudar de tamanho
        window.addEventListener('resize', function () {
            statusChartInstance?.resize();
            ageChartInstance?.resize();
        });
    }

    function fetchGraficosData() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual
            // agente_selecionado não é usado aqui, pois os gráficos são por equipe ou todas as microáreas da equipe
        });

        fetch(`/api/graficos_painel_adolescentes?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    console.error("Erro ao buscar dados dos gráficos:", data.erro);
                    return;
                }
                updatePizzaChart(data.pizza_data);
                updateBarChart(data.bar_chart_data);
            })
            .catch(error => console.error('Erro de rede ao buscar dados dos gráficos:', error));
    }

    function updatePizzaChart(pizzaData) {
        if (!ageChartInstance || !pizzaData) return;

        const seriesData = [
            { value: pizzaData.gestantes || 0, name: statusLabels.gestantes, itemStyle: { color: statusColors.gestantes } },
            { value: pizzaData.sem_metodo || 0, name: statusLabels.sem_metodo, itemStyle: { color: statusColors.sem_metodo } },
            { value: pizzaData.metodo_atraso || 0, name: statusLabels.metodo_atraso, itemStyle: { color: statusColors.metodo_atraso } },
            { value: pizzaData.metodo_em_dia || 0, name: statusLabels.metodo_em_dia, itemStyle: { color: statusColors.metodo_em_dia } }
        ].filter(item => item.value > 0); // Filtra para não mostrar itens com valor 0 na legenda/pizza

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'horizontal',
                bottom: 0,
                data: seriesData.map(item => item.name)
            },
            series: [
                {
                    name: 'Distribuição da Equipe',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false, position: 'center' },
                    emphasis: {
                        label: { show: true, fontSize: '16', fontWeight: 'bold' }
                    },
                    labelLine: { show: false },
                    data: seriesData
                }
            ]
        };
        ageChartInstance.setOption(option, true); // true para limpar o gráfico anterior
    }

    function updateBarChart(barData) {
        if (!statusChartInstance || !barData) return;

        let categories;
        let seriesDataFunction;

        if (equipeSelecionadaAtual === 'Todas') {
            categories = [...new Set(barData.map(item => item.nome_equipe || 'Equipe N/A'))].sort();
            seriesDataFunction = (statusKey, category) => {
                const item = barData.find(d => (d.nome_equipe || 'Equipe N/A') === category);
                return item ? (item[statusKey] || 0) : 0;
            };
        } else { // Specific team selected
            // Create unique categories based on "Área X - Agente Y" or "Área X"
            categories = [...new Set(barData.map(item => {
                const microarea = item.microarea || 'N/A';
                const agente = item.nome_agente || 'Agente Desconhecido';
                return `Área ${microarea} - ${agente}`;
            }))].sort();

            seriesDataFunction = (statusKey, categoryLabel) => {
                const item = barData.find(d => {
                    const ma = d.microarea || 'N/A';
                    const ag = d.nome_agente || 'Agente Desconhecido';
                    return `Área ${ma} - ${ag}` === categoryLabel;
                });
                return item ? (item[statusKey] || 0) : 0;
            };
        }

        const series = Object.keys(statusLabels).map(statusKey => ({
            name: statusLabels[statusKey],
            type: 'bar',
            stack: 'total',
            itemStyle: { color: statusColors[statusKey], borderRadius: [4, 4, 0, 0] },
            emphasis: { focus: 'series' },
            data: categories.map(cat => seriesDataFunction(statusKey, cat))
        }));

        const option = {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: Object.values(statusLabels), bottom: 0 },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: categories, axisLabel: { interval: 0, rotate: categories.length > 5 ? 30 : 0 } },
            yAxis: { type: 'value' },
            series: series
        };
        statusChartInstance.setOption(option, true); // true para limpar o gráfico anterior
    }

    // --- Funções para a Tabela de Timeline ---

    function getTimelineMetodoStatusContent(ado) {
        let metodoTexto = ado.metodo || 'Sem método';
        let statusTexto = '';
        let statusClass = 'text-gray-600';
        let metodoClass = 'text-gray-900';
        let containerClass = '';

        // Verificar se está fora de área (quando próxima ação é "mudou de área" ou "remover do acompanhamento")
        const isForaDeArea = ado.proxima_acao_tipo === 5 || ado.proxima_acao_tipo === 7 || 
                           (ado.proxima_acao_descricao && 
                            (ado.proxima_acao_descricao.toLowerCase().includes('mudou de área') || 
                             ado.proxima_acao_descricao.toLowerCase().includes('remover do acompanhamento')));

        if (isForaDeArea) {
            metodoTexto = 'FORA DE ÁREA';
            statusTexto = '';
            metodoClass = 'text-red-700 font-bold';
            containerClass = 'border-2 border-red-500 rounded-full px-3 py-1 inline-block bg-red-50';
        } else if (ado.status_gravidez === 'Grávida') {
            metodoTexto = 'GESTANTE';
            statusTexto = ado.data_provavel_parto ? `DPP: ${ado.data_provavel_parto}` : 'DPP não informada';
            statusClass = 'text-pink-600 font-semibold';
            metodoClass = 'text-pink-700 font-bold';
            containerClass = 'border-2 border-pink-500 rounded-full px-3 py-1 inline-block bg-pink-50';
        } else if (!ado.metodo) {
            metodoTexto = 'SEM MÉTODO';
            statusTexto = 'Não utiliza método contraceptivo.';
            statusClass = 'text-yellow-700';
            metodoClass = 'text-yellow-700 font-bold';
            containerClass = 'border-2 border-yellow-500 rounded-full px-3 py-1 inline-block bg-yellow-50';
        } else if (ado.data_aplicacao) {
            const dataAplicacao = new Date(ado.data_aplicacao + 'T00:00:00'); // Considerar como data local
            
            if (isNaN(dataAplicacao.getTime())) { // Verifica se a data é inválida
                statusTexto = 'Data de aplicação inválida.';
                statusClass = 'text-red-500 font-semibold';
            } else {
                // Continua com a lógica original se a data for válida
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0); // Normalizar hoje para meia-noite para comparação de dias

                let limiteDias = Infinity;
                const metodoLower = ado.metodo.toLowerCase();
                
                // Determinar nome do método para exibição
                let nomeMetodoDisplay = '';
                if (metodoLower.includes('mensal') || metodoLower.includes('pílula')) {
                    limiteDias = 30;
                    nomeMetodoDisplay = metodoLower.includes('mensal') ? 'MENSAL' : 'PÍLULA';
                } else if (metodoLower.includes('trimestral')) {
                    limiteDias = 90;
                    nomeMetodoDisplay = 'TRIMESTRAL';
                } else if (metodoLower.includes('diu')) {
                    nomeMetodoDisplay = 'DIU';
                } else {
                    nomeMetodoDisplay = ado.metodo.toUpperCase();
                }

                const dataVencimento = new Date(dataAplicacao);
                dataVencimento.setDate(dataVencimento.getDate() + limiteDias);

                const dataAplicacaoFormatada = dataAplicacao.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

                if (limiteDias !== Infinity) { // Métodos com data de vencimento clara
                    if (hoje >= dataVencimento) {
                        // Método vencido
                        metodoTexto = nomeMetodoDisplay;
                        statusTexto = `Vencido desde: ${dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
                        statusClass = 'text-red-600 font-semibold';
                        metodoClass = 'text-red-700 font-bold';
                        containerClass = 'border-2 border-red-500 rounded-full px-3 py-1 inline-block bg-red-50';
                    } else {
                        // Método em dia
                        metodoTexto = nomeMetodoDisplay;
                        statusTexto = `Em dia - Próx. dose/venc: ${dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
                        statusClass = 'text-green-600';
                        metodoClass = 'text-green-700 font-bold';
                        containerClass = 'border-2 border-green-500 rounded-full px-3 py-1 inline-block bg-green-50';
                    }
                } else { // Métodos de longa duração sem data de vencimento clara (DIU, Implante, Laqueadura)
                    metodoTexto = nomeMetodoDisplay;
                    statusTexto = `Em uso desde: ${dataAplicacaoFormatada}`;
                    statusClass = 'text-green-600';
                    metodoClass = 'text-green-700 font-bold';
                    containerClass = 'border-2 border-green-500 rounded-full px-3 py-1 inline-block bg-green-50';
                }
            }
        } else { // Tem método mas não tem data de aplicação (pode acontecer se o dado for inconsistente)
            statusTexto = 'Data de aplicação não informada.';
            statusClass = 'text-gray-500';
        }

        if (containerClass) {
            return `
                <div class="${containerClass}">
                    <div class="text-sm font-bold ${metodoClass}">${metodoTexto}</div>
                </div>
                ${statusTexto ? `<div class="text-xs ${statusClass} mt-1">${statusTexto}</div>` : ''}
            `;
        } else {
            return `
                <div class="text-sm font-medium ${metodoClass}">${metodoTexto}</div>
                <div class="text-xs ${statusClass}">${statusTexto}</div>
            `;
        }
    }

    function renderTimelineTable(data) {
        timelineTableBody.innerHTML = '';
        if (!data || !data.adolescentes || data.adolescentes.length === 0) {
            timelineTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhuma adolescente encontrada.</td></tr>`; // Colspan ajustado para 5 colunas
            renderTimelinePagination(0, 1, 5, 0);
            return;
        }

        data.adolescentes.forEach(ado => {
            const isGestante = ado.status_gravidez === 'Grávida';
            let isMetodoEmDia = false;

            if (!isGestante && ado.metodo && ado.data_aplicacao) {
                // A data_aplicacao vem como 'YYYY-MM-DD' do backend para esta função
                const dataAplicacaoParts = ado.data_aplicacao.split('-');
                const dataAplicacao = new Date(parseInt(dataAplicacaoParts[0]), parseInt(dataAplicacaoParts[1]) - 1, parseInt(dataAplicacaoParts[2]));

                if (!isNaN(dataAplicacao.getTime())) {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    let limiteDias = Infinity;
                    const metodoLower = ado.metodo.toLowerCase();

                    if (metodoLower.includes('mensal') || metodoLower.includes('pílula')) limiteDias = 30;
                    else if (metodoLower.includes('trimestral')) limiteDias = 90;

                    if (limiteDias !== Infinity) {
                        const dataVencimento = new Date(dataAplicacao);
                        dataVencimento.setDate(dataVencimento.getDate() + limiteDias);
                        if (hoje < dataVencimento) {
                            isMetodoEmDia = true;
                        }
                    } else { // Métodos de longa duração (DIU, Implante, Laqueadura)
                        isMetodoEmDia = true;
                    }
                }
            }

            const isDIU = ado.metodo && ado.metodo.toLowerCase().includes('diu');
            let shouldHideActions;

            if (isDIU) {
                shouldHideActions = false; // Sempre mostrar ações para DIU
            } else {
                shouldHideActions = isGestante || isMetodoEmDia;
            }

            let registrarAcoesHtml = '';
            if (!shouldHideActions) {
                registrarAcoesHtml = `
                    <button class="timeline-ver-detalhes-btn text-primary hover:text-indigo-700 !rounded-button whitespace-nowrap" 
                            data-cod-paciente="${ado.cod_paciente}"
                            data-nome-paciente="${ado.nome_paciente || ''}">
                        Registrar Ações</button>`;
            }

            let proximaAcaoDisplay = 'A definir';
            if (shouldHideActions) {
                proximaAcaoDisplay = '';
            } else if (ado.ultimo_resultado_abordagem === 4) {
                // Caso especial: "Já usa um método" - mostrar em verde
                proximaAcaoDisplay = `<span class="text-green-600 font-medium">(Paciente em uso)</span><br><span class="text-xs text-green-500">(Atualizar no PEC)</span>`;
            } else if (ado.proxima_acao_tipo === 5 || ado.proxima_acao_tipo === 7 || 
                      (ado.proxima_acao_descricao && 
                       (ado.proxima_acao_descricao.toLowerCase().includes('mudou de área') || 
                        ado.proxima_acao_descricao.toLowerCase().includes('remover do acompanhamento')))) {
                // Caso especial: "Mudou de área" ou "Remover do acompanhamento" - mostrar em vermelho
                proximaAcaoDisplay = `<span class="text-red-700 font-medium text-sm">Fora de área. Atualizar PEC.</span>`;
            } else if (ado.proxima_acao_tipo === 3 || (ado.proxima_acao_descricao && (ado.proxima_acao_descricao.toLowerCase().includes('consulta na ubs') || ado.proxima_acao_descricao.toLowerCase().includes('iniciar método na ubs')))) {
                // Caso especial: "Iniciar método na UBS" - mostrar em verde escuro
                proximaAcaoDisplay = `<span class="text-green-700 font-medium">Iniciar método na UBS</span><br><span class="text-xs text-green-700">(${ado.proxima_acao_data_formatada || 'data da consulta'})</span>`;
            } else if (ado.proxima_acao_tipo === 6 || (ado.proxima_acao_descricao && ado.proxima_acao_descricao.toLowerCase().includes('iniciar método em domicílio'))) {
                // Caso especial: "Iniciar método em domicílio" - mostrar em verde escuro
                proximaAcaoDisplay = `<span class="text-green-700 font-medium">Iniciar método em domicílio</span><br><span class="text-xs text-green-700">(${ado.proxima_acao_data_formatada || 'data da visita'})</span>`;
            } else if (ado.proxima_acao_descricao) {
                // Verificar se é "Abordagem com pais" para colorir de amarelo escuro
                if (ado.proxima_acao_descricao.toLowerCase().includes('abordagem com pais')) {
                    proximaAcaoDisplay = `<span class="text-yellow-700 font-medium">${ado.proxima_acao_descricao}</span> <br> <span class="text-xs text-yellow-700">(${ado.proxima_acao_data_formatada || 'Data não definida'})</span>`;
                } else {
                    proximaAcaoDisplay = `${ado.proxima_acao_descricao} <br> <span class="text-xs text-gray-400">(${ado.proxima_acao_data_formatada || 'Data não definida'})</span>`;
                }
            }

            let imprimirCheckboxHtml = '';
            if (!shouldHideActions) {
                imprimirCheckboxHtml = `<input type="checkbox" class="imprimir-informativo-mae-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" data-cod-paciente="${ado.cod_paciente}">`;
            }

            const row = timelineTableBody.insertRow();
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${ado.nome_paciente || 'N/A'}, ${ado.idade_calculada || 'N/A'} anos</div>
                    <div class="text-xs text-gray-500">CNS: ${ado.cartao_sus || 'N/A'}</div>
                    <div class="text-xs text-gray-400">Mãe: ${ado.nome_responsavel || 'N/A'}</div>
                    <div class="text-xs text-gray-600">Equipe: ${ado.nome_equipe || 'N/A'} - ${ado.nome_agente || `Microárea ${ado.microarea || 'N/A'}`}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">${getTimelineMetodoStatusContent(ado)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${proximaAcaoDisplay}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${registrarAcoesHtml}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    ${imprimirCheckboxHtml}
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
            button.addEventListener('click', function () {
                if (this.disabled || this.dataset.page === undefined) return; // Ignora reticências e botões desabilitados
                currentTimelinePage = parseInt(this.dataset.page);
                fetchTimelineData();
            });
        });
    }

    function fetchTimelineData() {
        timelineTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Carregando...</td></tr>`; // Colspan ajustado para 5 colunas
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            agente_selecionado: agenteSelecionadoAtual,
            page_timeline: currentTimelinePage,
            search_timeline: currentTimelineSearch,
            status_timeline: currentTimelineStatusFilter,
            sort_by_timeline: currentTimelineSort,
            limit: currentTimelineLimit, // Adiciona o parâmetro de limite
            proxima_acao: currentProximaAcaoFilter, // Adiciona o filtro de próxima ação
            metodo_filter: currentMetodoFilter // Adiciona o filtro de método
        });

        fetch(`/api/timeline_adolescentes?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    console.error("Erro ao buscar dados da timeline:", data.erro);
                    timelineTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>`; // Colspan ajustado para 5 colunas
                    renderTimelinePagination(0, 1, 5, 0);
                    return;
                }
                currentFetchedTimelineAdolescents = data.adolescentes || []; // Update cache
                renderTimelineTable(data);
            })
            .catch(error => {
                // Limpar a tabela e a paginação em caso de erro de rede
                if (timelineTableBody) {
                    timelineTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro de comunicação ao carregar dados.</td></tr>`; // Colspan ajustado para 5 colunas
                }
                if (timelinePaginationInfo) timelinePaginationInfo.innerHTML = '';
                if (timelinePaginationContainer) timelinePaginationContainer.innerHTML = '';

                currentFetchedTimelineAdolescents = []; // Clear cache on error

                console.error('Erro de rede ao buscar dados da timeline:', error);
                renderTimelinePagination(0, 1, 5, 0);
            });
    }


    // --- Funções para os Modais Dinâmicos ---
    function getIniciais(nome) {
        if (!nome) return 'N/A';
        const partes = nome.split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : partes[0][1] || '')).toUpperCase();
    }

    async function abrirModalTimeline(codPaciente) {
        if (!codPaciente) return;

        try {
            const response = await fetch(`/api/adolescente_detalhes_timeline/${codPaciente}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ erro: "Erro desconhecido ao buscar detalhes." }));
                throw new Error(errorData.erro || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.erro) {
                alert(`Erro ao carregar detalhes: ${data.erro}`);
                return;
            }

            const adoDetalhes = data.detalhes;
            const eventosTimeline = data.eventos_timeline || [];

            // Adiciona cod_paciente ao objeto adoDetalhes se não estiver presente, para consistência
            currentAdolescenteForModal = { ...adoDetalhes, cod_paciente: codPaciente, nome_responsavel: adoDetalhes.nome_responsavel };

            // Populate left card
            if (timelineModalTitle) timelineModalTitle.textContent = `Acompanhamento - Linha do Tempo - ${adoDetalhes.nome_paciente || 'Desconhecida'}`;
            if (timelineModalAvatarIniciais) timelineModalAvatarIniciais.textContent = getIniciais(adoDetalhes.nome_paciente);
            if (timelineModalAdolescenteNome) timelineModalAdolescenteNome.textContent = adoDetalhes.nome_paciente || 'N/A';
            if (timelineModalAdolescenteIdade) timelineModalAdolescenteIdade.textContent = `${adoDetalhes.idade_calculada || 'N/A'} anos`;
            if (timelineModalMicroarea) timelineModalMicroarea.textContent = adoDetalhes.microarea || 'N/A';
            if (timelineModalEquipe) timelineModalEquipe.textContent = adoDetalhes.nome_equipe || 'N/A';
            if (timelineModalNomeMae) timelineModalNomeMae.textContent = adoDetalhes.nome_responsavel || 'N/A';

            // Status e Próxima Ação (usar dados de mv_plafam para status geral, próxima ação virá da timeline)
            const statusGeralContent = getTimelineMetodoStatusContent(adoDetalhes); // Usa dados de mv_plafam
            if (timelineModalStatus) timelineModalStatus.innerHTML = statusGeralContent.split('<div class="text-xs')[0];

            // Determinar próxima ação com base nos eventos da timeline
            if (timelineModalProximaAcao) {
                if (adoDetalhes.proxima_acao_descricao && adoDetalhes.proxima_acao_data_formatada) {
                    timelineModalProximaAcao.textContent = `${adoDetalhes.proxima_acao_descricao} (${adoDetalhes.proxima_acao_data_formatada})`;
                } else {
                    timelineModalProximaAcao.textContent = 'A definir';
                }
            }

            renderTimelineEvents(eventosTimeline, adoDetalhes.nome_paciente);

            if (timelineModal) timelineModal.classList.remove('hidden');

        } catch (error) {
            console.error("Falha ao abrir modal da timeline:", error);
            alert(`Não foi possível carregar os detalhes da adolescente: ${error.message}`);
        }
    }

    function renderTimelineEvents(eventos, nomePaciente) {
        if (timelineModalContent) {
            timelineModalContent.innerHTML = ''; // Clear previous content

            if (!eventos || eventos.length === 0) {
                timelineModalContent.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma abordagem registrada para esta adolescente.</p>';
                return;
            }

            const timelineLine = document.createElement('div');
            timelineLine.className = 'timeline-line';
            timelineModalContent.appendChild(timelineLine);

            eventos.forEach((evento, index) => {
                const dataAcaoFormatada = evento.data_acao ? new Date(evento.data_acao + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Data não informada';
                let iconClass = timelineEventIcons['default']; // Inicia com default
                let iconColorClass = timelineEventColors['default']; // Inicia com default

                let tipoAbordagemTexto = tipoAbordagemMap[evento.tipo_abordagem] || `Tipo ${evento.tipo_abordagem || 'Desconhecido'}`;
                let resultadoAbordagemTexto = evento.resultado_abordagem ? (resultadoAbordagemMap[evento.resultado_abordagem] || `Resultado ${evento.resultado_abordagem}`) : '';

                // Lógica para destacar se é uma "próxima ação" agendada
                // (Exemplo: se a data_acao for futura ou observações indicarem agendamento)
                let cardBorderClass = '';
                const dataAcaoObj = evento.data_acao ? new Date(evento.data_acao + 'T00:00:00') : null;
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                // Considera agendamento se a data for futura E a observação contiver "agendamento"
                // OU se a data for futura e não houver resultado (indicando que ainda não ocorreu)
                const isFutureEvent = dataAcaoObj && dataAcaoObj > hoje;
                const hasSchedulingKeyword = (evento.observacoes || '').toLowerCase().includes('agendamento');
                const isConsideredFutureScheduledEvent = isFutureEvent && (hasSchedulingKeyword || evento.resultado_abordagem === null || evento.resultado_abordagem === undefined);

                cardBorderClass = ''; // Alterado de 'let cardBorderClass = ""' para apenas atribuição

                if (isConsideredFutureScheduledEvent) {
                    cardBorderClass = 'border-2 border-primary'; // Destaca ações futuras agendadas
                    iconClass = 'ri-calendar-event-line'; // Ícone de agenda sempre

                    // Lógica para cor da agenda (verde ou amarela)
                    const obsLowerCase = (evento.observacoes || '').toLowerCase();
                    if (evento.tipo_abordagem === 3 || obsLowerCase.includes('método') || obsLowerCase.includes('contraceptivo') || obsLowerCase.includes('aplicar') || obsLowerCase.includes('iniciar diu') || obsLowerCase.includes('inserir diu') || obsLowerCase.includes('colocar diu')) {
                        iconColorClass = 'bg-green-100 text-green-600'; // Agenda verde
                    } else {
                        iconColorClass = 'bg-yellow-100 text-yellow-600'; // Agenda amarela
                    }

                    if (index === 0) { // Se for o primeiro evento da lista (o mais recente/último registrado)
                        tipoAbordagemTexto = 'Agendamento';
                    }
                } else { // Ação já realizada (não é um agendamento futuro)
                    if (evento.resultado_abordagem === 3) { // Ausente / Não encontrado - TEM PRIORIDADE
                        iconClass = 'ri-question-mark';
                        iconColorClass = 'bg-red-100 text-red-600';
                    } else if (evento.tipo_abordagem === 1) { // Caso específico: Abordagem com pais (e não ausente)
                        iconClass = timelineEventIcons[1]; // Ícone de pais
                        if (evento.resultado_abordagem === 1) { // Aceitou método
                            iconColorClass = 'bg-green-100 text-green-600'; // Verde
                        } else if (evento.resultado_abordagem === 2) { // Recusou método
                            iconColorClass = 'bg-red-100 text-red-600'; // Vermelho
                        } else {
                            // Outros resultados para abordagem com pais (ex: sem resultado definido ainda)
                            iconColorClass = timelineEventColors[1]; // Cor padrão azul
                        }
                    } else { // Outros tipos de abordagem (não pais, não ausente e não futuras)
                        // Define o ícone e cor padrão com base no tipo de abordagem
                        iconClass = timelineEventIcons[evento.tipo_abordagem] || timelineEventIcons['default'];
                        iconColorClass = timelineEventColors[evento.tipo_abordagem] || timelineEventColors['default'];

                        // Sobrescreve com base no resultado (sabemos que não é 3 aqui)
                        if (evento.resultado_abordagem === 1) { // Aceitou / Deseja iniciar método
                            iconClass = 'ri-check-line';
                            iconColorClass = 'bg-green-100 text-green-600';
                        } else if (evento.resultado_abordagem === 2) { // Recusou
                            iconClass = 'ri-close-line';
                            iconColorClass = 'bg-red-100 text-red-600';
                        }
                        // Se não for resultado 1 ou 2 (e não 3), mantém o ícone/cor padrão do tipo de abordagem.
                    }
                }

                // Lógica anterior para isFutureScheduledEvent (apenas para referência, agora é isConsideredFutureScheduledEvent)
                /*
                if (isFutureScheduledEvent) {
                    cardBorderClass = 'border-2 border-primary'; // Destaca ações futuras agendadas
                    iconClass = 'ri-calendar-event-line'; // Ícone de agenda
                    iconColorClass = 'bg-yellow-100 text-yellow-600'; // Cores amarelas
                    if (index === 0) { // Se for o primeiro evento da lista (o mais recente/último registrado)
                        tipoAbordagemTexto = 'Agendamento';
                    }
                }
                */
                let deleteButtonHtml = '';
                if (index === 0) { // Adiciona o botão de deletar apenas para o item mais recente (topo da timeline)
                    deleteButtonHtml = `
                        <button class="delete-timeline-action-btn text-red-500 hover:text-red-700 absolute bottom-2 right-2 p-1" title="Deletar esta ação" data-co-abordagem="${evento.co_abordagem}">
                            <i class="ri-delete-bin-line text-lg"></i>
                        </button>`;
                }

                const eventHtml = `
                    <div class="flex mb-8 relative">
                        <div class="w-12 h-12 rounded-full ${iconColorClass} flex items-center justify-center z-10 flex-shrink-0">
                            <div class="w-6 h-6 flex items-center justify-center">
                                <i class="${iconClass} text-xl"></i>
                            </div>
                        </div>
                        <div class="ml-4 bg-white rounded-lg shadow p-4 flex-grow relative ${cardBorderClass}">
                            ${deleteButtonHtml}
                            <div class="flex justify-between items-center mb-2">
                                <h5 class="font-medium">${tipoAbordagemTexto}</h5>
                                <span class="text-sm text-gray-500">${dataAcaoFormatada}</span>
                            </div>
                            ${resultadoAbordagemTexto ? `<p class="text-sm text-gray-700 mb-1"><strong>Resultado:</strong> ${resultadoAbordagemTexto}</p>` : ''}
                            ${evento.observacoes ? `<p class="text-sm text-gray-600 mb-2">${evento.observacoes.replace(/\n/g, '<br>')}</p>` : '<p class="text-sm text-gray-400 mb-2">Nenhuma observação registrada.</p>'}
                            <div class="text-sm text-gray-500">
                                Responsável: <span class="font-medium">${evento.responsavel_pela_acao || 'Não informado'}</span>
                            </div>
                        </div>
                    </div>
                `;
                timelineModalContent.insertAdjacentHTML('beforeend', eventHtml);
            });

            // Adicionar event listeners para os botões de deletar
            document.querySelectorAll('.delete-timeline-action-btn').forEach(button => {
                button.addEventListener('click', function () {
                    const coAbordagem = this.dataset.coAbordagem;
                    deletarAcaoTimeline(coAbordagem);
                });
            });
        }
    }

    async function deletarAcaoTimeline(coAbordagem) {
        if (!coAbordagem) return;

        if (confirm("Tem certeza que deseja deletar esta ação da linha do tempo? Esta ação não pode ser desfeita.")) {
            try {
                const response = await fetch(`/api/adolescente/acao/${coAbordagem}`, {
                    method: 'DELETE',
                });
                const result = await response.json();

                if (response.ok && result.sucesso) {
                    alert(result.mensagem || "Ação deletada com sucesso!");
                    // Reabrir/atualizar o modal da timeline para refletir a mudança
                    if (currentAdolescenteForModal && currentAdolescenteForModal.cod_paciente) {
                        abrirModalTimeline(currentAdolescenteForModal.cod_paciente);
                    }
                } else {
                    alert(`Falha ao deletar ação: ${result.erro || 'Erro desconhecido.'}`);
                }
            } catch (error) {
                console.error("Erro ao deletar ação da timeline:", error);
                alert("Erro de comunicação ao tentar deletar a ação.");
            }
        }
    }

    function abrirModalRegistro() {
        if (!currentAdolescenteForModal) {
            alert("Nenhuma adolescente selecionada para registrar ação.");
            return;
        }
        if (registerModalTitle) registerModalTitle.textContent = `Registrar Nova Ação - ${currentAdolescenteForModal.nome_paciente || 'Desconhecida'}`;
        // Limpar campos do formulário de registro aqui, se necessário
        const form = registerModal.querySelector('form'); // Supondo que os inputs estão dentro de um form
        if (form) form.reset();

        // Definir a data atual para o primeiro campo de data (ação atual)
        const dataAcaoAtualInput = registerModal.querySelector('input[type="date"]'); // Pega o primeiro input de data
        if (dataAcaoAtualInput) {
            const hoje = new Date();
            dataAcaoAtualInput.value = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }

        // Definir data da próxima ação como hoje + 7 dias
        const proximaAcaoDataInput = registerModal.querySelectorAll('input[type="date"]')[1]; // Segunda data é da próxima ação
        if (proximaAcaoDataInput) {
            const proximaData = new Date();
            proximaData.setDate(proximaData.getDate() + 7); // Adiciona 7 dias
            proximaAcaoDataInput.value = proximaData.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }

        // Resetar dropdowns para texto padrão
        const resultButtonSpan = document.getElementById('resultButton')?.querySelector('span');
        if (resultButtonSpan) resultButtonSpan.textContent = 'Selecione o resultado';
        const nextActionButtonSpan = document.getElementById('nextActionButton')?.querySelector('span');
        if (nextActionButtonSpan) nextActionButtonSpan.textContent = 'Selecione o tipo';

        // Esconder seção de método
        const methodSection = document.getElementById('methodSection');
        if (methodSection) methodSection.classList.add('hidden');

        // Limpar campo de observações
        const observacoesTextarea = registerModal.querySelector('textarea');
        if (observacoesTextarea) observacoesTextarea.value = '';

        if (registerModal) registerModal.classList.remove('hidden');
        if (timelineModal) timelineModal.classList.add('hidden'); // Fecha o modal da timeline
    }

    function generateMotherInformativePDF(selectedAdolescents) {
        if (!selectedAdolescents || selectedAdolescents.length === 0) {
            alert("Nenhuma adolescente selecionada para gerar informativos.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Alterado para Landscape (paisagem)
        const informativosPorPagina = 3;

        // Dimensões da página A4 em paisagem
        const pageWidthA4 = 297;
        const pageHeightA4 = 210;
        const margin = 10;

        const informativoWidth = (pageWidthA4 - (margin * 2) - (margin * (informativosPorPagina - 1))) / informativosPorPagina;
        const informativoHeightTotal = pageHeightA4 - (margin * 2); // Altura total disponível para o conteúdo do informativo dentro das margens

        selectedAdolescents.forEach((ado, index) => {
            const page = Math.floor(index / informativosPorPagina);
            const positionInPage = index % informativosPorPagina;

            if (positionInPage === 0 && page > 0) {
                doc.addPage();
            }

            const currentXStart = margin + (positionInPage * (informativoWidth + margin));
            let currentY = margin + 10; // Y inicial para o conteúdo dentro do box do informativo

            const contentAreaX = currentXStart + 5; // Margem interna do box
            const contentAreaWidth = informativoWidth - 10; // Largura útil para texto dentro do box

            // Desenha o retângulo para o informativo atual (similar ao convite)
            doc.setDrawColor(200, 200, 200); // Cor da borda do box
            doc.rect(currentXStart, margin, informativoWidth, informativoHeightTotal);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(29, 112, 184); // Cor primária (azul do Plafam)
            doc.text("Prevenção na Adolescência", currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += 8;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(51, 51, 51); // #333333

            // Greeting line with conditional bolding and uppercase for mother's name
            if (ado.nome_responsavel && ado.nome_responsavel.trim() !== "") {
                const prefix = "Prezada(o) Sra. ";
                const nomeMaeUpperCase = ado.nome_responsavel.toUpperCase();
                const suffix = ""; // Parentheses removed

                // Calculate widths for precise centering
                doc.setFont("helvetica", "normal"); // Set to normal for prefix/suffix width calculation
                const prefixWidth = doc.getTextWidth(prefix);
                const suffixWidth = doc.getTextWidth(suffix);

                doc.setFont("helvetica", "bold"); // Set to bold for name width calculation
                const nomeMaeWidth = doc.getTextWidth(nomeMaeUpperCase);

                const totalGreetingWidth = prefixWidth + nomeMaeWidth + suffixWidth;
                let currentXGreeting = currentXStart + (informativoWidth - totalGreetingWidth) / 2;

                // Print parts
                doc.setFont("helvetica", "normal");
                doc.text(prefix, currentXGreeting, currentY);
                currentXGreeting += prefixWidth;

                doc.setFont("helvetica", "bold");
                doc.text(nomeMaeUpperCase, currentXGreeting, currentY);
                currentXGreeting += nomeMaeWidth;

                doc.setFont("helvetica", "normal");
                doc.text(suffix, currentXGreeting, currentY);
            } else {
                doc.setFont("helvetica", "normal"); // Ensure normal font
                doc.text("Prezada(o)", currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            }
            currentY += 6; 

            // Adicionar nome da adolescente
            if (ado.nome_paciente && ado.nome_paciente.trim() !== "") {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9); // Fonte um pouco menor para o nome da filha
                doc.setTextColor(102, 102, 102); // Cinza, #666666
                const filhaText = `Filha: ${ado.nome_paciente}`;
                // Tenta centralizar, mas se for muito longo, pode quebrar.
                // Idealmente, teríamos uma lógica para truncar ou reduzir mais a fonte se necessário.
                doc.text(filhaText, currentXStart + informativoWidth / 2, currentY, { align: 'center', maxWidth: contentAreaWidth });
                currentY += 5;
            }
            doc.setFontSize(10); // Resetar para o tamanho de fonte padrão do corpo
            doc.setTextColor(51, 51, 51); // Resetar para a cor padrão do corpo

            const introText = "A adolescência é uma fase de grandes descobertas e transformações. Nosso objetivo é apoiar nossas jovens a fazerem escolhas conscientes para um futuro saudável e planejado.";
            let splitText = doc.splitTextToSize(introText, contentAreaWidth);
            doc.text(splitText, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += (splitText.length * 4.8) + 5;

            const desafioText = "Gravidez na adolescência pode trazer desafios significativos para a saúde, estudos e desenvolvimento pessoal. A prevenção é o melhor caminho.";
            splitText = doc.splitTextToSize(desafioText, contentAreaWidth);
            doc.text(splitText, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += (splitText.length * 4.8) + 5;

            const metodosIntro = "Existem diversas opções seguras e eficazes de métodos contraceptivos, disponíveis gratuitamente pelo SUS:";
            splitText = doc.splitTextToSize(metodosIntro, contentAreaWidth);
            doc.text(splitText, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += (splitText.length * 4.8) + 4;

            // Lista de métodos com "ícones" e centralizada
            // const checkIcon = "✓"; // Símbolo de check removido

            doc.setFont("helvetica", "bold"); // Definir negrito para os métodos
            doc.setFontSize(10);
            doc.setTextColor(51, 51, 51);
            doc.text(`DIU (Dispositivo Intrauterino)`, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += 5;
            doc.text(`Pílulas Anticoncepcionais`, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += 5;
            doc.text(`Injetáveis (mensal/trimestral)`, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += 7;

            const metodosOrientacao = "Cada método tem suas características, e podemos tirar as suas dúvidas e de sua filha.";
            splitText = doc.splitTextToSize(metodosOrientacao, contentAreaWidth);
            doc.text(splitText, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += (splitText.length * 4.8) + 5;

            doc.setFont("helvetica", "bold");
            const apoioText1 = "Sua filha precisa de apoio? Converse abertamente com ela sobre as formas de prevenção. O diálogo e a informação são fundamentais.";
            splitText = doc.splitTextToSize(apoioText1, contentAreaWidth);
            doc.text(splitText, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += (splitText.length * 4.8) + 7;

            doc.setFont("helvetica", "normal"); // Reset bold for the next line if it's not bold
            doc.setTextColor(29, 112, 184); // Cor primária para o CTA
            const ctaText = "Venha em consulta com sua equipe de saúde para mais informações.";
            splitText = doc.splitTextToSize(ctaText, contentAreaWidth);
            doc.text(splitText, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            currentY += (splitText.length * 4.8) + 5;

            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 51, 51); // Reset color to default text color for bold
            const ctaText2 = "Não precisa tirar ficha.";
            splitText = doc.splitTextToSize(ctaText2, contentAreaWidth);
            doc.text(splitText, currentXStart + informativoWidth / 2, currentY, { align: 'center' });
            // currentY += (splitText.length * 4.8); // No increment needed if it's the last text before footer

            // Footer do informativo
            // Linha do rodapé removida conforme solicitado
        });

        doc.output('dataurlnewwindow');
    }


    // Inicialização
    fetchEquipesEAgentes();
    initCharts(); // Inicializa as instâncias dos gráficos
    fetchTimelineData(); // Carrega dados da timeline na inicialização

    // Define a ordenação padrão e atualiza o texto do botão
    currentTimelineSort = 'proxima_acao_asc'; // Define a ordenação padrão
    if (timelineSortBtnText) {
        const defaultSortOption = document.querySelector(`.timeline-sort-option[data-sort="${currentTimelineSort}"]`);
        if (defaultSortOption && defaultSortOption.dataset.text) {
            timelineSortBtnText.textContent = defaultSortOption.dataset.text;
        } else {
            timelineSortBtnText.textContent = 'Ordenação'; // Fallback se a opção não for encontrada ou não tiver data-text
        }
    }

    // A primeira chamada a fetchEstatisticas (dentro de fetchEquipesEAgentes) já vai chamar atualizarLabelsDosCards.


    // --- Event Listeners para a Tabela de Timeline ---
    if (searchTimelineInput) {
        searchTimelineInput.addEventListener('keyup', function (event) {
            if (event.key === 'Enter') {
                currentTimelineSearch = this.value;
                currentTimelinePage = 1;
                fetchTimelineData();
            }
        });
    }


    timelineStatusFilterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Define o botão clicado como ativo e os outros como inativos
            timelineStatusFilterButtons.forEach(btn => {
                // Resetar para estado padrão inativo primeiro
                btn.classList.remove(
                    // Cores de fundo ativas
                    'bg-primary', 'bg-green-500', 'bg-red-500', 'bg-yellow-400', 'bg-pink-500', 'bg-purple-500',
                    // Cores de texto ativas
                    'text-white', 'text-yellow-800',
                    // Cores de borda ativas
                    'border-primary', 'border-green-500', 'border-red-500', 'border-yellow-400', 'border-pink-500', 'border-purple-500'
                );

                if (btn === this) {
                    // Ativa o botão clicado
                    console.log('Ativando aba:', this.textContent, 'com classes:', this.dataset.activeBg, this.dataset.activeText, this.dataset.activeBorder);
                    
                    // Remove classes inativas primeiro
                    btn.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'bg-transparent', 'active-todos');
                    
                    // Se for a aba "Todos", aplica classe personalizada
                    if (this.id === 'timeline-filter-todos') {
                        btn.classList.add('active-todos');
                    } else {
                        // Aplica classes ativas normais para outras abas
                        btn.classList.add(this.dataset.activeBg, this.dataset.activeText, this.dataset.activeBorder);
                    }
                } else {
                    // Aplica estilo inativo para outros botões
                    btn.classList.remove('text-white', 'active-todos'); // Remove texto branco e classe personalizada se existir
                    btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'bg-transparent');
                }
            });




            currentTimelineStatusFilter = this.dataset.statusFilter;
            currentTimelinePage = 1;
            fetchTimelineData();
        });
    });
    // Ativar o filtro "Todos" inicialmente
    if (document.getElementById('timeline-filter-todos')) {
        document.getElementById('timeline-filter-todos').click();
    }

    // Configurar dropdown de filtro de próxima ação
    const proximaAcaoFilterBtn = document.getElementById('proximaAcaoFilterBtn');
    const proximaAcaoFilterText = document.getElementById('proximaAcaoFilterText');
    const proximaAcaoFilterDropdown = document.getElementById('proximaAcaoFilterDropdown');
    const proximaAcaoFilterOptions = document.querySelectorAll('.proxima-acao-filter-option');

    if (proximaAcaoFilterBtn) {
        proximaAcaoFilterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            proximaAcaoFilterDropdown.classList.toggle('hidden');
        });
    }

    proximaAcaoFilterOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            currentProximaAcaoFilter = e.currentTarget.dataset.acao;
            // Mostrar o texto da opção selecionada
            proximaAcaoFilterText.textContent = e.currentTarget.textContent.trim();
            currentTimelinePage = 1;
            fetchTimelineData();
            proximaAcaoFilterDropdown.classList.add('hidden');
        });
    });

    // Configurar dropdown de filtro de métodos
    const filtroMetodosBtn = document.getElementById('filtroMetodosBtn');
    const filtroMetodosText = document.getElementById('filtroMetodosText');
    const filtroMetodosDropdown = document.getElementById('filtroMetodosDropdown');
    const filtroMetodoOptions = document.querySelectorAll('.filtro-metodo-option');

    if (filtroMetodosBtn) {
        filtroMetodosBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filtroMetodosDropdown.classList.toggle('hidden');
        });
    }

    filtroMetodoOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            currentMetodoFilter = e.currentTarget.dataset.metodo;
            // Mostrar o texto da opção selecionada
            filtroMetodosText.textContent = e.currentTarget.textContent.trim();
            currentTimelinePage = 1;
            fetchTimelineData();
            filtroMetodosDropdown.classList.add('hidden');
        });
    });

    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', () => {
        if (proximaAcaoFilterDropdown) {
            proximaAcaoFilterDropdown.classList.add('hidden');
        }
        if (filtroMetodosDropdown) {
            filtroMetodosDropdown.classList.add('hidden');
        }
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
    timelineTableBody.addEventListener('click', function (event) {
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
        closeTimelineModalBtn.addEventListener('click', () => {
            timelineModal.classList.add('hidden');
            atualizarPainelCompleto(); // Atualiza a tabela e estatísticas
        });
    }
    if (closeTimelineModalFooterBtn) {
        closeTimelineModalFooterBtn.addEventListener('click', () => {
            timelineModal.classList.add('hidden');
            atualizarPainelCompleto(); // Atualiza a tabela e estatísticas
        });
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
        saveRegisterModalBtn.addEventListener('click', async function () {
            if (!currentAdolescenteForModal || !currentAdolescenteForModal.cod_paciente) {
                alert("Erro: Dados da adolescente não encontrados.");
                return;
            }

            const tipoAcaoRadio = registerModal.querySelector('input[name="action-type"]:checked');
            const dataAcaoInput = registerModal.querySelector('input[type="date"]'); // Primeira data é da ação atual
            const resultadoButton = document.getElementById('resultButton');
            const observacoesTextarea = registerModal.querySelector('textarea');
            const responsavelInput = document.getElementById('registerResponsibleInput');

            // Próxima Ação
            const proximaAcaoDataInput = registerModal.querySelectorAll('input[type="date"]')[1]; // Segunda data é da próxima ação
            const proximaAcaoTipoButton = document.getElementById('nextActionButton');

            // Capturar método selecionado, se visível
            const methodSection = document.getElementById('methodSection');
            const selectedMethodRadio = methodSection && !methodSection.classList.contains('hidden') ? 
                registerModal.querySelector('input[name="method-type"]:checked') : null;
            const selectedMethodName = selectedMethodRadio ? selectedMethodRadio.value : null;

            // Criar observações melhoradas
            let observacoesEnhanced = observacoesTextarea ? observacoesTextarea.value.trim() : '';
            
            // Adicionar informações do resultado à observação
            const resultText = resultadoButton.querySelector('span') ? resultadoButton.querySelector('span').textContent : '';
            const tipoText = tipoAcaoRadio ? tipoAcaoRadio.parentElement.textContent.trim() : '';
            
            if (resultText && resultText !== 'Selecione o resultado') {
                observacoesEnhanced += observacoesEnhanced ? ` | Resultado: ${resultText}` : `Resultado: ${resultText}`;
            }
            
            if (selectedMethodName) {
                observacoesEnhanced += observacoesEnhanced ? ` | Método: ${selectedMethodName}` : `Método: ${selectedMethodName}`;
            }

            const payload = {
                co_cidadao: currentAdolescenteForModal.cod_paciente,
                nome_adolescente: currentAdolescenteForModal.nome_paciente,
                nome_responsavel_atual: currentAdolescenteForModal.nome_responsavel,
                acao_atual: {
                    tipo_abordagem: tipoAcaoRadio ? parseInt(tipoAcaoRadio.value) : null,
                    data_acao: dataAcaoInput ? dataAcaoInput.value : null,
                    resultado_abordagem: resultadoButton.dataset.selectedValue ? parseInt(resultadoButton.dataset.selectedValue) : null,
                    observacoes: observacoesEnhanced,
                    responsavel_pela_acao: responsavelInput ? responsavelInput.value.trim() : '',
                    metodo_escolhido: selectedMethodName // Adicionar método ao payload
                }
            };

            if (proximaAcaoDataInput && proximaAcaoDataInput.value && proximaAcaoTipoButton.dataset.selectedValue) {
                // Mapear o código do tipo para o texto correto
                const tipoCode = proximaAcaoTipoButton.dataset.selectedValue;
                const tipoTextoMap = {
                    '1': 'Abordagem com pais',
                    '2': 'Abordagem direta com adolescente',
                    '3': 'Iniciar método na UBS', 
                    '5': 'Mudou de área',
                    '6': 'Iniciar método em domicílio',
                    '7': 'Remover do acompanhamento',
                    '8': 'Atualizar no PEC'
                };
                
                // Usar o mapeamento ao invés de depender do texto do DOM
                let proximaAcaoObs = tipoTextoMap[tipoCode] || `Ação tipo ${tipoCode}`;
                
                // Debug
                console.log('Código da próxima ação:', tipoCode);
                console.log('Texto mapeado:', proximaAcaoObs);
                
                // Adicionar contexto baseado na ação atual
                if (selectedMethodName && (resultText === 'Deseja iniciar um método contraceptivo')) {
                    proximaAcaoObs += ` (Método escolhido: ${selectedMethodName})`;
                }
                
                payload.proxima_acao = {
                    tipo_abordagem: parseInt(proximaAcaoTipoButton.dataset.selectedValue),
                    data_acao: proximaAcaoDataInput.value,
                    responsavel_pela_acao: responsavelInput ? responsavelInput.value.trim() : '',
                    observacoes: proximaAcaoObs,
                    resultado_abordagem: null
                };
                
                console.log('Payload próxima ação:', payload.proxima_acao);
            }

            if (!payload.acao_atual.tipo_abordagem || !payload.acao_atual.data_acao || !payload.acao_atual.responsavel_pela_acao) {
                alert("Por favor, preencha: Tipo de ação, Data da ação e Responsável pela ação.");
                return;
            }
            // Validação para resultado da abordagem, se um tipo de ação que o requer for selecionado
            if (payload.acao_atual.tipo_abordagem !== 4 && payload.acao_atual.tipo_abordagem !== 7 && !payload.acao_atual.resultado_abordagem) { // Se não for "Entrega de convite" nem "Remover do acompanhamento"
                alert("Por favor, selecione o Resultado da abordagem.");
                return;
            }


            try {
                const response = await fetch('/api/adolescente/registrar_acao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (response.ok && result.sucesso) {
                    alert(result.mensagem || "Ação registrada com sucesso!");
                    if (registerModal) registerModal.classList.add('hidden');

                    // Limpar o formulário após o sucesso
                    const form = registerModal.querySelector('form'); // Adicione uma tag <form> no HTML se não houver
                    if (form) form.reset();
                    if (resultadoButton.querySelector('span')) resultadoButton.querySelector('span').textContent = 'Selecione o resultado';
                    delete resultadoButton.dataset.selectedValue;
                    if (proximaAcaoTipoButton.querySelector('span')) proximaAcaoTipoButton.querySelector('span').textContent = 'Selecione o tipo';
                    delete proximaAcaoTipoButton.dataset.selectedValue;
                    const methodSection = document.getElementById('methodSection');
                    if (methodSection) methodSection.classList.add('hidden');
                    if (responsavelInput) responsavelInput.value = '';


                    // Reabrir e atualizar o modal da timeline
                    abrirModalTimeline(currentAdolescenteForModal.cod_paciente);
                    fetchTimelineData(); // Atualiza a tabela principal também
                } else {
                    alert(`Falha ao registrar ação: ${result.erro || 'Erro desconhecido.'}`);
                }
            } catch (error) {
                console.error("Erro ao salvar ação:", error);
                alert("Erro de comunicação ao salvar ação.");
            }
        });
    }

    if (imprimirInformativosMaeBtn) {
        imprimirInformativosMaeBtn.addEventListener('click', () => {
            const selectedAdolescentCodes = [];
            document.querySelectorAll('.imprimir-informativo-mae-checkbox:checked').forEach(checkbox => {
                selectedAdolescentCodes.push(checkbox.dataset.codPaciente);
            });

            if (selectedAdolescentCodes.length === 0) {
                alert("Por favor, selecione pelo menos uma adolescente na coluna 'Imprimir Informativo' para gerar os PDFs.");
                return;
            }
            const adolescentesParaInformativo = currentFetchedTimelineAdolescents.filter(ado => selectedAdolescentCodes.includes(String(ado.cod_paciente)));
            generateMotherInformativePDF(adolescentesParaInformativo);
        });
    }
});
