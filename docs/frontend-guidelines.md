# Frontend Guidelines - Sistema APS

## 📋 Visão Geral

O frontend do Sistema APS é construído com JavaScript modular ES6+, TailwindCSS e templates Jinja2. Este documento estabelece os padrões para desenvolvimento frontend consistente e maintível.

## 🏗️ Arquitetura Frontend

### Estrutura de Arquivos

```
static/
├── hiperdia_has_script.js      # Controller principal HIPERDIA
├── hiperdiaApi.js              # Chamadas API HIPERDIA
├── hiperdiaDom.js              # Manipulação DOM HIPERDIA
├── plafam_script.js            # Controller PLAFAM
├── adolescentes_script.js      # Controller Adolescentes
└── [outros scripts específicos]

templates/
├── painel-hiperdia-has.html    # Template HIPERDIA
├── painel-plafam.html          # Template PLAFAM
├── painel-adolescentes.html    # Template Adolescentes
└── base.html                   # Template base
```

### Padrão de Módulos

#### Estrutura Recomendada

```javascript
// exemplo: hiperdiaApi.js
export const hiperdiaApi = {
    // Configuração
    API_BASE_URL: '',
    
    // Métodos públicos
    fetchPacientesHiperdia: async (params) => {
        // implementação
    },
    
    registrarAcao: async (payload) => {
        // implementação
    }
};

// exemplo: hiperdiaDom.js  
export const hiperdiaDom = {
    // Elementos DOM
    elementos: {
        tabela: null,
        modal: null,
        filtros: null
    },
    
    // Métodos de renderização
    renderPacientesTable: (pacientes) => {
        // implementação
    },
    
    // Event handlers
    setupEventListeners: () => {
        // implementação
    }
};
```

## 🎨 TailwindCSS Guidelines

### Classes Base do Sistema

#### Layout e Containers

```html
<!-- Container principal -->
<div class="container mx-auto px-4 py-6">
    <!-- Conteúdo -->
</div>

<!-- Cards -->
<div class="bg-white rounded-lg shadow-md p-6 mb-4">
    <!-- Conteúdo do card -->
</div>

<!-- Grid responsivo -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Items do grid -->
</div>
```

#### Botões Padronizados

```html
<!-- Botão primário -->
<button class="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-md transition-colors">
    Ação Principal
</button>

<!-- Botão secundário -->
<button class="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-md transition-colors">
    Ação Secundária
</button>

<!-- Botão de sucesso -->
<button class="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-md transition-colors">
    Confirmar
</button>

<!-- Botão de alerta -->
<button class="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-md transition-colors">
    Atenção
</button>

<!-- Botão de erro -->
<button class="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md transition-colors">
    Excluir
</button>
```

#### Formulários

```html
<!-- Grupo de campo -->
<div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">
        Nome do Campo
    </label>
    <input type="text" 
           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           placeholder="Digite aqui...">
</div>

<!-- Select -->
<select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">Selecione...</option>
    <option value="opcao1">Opção 1</option>
</select>

<!-- Textarea -->
<textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          rows="4" placeholder="Observações..."></textarea>
```

### Cores do Sistema

#### Paleta Padrão

```css
/* Cores principais */
.cor-primaria    { color: #3B82F6; }  /* blue-500 */
.bg-primaria     { background-color: #3B82F6; }

.cor-sucesso     { color: #10B981; }  /* green-500 */
.bg-sucesso      { background-color: #10B981; }

.cor-alerta      { color: #F59E0B; }  /* yellow-500 */
.bg-alerta       { background-color: #F59E0B; }

.cor-erro        { color: #EF4444; }  /* red-500 */
.bg-erro         { background-color: #EF4444; }

.cor-neutro      { color: #6B7280; }  /* gray-500 */
.bg-neutro       { background-color: #6B7280; }
```

#### Estados dos Componentes

```html
<!-- Estados de botão -->
<button class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
    Botão com Estados
</button>

<!-- Estados de input -->
<input class="border-gray-300 focus:border-blue-500 focus:ring-blue-500 invalid:border-red-500">

<!-- Estados de cards -->
<div class="bg-white hover:shadow-lg transition-shadow duration-200">
    Card com Hover
</div>
```

## 🎯 JavaScript Patterns

### Nomenclatura e Convenções

#### Variáveis e Funções

```javascript
// ✅ CamelCase para JavaScript
const proximaAcaoDisplay = 'Solicitar MRPA';
const codCidadao = 12345;
const dataAgendamento = '2024-01-15';

// ✅ Português para variáveis de negócio
const pacientesHiperdia = [];
const equipesDisponiveis = [];
const acoesPendentes = [];

// ✅ Funções descritivas
function abrirModalTimeline(codCidadao) { }
function buscarPacientesPorEquipe(nomeEquipe) { }
function validarDadosFormulario(dadosFormulario) { }
```

#### Constantes e Configurações

```javascript
// ✅ Constantes em UPPER_CASE
const API_BASE_URL = '';
const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 300;

// ✅ Mapeamentos de dados
const TIPO_ACAO_MAP = {
    1: { nome: "Solicitar MRPA", icone: "stethoscope-line", cor: "blue" },
    2: { nome: "Avaliar Exames", icone: "file-text-line", cor: "green" },
    3: { nome: "Modificar tratamento", icone: "medicine-bottle-line", cor: "orange" },
    4: { nome: "Orientar mudança estilo vida", icone: "heart-line", cor: "purple" },
    5: { nome: "Solicitar Exames", icone: "test-tube-line", cor: "cyan" },
    6: { nome: "Reagendar Hiperdia", icone: "calendar-line", cor: "yellow" },
    7: { nome: "Encaminhar médico", icone: "user-heart-line", cor: "red" },
    8: { nome: "Busca Ativa", icone: "search-line", cor: "indigo" },
    9: { nome: "Agendar Hiperdia", icone: "calendar-check-line", cor: "emerald" }
};

const STATUS_CORES = {
    'PENDENTE': 'yellow',
    'REALIZADA': 'green', 
    'CANCELADA': 'red'
};
```

### Event Handling

#### Event Delegation

```javascript
// ✅ Usar event delegation para elementos dinâmicos
function setupEventListeners() {
    const tabela = document.getElementById('pacientes-table');
    
    tabela.addEventListener('click', (event) => {
        const target = event.target;
        
        // Timeline
        if (target.matches('[data-acao="timeline"]')) {
            const codCidadao = target.dataset.codCidadao;
            abrirModalTimeline(codCidadao);
        }
        
        // Registrar ação
        if (target.matches('[data-acao="registrar"]')) {
            const codCidadao = target.dataset.codCidadao;
            abrirModalRegistrarAcao(codCidadao);
        }
        
        // Editar
        if (target.matches('[data-acao="editar"]')) {
            const codAcompanhamento = target.dataset.codAcompanhamento;
            editarAcompanhamento(codAcompanhamento);
        }
    });
}
```

#### Debounce para Busca

```javascript
// ✅ Debounce para campos de busca
function criarDebouncedSearch(callback, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
}

// Uso
const buscarPacientesDebounced = criarDebouncedSearch(buscarPacientes, 300);

document.getElementById('campo-busca').addEventListener('input', (event) => {
    buscarPacientesDebounced(event.target.value);
});
```

### Manipulação do DOM

#### Seletores Eficientes

```javascript
// ✅ Cache de elementos frequentemente usados
const elementos = {
    tabela: document.getElementById('pacientes-table'),
    modalTimeline: document.getElementById('modal-timeline'),
    modalRegistrar: document.getElementById('modal-registrar-acao'),
    filtroEquipe: document.getElementById('filtro-equipe'),
    filtroBusca: document.getElementById('filtro-busca'),
    loadingIndicator: document.getElementById('loading')
};

// ✅ Função para verificar se elementos existem
function verificarElementos() {
    const elementosFaltando = [];
    
    Object.entries(elementos).forEach(([nome, elemento]) => {
        if (!elemento) {
            elementosFaltando.push(nome);
        }
    });
    
    if (elementosFaltando.length > 0) {
        console.error('Elementos não encontrados:', elementosFaltando);
        return false;
    }
    
    return true;
}
```

#### Criação Dinâmica de Elementos

```javascript
// ✅ Função utilitária para criar elementos
function criarElemento(tag, classes = '', atributos = {}, conteudo = '') {
    const elemento = document.createElement(tag);
    
    if (classes) {
        elemento.className = classes;
    }
    
    Object.entries(atributos).forEach(([key, value]) => {
        elemento.setAttribute(key, value);
    });
    
    if (conteudo) {
        elemento.innerHTML = conteudo;
    }
    
    return elemento;
}

// Uso
const botaoTimeline = criarElemento('button', 
    'bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm',
    { 'data-acao': 'timeline', 'data-cod-cidadao': paciente.cod_paciente },
    '<i class="ri-time-line mr-1"></i>Timeline'
);
```

### API Integration

#### Chamadas Padronizadas

```javascript
// ✅ Wrapper para fetch com tratamento de erro
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    try {
        mostrarLoading(true);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error(`Erro na API (${endpoint}):`, error);
        mostrarMensagemErro(`Erro ao carregar dados: ${error.message}`);
        throw error;
        
    } finally {
        mostrarLoading(false);
    }
}

// ✅ Funções específicas da API
const api = {
    async buscarPacientes(params) {
        const urlParams = new URLSearchParams(params).toString();
        return apiCall(`/api/pacientes_hiperdia_has?${urlParams}`);
    },
    
    async registrarAcao(payload) {
        return apiCall('/api/hiperdia/registrar_acao', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    
    async buscarTimeline(codCidadao, period = 'all') {
        return apiCall(`/api/hiperdia/timeline/${codCidadao}?period=${period}`);
    }
};
```

### Validação de Formulários

#### Validadores Customizados

```javascript
// ✅ Sistema de validação modular
const validadores = {
    required: (valor, campo) => {
        if (!valor || valor.trim() === '') {
            return `Campo ${campo} é obrigatório`;
        }
        return null;
    },
    
    numeric: (valor, campo) => {
        if (valor && isNaN(Number(valor))) {
            return `Campo ${campo} deve ser numérico`;
        }
        return null;
    },
    
    date: (valor, campo) => {
        if (valor && !moment(valor, 'YYYY-MM-DD', true).isValid()) {
            return `Campo ${campo} deve ter uma data válida`;
        }
        return null;
    },
    
    pressao: (valor, campo) => {
        if (valor && (Number(valor) < 50 || Number(valor) > 300)) {
            return `Campo ${campo} deve estar entre 50 e 300 mmHg`;
        }
        return null;
    }
};

// ✅ Função de validação genérica
function validarFormulario(dados, regras) {
    const erros = [];
    
    Object.entries(regras).forEach(([campo, regrascampo]) => {
        const valor = dados[campo];
        
        regrascamp.forEach(regra => {
            const erro = validadores[regra](valor, campo);
            if (erro) {
                erros.push(erro);
            }
        });
    });
    
    return erros;
}

// Uso
const dadosFormulario = {
    cod_cidadao: document.getElementById('cod-cidadao').value,
    pressao_sistolica: document.getElementById('pressao-sistolica').value,
    data_agendamento: document.getElementById('data-agendamento').value
};

const regrasValidacao = {
    cod_cidadao: ['required', 'numeric'],
    pressao_sistolica: ['numeric', 'pressao'],
    data_agendamento: ['required', 'date']
};

const erros = validarFormulario(dadosFormulario, regrasValidacao);
```

## 🎨 UI Components

### Modais Padronizados

#### Estrutura HTML Base

```html
<!-- Modal genérico -->
<div id="modal-exemplo" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b">
                <h3 class="text-lg font-semibold text-gray-900">
                    Título do Modal
                </h3>
                <button class="text-gray-400 hover:text-gray-600" data-acao="fechar-modal">
                    <i class="ri-close-line text-xl"></i>
                </button>
            </div>
            
            <!-- Body -->
            <div class="p-6 overflow-y-auto max-h-[60vh]">
                <!-- Conteúdo do modal -->
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button class="px-4 py-2 text-gray-600 hover:text-gray-800" data-acao="fechar-modal">
                    Cancelar
                </button>
                <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    Confirmar
                </button>
            </div>
        </div>
    </div>
</div>
```

#### JavaScript para Modais

```javascript
// ✅ Sistema de modal reutilizável
const modalManager = {
    abrir: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },
    
    fechar: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },
    
    setupEventListeners: () => {
        document.addEventListener('click', (event) => {
            // Fechar modal clicando no backdrop
            if (event.target.matches('.modal-backdrop')) {
                const modal = event.target.closest('[id^="modal-"]');
                if (modal) {
                    modalManager.fechar(modal.id);
                }
            }
            
            // Botões de fechar
            if (event.target.matches('[data-acao="fechar-modal"]')) {
                const modal = event.target.closest('[id^="modal-"]');
                if (modal) {
                    modalManager.fechar(modal.id);
                }
            }
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const modalAberto = document.querySelector('[id^="modal-"]:not(.hidden)');
                if (modalAberto) {
                    modalManager.fechar(modalAberto.id);
                }
            }
        });
    }
};
```

### Tabelas Responsivas

#### HTML Structure

```html
<div class="overflow-x-auto">
    <table class="min-w-full bg-white border border-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                    Nome
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                    Idade
                </th>
                <th class="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">
                    Ações
                </th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
            <!-- Linhas serão inseridas dinamicamente -->
        </tbody>
    </table>
</div>
```

#### Renderização de Tabela

```javascript
// ✅ Função de renderização de tabela
function renderizarTabela(pacientes, containerId) {
    const container = document.getElementById(containerId);
    const tbody = container.querySelector('tbody');
    
    if (!tbody) {
        console.error('Tbody não encontrado na tabela');
        return;
    }
    
    // Limpar conteúdo anterior
    tbody.innerHTML = '';
    
    if (pacientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="100%" class="px-4 py-8 text-center text-gray-500">
                    Nenhum paciente encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    pacientes.forEach(paciente => {
        const linha = criarLinhaPaciente(paciente);
        tbody.appendChild(linha);
    });
}

function criarLinhaPaciente(paciente) {
    const tr = criarElemento('tr', 'hover:bg-gray-50');
    
    tr.innerHTML = `
        <td class="px-4 py-3 border-b">
            <div class="font-medium text-gray-900">${paciente.nome_paciente}</div>
            <div class="text-sm text-gray-500">${paciente.equipe_nome}</div>
        </td>
        <td class="px-4 py-3 border-b text-sm text-gray-600">
            ${calcularIdade(paciente.data_nascimento)} anos
        </td>
        <td class="px-4 py-3 border-b text-center">
            <div class="flex items-center justify-center gap-2">
                ${criarBotoesAcao(paciente)}
            </div>
        </td>
    `;
    
    return tr;
}
```

### Loading e Feedback

#### Loading Indicators

```html
<!-- Loading spinner -->
<div id="loading" class="hidden fixed inset-0 bg-black bg-opacity-25 z-50">
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span class="text-gray-700">Carregando...</span>
        </div>
    </div>
</div>

<!-- Loading em tabela -->
<div id="loading-tabela" class="hidden text-center py-8">
    <div class="inline-flex items-center gap-2 text-gray-600">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>Carregando pacientes...</span>
    </div>
</div>
```

#### Mensagens de Feedback

```javascript
// ✅ Sistema de notificações
const notificacoes = {
    mostrar: (mensagem, tipo = 'info', duracao = 5000) => {
        const cores = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        };
        
        const notificacao = criarElemento('div', 
            `fixed top-4 right-4 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`,
            {},
            `<div class="flex items-center gap-2">
                <span>${mensagem}</span>
                <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="ri-close-line"></i>
                </button>
            </div>`
        );
        
        document.body.appendChild(notificacao);
        
        // Animação de entrada
        setTimeout(() => {
            notificacao.classList.remove('translate-x-full');
        }, 100);
        
        // Remoção automática
        setTimeout(() => {
            notificacao.classList.add('translate-x-full');
            setTimeout(() => notificacao.remove(), 300);
        }, duracao);
    },
    
    sucesso: (mensagem) => notificacoes.mostrar(mensagem, 'success'),
    erro: (mensagem) => notificacoes.mostrar(mensagem, 'error'),
    alerta: (mensagem) => notificacoes.mostrar(mensagem, 'warning'),
    info: (mensagem) => notificacoes.mostrar(mensagem, 'info')
};
```

## 🔧 Utilities

### Funções Utilitárias Comuns

```javascript
// ✅ Utilitários para datas
const dateUtils = {
    formatarDataBR: (dataISO) => {
        if (!dataISO) return '';
        const date = new Date(dataISO);
        return date.toLocaleDateString('pt-BR');
    },
    
    formatarDataParaInput: (dataISO) => {
        if (!dataISO) return '';
        return dataISO.split('T')[0];
    },
    
    calcularIdade: (dataNascimento) => {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const m = hoje.getMonth() - nascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    }
};

// ✅ Utilitários para formatação
const formatUtils = {
    formatarTelefone: (telefone) => {
        if (!telefone) return '';
        const digits = telefone.replace(/\D/g, '');
        if (digits.length === 11) {
            return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
        }
        return telefone;
    },
    
    formatarCPF: (cpf) => {
        if (!cpf) return '';
        const digits = cpf.replace(/\D/g, '');
        if (digits.length === 11) {
            return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
        }
        return cpf;
    },
    
    truncarTexto: (texto, limite = 50) => {
        if (!texto) return '';
        if (texto.length <= limite) return texto;
        return texto.substring(0, limite) + '...';
    }
};

// ✅ Utilitários para URL e parâmetros
const urlUtils = {
    obterParametroURL: (nome) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(nome);
    },
    
    atualizarParametroURL: (nome, valor) => {
        const url = new URL(window.location);
        if (valor) {
            url.searchParams.set(nome, valor);
        } else {
            url.searchParams.delete(nome);
        }
        window.history.replaceState({}, '', url);
    },
    
    construirQueryString: (params) => {
        const filteredParams = Object.fromEntries(
            Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        );
        return new URLSearchParams(filteredParams).toString();
    }
};
```

## 📱 Responsividade

### Breakpoints Padrão

```html
<!-- Classes responsivas TailwindCSS -->
<!-- Mobile first approach -->

<!-- Esconder em mobile, mostrar em tablet+ -->
<div class="hidden md:block">Conteúdo para tablet+</div>

<!-- Mostrar apenas em mobile -->
<div class="block md:hidden">Conteúdo para mobile</div>

<!-- Grid responsivo -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <!-- Items -->
</div>

<!-- Padding responsivo -->
<div class="p-4 md:p-6 lg:p-8">
    <!-- Conteúdo -->
</div>
```

### Tabelas Responsivas

```html
<!-- Tabela com scroll horizontal em mobile -->
<div class="overflow-x-auto">
    <table class="min-w-full">
        <!-- Conteúdo da tabela -->
    </table>
</div>

<!-- Cards que se transformam em tabela em desktop -->
<div class="space-y-4 md:hidden">
    <!-- Cards para mobile -->
</div>
<div class="hidden md:block">
    <table>
        <!-- Tabela para desktop -->
    </table>
</div>
```

## 🚀 Performance

### Lazy Loading

```javascript
// ✅ Lazy loading para imagens
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
```

### Virtualização de Listas

```javascript
// ✅ Renderização virtual para listas grandes
class VirtualList {
    constructor(container, items, renderItem, itemHeight = 50) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.itemHeight = itemHeight;
        this.visibleCount = Math.ceil(container.clientHeight / itemHeight);
        this.scrollTop = 0;
        
        this.setup();
    }
    
    setup() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        
        this.viewport = document.createElement('div');
        this.viewport.style.height = `${this.items.length * this.itemHeight}px`;
        
        this.content = document.createElement('div');
        this.content.style.position = 'absolute';
        this.content.style.top = '0';
        this.content.style.width = '100%';
        
        this.viewport.appendChild(this.content);
        this.container.appendChild(this.viewport);
        
        this.container.addEventListener('scroll', () => this.onScroll());
        this.render();
    }
    
    onScroll() {
        this.scrollTop = this.container.scrollTop;
        this.render();
    }
    
    render() {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(startIndex + this.visibleCount + 1, this.items.length);
        
        this.content.style.transform = `translateY(${startIndex * this.itemHeight}px)`;
        this.content.innerHTML = '';
        
        for (let i = startIndex; i < endIndex; i++) {
            const element = this.renderItem(this.items[i], i);
            element.style.height = `${this.itemHeight}px`;
            this.content.appendChild(element);
        }
    }
}
```

## 🧪 Testing

### Testes Unitários (Recomendado)

```javascript
// ✅ Exemplo de teste com Jest (futuro)
describe('dateUtils', () => {
    test('deve calcular idade corretamente', () => {
        const dataNascimento = '1990-01-01';
        const idade = dateUtils.calcularIdade(dataNascimento);
        expect(idade).toBeGreaterThan(30);
    });
    
    test('deve formatar data para padrão brasileiro', () => {
        const dataISO = '2024-01-15';
        const dataBR = dateUtils.formatarDataBR(dataISO);
        expect(dataBR).toBe('15/01/2024');
    });
});

describe('validadores', () => {
    test('deve validar campo obrigatório', () => {
        const erro = validadores.required('', 'nome');
        expect(erro).toContain('obrigatório');
    });
    
    test('deve validar valor numérico', () => {
        const erro = validadores.numeric('abc', 'idade');
        expect(erro).toContain('numérico');
    });
});
```

### Debug e Monitoramento

```javascript
// ✅ Sistema de debug
const debug = {
    enabled: window.location.hostname === 'localhost',
    
    log: (...args) => {
        if (debug.enabled) {
            console.log('[DEBUG]', ...args);
        }
    },
    
    error: (...args) => {
        if (debug.enabled) {
            console.error('[DEBUG ERROR]', ...args);
        }
    },
    
    time: (label) => {
        if (debug.enabled) {
            console.time(`[DEBUG TIME] ${label}`);
        }
    },
    
    timeEnd: (label) => {
        if (debug.enabled) {
            console.timeEnd(`[DEBUG TIME] ${label}`);
        }
    }
};

// Uso
debug.log('Iniciando busca de pacientes');
debug.time('Busca API');

try {
    const resultado = await api.buscarPacientes(params);
    debug.timeEnd('Busca API');
    debug.log('Pacientes encontrados:', resultado.total);
} catch (error) {
    debug.error('Erro na busca:', error);
}
```

## 📚 Recursos e Referências

### Bibliotecas Utilizadas

- **TailwindCSS**: Framework CSS utilitário
- **RemixIcon**: Conjunto de ícones
- **ECharts**: Biblioteca de gráficos
- **jsPDF**: Geração de PDFs no frontend

### Links Úteis

- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [RemixIcon](https://remixicon.com/)
- [ECharts Documentation](https://echarts.apache.org/en/index.html)
- [jsPDF Documentation](https://raw.githack.com/MrRio/jsPDF/master/docs/index.html)
- [MDN Web Docs](https://developer.mozilla.org/)

### Ferramentas de Desenvolvimento

```bash
# Linting JavaScript
npx eslint static/*.js

# Formatação de código (se configurado)
npx prettier --write static/*.js

# Live reload (se configurado)
npx live-server
```