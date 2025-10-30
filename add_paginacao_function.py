#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Adicionar função de paginação
"""

with open('static/dashboard_rastreamento_nao_hipertensos.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar onde adicionar (antes da seção de checkbox)
marca = '// ============================================================================\n// FUNÇÕES PARA CHECKBOX E SELEÇÃO MÚLTIPLA\n// ============================================================================'

funcao_paginacao = '''// ============================================================================
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

'''

# Adicionar antes da marca
content = content.replace(marca, funcao_paginacao + '\n' + marca)

with open('static/dashboard_rastreamento_nao_hipertensos.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Funcao renderizarPaginacao adicionada com sucesso!')
