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
            // atualizarLabelsDosCards(); // Já chamado no finally de fetchEstatisticas
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
                    // atualizarLabelsDosCards(); // Já chamado no finally de fetchEstatisticas
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
                    // atualizarLabelsDosCards(); // Já chamado no finally de fetchEstatisticas
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
                        // atualizarLabelsDosCards(); // Já chamado no finally de fetchEstatisticas
                    });
                    equipeDropdownContent.appendChild(option);
                });

                // Carrega estatísticas iniciais para "Todas as equipes"
                fetchEstatisticas();
            })
            .catch(error => console.error('Erro de rede ao buscar equipes e agentes:', error));
    }

    // Inicialização
    fetchEquipesEAgentes();
    // A primeira chamada a fetchEstatisticas (dentro de fetchEquipesEAgentes) já vai chamar atualizarLabelsDosCards.
});
