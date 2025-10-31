// ============================================================================
// FUNÇÕES PARA HIPERTENSOS (CONFIRMADOS)
// ============================================================================

// Carregar lista de Hipertensos
async function carregarHipertensos(pagina = 1) {
    const equipe = document.getElementById('filtro-equipe-dashboard')?.value || '';
    const microarea = document.getElementById('filtro-microarea-dashboard')?.value || '';
    const busca = document.getElementById('filtro-busca-dashboard')?.value || '';

    try {
        const response = await fetch(`/api/rastreamento/hipertensos?equipe=${encodeURIComponent(equipe)}&microarea=${encodeURIComponent(microarea)}&busca=${encodeURIComponent(busca)}&pagina=${pagina}`);
        const data = await response.json();

        if (data.success) {
            renderizarHipertensos(data.cidadaos);
            renderizarPaginacao(data, 'paginacao-hipertensos', carregarHipertensos);

            // Atualizar contador na aba
            const aba = document.querySelector('[data-aba="hipertensos"] .count-aba');
            if (aba) aba.textContent = `(${data.total})`;
        } else {
            console.error('Erro ao carregar hipertensos:', data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar hipertensos:', error);
    }
}

// Renderizar lista de Hipertensos
function renderizarHipertensos(cidadaos) {
    const tbody = document.getElementById('lista-hipertensos');

    if (!cidadaos || cidadaos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="px-4 py-8 text-center text-gray-400">
                    Nenhum hipertenso encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cidadaos.map(c => {
        // Determinar classificação e cor do badge
        let classificacao = 'Hipertensão';
        let badgeClass = 'bg-red-100 text-red-800';

        const pas = c.media_pas || 0;
        const pad = c.media_pad || 0;

        if (pas < 130 && pad < 80) {
            classificacao = 'Normal';
            badgeClass = 'bg-green-100 text-green-800';
        } else if ((pas >= 130 && pas < 140) || (pad >= 80 && pad < 90)) {
            classificacao = 'Limítrofe';
            badgeClass = 'bg-yellow-100 text-yellow-800';
        } else if ((pas >= 140 && pas < 160) || (pad >= 90 && pad < 100)) {
            classificacao = 'Estágio 1';
            badgeClass = 'bg-orange-100 text-orange-800';
        } else if (pas >= 160 || pad >= 100) {
            classificacao = 'Estágio 2';
            badgeClass = 'bg-red-100 text-red-800';
        }

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
                    ${c.responsavel_familiar || '---'}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.equipe || '---'}
                </td>
                <td class="px-2 py-1 text-center text-gray-600">
                    ${c.microarea || '---'}
                </td>
                <td class="px-2 py-1 text-center">
                    <span class="font-semibold text-red-700">${c.media_pa || '---'}</span>
                </td>
                <td class="px-2 py-1 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold ${badgeClass}">
                        ${classificacao}
                    </span>
                </td>
                <td class="px-2 py-1 text-center">
                    <button onclick="alternarRegistroPec(${c.cod_cidadao}, ${c.registrado_pec})"
                            class="px-2 py-1 rounded text-[9px] font-semibold ${c.registrado_pec ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                            id="btn-pec-${c.cod_cidadao}"
                            title="${c.registrado_pec ? 'Marcar como não registrado' : 'Marcar como registrado'}">
                        ${c.registrado_pec ? 'Sim' : 'Não'}
                    </button>
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

// Função para alternar registro no PEC
async function alternarRegistroPec(cod_cidadao, registrado_atual) {
    const novo_status = !registrado_atual;

    try {
        const response = await fetch(`/api/rastreamento/atualizar-registro-pec/${cod_cidadao}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                registrado_pec: novo_status
            })
        });

        const data = await response.json();

        if (data.success) {
            // Atualizar o botão
            const btn = document.getElementById(`btn-pec-${cod_cidadao}`);
            if (btn) {
                if (novo_status) {
                    btn.className = 'px-2 py-1 rounded text-[9px] font-semibold bg-green-100 text-green-700 hover:bg-green-200';
                    btn.textContent = 'Sim';
                    btn.title = 'Marcar como não registrado';
                } else {
                    btn.className = 'px-2 py-1 rounded text-[9px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200';
                    btn.textContent = 'Não';
                    btn.title = 'Marcar como registrado';
                }
                btn.onclick = () => alternarRegistroPec(cod_cidadao, novo_status);
            }
        } else {
            alert('Erro ao atualizar status: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao atualizar registro PEC:', error);
        alert('Erro ao atualizar status de registro no PEC');
    }
}

// Função auxiliar para formatar CPF/CNS (reutilizando do arquivo nao_hipertensos)
function formatarCpfCns(cns, cpf) {
    const isHash = (str) => {
        if (!str) return false;
        return str.length > 15 && /[a-f0-9]{32}/.test(str);
    };

    if (cns && !isHash(cns)) {
        return cns;
    }

    if (cpf && !isHash(cpf)) {
        return cpf;
    }

    return '---';
}

// Função para renderizar paginação (reutilizando padrão)
function renderizarPaginacao(data, containerId, callbackFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPaginas = data.total_paginas || 1;
    const paginaAtual = data.pagina_atual || 1;

    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex justify-center items-center gap-2">';

    // Botão Anterior
    if (paginaAtual > 1) {
        html += `<button onclick="${callbackFunction.name}(${paginaAtual - 1})"
                        class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
                    Anterior
                </button>`;
    }

    // Números das páginas
    const maxPaginas = 5;
    let inicioPagina = Math.max(1, paginaAtual - Math.floor(maxPaginas / 2));
    let fimPagina = Math.min(totalPaginas, inicioPagina + maxPaginas - 1);

    if (fimPagina - inicioPagina < maxPaginas - 1) {
        inicioPagina = Math.max(1, fimPagina - maxPaginas + 1);
    }

    for (let i = inicioPagina; i <= fimPagina; i++) {
        const activeClass = i === paginaAtual ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300';
        html += `<button onclick="${callbackFunction.name}(${i})"
                        class="px-3 py-1 ${activeClass} rounded text-sm">
                    ${i}
                </button>`;
    }

    // Botão Próxima
    if (paginaAtual < totalPaginas) {
        html += `<button onclick="${callbackFunction.name}(${paginaAtual + 1})"
                        class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
                    Próxima
                </button>`;
    }

    html += `</div><div class="text-center text-sm text-gray-600 mt-2">
                Página ${paginaAtual} de ${totalPaginas} | Total: ${data.total} registros
            </div>`;

    container.innerHTML = html;
}
