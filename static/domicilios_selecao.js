/**
 * GERENCIAMENTO DE SELEÇÃO DE DOMICÍLIOS
 *
 * Este módulo gerencia a seleção de domicílios incluindo:
 * - Seleção de TODOS os domicílios filtrados (todas as páginas)
 * - Persistência da seleção ao navegar entre páginas
 * - Geração de PDF apenas dos domicílios selecionados
 */

// Estado global de seleção
const selecaoDomicilios = {
    idsSelecionados: new Set(),     // IDs dos domicílios selecionados
    todosSelecionados: false,       // Flag se "Selecionar Todos" foi clicado
    todosIdsFiltrados: [],          // Lista de todos os IDs com filtros ativos
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de seleção de domicílios carregado');

    // Interceptar botão "Selecionar Todos"
    const btnSelecionarTodos = document.getElementById('selecionar-todos-domicilios');
    if (btnSelecionarTodos) {
        const novoBtnSelecionarTodos = btnSelecionarTodos.cloneNode(true);
        btnSelecionarTodos.parentNode.replaceChild(novoBtnSelecionarTodos, btnSelecionarTodos);
        novoBtnSelecionarTodos.addEventListener('click', selecionarTodosDomicilios);
    }

    // Interceptar botão "Desmarcar Todos"
    const btnDesmarcarTodos = document.getElementById('desmarcar-todos-domicilios');
    if (btnDesmarcarTodos) {
        const novoBtnDesmarcarTodos = btnDesmarcarTodos.cloneNode(true);
        btnDesmarcarTodos.parentNode.replaceChild(novoBtnDesmarcarTodos, btnDesmarcarTodos);
        novoBtnDesmarcarTodos.addEventListener('click', desmarcarTodosDomicilios);
    }

    // Observar mudanças na tabela para aplicar seleções persistentes
    observarMudancasTabela();

    // Interceptar checkboxes individuais
    interceptarCheckboxes();
});

/**
 * Função para selecionar TODOS os domicílios filtrados (de todas as páginas)
 */
async function selecionarTodosDomicilios() {
    try {
        console.log('Selecionando todos os domicílios filtrados...');

        // Mostrar mensagem de carregamento
        const btn = document.getElementById('selecionar-todos-domicilios');
        const textoOriginal = btn.textContent;
        btn.textContent = 'Carregando...';
        btn.disabled = true;

        // Obter filtros ativos
        const equipeButtonText = document.getElementById('domicilio-equipe-button-text');
        const microareaButtonText = document.getElementById('domicilio-microarea-button-text');
        const buscaInput = document.getElementById('domicilio-busca-input');

        const equipeSelecionada = equipeButtonText ? equipeButtonText.textContent : 'Todas as equipes';
        const microareaSelecionada = microareaButtonText ? microareaButtonText.textContent : 'Todas as microáreas';
        const termoBusca = buscaInput ? buscaInput.value.trim() : '';

        // Buscar TODOS os IDs dos domicílios filtrados
        const params = new URLSearchParams({
            equipe: equipeSelecionada,
            microarea: microareaSelecionada,
            search: termoBusca,
            status: 'Todos',
            page: 1,
            limit: 99999
        });

        const response = await fetch(`/api/domicilios/list?${params}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar domicílios');
        }

        const data = await response.json();
        const todosDomicilios = data.domicilios || [];

        // Adicionar todos os IDs ao Set
        selecaoDomicilios.idsSelecionados.clear();
        todosDomicilios.forEach(d => {
            selecaoDomicilios.idsSelecionados.add(String(d.id_domicilio));
        });

        selecaoDomicilios.todosSelecionados = true;
        selecaoDomicilios.todosIdsFiltrados = todosDomicilios.map(d => String(d.id_domicilio));

        // Marcar checkboxes da página atual
        marcarCheckboxesPaginaAtual();

        // Marcar checkbox "selecionar todos"
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }

        console.log(`${selecaoDomicilios.idsSelecionados.size} domicílios selecionados`);
        alert(`✅ ${selecaoDomicilios.idsSelecionados.size} domicílio(s) selecionado(s)`);

        // Restaurar botão
        btn.textContent = textoOriginal;
        btn.disabled = false;

    } catch (error) {
        console.error('Erro ao selecionar todos:', error);
        alert('❌ Erro ao selecionar todos os domicílios');

        const btn = document.getElementById('selecionar-todos-domicilios');
        btn.textContent = 'Selecionar Todos';
        btn.disabled = false;
    }
}

/**
 * Desmarca todos os domicílios
 */
function desmarcarTodosDomicilios() {
    selecaoDomicilios.idsSelecionados.clear();
    selecaoDomicilios.todosSelecionados = false;
    selecaoDomicilios.todosIdsFiltrados = [];

    // Desmarcar checkboxes da página atual
    const checkboxes = document.querySelectorAll('input[name="domicilio-checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);

    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }

    console.log('Todos os domicílios desmarcados');
}

/**
 * Marca os checkboxes da página atual baseado no estado de seleção
 */
function marcarCheckboxesPaginaAtual() {
    const checkboxes = document.querySelectorAll('input[name="domicilio-checkbox"]');
    checkboxes.forEach(cb => {
        const id = cb.value;
        cb.checked = selecaoDomicilios.idsSelecionados.has(String(id));
    });
}

/**
 * Intercepta checkboxes individuais para manter sincronizado com o estado
 */
function interceptarCheckboxes() {
    // Usar delegação de eventos no tbody
    const tbody = document.getElementById('domicilios-tbody');
    if (!tbody) return;

    tbody.addEventListener('change', function(e) {
        if (e.target.name === 'domicilio-checkbox') {
            const id = e.target.value;

            if (e.target.checked) {
                selecaoDomicilios.idsSelecionados.add(String(id));
            } else {
                selecaoDomicilios.idsSelecionados.delete(String(id));
                selecaoDomicilios.todosSelecionados = false;
            }

            console.log(`Domicílio ${id} ${e.target.checked ? 'selecionado' : 'desmarcado'}`);
            console.log(`Total selecionados: ${selecaoDomicilios.idsSelecionados.size}`);
        }
    });
}

/**
 * Observa mudanças na tabela para aplicar seleções persistentes
 */
function observarMudancasTabela() {
    const tbody = document.getElementById('domicilios-tbody');
    if (!tbody) return;

    // Usar MutationObserver para detectar quando a tabela é recarregada
    const observer = new MutationObserver(function(mutations) {
        // Quando a tabela muda, reaplicar seleções
        setTimeout(() => {
            marcarCheckboxesPaginaAtual();
            interceptarCheckboxes();
        }, 100);
    });

    observer.observe(tbody, {
        childList: true,
        subtree: true
    });
}

/**
 * Obtém lista de IDs selecionados
 * @returns {Array} Array de IDs dos domicílios selecionados
 */
function obterIdsSelecionados() {
    // Atualizar com checkboxes marcados da página atual
    const checkboxes = document.querySelectorAll('input[name="domicilio-checkbox"]:checked');
    checkboxes.forEach(cb => {
        selecaoDomicilios.idsSelecionados.add(String(cb.value));
    });

    return Array.from(selecaoDomicilios.idsSelecionados);
}

/**
 * Verifica se há domicílios selecionados
 * @returns {boolean}
 */
function temDomiciliosSelecionados() {
    // Verificar checkboxes marcados OU Set de IDs
    const checkboxesMarcados = document.querySelectorAll('input[name="domicilio-checkbox"]:checked');
    return checkboxesMarcados.length > 0 || selecaoDomicilios.idsSelecionados.size > 0;
}

/**
 * Obtém quantidade de domicílios selecionados
 * @returns {number}
 */
function contarDomiciliosSelecionados() {
    // Atualizar com checkboxes da página atual
    const checkboxes = document.querySelectorAll('input[name="domicilio-checkbox"]:checked');
    checkboxes.forEach(cb => {
        selecaoDomicilios.idsSelecionados.add(String(cb.value));
    });

    return selecaoDomicilios.idsSelecionados.size;
}

// Exportar funções globalmente para uso em outros scripts
window.selecaoDomicilios = selecaoDomicilios;
window.obterIdsSelecionados = obterIdsSelecionados;
window.temDomiciliosSelecionados = temDomiciliosSelecionados;
window.contarDomiciliosSelecionados = contarDomiciliosSelecionados;
