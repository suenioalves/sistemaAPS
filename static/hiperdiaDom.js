// hiperdiaDom.js
// Este módulo contém funções para manipulação do DOM no painel Hiperdia.

const _elements = {}; // Objeto para armazenar referências aos elementos do DOM

export const hiperdiaDom = {
    /**
     * Inicializa e armazena referências a todos os elementos do DOM necessários.
     * Deve ser chamado uma vez no início do script principal.
     */
    initDomElements: () => {
        _elements.equipeButton = document.getElementById('hiperdia-equipe-button');
        _elements.equipeButtonText = document.getElementById('hiperdia-equipe-button-text');
        _elements.equipeDropdown = document.getElementById('hiperdia-equipe-dropdown');
        _elements.equipeDropdownContent = document.getElementById('hiperdia-equipe-dropdown-content');

        _elements.microareaButton = document.getElementById('hiperdia-microarea-button');
        _elements.hipertensosCard = document.getElementById('hipertensosCard');
        _elements.compensadosCard = document.getElementById('compensadosCard');
        _elements.descompensadosCard = document.getElementById('descompensadosCard');
        _elements.revisaoCard = document.getElementById('revisaoCard');
        _elements.microareaButtonText = document.getElementById('hiperdia-microarea-button-text');
        _elements.microareaDropdown = document.getElementById('hiperdia-microarea-dropdown');
        _elements.microareaDropdownContent = document.getElementById('hiperdia-microarea-dropdown-content');

        _elements.tabelaPacientesBody = document.getElementById('hiperdia-tabela-pacientes-body');
        _elements.paginationContainer = document.getElementById('hiperdia-pagination-container');
        _elements.paginationInfo = document.getElementById('hiperdia-pagination-info');
        _elements.searchInput = document.getElementById('hiperdia-search-input');
        _elements.hiperdiaTimelineTitle = document.getElementById('hiperdiaTimelineTitle');
        _elements.acompanhamentoHipertensosTitle = document.getElementById('acompanhamentoHipertensosTitle');
        _elements.statusFilterButtons = document.querySelectorAll('.hiperdia-status-tab-btn');

        // Modal da Linha do Tempo
        _elements.timelineModal = document.getElementById('hiperdia-timelineModal');
        _elements.closeTimelineModal = document.getElementById('hiperdia-closeTimelineModal');
        _elements.closeTimelineModalBtn = document.getElementById('hiperdia-closeTimelineModalBtn');
        _elements.timelineRegisterBtn = document.getElementById('hiperdia-timelineRegisterBtn');
        _elements.timelineModalTitle = document.getElementById('hiperdia-timelineModalTitle');
        _elements.timelineModalAvatarIniciais = document.getElementById('hiperdia-timelineModalAvatarIniciais');
        _elements.timelineModalPacienteNome = document.getElementById('hiperdia-timelineModalPacienteNome');
        _elements.timelineModalPacienteIdade = document.getElementById('hiperdia-timelineModalPacienteIdade');
        _elements.timelineModalMicroarea = document.getElementById('hiperdia-timelineModalMicroarea');
        _elements.timelineModalEquipe = document.getElementById('hiperdia-timelineModalEquipe');
        _elements.timelineModalStatus = document.getElementById('hiperdia-timelineModalStatus');
        _elements.timelineModalUltimaPA = document.getElementById('hiperdia-timelineModalUltimaPA');
        _elements.timelineModalRiscoCV = document.getElementById('hiperdia-timelineModalRiscoCV');
        _elements.timelineModalProximaAcao = document.getElementById('hiperdia-timelineModalProximaAcao');
        _elements.timelineModalContentArea = document.getElementById('hiperdia-timelineModalContentArea');

        // Modal de Registro de Ação
        _elements.registerModal = document.getElementById('hiperdia-registerModal');
        _elements.closeRegisterModal = document.getElementById('hiperdia-closeRegisterModal');
        _elements.cancelRegisterBtn = document.getElementById('hiperdia-cancelRegisterBtn');
        _elements.saveRegisterModalBtn = document.getElementById('hiperdia-saveRegisterModalBtn');
        _elements.registerModalTitle = document.getElementById('hiperdia-registerModalTitle');
        _elements.actionTypeTabs = document.querySelectorAll('.action-type-tab');
        _elements.mrpaSection = document.getElementById('hiperdia-mrpaSection');
        _elements.medicationSection = document.getElementById('hiperdia-medicationSection');
        _elements.labExamsSection = document.getElementById('hiperdia-labExamsSection');
        _elements.imageExamsSection = document.getElementById('hiperdia-imageExamsSection');
        _elements.nutritionSection = document.getElementById('hiperdia-nutritionSection');
        _elements.cardiologySection = document.getElementById('hiperdia-cardiologySection');
        _elements.riskSection = document.getElementById('hiperdia-riskSection');
        _elements.dataAcaoAtualInput = document.getElementById('hiperdia-data-acao-atual');
        _elements.hiperdiaObservacoes = document.getElementById('hiperdia-observacoes');
        _elements.hiperdiaRegisterForm = document.getElementById('hiperdia-registerForm');

        // Campos específicos do MRPA
        _elements.mrpaSistolica = document.getElementById('hiperdia-mrpa-sistolica');
        _elements.mrpaDiastolica = document.getElementById('hiperdia-mrpa-diastolica');
        _elements.mrpaAnalise = document.getElementById('hiperdia-mrpa-analise');
        _elements.mrpaDecisionBtns = document.querySelectorAll('.mrpa-decision-btn');

        // Campos específicos de Modificar Tratamento
        _elements.medicationTypeRadios = document.querySelectorAll('input[name="medication-type"]');
        _elements.medicamentosAtuaisCards = document.getElementById('hiperdia-medicamentos-atuais-cards');
        _elements.novosMedicamentos = document.getElementById('hiperdia-novos-medicamentos');

        // Campos específicos de Avaliar Exames
        _elements.colesterolTotal = document.getElementById('hiperdia-colesterol-total');
        _elements.hdl = document.getElementById('hiperdia-hdl');
        _elements.ldl = document.getElementById('hiperdia-ldl');
        _elements.triglicerideos = document.getElementById('hiperdia-triglicerideos');
        _elements.glicemiaJejum = document.getElementById('hiperdia-glicemia-jejum');
        _elements.hemoglobinaGlicada = document.getElementById('hiperdia-hemoglobina-glicada');
        _elements.ureia = document.getElementById('hiperdia-ureia');
        _elements.creatinina = document.getElementById('hiperdia-creatinina');
        _elements.sodio = document.getElementById('hiperdia-sodio');
        _elements.potassio = document.getElementById('hiperdia-potassio');
        _elements.acidoUrico = document.getElementById('hiperdia-acido-urico');

        // Campos específicos de Avaliar RCV
        _elements.riscoIdade = document.getElementById('hiperdia-risco-idade');
        _elements.genderRadios = document.querySelectorAll('input[name="gender"]');
        _elements.smokingRadios = document.querySelectorAll('input[name="smoking"]');
        _elements.diabetesRadios = document.querySelectorAll('input[name="diabetes"]');
        _elements.riscoColesterolTotal = document.getElementById('hiperdia-risco-colesterol-total');
        _elements.riscoPas = document.getElementById('hiperdia-risco-pas');

        // Campos específicos de Nutrição
        _elements.peso = document.getElementById('hiperdia-peso');
        _elements.imc = document.getElementById('hiperdia-imc');
        _elements.circunferenciaAbdominal = document.getElementById('hiperdia-circunferencia-abdominal');
        _elements.orientacoesNutricionais = document.getElementById('hiperdia-orientacoes-nutricionais');
        _elements.hiperdiaResponsavelAcao = document.getElementById('hiperdia-responsavel-acao');

        // Expose elements for direct access from hiperdia_has_script.js
        Object.assign(hiperdiaDom, { elements: _elements });
    },

    /**
     * Atualiza o texto de um card de resumo.
     * @param {HTMLElement} element - O elemento HTML do card.
     * @param {string|number} value - O valor a ser exibido.
     */
    updateCard: (element, value) => {
        if (element) { // element is already the HTMLElement
            element.textContent = value !== undefined ? value : '-';
        }
    },

    /**
     * Atualiza o título principal do painel.
     * @param {string} equipe - Nome da equipe selecionada.
     * @param {string} microarea - Nome da microárea selecionada.
     * @param {Array<object>} todasEquipesComMicroareas - Dados de todas as equipes.
     */
    updateAcompanhamentoTitle: (equipe, microarea, todasEquipesComMicroareas) => {
        if (!_elements.acompanhamentoHipertensosTitle) return; // Use _elements.acompanhamentoHipertensosTitle
        // Mantém apenas o título principal, removendo a lógica do subtítulo da equipe/área.
        _elements.acompanhamentoHipertensosTitle.innerHTML = "Acompanhamento de Pacientes com Hipertensão";
     },

    /**
     * Atualiza o título da seção da linha do tempo com base nos filtros.
     * @param {string} equipe - Nome da equipe selecionada.
     * @param {string} microarea - Número da microárea selecionada.
     * @param {Array<object>} todasEquipesComMicroareas - Dados de todas as equipes.
     */
    updateTimelineTitle: (equipe, microarea, todasEquipesComMicroareas) => {
        if (!_elements.hiperdiaTimelineTitle) return;
        let mainTitleText = "Linha do Tempo de Acompanhamento";
        let subTitleText = "";

        if (equipe && equipe !== 'Todas') {
            subTitleText = ` - Equipe: ${equipe}`;
            const equipeAtual = todasEquipesComMicroareas.find(e => e.nome_equipe === equipe);
            if (equipeAtual && microarea && microarea !== 'Todas as áreas' && microarea !== 'Todas') {
                const agenteInfo = equipeAtual.agentes.find(ag => ag.micro_area === microarea);
                if (agenteInfo) {
                    subTitleText += ` - Área: ${agenteInfo.micro_area} - Agente: ${agenteInfo.nome_agente}`;
                }
            }
        }
        _elements.hiperdiaTimelineTitle.textContent = mainTitleText + subTitleText;
    },
    /**
     * Renderiza a tabela de pacientes.
     * @param {Array<object>} pacientes - Lista de pacientes.
     * @param {object} situacaoProblemaMap - Mapa de situação problema para display.
     */
    renderPacientesTable: (pacientes, situacaoProblemaMap) => {
        if (!_elements.tabelaPacientesBody) return; // Corrected: _elements.tabelaPacientesBody
        _elements.tabelaPacientesBody.innerHTML = ''; // Corrected: _elements.tabelaPacientesBody

        if (pacientes.length > 0) {
            pacientes.forEach(paciente => {
                const row = _elements.tabelaPacientesBody.insertRow();
                row.className = 'hover:bg-gray-50';
                
                const hasPendingAction = paciente.proxima_acao_descricao && paciente.proxima_acao_data_formatada;
                let proximaAcaoDisplay = 'A definir';
                if (paciente.proxima_acao_descricao) {
                    proximaAcaoDisplay = `${paciente.proxima_acao_descricao} <br> <span class="text-xs text-gray-400">(${paciente.proxima_acao_data_formatada || 'Data não definida'})</span>`;
                }

                const situacaoDisplay = situacaoProblemaMap[paciente.situacao_problema] || 'N/A';
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                            ${paciente.nome_paciente || 'N/A'}, ${paciente.idade_calculada || 'N/A'} anos
                            ${hasPendingAction ? '<i class="ri-time-line text-yellow-500 ml-1" title="Ação Pendente"></i>' : ''}
                        </div>
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
                _elements.tabelaPacientesBody.appendChild(row); // Corrected: _elements.tabelaPacientesBody
            });
        } else {
            _elements.tabelaPacientesBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum paciente encontrado.</td></tr>`;
        }
    },

    /**
     * Renderiza os controles de paginação.
     * @param {number} total - Total de resultados.
     * @param {number} page - Página atual.
     * @param {number} limit - Limite de itens por página.
     * @param {number} totalPages - Total de páginas.
     */
    renderPagination: (total, page, limit, totalPages) => {
        if (!_elements.paginationInfo || !_elements.paginationContainer) return;

        _elements.paginationInfo.innerHTML = '';
        _elements.paginationContainer.innerHTML = '';

        if (!total || totalPages <= 1) {
            return;
        }

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        _elements.paginationInfo.innerHTML = `Mostrando <span class="font-medium">${start}</span> a <span class="font-medium">${end}</span> de <span class="font-medium">${total}</span> resultados`;

        let paginationHtml = '';

        const createButton = (text, pageNum, isDisabled = false, isActive = false) => {
            const disabledClasses = isDisabled ? 'disabled:opacity-50' : '';
            const activeClasses = isActive ? 'bg-primary text-white' : 'border border-gray-300';
            const pageData = pageNum ? `data-page="${pageNum}"` : '';
            return `
                <button 
                    class="pagination-button ${activeClasses} rounded px-3 py-1 text-sm !rounded-button whitespace-nowrap ${disabledClasses}" 
                    ${pageData}
                    ${isDisabled ? 'disabled' : ''}>
                    ${text}
                </button>`;
        };
        
        const createEllipsis = () => {
            return `<span class="flex items-center px-1 py-1 text-sm text-gray-500">...</span>`;
        };

        // Botão Anterior
        paginationHtml += createButton('Anterior', page - 1, page === 1);

        const maxButtons = 5;
        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += createButton(i, i, false, i === page);
            }
        } else {
            const pageNumbers = [];
            if (page <= 3) {
                pageNumbers.push(1, 2, 3, '...', totalPages);
            } else if (page >= totalPages - 2) {
                pageNumbers.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
            } else {
                pageNumbers.push(1, '...', page, '...', totalPages);
            }

            pageNumbers.forEach(p => {
                if (p === '...') {
                    paginationHtml += createEllipsis();
                } else {
                    paginationHtml += createButton(p, p, false, p === page);
                }
            });
        }

        // Botão Próximo
        paginationHtml += createButton('Próximo', page + 1, page === totalPages);

        _elements.paginationContainer.innerHTML = paginationHtml;
    },

    /**
     * Configura o comportamento de um dropdown.
     * @param {HTMLElement} button - O botão que abre/fecha o dropdown.
     * @param {HTMLElement} dropdown - O elemento do dropdown.
     */
    setupDropdown: (button, dropdown) => {
        if (button && dropdown) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                document.querySelectorAll('.dropdown-menu.absolute').forEach(d => {
                    if (d !== dropdown) d.classList.add('hidden');
                });
                dropdown.classList.toggle('hidden');
            });
        }
    },

    /**
     * Popula o dropdown de agentes/microáreas.
     * @param {Array<object>} agentesDaEquipe - Lista de agentes para a equipe selecionada.
     * @param {string} microareaSelecionadaAtual - A microárea atualmente selecionada.
     * @param {Function} onSelectCallback - Callback a ser executado ao selecionar uma opção.
     */
    populateAgentesDropdown: (agentesDaEquipe, microareaSelecionadaAtual, onSelectCallback) => {
        if (!_elements.microareaDropdownContent || !_elements.microareaButtonText) return;
        _elements.microareaDropdownContent.innerHTML = '';

        const todasOption = document.createElement('div');
        todasOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
        todasOption.textContent = 'Todas as áreas';
        todasOption.addEventListener('click', () => {
            _elements.microareaDropdown.classList.add('hidden'); // Fecha o dropdown
            onSelectCallback('Todas as áreas', 'Todas as áreas');
        });
        _elements.microareaDropdownContent.appendChild(todasOption);

        if (agentesDaEquipe && agentesDaEquipe.length > 0) {
            const microareasUnicas = {};
            agentesDaEquipe.forEach(ag => {
                if (!microareasUnicas[ag.micro_area]) {
                    microareasUnicas[ag.micro_area] = [];
                }
                if (ag.nome_agente) {
                    microareasUnicas[ag.micro_area].push(ag.nome_agente);
                }
            });

            Object.keys(microareasUnicas).sort().forEach(ma => {
                const option = document.createElement('div');
                option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                const nomeAgente = microareasUnicas[ma].length > 0 ? microareasUnicas[ma][0] : null;
                const displayText = nomeAgente ? `Área ${ma} - ${nomeAgente}` : `Área ${ma}`;
                option.textContent = displayText;
                option.addEventListener('click', () => {
                    _elements.microareaDropdown.classList.add('hidden'); // Fecha o dropdown
                    onSelectCallback(displayText, ma);
                });
                _elements.microareaDropdownContent.appendChild(option);
            });
        }
    },

    /**
     * Popula o dropdown de equipes.
     * @param {Array<object>} equipesData - Dados das equipes.
     * @param {string} equipeSelecionadaAtual - A equipe atualmente selecionada.
     * @param {Function} onSelectCallback - Callback a ser executado ao selecionar uma opção.
     */
    populateEquipesDropdown: (equipesData, equipeSelecionadaAtual, onSelectCallback) => {
        if (!_elements.equipeDropdownContent || !_elements.equipeButtonText) return;
        _elements.equipeDropdownContent.innerHTML = '';

        const todasEquipesOption = document.createElement('div');
        todasEquipesOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
        todasEquipesOption.textContent = 'Todas as Equipes';
        todasEquipesOption.addEventListener('click', () => {
            _elements.equipeDropdown.classList.add('hidden'); // Fecha o dropdown
            onSelectCallback('Todas as Equipes', 'Todas', []); // Passa nome, valor e agentes vazios
        });
         _elements.equipeDropdownContent.appendChild(todasEquipesOption);

        if (equipesData.length === 0) {
            const noEquipesOption = document.createElement('div');
            noEquipesOption.className = 'p-2 text-gray-500';
            noEquipesOption.textContent = 'Nenhuma equipe encontrada.';
           _elements.equipeDropdownContent.appendChild(noEquipesOption);
        } else {
            equipesData.forEach(equipe => {
                const option = document.createElement('div');
                option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                option.textContent = `${equipe.nome_equipe} (${equipe.num_pacientes || 0} pacientes)`;
                option.addEventListener('click', () => {
                    _elements.equipeDropdown.classList.add('hidden'); // Fecha o dropdown
                    onSelectCallback(equipe.nome_equipe, equipe.nome_equipe, equipe.agentes);
                });
                _elements.equipeDropdownContent.appendChild(option);
            });
        }
    },

    /**
     * Abre o modal da linha do tempo e preenche os dados do paciente.
     * @param {object} paciente - Objeto do paciente.
     */
    openTimelineModal: (paciente) => {
        if (!paciente || !_elements.timelineModal) return;

        _elements.timelineModalTitle.textContent = `Linha do Tempo - ${paciente.nome_paciente || 'Paciente'}`;
        _elements.timelineModalAvatarIniciais.textContent = hiperdiaDom.getIniciais(paciente.nome_paciente);
        _elements.timelineModalPacienteNome.textContent = paciente.nome_paciente || 'N/A';
        _elements.timelineModalPacienteIdade.textContent = `${paciente.idade_calculada || 'N/A'} anos`;
        _elements.timelineModalMicroarea.textContent = paciente.microarea || 'N/A';
        _elements.timelineModalEquipe.textContent = paciente.nome_equipe || 'N/A';

        const situacaoProblemaMap = { 0: 'Ativo', 1: 'Compensado' };
        _elements.timelineModalStatus.textContent = situacaoProblemaMap[paciente.situacao_problema] || 'N/A';
        _elements.timelineModalUltimaPA.textContent = 'N/A'; // Dados não disponíveis na view atual
        _elements.timelineModalRiscoCV.textContent = 'N/A'; // Dados não disponíveis na view atual
        _elements.timelinePeriodFilterButtons = document.querySelectorAll('.timeline-period-filter-btn');
        _elements.timelineModalProximaAcao.textContent = paciente.proxima_acao_descricao ? `${paciente.proxima_acao_descricao} (${paciente.proxima_acao_data_formatada})` : 'A definir';

        _elements.timelineModalContentArea.innerHTML = '<p class="text-center text-gray-500 py-8">Carregando histórico...</p>';
        _elements.timelineModal.classList.remove('hidden');
    },

    /**
     * Fecha o modal da linha do tempo.
     */
    closeTimelineModal: () => {
        if (_elements.timelineModal) _elements.timelineModal.classList.add('hidden');
     },
    /**
     * Atualiza o estilo dos botões de filtro de período da linha do tempo.
     * @param {HTMLElement} activeButton - O botão que deve ser marcado como ativo.
     */
    updateTimelinePeriodFilterButtons: (activeButton) => {
        _elements.timelinePeriodFilterButtons.forEach(btn => {
            btn.classList.remove('bg-primary', 'text-white');
            btn.classList.add('bg-white', 'text-gray-700', 'border', 'border-gray-300');
        });
        if (activeButton) {
            activeButton.classList.remove('bg-white', 'text-gray-700', 'border', 'border-gray-300');
            activeButton.classList.add('bg-primary', 'text-white');
        }
    },
    /**
     * Renderiza os eventos na linha do tempo.
     * @param {Array<object>} events - Lista de eventos da linha do tempo.
     * @param {Function} getIniciais - Função para obter iniciais.
     */
    renderTimelineEvents: (events, getIniciais) => {
        if (!_elements.timelineModalContentArea) return;
        _elements.timelineModalContentArea.innerHTML = '';
    
        if (!events || events.length === 0) {
            _elements.timelineModalContentArea.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum histórico de acompanhamento encontrado.</p>';
            return;
        }
    
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        _elements.timelineModalContentArea.appendChild(timelineLine);

        // Mapeamento de ícones para cada tipo de ação quando 'REALIZADA'
        const actionIcons = {
            1: 'ri-file-add-line',          // Solicitar MRPA
            2: 'ri-stethoscope-line',       // Avaliar MRPA
            3: 'ri-capsule-line',           // Modificar tratamento
            4: 'ri-test-tube-line',         // Solicitar Exames
            5: 'ri-file-search-line',       // Avaliar Exames
            6: 'ri-heart-2-line',           // Avaliar RCV
            7: 'ri-arrow-right-up-line',    // Encaminhar para nutrição
            8: 'ri-apple-line',             // Registrar consulta nutrição
            9: 'ri-calendar-check-line',    // Agendar novo acompanhamento
            'default': 'ri-check-double-line' // Fallback
        };
    
        events.forEach(evento => {
            let iconClass;
            let iconColorClass;
            let displayActionText = evento.dsc_acao;
            let statusDisplayText = `(${evento.status_acao})`;

            switch (evento.status_acao) {
                case 'PENDENTE':
                    if (evento.cod_acao === 9) { // Se for "Agendar novo acompanhamento"
                        iconClass = 'ri-calendar-check-line';
                        iconColorClass = 'bg-yellow-100 text-yellow-600';
                    } else {
                        iconClass = 'ri-time-line';
                        iconColorClass = 'bg-yellow-100 text-yellow-600';
                    }
                    break;
                case 'REALIZADA':
                    iconClass = actionIcons[evento.cod_acao] || actionIcons['default'];
                    if (evento.cod_acao === 9) { // Se for "Agendar novo acompanhamento"
                        iconClass = 'ri-calendar-check-line'; // Manter o ícone de calendário
                        iconColorClass = 'bg-yellow-100 text-yellow-600'; // Cor amarela
                    } else if (evento.cod_acao === 3) { // Se for "Modificar tratamento"
                        iconColorClass = 'bg-red-100 text-red-600'; // Usa a cor vermelha
                    } else {
                        iconColorClass = 'bg-green-100 text-green-600'; // Cor verde padrão para outras ações realizadas
                    }
                    if (evento.cod_acao === 2) { // Avaliar MRPA
                        displayActionText = "Analisar MRPA após 7 dias";
                        statusDisplayText = "(Ação concluída)";
                    }
                    break;
                case 'CANCELADA':
                    iconClass = 'ri-close-circle-line';
                    iconColorClass = 'bg-red-100 text-red-600';
                    break;
                default:
                    iconClass = 'ri-question-line';
                    iconColorClass = 'bg-gray-100 text-gray-600';
                    break;
            }

            const dataDisplay = evento.data_realizacao || evento.data_agendamento;
            const dataFormatada = dataDisplay ? new Date(dataDisplay + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Data não informada';
            
            const cardBorderClass = evento.status_acao === 'PENDENTE' ? 'border-2 border-yellow-400' : '';
    
            const cancelButtonHtml = evento.status_acao === 'PENDENTE'
                ? `<button class="cancel-action-btn text-xs text-red-500 hover:text-red-700 font-medium ml-4" data-cod-acompanhamento="${evento.cod_acompanhamento}">Cancelar</button>`
                : '';

            let examResultsHtml = '';
            if (evento.resultados_exames) {
                const results = evento.resultados_exames;
                const resultItems = [
                    { label: 'Colesterol Total', value: results.colesterol_total, unit: 'mg/dL' },
                    { label: 'HDL', value: results.hdl, unit: 'mg/dL' },
                    { label: 'LDL', value: results.ldl, unit: 'mg/dL' },
                    { label: 'Triglicerídeos', value: results.triglicerideos, unit: 'mg/dL' },
                    { label: 'Glicemia de Jejum', value: results.glicemia_jejum, unit: 'mg/dL' },
                    { label: 'Hb Glicada', value: results.hemoglobina_glicada, unit: '%' },
                    { label: 'Ureia', value: results.ureia, unit: 'mg/dL' },
                    { label: 'Creatinina', value: results.creatinina, unit: 'mg/dL' },
                    { label: 'Sódio', value: results.sodio, unit: 'mEq/L' },
                    { label: 'Potássio', value: results.potassio, unit: 'mEq/L' },
                    { label: 'Ácido Úrico', value: results.acido_urico, unit: 'mg/dL' },
                ];

                const filteredItems = resultItems.filter(item => item.value !== null && item.value !== undefined);

                if (filteredItems.length > 0) {
                    examResultsHtml = '<div class="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs">';
                    filteredItems.forEach(item => {
                        examResultsHtml += `
                            <div class="flex justify-between">
                                <span class="text-gray-600">${item.label}:</span>
                                <span class="font-medium text-gray-800">${item.value} ${item.unit}</span>
                            </div>
                        `;
                    });
                    examResultsHtml += '</div>';
                }
            }

            let treatmentDetailsHtml = '';
            if (evento.treatment_modification) {
                const details = evento.treatment_modification;
                treatmentDetailsHtml = `
                    <div class="mt-3 pt-3 border-t border-gray-200 text-xs">
                        <p class="font-medium text-gray-700 mb-1">Detalhes do Tratamento:</p>
                        <div class="flex justify-between mb-1">
                            <span class="text-gray-600">Tipo de Ajuste:</span>
                            <span class="font-medium text-gray-800">${details.tipo_ajuste || 'N/A'}</span>
                        </div>
                        ${details.medicamentos_novos ? `<div><span class="text-gray-600">Novas Medicações:</span><p class="font-medium text-gray-800 whitespace-pre-wrap">${details.medicamentos_novos}</p></div>` : ''}
                    </div>
                `;
            }

            let riskDetailsHtml = '';
            if (evento.risk_assessment_details) {
                const details = evento.risk_assessment_details;
                const riskItems = [
                    { label: 'Idade', value: details.idade, unit: 'anos' },
                    { label: 'Sexo', value: details.sexo, unit: '' },
                    { label: 'Tabagismo', value: details.tabagismo ? 'Sim' : 'Não', unit: '' },
                    { label: 'Diabetes', value: details.diabetes ? 'Sim' : 'Não', unit: '' },
                    { label: 'Colesterol Total', value: details.colesterol_total, unit: 'mg/dL' },
                    { label: 'Pressão Sistólica', value: details.pressao_sistolica, unit: 'mmHg' },
                ];

                riskDetailsHtml = '<div class="mt-3 pt-3 border-t border-gray-200 text-xs">';
                riskDetailsHtml += '<p class="font-medium text-gray-700 mb-1">Dados da Avaliação de Risco:</p>';
                riskDetailsHtml += '<div class="grid grid-cols-2 gap-x-4 gap-y-1">';
                
                riskItems.forEach(item => {
                    if (item.value !== null && item.value !== undefined) {
                        riskDetailsHtml += `
                            <div class="flex justify-between">
                                <span class="text-gray-600">${item.label}:</span>
                                <span class="font-medium text-gray-800">${item.value}${item.unit ? ' ' + item.unit : ''}</span>
                            </div>
                        `;
                    }
                });
                
                riskDetailsHtml += '</div></div>';
            }

            // Tabela de Risco Cardiovascular da OMS/OPAS (HEARTS nas Américas - AMR A, sem colesterol)
            // Fonte: https://www.paho.org/pt/hearts-americas/ferramentas-tecnicas-para-implementacao/calculadora-risco-cardiovascular
            const WHO_HEARTS_RISK_TABLE_AMR_A = {
                'masculino': {
                    '40-49': {
                        'non_smoker_no_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '<10%', '>=180': '<10%' },
                        'non_smoker_with_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '10-20%', '>=180': '20-30%' },
                        'smoker_no_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '10-20%', '>=180': '10-20%' },
                        'smoker_with_diabetes': { '<140': '10-20%', '140-159': '10-20%', '160-179': '20-30%', '>=180': '30-40%' }
                    },
                    '50-59': {
                        'non_smoker_no_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '10-20%', '>=180': '20-30%' },
                        'non_smoker_with_diabetes': { '<140': '10-20%', '140-159': '20-30%', '160-179': '30-40%', '>=180': '>40%' },
                        'smoker_no_diabetes': { '<140': '10-20%', '140-159': '10-20%', '160-179': '20-30%', '>=180': '30-40%' },
                        'smoker_with_diabetes': { '<140': '20-30%', '140-159': '30-40%', '160-179': '>40%', '>=180': '>40%' }
                    },
                    '60-69': {
                        'non_smoker_no_diabetes': { '<140': '<10%', '140-159': '10-20%', '160-179': '20-30%', '>=180': '30-40%' },
                        'non_smoker_with_diabetes': { '<140': '20-30%', '140-159': '30-40%', '160-179': '>40%', '>=180': '>40%' },
                        'smoker_no_diabetes': { '<140': '20-30%', '140-159': '20-30%', '160-179': '30-40%', '>=180': '>40%' },
                        'smoker_with_diabetes': { '<140': '30-40%', '140-159': '>40%', '160-179': '>40%', '>=180': '>40%' }
                    },
                    '70-74': {
                        'non_smoker_no_diabetes': { '<140': '10-20%', '140-159': '20-30%', '160-179': '30-40%', '>=180': '>40%' },
                        'non_smoker_with_diabetes': { '<140': '30-40%', '140-159': '>40%', '160-179': '>40%', '>=180': '>40%' },
                        'smoker_no_diabetes': { '<140': '30-40%', '140-159': '30-40%', '160-179': '>40%', '>=180': '>40%' },
                        'smoker_with_diabetes': { '<140': '>40%', '140-159': '>40%', '160-179': '>40%', '>=180': '>40%' }
                    }
                },
                'feminino': {
                    '40-49': {
                        'non_smoker_no_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '<10%', '>=180': '<10%' },
                        'non_smoker_with_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '<10%', '>=180': '10-20%' },
                        'smoker_no_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '10-20%', '>=180': '10-20%' },
                        'smoker_with_diabetes': { '<140': '<10%', '140-159': '10-20%', '160-179': '10-20%', '>=180': '20-30%' }
                    },
                    '50-59': {
                        'non_smoker_no_diabetes': { '<140': '<10%', '140-159': '<10%', '160-179': '10-20%', '>=180': '10-20%' },
                        'non_smoker_with_diabetes': { '<140': '10-20%', '140-159': '10-20%', '160-179': '20-30%', '>=180': '30-40%' },
                        'smoker_no_diabetes': { '<140': '<10%', '140-159': '10-20%', '160-179': '10-20%', '>=180': '20-30%' },
                        'smoker_with_diabetes': { '<140': '10-20%', '140-159': '20-30%', '160-179': '30-40%', '>=180': '>40%' }
                    },
                    '60-69': {
                        'non_smoker_no_diabetes': { '<140': '<10%', '140-159': '10-20%', '160-179': '10-20%', '>=180': '20-30%' },
                        'non_smoker_with_diabetes': { '<140': '10-20%', '140-159': '20-30%', '160-179': '30-40%', '>=180': '>40%' },
                        'smoker_no_diabetes': { '<140': '10-20%', '140-159': '10-20%', '160-179': '20-30%', '>=180': '30-40%' },
                        'smoker_with_diabetes': { '<140': '20-30%', '140-159': '30-40%', '160-179': '>40%', '>=180': '>40%' }
                    },
                    '70-74': {
                        'non_smoker_no_diabetes': { '<140': '10-20%', '140-159': '10-20%', '160-179': '20-30%', '>=180': '30-40%' },
                        'non_smoker_with_diabetes': { '<140': '20-30%', '140-159': '30-40%', '160-179': '>40%', '>=180': '>40%' },
                        'smoker_no_diabetes': { '<140': '10-20%', '140-159': '20-30%', '160-179': '30-40%', '>=180': '>40%' },
                        'smoker_with_diabetes': { '<140': '30-40%', '140-159': '>40%', '160-179': '>40%', '>=180': '>40%' }
                    }
                }
            };

            // Funções auxiliares para mapear valores para as chaves da tabela
            const getAgeRange = (age) => {
                if (age < 50) return '40-49';
                if (age < 60) return '50-59';
                if (age < 70) return '60-69';
                return '70-74';
            };
            const getSbpRange = (sbp) => {
                if (sbp < 140) return '<140';
                if (sbp < 160) return '140-159';
                if (sbp < 180) return '160-179';
                return '>=180';
            };

            // Função principal para calcular o risco com base na tabela da OMS
            const calculateHeartsRiskScore = (details) => {
                if (!details || !details.idade || !details.sexo || !details.pressao_sistolica) {
                    return { percentage: 'Dados insuficientes', level: 'Indeterminado', pointerPosition: '0%' };
                }

                const sexKey = details.sexo.toLowerCase();
                const ageKey = getAgeRange(details.idade);
                const sbpKey = getSbpRange(details.pressao_sistolica);
                const smokerKey = `${details.tabagismo ? 'smoker' : 'non_smoker'}_${details.diabetes ? 'with_diabetes' : 'no_diabetes'}`;

                const riskPercent = WHO_HEARTS_RISK_TABLE_AMR_A[sexKey]?.[ageKey]?.[smokerKey]?.[sbpKey] || 'N/A';

                let riskLevel = 'Indeterminado';
                let pointerPosition = '50%';

                if (riskPercent.includes('<10%')) { riskLevel = 'Baixo (<10%)'; pointerPosition = '15%'; }
                else if (riskPercent.includes('10-20%')) { riskLevel = 'Moderado (10-20%)'; pointerPosition = '38%'; }
                else if (riskPercent.includes('20-30%')) { riskLevel = 'Alto (20-30%)'; pointerPosition = '62%'; }
                else if (riskPercent.includes('30-40%')) { riskLevel = 'Muito Alto (30-40%)'; pointerPosition = '85%'; }
                else if (riskPercent.includes('>40%')) { riskLevel = 'Crítico (>40%)'; pointerPosition = '95%'; }

                return { percentage: riskPercent, level: riskLevel, pointerPosition };
            };

            let riskBarHtml = '';
            if (evento.risk_assessment_details) {
                const riskResult = calculateHeartsRiskScore(evento.risk_assessment_details);

                riskBarHtml = `
                    <div class="mt-3 pt-3 border-t border-gray-200 text-xs">
                        <p class="font-medium text-gray-700 mb-2">Risco Cardiovascular (HEARTS):</p>
                        <div class="relative w-full h-4 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-500 to-red-500">
                            <div class="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-gray-800" style="left: ${riskResult.pointerPosition}; transform: translateX(-50%) translateY(-50%);"></div>
                        </div>
                        <p class="text-center text-gray-600 mt-1">Risco em 10 anos: <span class="font-semibold">${riskResult.level}</span></p>
                    </div>
                `;
            }

            let mrpaDetailsHtml = '';
            if (evento.mrpa_details) {
                const details = evento.mrpa_details;
                mrpaDetailsHtml = `
                    <div class="mt-3 pt-3 border-t border-gray-200 text-xs">
                        <p class="font-medium text-gray-700 mb-1">Resultados do MRPA:</p>
                        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Média Sistólica:</span>
                                <span class="font-medium text-gray-800">${details.media_pa_sistolica || 'N/A'} mmHg</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Média Diastólica:</span>
                                <span class="font-medium text-gray-800">${details.media_pa_diastolica || 'N/A'} mmHg</span>
                            </div>
                        </div>
                        ${details.analise_mrpa ? `<div class="mt-2"><p class="text-gray-600">Análise:</p><p class="font-medium text-gray-800 whitespace-pre-wrap">${details.analise_mrpa}</p></div>` : ''}
                    </div>
                `;
            }

            let nutritionDetailsHtml = '';
            if (evento.nutrition_details) {
                const details = evento.nutrition_details;
                const nutritionItems = [
                    { label: 'Peso', value: details.peso, unit: 'kg' },
                    { label: 'IMC', value: details.imc, unit: 'kg/m²' },
                    { label: 'Circ. Abdominal', value: details.circunferencia_abdominal, unit: 'cm' },
                ];

                nutritionDetailsHtml = '<div class="mt-3 pt-3 border-t border-gray-200 text-xs">';
                nutritionDetailsHtml += '<p class="font-medium text-gray-700 mb-1">Dados da Consulta de Nutrição:</p>';
                nutritionDetailsHtml += '<div class="grid grid-cols-3 gap-x-4 gap-y-1">';
                nutritionItems.forEach(item => {
                    if (item.value !== null && item.value !== undefined) {
                        nutritionDetailsHtml += `
                            <div class="flex flex-col items-center">
                                <span class="text-gray-600">${item.label}</span>
                                <span class="font-bold text-gray-800">${item.value}${item.unit ? ' ' + item.unit : ''}</span>
                            </div>
                        `;
                    }
                });
                nutritionDetailsHtml += '</div>';
                if (details.orientacoes_nutricionais) {
                    nutritionDetailsHtml += `<div class="mt-2"><p class="text-gray-600">Orientações:</p><p class="font-medium text-gray-800 whitespace-pre-wrap">${details.orientacoes_nutricionais}</p></div>`;
                }
                nutritionDetailsHtml += '</div>';
            }

            let nextAccompanimentHtml = '';
            if (evento.next_accompaniment_details) {
                const details = evento.next_accompaniment_details;
                nextAccompanimentHtml = `
                    <div class="mt-3 pt-3 border-t border-gray-200 text-xs">
                        <p class="font-medium text-gray-700 mb-1">Próximo Acompanhamento Agendado:</p>
                        <p class="text-gray-600">Tipo: <span class="font-medium text-gray-800">${details.dsc_acao}</span></p>
                        <p class="text-gray-600">Data: <span class="font-medium text-gray-800">${details.data_agendamento || 'N/A'}</span></p>
                    </div>
                `;
            }

            let adjustedActionText = evento.dsc_acao;
            let adjustedStatusDisplay = `(${evento.status_acao})`;

            // Garante que adjustedActionText seja inicializado
            if (typeof adjustedActionText === 'undefined') {
                adjustedActionText = evento.dsc_acao || 'Ação não especificada';
            }

            // Custom logic for display based on user requirements
            if (evento.cod_acao === 9 && evento.status_acao === 'PENDENTE') {
                adjustedActionText = "Agendado Hiperdia";
                adjustedStatusDisplay = "(Pendente)";
                iconClass = 'ri-calendar-check-line';
                iconColorClass = 'bg-yellow-100 text-yellow-600';
            } else if (evento.cod_acao === 9 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Iniciado Hiperdia";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-calendar-check-line'; // Keep calendar icon
                iconColorClass = 'bg-green-100 text-green-600'; // Change to green
            } else if (evento.cod_acao === 1 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Solicitar MRPA";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-file-add-line';
                iconColorClass = 'bg-green-100 text-green-600';
            } else if (evento.cod_acao === 2 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Avaliar MRPA";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-stethoscope-line';
                iconColorClass = 'bg-green-100 text-green-600';
            } else if (evento.cod_acao === 3 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Modificar Tratamento";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-capsule-line'; // Keep capsule icon
                iconColorClass = 'bg-green-100 text-green-600'; // Change to green
            } else if (evento.cod_acao === 4 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Solicitar Exames";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-test-tube-line';
                iconColorClass = 'bg-green-100 text-green-600';
            } else if (evento.cod_acao === 5 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Avaliar Exames";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-file-search-line';
                iconColorClass = 'bg-green-100 text-green-600';
            } else if (evento.cod_acao === 6 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Avaliar RCV";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-heart-2-line';
                iconColorClass = 'bg-green-100 text-green-600';
            } else if (evento.cod_acao === 7 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Encaminhar Nutrição";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-arrow-right-up-line';
                iconColorClass = 'bg-green-100 text-green-600';
            } else if (evento.cod_acao === 8 && evento.status_acao === 'REALIZADA') {
                adjustedActionText = "Registrar Nutrição";
                adjustedStatusDisplay = "(Realizada)";
                iconClass = 'ri-apple-line';
                iconColorClass = 'bg-green-100 text-green-600';
            } else { // Default icons and colors for PENDENTE and CANCELADA or other cases
                switch (evento.status_acao) {
                    case 'PENDENTE':
                        iconClass = 'ri-time-line';
                        iconColorClass = 'bg-yellow-100 text-yellow-600';
                        break;
                    case 'CANCELADA':
                        iconClass = 'ri-close-circle-line';
                        iconColorClass = 'bg-red-100 text-red-600';
                        break;
                    default:
                        iconClass = actionIcons[evento.cod_acao] || actionIcons['default'];
                        iconColorClass = 'bg-gray-100 text-gray-600';
                        break;
                }
            }

            const eventHtml = `
                <div class="flex mb-8 relative">
                    <div class="w-12 h-12 rounded-full ${iconColorClass} flex items-center justify-center z-10 flex-shrink-0">
                        <div class="w-6 h-6 flex items-center justify-center"><i class="${iconClass} text-xl"></i></div>
                    </div>
                    <div class="ml-4 bg-white rounded-lg shadow p-4 flex-grow ${cardBorderClass}">
                        <div class="flex justify-between items-center mb-2">
                            <h5 class="font-medium">${adjustedActionText} <span class="text-xs">${adjustedStatusDisplay}</span></h5>
                            <div class="flex items-center">
                                <span class="text-sm text-gray-500">${dataFormatada}</span>
                                ${cancelButtonHtml}
                            </div>
                        </div>
                        ${evento.observacoes ? `<p class="text-sm text-gray-600 mb-2">${evento.observacoes.replace(/\n/g, '<br>')}</p>` : ''}
                        ${riskBarHtml}
                        ${evento.responsavel_pela_acao ? `
                            <div class="text-sm text-gray-500 mt-2">Profissional: <span class="font-medium text-gray-800">${evento.responsavel_pela_acao}</span></div>
                        ` : ''}
                        ${mrpaDetailsHtml}
                        ${treatmentDetailsHtml}
                        ${nextAccompanimentHtml}
                        ${nutritionDetailsHtml}
                        ${riskDetailsHtml}
                        ${examResultsHtml}
                    </div>
                </div>
            `;
            _elements.timelineModalContentArea.insertAdjacentHTML('beforeend', eventHtml);
        });
    },

    /**
     * Abre o modal de registro de ação e preenche os dados iniciais.
     * @param {object} paciente - Objeto do paciente.
     */
     openRegisterModal: (paciente) => {
        if (!paciente || !_elements.registerModal) return;

        _elements.registerModalTitle.textContent = `Registrar Nova Ação - ${paciente.nome_paciente}`;
        _elements.hiperdiaRegisterForm.reset(); // Limpa o formulário
        _elements.dataAcaoAtualInput.value = new Date().toISOString().split('T')[0]; // Data atual

        // Reset period filter to 'all' when opening the register modal
        // Reseta e ativa a primeira aba de ação
        if (_elements.actionTypeTabs && _elements.actionTypeTabs.length > 0) {
            _elements.actionTypeTabs.forEach((tab, index) => {
                tab.classList.remove('active', 'border-primary', 'bg-primary/10', 'text-primary');
                tab.classList.add('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                if (index === 0) {
                    tab.classList.add('active', 'border-primary', 'bg-primary/10', 'text-primary');
                    tab.classList.remove('border-gray-200', 'bg-white', 'hover:bg-gray-50', 'text-gray-600');
                }
            });
        }

        // Oculta todas as seções dinâmicas por padrão
        const sections = [
            _elements.mrpaSection, _elements.medicationSection, _elements.labExamsSection, _elements.imageExamsSection,
            _elements.nutritionSection, _elements.cardiologySection, _elements.riskSection, _elements.autoActionNotice, _elements.nextActionSection
        ];
        sections.forEach(section => {
            if (section) section.classList.add('hidden');
        });

        _elements.registerModal.classList.remove('hidden');
    },

    /**
     * Fecha o modal de registro de ação.
     */
    closeRegisterModal: () => {
        if (_elements.registerModal) _elements.registerModal.classList.add('hidden');
    },

    renderMedicamentosCards: (medicamentos) => {
        const container = _elements.medicamentosAtuaisCards;
        if (!container) return;

        container.innerHTML = '';
        if (medicamentos && medicamentos.length > 0) {
            medicamentos.forEach(med => {
                const card = document.createElement('div');
                card.className = 'bg-gray-100 p-2 rounded-lg text-xs';
                card.innerHTML = `<p class="font-semibold">${med.medicamento}</p><p>${med.posologia}</p>`;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="text-xs text-gray-500 col-span-2">Nenhum medicamento atual encontrado.</p>';
        }
    },

    /**
     * Obtém as iniciais de um nome.
     * @param {string} nome - Nome completo.
     * @returns {string} Iniciais.
     */
    getIniciais: (nome) => {
        if (!nome) return '--';
        const partes = nome.split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : partes[0][1] || '')).toUpperCase();
    },

    /**
     * Exibe ou oculta seções dinâmicas do formulário de registro com base no tipo de ação.
     * @param {string} selectedValue - O valor do tipo de ação selecionado.
     * @param {Date} dataAcaoAtual - A data da ação atual.
     */
    toggleRegisterSections: (selectedValue, dataAcaoAtual) => {
        const sections = [
            _elements.mrpaSection, _elements.medicationSection, _elements.labExamsSection, _elements.imageExamsSection,
            _elements.nutritionSection, _elements.cardiologySection, _elements.riskSection
        ];
        sections.forEach(section => {
            if (section) section.classList.add('hidden');
        });

        // Adiciona um novo elemento para a mensagem de ação automática se ainda não existir
        if (!_elements.autoActionNotice) {
            const form = document.getElementById('hiperdia-registerForm');
            if (form) {
                const newDiv = document.createElement('div');
                newDiv.id = 'hiperdia-autoActionNotice';
                newDiv.className = 'bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 hidden';
                form.insertBefore(newDiv, form.firstChild);
                _elements.autoActionNotice = newDiv;
            }
        }

        if (_elements.autoActionNotice) _elements.autoActionNotice.classList.add('hidden');

        switch (selectedValue) {
            case '1': // Solicitar MRPA
                // a) Ao agendar Hiperdia (ele fica como pendente).
                // b) ao chegar a data do hiperdia, ele automaticamente cria a acao Solicitar MRPA (como pendente), e o Agendar Hiperdia muda pra realizado e muda o texto para Iniciado Hiperdia, cor verde o icone
                // lembrando que se a data agendada para o Hiperdia for a mesma data de hoje, ele ja insere como Iniciado Hiperdia (realizado) e cria automaticamente a acao Solicitar MRPA (pendente).
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    if (!isNaN(dataAcaoAtual.getTime())) {
                        const dataProxima = new Date(dataAcaoAtual);
                        dataProxima.setDate(dataProxima.getDate() + 7);
                        const dataFormatada = dataProxima.toLocaleDateString('pt-BR');
                        _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Avaliar MRPA" será agendada para <strong>${dataFormatada}</strong>.`;
                    } else {
                        _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Avaliar MRPA" será agendada para 7 dias após a data da ação.`;
                    }
                }
                break;
            case '2': // Avaliar MRPA
                if (_elements.mrpaSection) _elements.mrpaSection.classList.remove('hidden');
                // c) ao avaliar MRPA (muda para realizada), e ai vai cria a proxima acao futura conforme a avaliacao.
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> A próxima ação será criada com base na decisão de manter ou modificar o tratamento.`;
                }
                break;
            case '3': // Modificar tratamento
                if (_elements.medicationSection) _elements.medicationSection.classList.remove('hidden');
                // d) se for modificar o tratamento, vai criar a acao futura Modificar o tratamento como pendente (para hoje mesmo).
                // e) ao modificar o tratamento, cria a acao futura, Solicitar MRPA pendente (para 30 dias depois) e ai volta pra o mesmo esquema do b). e ai vai repetir varias vezes se necessário conforme o tratamento seja modificado.
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    if (!isNaN(dataAcaoAtual.getTime())) {
                        const dataProxima = new Date(dataAcaoAtual);
                        dataProxima.setDate(dataProxima.getDate() + 30);
                        const dataFormatada = dataProxima.toLocaleDateString('pt-BR');
                        _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Solicitar MRPA" será agendada para <strong>${dataFormatada}</strong>.`;
                    } else {
                        _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Solicitar MRPA" será agendada para 30 dias após a data da ação.`;
                    }
                }
                break;
            case '4': // Solicitar Exames
                // f) se for manter o tratamento, criar a acao pendente solictar exames para hoje.
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    if (!isNaN(dataAcaoAtual.getTime())) {
                        const dataProxima = new Date(dataAcaoAtual);
                        dataProxima.setDate(dataProxima.getDate() + 15); // Avaliar exames em 15 dias
                        const dataFormatada = dataProxima.toLocaleDateString('pt-BR');
                        _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Avaliar Exames" será agendada para <strong>${dataFormatada}</strong>.`;
                    } else {
                        _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Avaliar Exames" será agendada para 15 dias após a data da ação.`;
                    }
                }
                break;
            case '5': // Avaliar Exames
                if (_elements.labExamsSection) _elements.labExamsSection.classList.remove('hidden');
                // e) ao avaliar exames cria a funcao futura avaliar RCV como pendente e Avaliar exames realizado.
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Avaliar RCV" será agendada para hoje.`;
                }
                break;
            case '6': // Avaliar RCV (Risco Cardiovascular)
                if (_elements.riskSection) _elements.riskSection.classList.remove('hidden');
                // f) ao avaliar RCV realizada, cria a acao futura encaminhar para a nutrição
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Encaminhar Nutrição" será agendada para hoje.`;
                }
                break;
            case '7': // Encaminhar Nutrição
                // Não cria ação futura diretamente de acordo com as especificações.
                // A ação 8 (Registrar Nutrição) cria a 9 (Agendar Hiperdia).
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Esta ação não gera uma ação futura automática.`;
                }
                break;
            case '8': // Registrar consulta nutrição
                if (_elements.nutritionSection) _elements.nutritionSection.classList.remove('hidden');
                // g) ao realizar a acao registrar nutrição, cria a acao futura Agendar Hiperdia (pendente)
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Uma ação para "Agendar Hiperdia" será agendada para hoje.`;
                }
                break;
            case '9': // Agendar Hiperdia
                if (_elements.autoActionNotice) {
                    _elements.autoActionNotice.classList.remove('hidden');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Normalize today to start of day
                    if (!isNaN(dataAcaoAtual.getTime())) {
                        const dataProxima = new Date(dataAcaoAtual);
                        // Se a data for hoje ou passada, já inicia o Hiperdia e agenda MRPA para hoje.
                        if (dataProxima <= today) {
                            _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> Se a data for hoje ou passada, o Hiperdia será iniciado e uma ação para "Solicitar MRPA" será agendada para hoje.`;
                        } else {
                            _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> O Hiperdia será agendado como pendente até a data selecionada.`;
                        }
                    } else {
                        _elements.autoActionNotice.innerHTML = `<strong>Ação Automática:</strong> O Hiperdia será agendado como pendente até a data selecionada.`;
                    }
                }
                break;
            default:
                // Nenhuma seção específica ou mensagem automática para outras ações
                break;
        }
    },

    /**
     * Obtém os valores dos campos de resultados de exames laboratoriais.
     * @returns {object} Objeto com os resultados dos exames.
     */
    getLabExamResults: () => {
        const getNumericValue = (element) => element && element.value !== '' ? Number(element.value) : null;
        return {
            colesterol_total: getNumericValue(_elements.colesterolTotal),
            hdl: getNumericValue(_elements.hdl),
            ldl: getNumericValue(_elements.ldl),
            triglicerideos: getNumericValue(_elements.triglicerideos),
            glicemia_jejum: getNumericValue(_elements.glicemiaJejum),
            hemoglobina_glicada: getNumericValue(_elements.hemoglobinaGlicada),
            ureia: getNumericValue(_elements.ureia),
            creatinina: getNumericValue(_elements.creatinina),
            sodio: getNumericValue(_elements.sodio),
            potassio: getNumericValue(_elements.potassio),
            acido_urico: getNumericValue(_elements.acidoUrico)
        };
    },

    /**
     * Obtém os valores dos campos de modificação de tratamento.
     * @returns {object} Objeto com os dados de modificação de tratamento.
     */
    getTreatmentModificationData: () => {
        const tipoAjuste = document.querySelector('input[name="medication-type"]:checked')?.value || null;
        return {
            tipo_ajuste: tipoAjuste,
            medicamentos_novos: _elements.novosMedicamentos.value || null
        };
    },

    /**
     * Obtém os valores dos campos de avaliação de risco cardiovascular.
     * @returns {object} Objeto com os dados de avaliação de risco.
     */
    getRiskAssessmentData: () => {
        console.log('[LOG] Iniciando getRiskAssessmentData');
        
        const getRadioValue = (name) => {
            const element = document.querySelector(`input[name="${name}"]:checked`);
            const value = element?.value || null;
            console.log(`[LOG] getRadioValue(${name}):`, value);
            return value;
        };
        
        const getBooleanValue = (name) => {
            const element = document.querySelector(`input[name="${name}"]:checked`);
            const value = element?.value === 'Sim';
            console.log(`[LOG] getBooleanValue(${name}):`, value);
            return value;
        };
        
        const getNumericValue = (element) => {
            const value = element && element.value !== '' ? parseInt(element.value) : null;
            console.log(`[LOG] getNumericValue(${element?.id || 'unknown'}):`, value);
            return value;
        };

        const result = {
            idade: getNumericValue(_elements.riscoIdade),
            sexo: getRadioValue('gender'),
            tabagismo: getBooleanValue('smoking'),
            diabetes: getBooleanValue('diabetes'),
            colesterol_total: getNumericValue(_elements.riscoColesterolTotal),
            pressao_sistolica: getNumericValue(_elements.riscoPas)
        };
        
        console.log('[LOG] Resultado final getRiskAssessmentData:', result);
        return result;
    },

    /**
     * Obtém os valores dos campos de consulta de nutrição.
     * @returns {object} Objeto com os dados da consulta de nutrição.
     */
    getNutritionData: () => {
        const getNumericValue = (element) => element && element.value !== '' ? Number(element.value) : null; // Corrected: _elements.peso
        return {
            peso: getNumericValue(_elements.peso), // Corrected: _elements.peso
            imc: getNumericValue(_elements.imc), // Corrected: _elements.imc
            circunferencia_abdominal: getNumericValue(_elements.circunferenciaAbdominal), // Corrected: _elements.circunferenciaAbdominal
            orientacoes_nutricionais: _elements.orientacoesNutricionais.value || null // Corrected: _elements.orientacoesNutricionais
        };
    },

    /**
     * Obtém os valores dos campos de MRPA.
     * @returns {object} Objeto com os dados do MRPA.
     */
    getMrpaResults: () => { // Corrected: _elements.mrpaSistolica
        const getNumericValue = (element) => element && element.value !== '' ? parseInt(element.value) : null; // Corrected: _elements.mrpaSistolica
        return {
            media_pa_sistolica: getNumericValue(_elements.mrpaSistolica), // Corrected: _elements.mrpaSistolica
            media_pa_diastolica: getNumericValue(_elements.mrpaDiastolica), // Corrected: _elements.mrpaDiastolica
            analise_mrpa: _elements.mrpaAnalise.value || null // Corrected: _elements.mrpaAnalise
        };
    },

    /**
     * Define o estado de carregamento do botão de salvar.
     * @param {boolean} isLoading - True para estado de carregamento, false caso contrário.
     */
    setSaveButtonLoading: (isLoading) => {
        if (_elements.saveRegisterModalBtn) { // Corrected: _elements.saveRegisterModalBtn
            _elements.saveRegisterModalBtn.disabled = isLoading; // Corrected: _elements.saveRegisterModalBtn
            _elements.saveRegisterModalBtn.textContent = isLoading ? 'Salvando...' : 'Salvar registro'; // Corrected: _elements.saveRegisterModalBtn
        }
    },

    /**
     * Define o estado de carregamento da tabela de pacientes.
     */
    setTableLoading: () => { // Corrected: _elements.tabelaPacientesBody
        if (_elements.tabelaPacientesBody) { // Corrected: _elements.tabelaPacientesBody
            _elements.tabelaPacientesBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Carregando...</td></tr>`; // Corrected: _elements.tabelaPacientesBody
        }
    },

    /**
     * Exibe uma mensagem de erro na tabela de pacientes.
     */
    setTableError: () => { // Corrected: _elements.tabelaPacientesBody
        if (_elements.tabelaPacientesBody) { // Corrected: _elements.tabelaPacientesBody
            _elements.tabelaPacientesBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>`; // Corrected: _elements.tabelaPacientesBody
        }
    },

    /**
     * Atualiza o estilo dos botões de filtro de status.
     * @param {HTMLElement} activeButton - O botão que deve ser marcado como ativo.
     */
    updateStatusFilterButtons: (activeButton) => { // Corrected: _elements.statusFilterButtons
        _elements.statusFilterButtons.forEach(btn => { // Corrected: _elements.statusFilterButtons
            btn.classList.remove(btn.dataset.activeBg, btn.dataset.activeText, btn.dataset.activeBorder);
            btn.classList.add(btn.dataset.inactiveBg, btn.dataset.inactiveText, btn.dataset.inactiveBorder);
        });
        if (activeButton) {
            activeButton.classList.remove(activeButton.dataset.inactiveBg, activeButton.dataset.inactiveText, activeButton.dataset.inactiveBorder);
            activeButton.classList.add(activeButton.dataset.activeBg, activeButton.dataset.activeText, activeButton.dataset.activeBorder);
        }
    }
};
