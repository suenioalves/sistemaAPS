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
                <td colspan="12" class="px-4 py-8 text-center text-gray-400">
                    Nenhum cidadão suspeito de hipertensão encontrado
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
                    <span class="font-semibold text-red-700">${c.media_pa}</span>
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
        const resultadoClass = t.resultado === 'NAO_HIPERTENSO' || t.resultado === 'NORMAL' ?
                               'bg-green-100 text-green-700' :
                               'bg-red-100 text-red-700';

        const resultadoText = t.resultado === 'NAO_HIPERTENSO' || t.resultado === 'NORMAL' ?
                              'Não Hipertenso' :
                              'Suspeito de HAS';

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

// Exportar funções globalmente
window.carregarNaoHipertensos = carregarNaoHipertensos;
window.carregarSuspeitosHAS = carregarSuspeitosHAS;
window.visualizarHistoricoTriagens = visualizarHistoricoTriagens;
window.fecharModalHistorico = fecharModalHistorico;
