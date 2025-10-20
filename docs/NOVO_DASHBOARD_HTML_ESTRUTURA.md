# Nova Estrutura do Dashboard - HTML Completo

Esta é a nova estrutura do dashboard conforme especificação do usuário.

## Substituir no arquivo `painel-rastreamento-cardiovascular.html`

Substituir a seção do dashboard (linhas 101-161) por este novo código:

```html
<!-- CONTADORES DAS 6 CATEGORIAS -->
<div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">

    <!-- Sem Triagem -->
    <div class="bg-white rounded-lg shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow border-b-4 border-gray-400"
         onclick="selecionarAba('sem-triagem')">
        <div class="text-3xl font-bold text-gray-600" id="count-sem-triagem">0</div>
        <div class="text-xs text-gray-600 mt-1 font-semibold">Sem Triagem</div>
        <div class="text-xs text-gray-400 mt-1">Nenhuma int. triado</div>
    </div>

    <!-- Em Triagem -->
    <div class="bg-white rounded-lg shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow border-b-4 border-blue-500"
         onclick="selecionarAba('em-triagem')">
        <div class="text-3xl font-bold text-blue-600" id="count-em-triagem">0</div>
        <div class="text-xs text-blue-600 mt-1 font-semibold">Em Triagem</div>
        <div class="text-xs text-gray-400 mt-1">≥1 int. triado</div>
    </div>

    <!-- Família - Triagem Completa -->
    <div class="bg-white rounded-lg shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow border-b-4 border-green-500"
         onclick="selecionarAba('triagem-completa')">
        <div class="text-3xl font-bold text-green-600" id="count-triagem-completa">0</div>
        <div class="text-xs text-green-600 mt-1 font-semibold">Família - Triagem Completa</div>
        <div class="text-xs text-gray-400 mt-1">Todos triados</div>
    </div>

    <!-- Família - Triagem Incompleta -->
    <div class="bg-white rounded-lg shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow border-b-4 border-yellow-500"
         onclick="selecionarAba('triagem-incompleta')">
        <div class="text-3xl font-bold text-yellow-600" id="count-triagem-incompleta">0</div>
        <div class="text-xs text-yellow-600 mt-1 font-semibold">Família - Triagem Incompleta</div>
        <div class="text-xs text-gray-400 mt-1">Algum não triado</div>
    </div>

    <!-- Não Hipertensos -->
    <div class="bg-white rounded-lg shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow border-b-4 border-teal-500"
         onclick="selecionarAba('nao-hipertensos')">
        <div class="text-3xl font-bold text-teal-600" id="count-nao-hipertensos">0</div>
        <div class="text-xs text-teal-600 mt-1 font-semibold">Não Hipertensos</div>
        <div class="text-xs text-gray-400 mt-1">Pacientes</div>
    </div>

    <!-- Hipertensos -->
    <div class="bg-white rounded-lg shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow border-b-4 border-red-500"
         onclick="selecionarAba('hipertensos')">
        <div class="text-3xl font-bold text-red-600" id="count-hipertensos">0</div>
        <div class="text-xs text-red-600 mt-1 font-semibold">Hipertensos</div>
        <div class="text-xs text-gray-400 mt-1">Pacientes</div>
    </div>

</div>

<!-- ABAS DE CONTEÚDO -->
<div class="bg-white rounded-lg shadow-sm mb-6">
    <!-- Navegação das Abas -->
    <div class="border-b border-gray-200 px-6 pt-6">
        <nav class="flex flex-wrap gap-2" id="abas-navegacao">
            <button class="aba-btn px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 active" data-aba="sem-triagem">
                <i class="ri-file-list-line mr-1"></i>Sem Triagem
            </button>
            <button class="aba-btn px-4 py-2 text-sm font-medium rounded-t-lg border-b-2" data-aba="em-triagem">
                <i class="ri-loader-4-line mr-1"></i>Em Triagem
            </button>
            <button class="aba-btn px-4 py-2 text-sm font-medium rounded-t-lg border-b-2" data-aba="triagem-completa">
                <i class="ri-checkbox-circle-line mr-1"></i>Triagem Completa
            </button>
            <button class="aba-btn px-4 py-2 text-sm font-medium rounded-t-lg border-b-2" data-aba="triagem-incompleta">
                <i class="ri-error-warning-line mr-1"></i>Triagem Incompleta
            </button>
            <button class="aba-btn px-4 py-2 text-sm font-medium rounded-t-lg border-b-2" data-aba="nao-hipertensos">
                <i class="ri-user-smile-line mr-1"></i>Não Hipertensos
            </button>
            <button class="aba-btn px-4 py-2 text-sm font-medium rounded-t-lg border-b-2" data-aba="hipertensos">
                <i class="ri-alert-line mr-1"></i>Hipertensos
            </button>
        </nav>
    </div>

    <!-- Conteúdo das Abas -->
    <div class="p-6" id="conteudo-abas">
        <div id="aba-sem-triagem" class="aba-conteudo">
            <p class="text-gray-400 text-center py-8">Nenhuma família sem triagem</p>
        </div>
        <div id="aba-em-triagem" class="aba-conteudo hidden">
            <p class="text-gray-400 text-center py-8">Nenhuma família em triagem</p>
        </div>
        <div id="aba-triagem-completa" class="aba-conteudo hidden">
            <p class="text-gray-400 text-center py-8">Nenhuma família com triagem completa</p>
        </div>
        <div id="aba-triagem-incompleta" class="aba-conteudo hidden">
            <p class="text-gray-400 text-center py-8">Nenhuma família com triagem incompleta</p>
        </div>
        <div id="aba-nao-hipertensos" class="aba-conteudo hidden">
            <p class="text-gray-400 text-center py-8">Nenhum paciente não hipertenso</p>
        </div>
        <div id="aba-hipertensos" class="aba-conteudo hidden">
            <p class="text-gray-400 text-center py-8">Nenhum paciente hipertenso</p>
        </div>
    </div>
</div>
```

## Estilos CSS a adicionar

Adicionar no `<style>` do HTML:

```css
/* Estilo das abas */
.aba-btn {
    color: #6b7280;
    border-bottom-color: transparent;
    transition: all 0.2s;
}

.aba-btn:hover {
    color: #374151;
    background-color: #f3f4f6;
}

.aba-btn.active {
    color: #ef4444;
    border-bottom-color: #ef4444;
    background-color: #fef2f2;
}

.aba-conteudo {
    display: block;
}

.aba-conteudo.hidden {
    display: none;
}
```

## JavaScript a adicionar

Adicionar ao arquivo `dashboard_rastreamento.js`:

```javascript
// Função para selecionar aba
window.selecionarAba = function(nomeAba) {
    // Atualizar botões de navegação
    document.querySelectorAll('.aba-btn').forEach(btn => {
        if (btn.getAttribute('data-aba') === nomeAba) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Atualizar conteúdo
    document.querySelectorAll('.aba-conteudo').forEach(conteudo => {
        conteudo.classList.add('hidden');
    });

    const conteudoAtivo = document.getElementById(`aba-${nomeAba}`);
    if (conteudoAtivo) {
        conteudoAtivo.classList.remove('hidden');
    }

    // Carregar dados da aba selecionada
    carregarDadosAba(nomeAba);
};

// Event listeners para os botões das abas
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const nomeAba = btn.getAttribute('data-aba');
            selecionarAba(nomeAba);
        });
    });
});

// Função para carregar dados de uma aba específica
function carregarDadosAba(nomeAba) {
    // TODO: Implementar carregamento específico para cada aba
    console.log('Carregando dados da aba:', nomeAba);
}
```

## Estrutura de Dados Esperada do Backend

```json
{
    "success": true,
    "dashboard": {
        "contadores": {
            "sem_triagem": 12,
            "em_triagem": 5,
            "triagem_completa": 8,
            "triagem_incompleta": 3,
            "nao_hipertensos": 45,
            "hipertensos": 7
        },
        "sem_triagem": [
            {
                "id_familia": 123,
                "nome_responsavel": "MARIA DA SILVA",
                "endereco": "RUA DAS FLORES, 123",
                "microarea": "01",
                "total_integrantes": 4
            }
        ],
        "em_triagem": [...],
        "triagem_completa": [...],
        "triagem_incompleta": [...],
        "nao_hipertensos": [
            {
                "co_seq": 456,
                "nome": "JOÃO SANTOS",
                "idade": 45,
                "sexo": "M",
                "pas": 118,
                "pad": 75,
                "endereco": "RUA X, 10"
            }
        ],
        "hipertensos": [...]
    }
}
```
