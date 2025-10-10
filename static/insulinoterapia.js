/**
 * JORNADA DA INSULINOTERAPIA
 * Sistema inteligente para acompanhamento do ajuste de insulina
 * Baseado na Diretriz Brasileira de Diabetes
 */

const JornadaInsulinoterapia = {
    // Estado atual da jornada
    pacienteAtual: null,
    faseAtual: null,
    registros: [],
    insulinas: [], // Insulinas ativas do paciente

    // Fases da jornada
    FASES: {
        PREPARACAO: 'Preparacao',
        FASE1_JEJUM: 'Fase1_Jejum',
        FASE2_MAPEAMENTO: 'Fase2_Mapeamento',
        FASE3_POS_REFEICOES: 'Fase3_Pos_Refeicoes',
        MANUTENCAO: 'Manutencao'
    },

    // Tipos de glicemia
    TIPOS_GLICEMIA: {
        JEJUM: 'Jejum',
        ANTES_ALMOCO: 'Antes_Almoco',
        APOS_ALMOCO_2H: '2h_Apos_Almoco',
        ANTES_JANTAR: 'Antes_Jantar',
        APOS_JANTAR_2H: '2h_Apos_Jantar',
        AO_DEITAR: 'Ao_Deitar'
    },

    // Metas glicêmicas
    METAS: {
        JEJUM_MIN: 80,
        JEJUM_MAX: 130,
        POS_PRANDIAL_MAX: 180,
        HIPOGLICEMIA: 70,
        ATENCAO_MIN: 70,
        ATENCAO_MAX: 79
    },

    /**
     * Inicializa a jornada para um paciente
     */
    async iniciar(paciente) {
        this.pacienteAtual = paciente;

        // Buscar dados da jornada e insulinas
        try {
            const [jornadaResponse, insulinasResponse] = await Promise.all([
                fetch(`/api/diabetes/insulinoterapia/${paciente.cod_paciente}`),
                fetch(`/api/diabetes/insulinas/${paciente.cod_paciente}`)
            ]);

            const jornadaData = await jornadaResponse.json();
            const insulinasData = await insulinasResponse.json();

            if (jornadaData.sucesso) {
                this.registros = jornadaData.registros || [];
                this.faseAtual = jornadaData.fase_atual || null;
            }

            if (insulinasData.sucesso) {
                this.insulinas = insulinasData.insulinas || [];
            }

            // Abrir modal
            this.abrirModal();
        } catch (error) {
            console.error('[ERRO] Erro ao iniciar jornada:', error);
            alert('Erro ao carregar dados da jornada de insulinoterapia');
        }
    },

    /**
     * Abre o modal da jornada
     */
    abrirModal() {
        const modal = document.getElementById('modal-jornada-insulina');
        if (!modal) {
            this.criarModal();
        }

        this.renderizarConteudo();
        document.getElementById('modal-jornada-insulina').classList.remove('hidden');
    },

    /**
     * Fecha o modal
     */
    fecharModal() {
        document.getElementById('modal-jornada-insulina').classList.add('hidden');
    },

    /**
     * Cria o HTML do modal
     */
    criarModal() {
        const modalHTML = `
            <div id="modal-jornada-insulina" class="fixed z-50 inset-0 overflow-y-auto hidden">
                <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onclick="JornadaInsulinoterapia.fecharModal()"></div>

                    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                        <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                        <i class="ri-syringe-line text-2xl text-white"></i>
                                    </div>
                                    <div class="ml-4">
                                        <h3 class="text-xl font-bold text-white" id="titulo-jornada-insulina">
                                            Jornada da Insulina
                                        </h3>
                                        <p class="text-sm text-orange-100" id="subtitulo-jornada-insulina"></p>
                                    </div>
                                </div>
                                <button onclick="JornadaInsulinoterapia.fecharModal()" class="text-white hover:text-orange-100 transition-colors">
                                    <i class="ri-close-line text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        <div class="bg-white px-6 py-6">
                            <div id="conteudo-jornada-insulina">
                                <!-- Conteúdo será renderizado dinamicamente -->
                            </div>
                        </div>

                        <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button onclick="JornadaInsulinoterapia.fecharModal()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Renderiza o conteúdo baseado na fase atual
     */
    renderizarConteudo() {
        const container = document.getElementById('conteudo-jornada-insulina');
        const subtitulo = document.getElementById('subtitulo-jornada-insulina');

        if (!this.faseAtual) {
            // Tela de preparação
            subtitulo.textContent = this.pacienteAtual.nome_paciente;
            container.innerHTML = this.renderTelaPreparacao();
        } else {
            subtitulo.textContent = `${this.pacienteAtual.nome_paciente} - ${this.getNomeFase(this.faseAtual.fase_tratamento)}`;

            switch (this.faseAtual.fase_tratamento) {
                case this.FASES.FASE1_JEJUM:
                    container.innerHTML = this.renderFase1Jejum();
                    break;
                case this.FASES.FASE2_MAPEAMENTO:
                    container.innerHTML = this.renderFase2Mapeamento();
                    break;
                case this.FASES.FASE3_POS_REFEICOES:
                    container.innerHTML = this.renderFase3PosRefeicoes();
                    break;
                case this.FASES.MANUTENCAO:
                    container.innerHTML = this.renderFaseManutencao();
                    break;
                default:
                    container.innerHTML = this.renderTelaPreparacao();
            }
        }

        // Renderizar linha do tempo
        this.renderLinhaDoTempo();
    },

    /**
     * Retorna nome amigável da fase
     */
    getNomeFase(fase) {
        const nomes = {
            [this.FASES.PREPARACAO]: 'Preparação',
            [this.FASES.FASE1_JEJUM]: 'Fase 1: Ajuste da Glicemia de Jejum',
            [this.FASES.FASE2_MAPEAMENTO]: 'Fase 2: Mapeamento Completo',
            [this.FASES.FASE3_POS_REFEICOES]: 'Fase 3: Ajuste Pós-Refeições',
            [this.FASES.MANUTENCAO]: 'Manutenção'
        };
        return nomes[fase] || fase;
    },

    /**
     * Renderiza tela de preparação
     */
    renderTelaPreparacao() {
        return `
            <div class="max-w-3xl mx-auto">
                <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 mb-6">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <i class="ri-heart-pulse-line text-4xl text-orange-500"></i>
                        </div>
                        <div class="ml-4 flex-1">
                            <h4 class="text-lg font-bold text-gray-800 mb-2">
                                Bem-vindo à Jornada da Insulinoterapia! 🎯
                            </h4>
                            <p class="text-gray-700 leading-relaxed">
                                Vamos ajudá-lo a encontrar as doses ideais de insulina de forma segura e gradual,
                                baseado nas diretrizes brasileiras de diabetes. Este processo pode levar de 2 a 4 semanas.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-white border-2 border-orange-200 rounded-lg p-6 mb-6">
                    <h5 class="text-md font-bold text-gray-800 mb-4 flex items-center">
                        <i class="ri-checkbox-circle-line text-orange-500 mr-2"></i>
                        Check-list de Preparação
                    </h5>

                    <div class="space-y-3">
                        <label class="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <input type="checkbox" id="check-orientacao" class="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500">
                            <span class="ml-3 text-sm text-gray-700">
                                O paciente (ou cuidador) foi orientado sobre a técnica correta de aplicação e armazenamento da insulina
                            </span>
                        </label>

                        <label class="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <input type="checkbox" id="check-monitoramento" class="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500">
                            <span class="ml-3 text-sm text-gray-700">
                                O paciente compreendeu a importância do monitoramento da glicemia e está pronto para iniciar
                            </span>
                        </label>

                        <label class="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <input type="checkbox" id="check-hipoglicemia" class="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500">
                            <span class="ml-3 text-sm text-gray-700">
                                O paciente foi orientado sobre os sinais de hipoglicemia e como agir
                            </span>
                        </label>
                    </div>
                </div>

                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
                    <div class="flex items-start">
                        <i class="ri-information-line text-blue-600 text-xl mt-0.5 flex-shrink-0"></i>
                        <div class="ml-3">
                            <h5 class="text-sm font-semibold text-blue-800 mb-1">Prescrição Inicial</h5>
                            <div id="prescricao-inicial" class="text-sm text-blue-700">
                                <!-- Será preenchido com dados das insulinas -->
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-center">
                    <button onclick="JornadaInsulinoterapia.iniciarFase1()"
                            id="btn-iniciar-jornada"
                            class="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="ri-play-circle-line mr-2"></i>
                        Iniciar Minha Jornada
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza Fase 1: Ajuste de Jejum
     */
    renderFase1Jejum() {
        // Filtrar registros de jejum
        const registrosJejum = this.registros.filter(r => r.tipo_glicemia === this.TIPOS_GLICEMIA.JEJUM);

        // Pegar últimas 3 medições para calcular sugestão
        const ultimas3 = registrosJejum.slice(0, 3);
        let sugestaoHtml = 'Aguardando medições...';

        if (ultimas3.length > 0) {
            const ultimaGlicemia = ultimas3[0].valor_glicemia;
            sugestaoHtml = `
                <div class="space-y-2">
                    <p class="font-semibold">Última medição: ${ultimaGlicemia} mg/dL</p>
                    <p>${ultimas3[0].sugestao_sistema || 'Nenhuma sugestão disponível'}</p>
                </div>
            `;

            // Verificar se atingiu meta (2 últimas medições na meta)
            if (ultimas3.length >= 2) {
                const nasMetas = ultimas3.slice(0, 2).every(r =>
                    r.valor_glicemia >= this.METAS.JEJUM_MIN &&
                    r.valor_glicemia <= this.METAS.JEJUM_MAX
                );

                if (nasMetas) {
                    sugestaoHtml += `
                        <div class="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <p class="text-green-800 font-bold">🎉 Meta alcançada!</p>
                            <p class="text-sm text-green-700 mt-1">
                                Suas últimas medições estão na meta. Você está pronto para a Fase 2!
                            </p>
                            <button onclick="JornadaInsulinoterapia.avancarParaFase2()"
                                    class="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                Avançar para Fase 2: Mapeamento
                            </button>
                        </div>
                    `;
                }
            }
        }

        return `
            <div class="space-y-6">
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div class="flex items-start">
                        <i class="ri-target-line text-2xl text-blue-600 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-blue-900 mb-1">Objetivo desta fase</h4>
                            <p class="text-sm text-blue-800">
                                Encontrar a dose ideal de insulina NPH (basal) para manter sua glicemia de jejum entre 80-130 mg/dL.
                                Esta fase dura em média 3 a 15 dias.
                            </p>
                        </div>
                    </div>
                </div>

                ${this.renderDosesInsulinaCard()}

                <div class="grid md:grid-cols-2 gap-4">
                    <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
                        <h5 class="font-bold text-gray-800 mb-3 flex items-center">
                            <i class="ri-dashboard-line text-orange-500 mr-2"></i>
                            Inserir Glicemia de Jejum
                        </h5>

                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input type="date" id="data-glicemia-jejum"
                                       class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                       value="${new Date().toISOString().split('T')[0]}">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Valor (mg/dL)</label>
                                <input type="number" id="valor-glicemia-jejum"
                                       placeholder="Ex: 120"
                                       class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            </div>

                            <button onclick="JornadaInsulinoterapia.registrarGlicemiaJejum()"
                                    class="w-full px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                                <i class="ri-add-line mr-1"></i>
                                Registrar
                            </button>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                        <h5 class="font-bold text-gray-800 mb-3 flex items-center">
                            <i class="ri-lightbulb-line text-green-600 mr-2"></i>
                            Sugestão Inteligente
                        </h5>
                        <div id="sugestao-fase1" class="text-sm text-gray-700">
                            ${sugestaoHtml}
                        </div>
                    </div>
                </div>

                <div id="historico-jejum" class="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 class="font-bold text-gray-800 mb-3">Histórico de Medições (${registrosJejum.length})</h5>
                    <div id="lista-jejum">
                        ${this.renderHistoricoJejum(registrosJejum)}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza histórico de medições de jejum
     */
    renderHistoricoJejum(registros) {
        if (registros.length === 0) {
            return '<p class="text-gray-500 text-sm">Nenhuma medição registrada ainda</p>';
        }

        return `
            <div class="space-y-2">
                ${registros.map(r => {
                    const data = new Date(r.data_registro).toLocaleDateString('pt-BR');
                    const valor = r.valor_glicemia;
                    let corClass = 'text-gray-700';
                    let icon = '⚪';

                    if (valor < this.METAS.HIPOGLICEMIA) {
                        corClass = 'text-red-600 font-bold';
                        icon = '🔴';
                    } else if (valor >= this.METAS.ATENCAO_MIN && valor < this.METAS.JEJUM_MIN) {
                        corClass = 'text-yellow-600';
                        icon = '🟡';
                    } else if (valor >= this.METAS.JEJUM_MIN && valor <= this.METAS.JEJUM_MAX) {
                        corClass = 'text-green-600 font-semibold';
                        icon = '🟢';
                    } else {
                        corClass = 'text-red-600';
                        icon = '🔴';
                    }

                    return `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div class="flex items-center space-x-3">
                                <span class="text-xl">${icon}</span>
                                <div>
                                    <p class="text-sm font-medium text-gray-700">${data}</p>
                                    ${r.observacoes ? `<p class="text-xs text-gray-500">${r.observacoes}</p>` : ''}
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="${corClass} text-lg font-bold">${valor} mg/dL</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Avança para Fase 2
     */
    async avancarParaFase2() {
        if (!confirm('Deseja avançar para a Fase 2: Mapeamento Completo?')) return;

        try {
            // Concluir fase 1
            const ultimaFase1 = this.registros.find(r => r.fase_tratamento === this.FASES.FASE1_JEJUM);
            if (ultimaFase1) {
                await fetch(`/api/diabetes/insulinoterapia/${ultimaFase1.cod_seq_acompanhamento}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status_fase: 'CONCLUIDA',
                        meta_alcancada: true
                    })
                });
            }

            // Criar registro da fase 2
            await fetch('/api/diabetes/insulinoterapia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codcidadao: this.pacienteAtual.cod_paciente,
                    fase_tratamento: this.FASES.FASE2_MAPEAMENTO,
                    observacoes: 'Iniciou Fase 2: Mapeamento Completo',
                    responsavel_registro: 'Sistema'
                })
            });

            // Recarregar
            this.iniciar(this.pacienteAtual);
        } catch (error) {
            console.error('[ERRO] Erro ao avançar para fase 2:', error);
            alert('Erro ao avançar para próxima fase');
        }
    },

    /**
     * Renderiza Fase 2: Mapeamento
     */
    renderFase2Mapeamento() {
        return `
            <div class="space-y-6">
                <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                    <div class="flex items-start">
                        <i class="ri-map-pin-line text-2xl text-purple-600 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-purple-900 mb-1">Mapeamento do seu dia</h4>
                            <p class="text-sm text-purple-800">
                                Agora vamos entender como sua glicemia se comporta ao longo do dia.
                                Meça sua glicose em 6 momentos específicos.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${this.renderCampoGlicemia('Jejum', 'JEJUM')}
                    ${this.renderCampoGlicemia('Antes do Almoço', 'ANTES_ALMOCO')}
                    ${this.renderCampoGlicemia('2h após Almoço', 'APOS_ALMOCO_2H')}
                    ${this.renderCampoGlicemia('Antes do Jantar', 'ANTES_JANTAR')}
                    ${this.renderCampoGlicemia('2h após Jantar', 'APOS_JANTAR_2H')}
                    ${this.renderCampoGlicemia('Ao Deitar', 'AO_DEITAR')}
                </div>

                <button onclick="JornadaInsulinoterapia.salvarMapeamento()"
                        class="w-full px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors">
                    <i class="ri-save-line mr-2"></i>
                    Salvar Mapeamento
                </button>

                <div id="analise-mapeamento" class="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
                    <h5 class="font-bold text-gray-800 mb-3 flex items-center">
                        <i class="ri-bar-chart-line text-blue-600 mr-2"></i>
                        Análise Inteligente
                    </h5>
                    <div id="resultado-analise" class="text-sm text-gray-700">
                        Preencha as medições para ver a análise
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza campo de glicemia
     */
    renderCampoGlicemia(label, tipo) {
        const icones = {
            'JEJUM': 'ri-sun-line',
            'ANTES_ALMOCO': 'ri-restaurant-line',
            'APOS_ALMOCO_2H': 'ri-time-line',
            'ANTES_JANTAR': 'ri-restaurant-2-line',
            'APOS_JANTAR_2H': 'ri-moon-line',
            'AO_DEITAR': 'ri-hotel-bed-line'
        };

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-3">
                <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <i class="${icones[tipo]} text-orange-500 mr-1"></i>
                    ${label}
                </label>
                <div class="relative">
                    <input type="number"
                           id="glicemia-${tipo}"
                           placeholder="mg/dL"
                           class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <span class="absolute right-3 top-2.5 text-xs text-gray-500">mg/dL</span>
                </div>
            </div>
        `;
    },

    /**
     * Salva mapeamento completo do dia
     */
    async salvarMapeamento() {
        const tiposGlicemia = [
            { tipo: 'JEJUM', nome: 'Jejum' },
            { tipo: 'ANTES_ALMOCO', nome: 'Antes do Almoço' },
            { tipo: 'APOS_ALMOCO_2H', nome: '2h após Almoço' },
            { tipo: 'ANTES_JANTAR', nome: 'Antes do Jantar' },
            { tipo: 'APOS_JANTAR_2H', nome: '2h após Jantar' },
            { tipo: 'AO_DEITAR', nome: 'Ao Deitar' }
        ];

        // Coletar valores
        const medicoes = [];
        let temMedicao = false;

        for (const item of tiposGlicemia) {
            const input = document.getElementById(`glicemia-${item.tipo}`);
            const valor = input ? input.value : null;

            if (valor && valor.trim() !== '') {
                temMedicao = true;
                medicoes.push({
                    tipo: this.TIPOS_GLICEMIA[item.tipo],
                    valor: parseFloat(valor),
                    nome: item.nome
                });
            }
        }

        if (!temMedicao) {
            alert('Preencha pelo menos uma medição de glicemia');
            return;
        }

        if (!confirm(`Deseja salvar ${medicoes.length} medição(ões) de glicemia?`)) {
            return;
        }

        try {
            // Salvar cada medição
            for (const medicao of medicoes) {
                await fetch('/api/diabetes/insulinoterapia', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        codcidadao: this.pacienteAtual.cod_paciente,
                        fase_tratamento: this.FASES.FASE2_MAPEAMENTO,
                        tipo_glicemia: medicao.tipo,
                        valor_glicemia: medicao.valor,
                        sugestao_sistema: `Medição de ${medicao.nome}: ${medicao.valor} mg/dL`,
                        responsavel_registro: 'Sistema'
                    })
                });
            }

            alert('Mapeamento salvo com sucesso!');

            // Limpar campos
            for (const item of tiposGlicemia) {
                const input = document.getElementById(`glicemia-${item.tipo}`);
                if (input) input.value = '';
            }

            // Recarregar dados
            this.iniciar(this.pacienteAtual);

        } catch (error) {
            console.error('[ERRO] Erro ao salvar mapeamento:', error);
            alert('Erro ao salvar mapeamento');
        }
    },

    /**
     * Renderiza linha do tempo
     */
    renderLinhaDoTempo() {
        // Implementação da visualização da linha do tempo
        console.log('[INFO] Renderizando linha do tempo...');
    },

    /**
     * Inicia Fase 1
     */
    async iniciarFase1() {
        // Verificar checkboxes
        const check1 = document.getElementById('check-orientacao').checked;
        const check2 = document.getElementById('check-monitoramento').checked;
        const check3 = document.getElementById('check-hipoglicemia').checked;

        if (!check1 || !check2 || !check3) {
            alert('Por favor, marque todos os itens do check-list de preparação');
            return;
        }

        try {
            const response = await fetch('/api/diabetes/insulinoterapia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codcidadao: this.pacienteAtual.cod_paciente,
                    fase_tratamento: this.FASES.FASE1_JEJUM,
                    observacoes: 'Iniciou jornada de insulinoterapia - preparação concluída',
                    responsavel_registro: 'Sistema'
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                this.faseAtual = { fase_tratamento: this.FASES.FASE1_JEJUM, status_fase: 'EM_ANDAMENTO' };
                this.renderizarConteudo();
            } else {
                alert('Erro ao iniciar fase 1: ' + data.erro);
            }
        } catch (error) {
            console.error('[ERRO] Erro ao iniciar fase 1:', error);
            alert('Erro ao iniciar fase 1');
        }
    },

    /**
     * Registra glicemia de jejum
     */
    async registrarGlicemiaJejum() {
        const valor = document.getElementById('valor-glicemia-jejum').value;
        const data = document.getElementById('data-glicemia-jejum').value;

        if (!valor || !data) {
            alert('Preencha todos os campos');
            return;
        }

        const sugestao = this.calcularSugestaoJejum(parseFloat(valor));

        try {
            const response = await fetch('/api/diabetes/insulinoterapia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codcidadao: this.pacienteAtual.cod_paciente,
                    fase_tratamento: this.FASES.FASE1_JEJUM,
                    tipo_glicemia: this.TIPOS_GLICEMIA.JEJUM,
                    valor_glicemia: parseFloat(valor),
                    sugestao_sistema: sugestao,
                    data_registro: data,
                    responsavel_registro: 'Sistema'
                })
            });

            const result = await response.json();

            if (result.sucesso) {
                alert('Glicemia registrada com sucesso!');
                document.getElementById('valor-glicemia-jejum').value = '';
                this.iniciar(this.pacienteAtual); // Recarregar
            }
        } catch (error) {
            console.error('[ERRO] Erro ao registrar glicemia:', error);
            alert('Erro ao registrar glicemia');
        }
    },

    /**
     * Calcula sugestão para glicemia de jejum
     */
    calcularSugestaoJejum(valor) {
        if (valor < this.METAS.HIPOGLICEMIA) {
            return `⚠️ ATENÇÃO: Hipoglicemia detectada (${valor} mg/dL < 70 mg/dL). Sugestão: Reduzir insulina NPH noturna em 4 unidades ou 10-20%. Comunique o médico imediatamente.`;
        } else if (valor >= this.METAS.ATENCAO_MIN && valor < this.METAS.JEJUM_MIN) {
            return `⚡ Glicemia em zona de atenção (${valor} mg/dL). Monitorar próximas medições. Se persistir, considerar redução leve da dose.`;
        } else if (valor >= this.METAS.JEJUM_MIN && valor <= this.METAS.JEJUM_MAX) {
            return `✅ Parabéns! Glicemia de jejum na meta (${valor} mg/dL). Continue monitorando para confirmar estabilidade.`;
        } else {
            return `📈 Glicemia acima da meta (${valor} mg/dL > 130 mg/dL). Sugestão: Aumentar insulina NPH noturna em 2 unidades. Consulte seu médico.`;
        }
    },

    /**
     * Renderiza card com doses de insulina editáveis
     */
    renderDosesInsulinaCard() {
        if (this.insulinas.length === 0) {
            return `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div class="flex items-start">
                        <i class="ri-alert-line text-yellow-600 text-xl mr-3"></i>
                        <div>
                            <p class="text-sm text-yellow-800">
                                Nenhuma prescrição de insulina encontrada. Registre uma prescrição antes de iniciar a jornada.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
                <h5 class="font-bold text-gray-800 mb-4 flex items-center">
                    <i class="ri-syringe-line text-indigo-600 mr-2"></i>
                    Doses Atuais de Insulina
                    <span class="ml-2 text-xs text-gray-500 font-normal">(clique nos botões para ajustar)</span>
                </h5>

                <div class="space-y-4">
                    ${this.insulinas.map(ins => this.renderInsulinaItem(ins)).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Renderiza item individual de insulina com controles
     */
    renderInsulinaItem(insulina) {
        const tipoClass = insulina.tipo_insulina === 'NPH' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';

        // Garantir que doses seja sempre um array
        let doses = insulina.doses_estruturadas;
        if (typeof doses === 'string') {
            try {
                doses = JSON.parse(doses);
            } catch (e) {
                doses = [];
            }
        }
        if (!Array.isArray(doses)) {
            doses = [];
        }

        return `
            <div class="bg-white rounded-lg p-4 border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <span class="px-3 py-1 ${tipoClass} rounded-full text-sm font-semibold">
                            ${insulina.tipo_insulina}
                        </span>
                        <span class="text-sm text-gray-600">
                            ${insulina.frequencia_dia || 'Conforme prescrição'}
                        </span>
                    </div>
                </div>

                <div class="space-y-2">
                    ${doses.length > 0 ? doses.map((dose, idx) => {
                        // Suportar ambos os formatos: 'dose' e 'unidades'
                        const valorDose = dose.unidades || dose.dose || 0;
                        return `
                        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div class="flex items-center space-x-3">
                                <i class="ri-time-line text-gray-500"></i>
                                <span class="text-sm font-medium text-gray-700">${dose.horario || `Dose ${idx + 1}`}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button onclick="JornadaInsulinoterapia.ajustarDose(${insulina.cod_seq_insulina}, ${idx}, -1)"
                                        class="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                    <i class="ri-subtract-line"></i>
                                </button>
                                <div class="w-16 text-center">
                                    <span class="text-xl font-bold text-indigo-700">${valorDose}</span>
                                    <span class="text-xs text-gray-500 ml-1">UI</span>
                                </div>
                                <button onclick="JornadaInsulinoterapia.ajustarDose(${insulina.cod_seq_insulina}, ${idx}, 1)"
                                        class="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                    <i class="ri-add-line"></i>
                                </button>
                            </div>
                        </div>
                    `}).join('') : `
                        <p class="text-sm text-gray-500 italic">Nenhuma dose estruturada disponível</p>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * Ajusta dose de insulina e salva automaticamente
     */
    async ajustarDose(codInsulina, doseIndex, incremento) {
        // Encontrar insulina
        const insulina = this.insulinas.find(ins => ins.cod_seq_insulina === codInsulina);
        if (!insulina) {
            console.error('[ERRO] Insulina não encontrada');
            return;
        }

        // Normalizar doses_estruturadas
        let doses = insulina.doses_estruturadas;
        if (typeof doses === 'string') {
            try {
                doses = JSON.parse(doses);
            } catch (e) {
                doses = [];
            }
        }
        if (!Array.isArray(doses)) {
            doses = [];
        }

        if (!doses[doseIndex]) {
            console.error('[ERRO] Dose não encontrada no índice', doseIndex);
            return;
        }

        // Ajustar valor (suportar ambos os formatos)
        const doseAtual = doses[doseIndex].unidades || doses[doseIndex].dose || 0;
        const novaDose = Math.max(0, doseAtual + incremento);

        // Atualizar localmente (manter o campo que já existe)
        if ('unidades' in doses[doseIndex]) {
            doses[doseIndex].unidades = novaDose;
        } else {
            doses[doseIndex].dose = novaDose;
        }
        insulina.doses_estruturadas = doses;

        // Salvar no banco automaticamente
        try {
            const response = await fetch(`/api/diabetes/insulinas/${codInsulina}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doses_estruturadas: doses
                })
            });

            const result = await response.json();

            if (result.sucesso) {
                // Re-renderizar apenas o card de doses
                this.atualizarCardDoses();
            } else {
                console.error('[ERRO] Erro ao salvar dose:', result.erro);
                alert('Erro ao salvar alteração da dose');
            }
        } catch (error) {
            console.error('[ERRO] Erro ao ajustar dose:', error);
            alert('Erro ao salvar alteração da dose');
        }
    },

    /**
     * Atualiza apenas o card de doses sem re-renderizar tudo
     */
    atualizarCardDoses() {
        const container = document.getElementById('conteudo-jornada-insulina');
        if (!container) return;

        // Encontrar e substituir apenas o card de doses
        const dosesHtml = this.renderDosesInsulinaCard();

        // Re-renderizar a fase completa (melhor UX)
        this.renderizarConteudo();
    }
};

// Expor globalmente
window.JornadaInsulinoterapia = JornadaInsulinoterapia;
