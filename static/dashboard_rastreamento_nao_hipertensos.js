// ============================================================================
// FUNÇÕES PARA NÃO HIPERTENSOS E SUSPEITOS DE HIPERTENSÃO
// ============================================================================

// Função auxiliar para validar se CPF/CNS está em formato válido
function formatarCpfCns(cns, cpf) {
    // Verifica se é um hash (texto longo com letras e números sem padrão)
    const isHash = (str) => {
        if (!str) return false;
        // Se tem mais de 15 caracteres e contém letras minúsculas, provavelmente é hash
        return str.length > 15 && /[a-f0-9]{32}/.test(str);
    };

    // Se CNS existe e não é hash, exibe CNS
    if (cns && !isHash(cns)) {
        return cns;
    }

    // Se CPF existe e não é hash, exibe CPF
    if (cpf && !isHash(cpf)) {
        return cpf;
    }

    // Se ambos são inválidos ou vazios, retorna vazio
    return '---';
}

// Carregar lista de Não Hipertensos
async function carregarNaoHipertensos(pagina = 1) {
    const equipe = document.getElementById('filtro-equipe-dashboard')?.value || '';
    const microarea = document.getElementById('filtro-microarea-dashboard')?.value || '';
    const busca = document.getElementById('filtro-busca-dashboard')?.value || '';

    try {
        const response = await fetch(`/api/rastreamento/nao-hipertensos?equipe=${encodeURIComponent(equipe)}&microarea=${encodeURIComponent(microarea)}&busca=${encodeURIComponent(busca)}&pagina=${pagina}`);
        const data = await response.json();

        if (data.success) {
            renderizarNaoHipertensos(data.cidadaos);
            renderizarPaginacao(data, 'paginacao-nao-hipertensos', carregarNaoHipertensos);

            // Atualizar contador na aba
            const aba = document.querySelector('[data-aba="nao-hipertensos"] .count-aba');
            if (aba) aba.textContent = `(${data.total})`;
        } else {
            console.error('Erro ao carregar não hipertensos:', data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar não hipertensos:', error);
    }
}

// Renderizar lista de Não Hipertensos
function renderizarNaoHipertensos(cidadaos) {
    const tbody = document.getElementById('lista-nao-hipertensos');

    if (!cidadaos || cidadaos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="px-4 py-8 text-center text-gray-400">
                    Nenhum cidadão não hipertenso encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cidadaos.map(c => {
        const validadeClass = c.dias_restantes > 90 ? 'text-green-600' :
                              c.dias_restantes > 30 ? 'text-yellow-600' :
                              c.dias_restantes > 0 ? 'text-orange-600' : 'text-red-600';

        const validadeText = c.dias_restantes > 0 ? `${c.dias_restantes} dias` : 'Expirada';

        return `
            <tr class="border-b hover:bg-gray-50 text-[11px]">
                <td class="px-2 py-1">
                    <div class="font-medium text-gray-900">${c.nome}</div>
                </td>
                <td class="px-2 py-1 text-gray-600">
                    ${formatarCpfCns(c.cns, c.cpf)}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.idade}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.sexo === 'M' ? 'M' : 'F'}
                </td>
                <td class="px-2 py-1 text-gray-600">
                    ${c.domicilio || '---'}
                </td>
                <td class="px-2 py-1 text-gray-600">
                    ${c.responsavel_familiar}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.equipe || '---'}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.microarea || '---'}
                </td>
                <td class="px-2 py-1 text-center">
                    <span class="font-semibold text-green-700">${c.media_pa}</span>
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.data_triagem}
                </td>
                <td class="px-2 py-1 text-center">
                    <span class="font-medium ${validadeClass}">${validadeText}</span>
                </td>
                <td class="px-2 py-1 text-center">
                    <button onclick="visualizarHistoricoTriagens(${c.cod_individual})"
                            class="text-blue-600 hover:text-blue-800"
                            title="Ver histórico">
                        <i class="ri-history-line text-sm"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Carregar lista de Suspeitos de HAS
async function carregarSuspeitosHAS(pagina = 1) {
    const equipe = document.getElementById('filtro-equipe-dashboard')?.value || '';
    const microarea = document.getElementById('filtro-microarea-dashboard')?.value || '';
    const busca = document.getElementById('filtro-busca-dashboard')?.value || '';

    try {
        const response = await fetch(`/api/rastreamento/suspeitos-has?equipe=${encodeURIComponent(equipe)}&microarea=${encodeURIComponent(microarea)}&busca=${encodeURIComponent(busca)}&pagina=${pagina}`);
        const data = await response.json();

        if (data.success) {
            renderizarSuspeitosHAS(data.cidadaos);
            renderizarPaginacao(data, 'paginacao-suspeitos-has', carregarSuspeitosHAS);

            // Atualizar contador na aba
            const aba = document.querySelector('[data-aba="suspeitos-has"] .count-aba');
            if (aba) aba.textContent = `(${data.total})`;
        } else {
            console.error('Erro ao carregar suspeitos de HAS:', data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar suspeitos de HAS:', error);
    }
}

// Renderizar lista de Suspeitos de HAS
function renderizarSuspeitosHAS(cidadaos) {
    const tbody = document.getElementById('lista-suspeitos-has');

    if (!cidadaos || cidadaos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="px-4 py-8 text-center text-gray-400">
                    Nenhum cidadão suspeito de hipertensão encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cidadaos.map(c => {
        return `
            <tr class="border-b hover:bg-gray-50 text-[11px]">
                <td class="px-1 py-1 text-center">
                    <input type="checkbox" class="rounded checkbox-suspeito"
                           data-cod="${c.cod_cidadao}"
                           data-nome="${c.nome}"
                           data-cns="${c.cns || ''}"
                           data-cpf="${c.cpf || ''}"
                           data-idade="${c.idade || ''}"
                           data-equipe="${c.equipe || ''}"
                           data-microarea="${c.microarea || ''}"
                           onclick="atualizarContadorSelecionados()">
                </td>
                <td class="px-2 py-1">
                    <div class="font-medium text-gray-900">${c.nome}</div>
                </td>
                <td class="px-2 py-1 text-gray-600">
                    ${formatarCpfCns(c.cns, c.cpf)}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.idade}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.sexo === 'M' ? 'M' : 'F'}
                </td>
                <td class="px-2 py-1 text-gray-600">
                    ${c.domicilio || '---'}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.equipe || '---'}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.microarea || '---'}
                </td>
                <td class="px-2 py-1 text-center">
                    <span class="font-semibold text-orange-700">${c.media_pa}</span>
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.data_triagem}
                </td>
                <td class="px-2 py-1 text-center">
                    <button onclick="abrirModalMRPA(${c.cod_cidadao}, '${c.nome}')"
                            class="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-[10px]"
                            title="Inserir/Ver MRPA">
                        <i class="ri-file-list-3-line"></i> MRPA
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Visualizar histórico de triagens de um cidadão
async function visualizarHistoricoTriagens(codIndividual) {
    try {
        const response = await fetch(`/api/rastreamento/historico/${codIndividual}`);
        const data = await response.json();

        if (data.success) {
            // Atualizar informações do cabeçalho
            document.getElementById('info-cidadao-historico').textContent =
                `Cidadão: ${data.nome_cidadao} | Total de triagens: ${data.total_triagens}`;

            // Renderizar histórico
            renderizarHistoricoTriagens(data.historico);

            // Exibir modal
            document.getElementById('modal-historico-triagens').classList.remove('hidden');
        } else {
            alert('Erro ao carregar histórico: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        alert('Erro ao carregar histórico de triagens');
    }
}

// Renderizar histórico de triagens
function renderizarHistoricoTriagens(historico) {
    const tbody = document.getElementById('lista-historico-triagens');

    if (!historico || historico.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                    Nenhuma triagem anterior encontrada
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = historico.map(t => {
        // Determinar classe e texto do resultado
        let resultadoClass, resultadoText;

        if (t.resultado === 'NAO_HIPERTENSO' || t.resultado === 'NORMAL') {
            resultadoClass = 'bg-green-100 text-green-700';
            resultadoText = 'Não Hipertenso';
        } else if (t.resultado === 'HIPERTENSO') {
            resultadoClass = 'bg-purple-100 text-purple-700';
            resultadoText = 'Hipertenso';
        } else {
            // SUSPEITO_HAS
            resultadoClass = 'bg-orange-100 text-orange-700';
            resultadoText = 'Suspeito de HAS';
        }

        const statusClass = t.expirada ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
        const statusText = t.expirada ? 'Expirada' : 'Válida';

        return `
            <tr class="border-b hover:bg-gray-50 ${t.expirada ? 'bg-gray-50' : ''}">
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">${t.data_triagem}</div>
                    <div class="text-xs text-gray-500">${t.dias_desde_triagem} dias atrás</div>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="font-semibold">${t.media_pa}</span>
                </td>
                <td class="px-4 py-3 text-center text-sm text-gray-600">
                    ${t.numero_afericoes || '---'}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${resultadoClass}">
                        ${resultadoText}
                    </span>
                </td>
                <td class="px-4 py-3 text-center text-sm text-gray-600">
                    ${t.equipe || '---'}
                </td>
                <td class="px-4 py-3 text-center text-sm text-gray-600">
                    ${t.microarea || '---'}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Fechar modal de histórico
function fecharModalHistorico() {
    document.getElementById('modal-historico-triagens').classList.add('hidden');
}

// ============================================================================
// PAGINAÇÃO
// ============================================================================

// Renderizar controles de paginação
function renderizarPaginacao(data, containerId, funcaoCarregar) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { pagina, total_paginas, total } = data;

    if (!total_paginas || total_paginas <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex items-center justify-between mt-4">';

    // Info de registros
    html += `<div class="text-sm text-gray-600">
        Total: <strong>${total}</strong> registro(s) | Página <strong>${pagina}</strong> de <strong>${total_paginas}</strong>
    </div>`;

    // Botões de navegação
    html += '<div class="flex gap-2">';

    // Primeira página
    if (pagina > 1) {
        html += `<button onclick="${funcaoCarregar.name}(1)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
            <i class="ri-arrow-left-double-line"></i> Primeira
        </button>`;
    }

    // Página anterior
    if (pagina > 1) {
        html += `<button onclick="${funcaoCarregar.name}(${pagina - 1})" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
            <i class="ri-arrow-left-s-line"></i> Anterior
        </button>`;
    }

    // Próxima página
    if (pagina < total_paginas) {
        html += `<button onclick="${funcaoCarregar.name}(${pagina + 1})" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
            Próxima <i class="ri-arrow-right-s-line"></i>
        </button>`;
    }

    // Última página
    if (pagina < total_paginas) {
        html += `<button onclick="${funcaoCarregar.name}(${total_paginas})" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
            Última <i class="ri-arrow-right-double-line"></i>
        </button>`;
    }

    html += '</div></div>';

    container.innerHTML = html;
}


// ============================================================================
// FUNÇÕES PARA CHECKBOX E SELEÇÃO MÚLTIPLA
// ============================================================================

// Selecionar/Desselecionar todos
function toggleSelectAllSuspeitos() {
    const selectAll = document.getElementById('select-all-suspeitos');
    const checkboxes = document.querySelectorAll('.checkbox-suspeito');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
    atualizarContadorSelecionados();
}

// Atualizar contador de selecionados
function atualizarContadorSelecionados() {
    const checkboxes = document.querySelectorAll('.checkbox-suspeito:checked');
    const count = checkboxes.length;
    const span = document.getElementById('count-selecionados-suspeitos');
    if (span) {
        span.textContent = count > 0 ? `${count} selecionado(s)` : '';
    }
}

// ============================================================================
// FUNÇÕES PARA MRPA
// ============================================================================

// Abrir modal para inserir MRPA
function abrirModalMRPA(codCidadao, nomeCidadao) {
    console.log('Abrir modal MRPA para:', codCidadao, nomeCidadao);
    alert('Modal MRPA em desenvolvimento. Código: ' + codCidadao + ', Nome: ' + nomeCidadao);
    // TODO: Implementar modal MRPA
}

// ============================================================================
// FUNÇÕES PARA GERAÇÃO DE PDF
// ============================================================================

// Variável global para armazenar a imagem do modelo MRPA
let imagemModeloMRPA = null;

// Carregar imagem do modelo MRPA
function carregarImagemModeloMRPA() {
    return new Promise((resolve, reject) => {
        if (imagemModeloMRPA) {
            resolve(imagemModeloMRPA);
            return;
        }

        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            imagemModeloMRPA = canvas.toDataURL('image/png');
            resolve(imagemModeloMRPA);
        };
        img.onerror = function() {
            reject(new Error('Erro ao carregar imagem do modelo MRPA'));
        };
        img.src = '/static/modelo_mrpa.png';
    });
}

// Função auxiliar para desenhar um formulário MRPA com a imagem do modelo
async function desenharFormularioMRPA(doc, paciente, offsetY = 0) {
    const margemEsq = 10;
    const larguraPagina = doc.internal.pageSize.width;

    try {
        // Carregar imagem do modelo
        const imagemBase64 = await carregarImagemModeloMRPA();

        // Calcular dimensões para a imagem (ajustar para caber bem na metade da página)
        const larguraImagem = larguraPagina - 20; // 10mm de margem de cada lado
        const alturaImagem = 120; // Altura para caber 2 formulários por página

        // Inserir a imagem do modelo MRPA
        doc.addImage(imagemBase64, 'PNG', margemEsq, offsetY + 20, larguraImagem, alturaImagem);

        // Adicionar dados de identificação do paciente ACIMA da imagem
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        // Nome
        doc.text('NOME: ' + paciente.nome, margemEsq, offsetY + 8);

        // Idade, Equipe e Microárea na mesma linha
        doc.setFontSize(8);
        doc.text('IDADE: ' + (paciente.idade || 'N/A'), margemEsq, offsetY + 14);

        // Verificar se tem dados de equipe e microárea
        if (paciente.equipe || paciente.microarea) {
            doc.text('EQUIPE: ' + (paciente.equipe || 'N/A'), margemEsq + 60, offsetY + 14);
            doc.text('MICROAREA: ' + (paciente.microarea || 'N/A'), margemEsq + 120, offsetY + 14);
        }

        doc.setTextColor(0, 0, 0);

    } catch (error) {
        console.error('Erro ao inserir imagem do modelo MRPA:', error);
        // Se falhar ao carregar a imagem, mostrar mensagem de erro no PDF
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text('ERRO: Nao foi possivel carregar o modelo MRPA', larguraPagina / 2, offsetY + 50, { align: 'center' });
        doc.text('Verifique se o arquivo modelo_mrpa.png existe em /static/', larguraPagina / 2, offsetY + 60, { align: 'center' });
    }
}

// Gerar PDF MRPA único com múltiplas páginas
async function gerarPDFMRPA(pacientes) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Se recebeu apenas um paciente (compatibilidade), converter para array
    if (!Array.isArray(pacientes)) {
        pacientes = [pacientes];
    }

    let primeiraPage = true;

    // Processar pacientes de 2 em 2 (por página)
    for (let i = 0; i < pacientes.length; i += 2) {
        // Se não for a primeira página, adicionar nova página
        if (!primeiraPage) {
            doc.addPage();
        }
        primeiraPage = false;

        const paciente1 = pacientes[i];
        const paciente2 = pacientes[i + 1] || null;

        // Desenhar primeiro formulário (topo da página)
        await desenharFormularioMRPA(doc, paciente1, 0);

        // Se houver segundo paciente, desenhar na metade inferior
        if (paciente2) {
            // Linha divisória
            doc.setDrawColor(200, 200, 200);
            doc.setLineDash([2, 2]);
            doc.line(10, 148, 200, 148);
            doc.setLineDash([]);
            doc.setDrawColor(0, 0, 0);

            await desenharFormularioMRPA(doc, paciente2, 148);
        }
    }

    // Gerar nome do arquivo com data e hora
    const agora = new Date();
    const dataHora = agora.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const nomeArquivo = `MRPA_Rastreamento_Hipertensao_${dataHora}.pdf`;

    doc.save(nomeArquivo);
}

// Gerar PDF único com todos os selecionados (2 pacientes por página)
async function gerarPDFsSuspeitosSelecionados() {
    const checkboxes = document.querySelectorAll('.checkbox-suspeito:checked');
    if (checkboxes.length === 0) {
        alert('Selecione pelo menos um paciente para gerar o PDF');
        return;
    }

    const pacientes = Array.from(checkboxes).map(cb => ({
        cod: cb.dataset.cod,
        nome: cb.dataset.nome,
        cns: cb.dataset.cns,
        cpf: cb.dataset.cpf,
        idade: cb.dataset.idade || '',
        equipe: cb.dataset.equipe || '',
        microarea: cb.dataset.microarea || ''
    }));

    // Gerar um único PDF com todos os pacientes (2 por página)
    await gerarPDFMRPA(pacientes);

    const totalPaginas = Math.ceil(pacientes.length / 2);
    alert(`PDF gerado com sucesso!\n\n${pacientes.length} formulário(s) MRPA em ${totalPaginas} página(s).`);
}

// Gerar PDF único com todos os suspeitos (2 pacientes por página)
async function gerarPDFsTodosSuspeitos() {
    const confirmacao = confirm('Deseja gerar um PDF MRPA com TODOS os suspeitos de hipertensão da página atual?');
    if (!confirmacao) return;

    const checkboxes = document.querySelectorAll('.checkbox-suspeito');
    const pacientes = Array.from(checkboxes).map(cb => ({
        cod: cb.dataset.cod,
        nome: cb.dataset.nome,
        cns: cb.dataset.cns,
        cpf: cb.dataset.cpf,
        idade: cb.dataset.idade || '',
        equipe: cb.dataset.equipe || '',
        microarea: cb.dataset.microarea || ''
    }));

    // Gerar um único PDF com todos os pacientes (2 por página)
    await gerarPDFMRPA(pacientes);

    const totalPaginas = Math.ceil(pacientes.length / 2);
    alert(`PDF gerado com sucesso!\n\n${pacientes.length} formulário(s) MRPA em ${totalPaginas} página(s).`);
}

// Exportar funções globalmente
window.carregarNaoHipertensos = carregarNaoHipertensos;
window.carregarSuspeitosHAS = carregarSuspeitosHAS;
window.visualizarHistoricoTriagens = visualizarHistoricoTriagens;
window.fecharModalHistorico = fecharModalHistorico;
window.toggleSelectAllSuspeitos = toggleSelectAllSuspeitos;
window.atualizarContadorSelecionados = atualizarContadorSelecionados;
window.abrirModalMRPA = abrirModalMRPA;
window.gerarPDFsSuspeitosSelecionados = gerarPDFsSuspeitosSelecionados;
window.gerarPDFsTodosSuspeitos = gerarPDFsTodosSuspeitos;

// ============================================================================
// MODAL MRPA - ENTRADA DE DADOS
// ============================================================================

// Estado do modal MRPA
let estadoMRPA = {
    codCidadao: null,
    nomeCidadao: '',
    modo: 'completo', // 'completo' ou 'media'
    medicoes: {
        // dia: { data: '', manha: [{pas, pad}, {pas, pad}, {pas, pad}], noite: [{pas, pad}, {pas, pad}] }
    }
};

// Abrir modal MRPA
window.abrirModalMRPA = async function(codCidadao, nomeCidadao) {
    estadoMRPA.codCidadao = codCidadao;
    estadoMRPA.nomeCidadao = nomeCidadao;
    estadoMRPA.modo = 'completo';
    estadoMRPA.medicoes = {};

    // Atualizar informações do paciente
    document.getElementById('mrpa-paciente-info').textContent = `Paciente: ${nomeCidadao}`;

    // Renderizar tabela de 5 dias
    renderizarTabelaMRPA();

    // Tentar carregar dados existentes
    await carregarDadosMRPAExistentes(codCidadao);

    // Mostrar modal
    document.getElementById('modal-mrpa').classList.remove('hidden');
};

// Fechar modal MRPA
window.fecharModalMRPA = function() {
    document.getElementById('modal-mrpa').classList.add('hidden');
    estadoMRPA = {
        codCidadao: null,
        nomeCidadao: '',
        modo: 'completo',
        medicoes: {}
    };
};

// Alternar modo de entrada (completo vs média)
window.alternarModoEntrada = function(modo) {
    estadoMRPA.modo = modo;

    // Atualizar botões
    const btnCompleto = document.getElementById('btn-modo-completo');
    const btnMedia = document.getElementById('btn-modo-media');

    if (modo === 'completo') {
        btnCompleto.className = 'px-4 py-2 rounded-lg font-semibold text-sm transition-colors bg-orange-600 text-white';
        btnMedia.className = 'px-4 py-2 rounded-lg font-semibold text-sm transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300';
        document.getElementById('modo-entrada-completo').classList.remove('hidden');
        document.getElementById('modo-entrada-media').classList.add('hidden');
    } else {
        btnCompleto.className = 'px-4 py-2 rounded-lg font-semibold text-sm transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300';
        btnMedia.className = 'px-4 py-2 rounded-lg font-semibold text-sm transition-colors bg-orange-600 text-white';
        document.getElementById('modo-entrada-completo').classList.add('hidden');
        document.getElementById('modo-entrada-media').classList.remove('hidden');
    }
};

// Renderizar tabela de 5 dias
function renderizarTabelaMRPA() {
    const tbody = document.getElementById('tbody-mrpa-dias');
    let html = '';

    for (let dia = 1; dia <= 5; dia++) {
        html += `
            <tr>
                <td class="border border-gray-300 px-2 py-2">
                    <input type="date" id="data-dia-${dia}"
                           class="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                           onchange="calcularMediaMRPA()">
                </td>
                <!-- Manhã - 3 medidas -->
                <td class="border border-gray-300 px-1 py-1 bg-blue-50">
                    <input type="text" id="manha-1-${dia}" placeholder="___/___"
                           class="w-full px-1 py-1 text-center text-xs border border-gray-200 rounded"
                           onchange="calcularMediaMRPA()" maxlength="7">
                </td>
                <td class="border border-gray-300 px-1 py-1 bg-blue-50">
                    <input type="text" id="manha-2-${dia}" placeholder="___/___"
                           class="w-full px-1 py-1 text-center text-xs border border-gray-200 rounded"
                           onchange="calcularMediaMRPA()" maxlength="7">
                </td>
                <td class="border border-gray-300 px-1 py-1 bg-blue-50">
                    <input type="text" id="manha-3-${dia}" placeholder="___/___"
                           class="w-full px-1 py-1 text-center text-xs border border-gray-200 rounded"
                           onchange="calcularMediaMRPA()" maxlength="7">
                </td>
                <!-- Noite - 3 medidas -->
                <td class="border border-gray-300 px-1 py-1 bg-gray-50">
                    <input type="text" id="noite-1-${dia}" placeholder="___/___"
                           class="w-full px-1 py-1 text-center text-xs border border-gray-200 rounded"
                           onchange="calcularMediaMRPA()" maxlength="7">
                </td>
                <td class="border border-gray-300 px-1 py-1 bg-gray-50">
                    <input type="text" id="noite-2-${dia}" placeholder="___/___"
                           class="w-full px-1 py-1 text-center text-xs border border-gray-200 rounded"
                           onchange="calcularMediaMRPA()" maxlength="7">
                </td>
                <td class="border border-gray-300 px-1 py-1 bg-gray-50">
                    <input type="text" id="noite-3-${dia}" placeholder="___/___"
                           class="w-full px-1 py-1 text-center text-xs border border-gray-200 rounded"
                           onchange="calcularMediaMRPA()" maxlength="7">
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

// Calcular média MRPA automaticamente
window.calcularMediaMRPA = function() {
    const medicoes = [];

    for (let dia = 1; dia <= 5; dia++) {
        // Manhã - 3 medidas
        for (let i = 1; i <= 3; i++) {
            const valor = document.getElementById(`manha-${i}-${dia}`)?.value.trim();
            if (valor && valor.includes('/')) {
                const [pas, pad] = valor.split('/').map(v => parseInt(v.trim()));
                if (pas && pad && pas >= 50 && pas <= 300 && pad >= 30 && pad <= 200) {
                    medicoes.push({ pas, pad });
                }
            }
        }

        // Noite - 3 medidas
        for (let i = 1; i <= 3; i++) {
            const valor = document.getElementById(`noite-${i}-${dia}`)?.value.trim();
            if (valor && valor.includes('/')) {
                const [pas, pad] = valor.split('/').map(v => parseInt(v.trim()));
                if (pas && pad && pas >= 50 && pas <= 300 && pad >= 30 && pad <= 200) {
                    medicoes.push({ pas, pad });
                }
            }
        }
    }

    if (medicoes.length === 0) {
        document.getElementById('media-pas-calculada').textContent = '---';
        document.getElementById('media-pad-calculada').textContent = '---';
        document.getElementById('classificacao-resultado').innerHTML =
            'Classificação: <span class="text-gray-500">Preencha as medições</span>';
        return;
    }

    // Calcular médias
    const somaPas = medicoes.reduce((sum, m) => sum + m.pas, 0);
    const somaPad = medicoes.reduce((sum, m) => sum + m.pad, 0);
    const mediaPas = Math.round(somaPas / medicoes.length);
    const mediaPad = Math.round(somaPad / medicoes.length);

    // Exibir médias
    document.getElementById('media-pas-calculada').textContent = mediaPas;
    document.getElementById('media-pad-calculada').textContent = mediaPad;

    // Classificação
    let classificacao, classe;
    if (mediaPas >= 130 || mediaPad >= 80) {
        classificacao = 'HIPERTENSO';
        classe = 'text-red-700 font-bold';
    } else {
        classificacao = 'NÃO HIPERTENSO';
        classe = 'text-green-700 font-bold';
    }

    document.getElementById('classificacao-resultado').innerHTML =
        `Classificação: <span class="${classe}">${classificacao}</span> (${medicoes.length} medição(ões))`;
};

// Calcular classificação da média (modo entrada direta)
window.calcularClassificacaoMedia = function() {
    const pas = parseInt(document.getElementById('input-media-pas')?.value);
    const pad = parseInt(document.getElementById('input-media-pad')?.value);

    if (!pas || !pad) {
        document.getElementById('classificacao-media').innerHTML =
            '<span class="text-gray-500">Preencha PAS e PAD para ver a classificação</span>';
        return;
    }

    let classificacao, classe;
    if (pas >= 130 || pad >= 80) {
        classificacao = 'HIPERTENSO';
        classe = 'text-red-700 font-bold';
    } else {
        classificacao = 'NÃO HIPERTENSO';
        classe = 'text-green-700 font-bold';
    }

    document.getElementById('classificacao-media').innerHTML =
        `<span class="${classe}">${classificacao}</span> (PAS: ${pas} / PAD: ${pad} mmHg)`;
};

// Carregar dados MRPA existentes (se houver)
async function carregarDadosMRPAExistentes(codCidadao) {
    try {
        const response = await fetch(`/api/rastreamento/mrpa/${codCidadao}`);
        const data = await response.json();

        if (data.success && data.medicoes && data.medicoes.length > 0) {
            // Preencher tabela com dados existentes
            data.medicoes.forEach(m => {
                const dia = m.dia_medicao;
                const periodo = m.periodo; // 'MANHA' ou 'NOITE'
                const numero = m.numero_afericao; // 1, 2 ou 3

                const inputId = periodo === 'MANHA' ? `manha-${numero}-${dia}` : `noite-${numero}-${dia}`;
                const input = document.getElementById(inputId);

                if (input) {
                    input.value = `${m.pressao_sistolica}/${m.pressao_diastolica}`;
                }

                // Preencher data
                if (m.data_afericao) {
                    document.getElementById(`data-dia-${dia}`).value = m.data_afericao;
                }
            });

            calcularMediaMRPA();
        }
    } catch (error) {
        console.error('Erro ao carregar dados MRPA:', error);
    }
}

// Salvar dados MRPA
window.salvarDadosMRPA = async function() {
    if (estadoMRPA.modo === 'completo') {
        await salvarMRPACompleto();
    } else {
        await salvarMRPAMedia();
    }
};

// Salvar MRPA modo completo
async function salvarMRPACompleto() {
    const medicoes = [];

    // Coletar todas as medições
    for (let dia = 1; dia <= 5; dia++) {
        const dataInput = document.getElementById(`data-dia-${dia}`);
        const dataAfericao = dataInput?.value;

        // Manhã - 3 medidas
        for (let i = 1; i <= 3; i++) {
            const valor = document.getElementById(`manha-${i}-${dia}`)?.value.trim();
            if (valor && valor.includes('/')) {
                const [pas, pad] = valor.split('/').map(v => parseInt(v.trim()));
                if (pas && pad && pas >= 50 && pas <= 300 && pad >= 30 && pad <= 200) {
                    medicoes.push({
                        dia_medicao: dia,
                        data_afericao: dataAfericao || new Date().toISOString().split('T')[0],
                        periodo: 'MANHA',
                        numero_afericao: i,
                        pressao_sistolica: pas,
                        pressao_diastolica: pad
                    });
                }
            }
        }

        // Noite - 3 medidas
        for (let i = 1; i <= 3; i++) {
            const valor = document.getElementById(`noite-${i}-${dia}`)?.value.trim();
            if (valor && valor.includes('/')) {
                const [pas, pad] = valor.split('/').map(v => parseInt(v.trim()));
                if (pas && pad && pas >= 50 && pas <= 300 && pad >= 30 && pad <= 200) {
                    medicoes.push({
                        dia_medicao: dia,
                        data_afericao: dataAfericao || new Date().toISOString().split('T')[0],
                        periodo: 'NOITE',
                        numero_afericao: i,
                        pressao_sistolica: pas,
                        pressao_diastolica: pad
                    });
                }
            }
        }
    }

    if (medicoes.length === 0) {
        alert('Por favor, preencha pelo menos uma medição antes de salvar.');
        return;
    }

    // Enviar ao backend
    try {
        const response = await fetch('/api/rastreamento/mrpa/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cod_cidadao: estadoMRPA.codCidadao,
                tipo_entrada: 'completo',
                medicoes: medicoes
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ MRPA salvo com sucesso!\n\nMédias calculadas:\nPAS: ${data.media_pas} mmHg\nPAD: ${data.media_pad} mmHg\n\nClassificação: ${data.classificacao}`);
            fecharModalMRPA();

            // Atualizar listas
            if (typeof carregarSuspeitosHAS === 'function') {
                carregarSuspeitosHAS(1);
            }
            if (typeof carregarDashboard === 'function') {
                carregarDashboard();
            }
        } else {
            alert('❌ Erro ao salvar MRPA: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao salvar MRPA:', error);
        alert('❌ Erro ao salvar. Verifique o console.');
    }
}

// Salvar MRPA modo média direta
async function salvarMRPAMedia() {
    const pas = parseInt(document.getElementById('input-media-pas')?.value);
    const pad = parseInt(document.getElementById('input-media-pad')?.value);
    const observacoes = document.getElementById('input-observacoes-media')?.value;

    if (!pas || !pad) {
        alert('Por favor, preencha PAS e PAD.');
        return;
    }

    if (pas < 50 || pas > 300 || pad < 30 || pad > 200) {
        alert('Valores de pressão arterial inválidos.\nPAS: 50-300 mmHg\nPAD: 30-200 mmHg');
        return;
    }

    try {
        const response = await fetch('/api/rastreamento/mrpa/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cod_cidadao: estadoMRPA.codCidadao,
                tipo_entrada: 'media',
                media_pas: pas,
                media_pad: pad,
                observacoes: observacoes
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ MRPA salvo com sucesso!\n\nMédia informada:\nPAS: ${pas} mmHg\nPAD: ${pad} mmHg\n\nClassificação: ${data.classificacao}`);
            fecharModalMRPA();

            // Atualizar listas
            if (typeof carregarSuspeitosHAS === 'function') {
                carregarSuspeitosHAS(1);
            }
            if (typeof carregarDashboard === 'function') {
                carregarDashboard();
            }
        } else {
            alert('❌ Erro ao salvar MRPA: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao salvar MRPA:', error);
        alert('❌ Erro ao salvar. Verifique o console.');
    }
}
