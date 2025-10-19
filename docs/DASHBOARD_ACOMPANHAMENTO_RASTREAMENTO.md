# Dashboard de Acompanhamento - Rastreamento Cardiovascular

**Data:** 2025-10-18
**Módulo:** Rastreamento Cardiovascular
**Tipo:** Nova Funcionalidade - Dashboard

---

## 📋 Objetivo

Implementar um dashboard de acompanhamento na tela principal do rastreamento cardiovascular, permitindo visualização rápida e acesso direto a:

1. **Domicílios em Triagem** - triagens em andamento
2. **Domicílios Triados** - triagens completas
3. **Hipertensos Diagnosticados** - casos positivos identificados

---

## 🎯 Funcionalidades Implementadas

### 1. Dashboard Visual com 3 Cards

```
┌─────────────────────────────────────────────────────────────────┐
│                     DASHBOARD DE ACOMPANHAMENTO                  │
├──────────────────┬──────────────────┬───────────────────────────┤
│  EM TRIAGEM      │   TRIADOS        │   HIPERTENSOS             │
│  (azul)          │   (verde)        │   (vermelho)              │
│  ─────────       │   ─────────      │   ─────────               │
│  □ 3 domicílios  │   □ 12 dom.      │   □ 5 casos               │
│                  │                  │                            │
│  Lista com:      │   Lista com:     │   Lista com:              │
│  • Endereço      │   • Endereço     │   • Nome do cidadão       │
│  • N° famílias   │   • N° triados   │   • Idade, sexo           │
│  • Progresso %   │   • Normais      │   • PAS×PAD               │
│  • Barra progr.  │   • Hipertensos  │   • Status encaminhamento │
│                  │   • Data concl.  │   • Endereço              │
└──────────────────┴──────────────────┴───────────────────────────┘
```

---

## 💻 Implementação Técnica

### Arquivo 1: `templates/painel-rastreamento-cardiovascular.html`

#### Adicionado Dashboard (Linhas 98-152)

```html
<!-- DASHBOARD DE ACOMPANHAMENTO -->
<div id="dashboard-acompanhamento" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

    <!-- CARD: Domicílios em Triagem -->
    <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
                <i class="ri-file-list-3-line mr-2 text-blue-600"></i>Em Triagem
            </h3>
            <span id="count-em-triagem" class="text-2xl font-bold text-blue-600">0</span>
        </div>
        <p class="text-sm text-gray-600 mb-4">Domicílios com triagem em andamento</p>
        <div id="lista-em-triagem" class="space-y-2 max-h-64 overflow-y-auto">
            <!-- Será preenchido via JavaScript -->
        </div>
    </div>

    <!-- CARD: Domicílios Triados -->
    <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
                <i class="ri-checkbox-circle-line mr-2 text-green-600"></i>Triados
            </h3>
            <span id="count-triados" class="text-2xl font-bold text-green-600">0</span>
        </div>
        <p class="text-sm text-gray-600 mb-4">Domicílios com triagem completa</p>
        <div id="lista-triados" class="space-y-2 max-h-64 overflow-y-auto">
            <!-- Será preenchido via JavaScript -->
        </div>
    </div>

    <!-- CARD: Hipertensos Diagnosticados -->
    <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
                <i class="ri-alert-line mr-2 text-red-600"></i>Hipertensos
            </h3>
            <span id="count-hipertensos" class="text-2xl font-bold text-red-600">0</span>
        </div>
        <p class="text-sm text-gray-600 mb-4">Casos positivos identificados</p>
        <div id="lista-hipertensos" class="space-y-2 max-h-64 overflow-y-auto">
            <!-- Será preenchido via JavaScript -->
        </div>
    </div>

</div>
```

**Características:**
- Grid responsivo de 3 colunas
- Altura máxima de 64 unidades (max-h-64) com scroll automático
- Borda lateral colorida para identificação rápida
- Contador destacado em fonte grande
- Ícones RemixIcon para cada categoria

---

### Arquivo 2: `static/dashboard_rastreamento.js` (NOVO)

Arquivo JavaScript dedicado ao dashboard com funções organizadas:

#### 2.1 Carregamento Inicial

```javascript
async function carregarDashboardAcompanhamento() {
    try {
        const response = await fetch('/api/rastreamento/dashboard');
        const data = await response.json();

        if (data.success) {
            renderizarDashboard(data.dashboard);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        renderizarDashboard({
            em_triagem: [],
            triados: [],
            hipertensos: []
        });
    }
}
```

**Endpoint esperado:** `GET /api/rastreamento/dashboard`

**Resposta esperada:**
```json
{
    "success": true,
    "dashboard": {
        "em_triagem": [...],
        "triados": [...],
        "hipertensos": [...]
    }
}
```

---

#### 2.2 Renderização de Domicílios em Triagem

```javascript
function renderizarEmTriagem(domicilios) {
    const container = document.getElementById('lista-em-triagem');
    const countElement = document.getElementById('count-em-triagem');

    countElement.textContent = domicilios.length;

    // ... renderização dos cards
}
```

**Card de Domicílio em Triagem:**
```html
<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
    <h5>Endereço</h5>
    <div>
        <span>N famílias</span>
        <span>N integrantes</span>
    </div>
    <div>
        <!-- Barra de progresso -->
        <div class="bg-blue-200 h-1.5">
            <div class="bg-blue-600" style="width: X%"></div>
        </div>
        <p>X% completo</p>
    </div>
</div>
```

**Dados esperados do backend:**
```json
{
    "id_domicilio": 123,
    "endereco": "RUA DAS FLORES, 123",
    "total_familias": 2,
    "total_integrantes": 8,
    "progresso": 65
}
```

---

#### 2.3 Renderização de Domicílios Triados

```javascript
function renderizarTriados(domicilios) {
    // Similar ao em_triagem, mas com informações de resultado
}
```

**Card de Domicílio Triado:**
```html
<div class="bg-green-50 border border-green-200 rounded-lg p-3">
    <h5>Endereço</h5>
    <div>
        <span>N famílias</span>
        <span>N triados</span>
    </div>
    <div>
        <span class="bg-green-600">N normais</span>
        <span class="bg-red-600">N hipertensos</span>
    </div>
    <p>Concluído em DD/MM/YYYY</p>
</div>
```

**Dados esperados:**
```json
{
    "id_domicilio": 456,
    "endereco": "AV. BRASIL, 456",
    "total_familias": 3,
    "total_triados": 12,
    "normais": 10,
    "hipertensos": 2,
    "data_conclusao": "2025-10-15"
}
```

---

#### 2.4 Renderização de Hipertensos

```javascript
function renderizarHipertensos(cidadaos) {
    // Renderiza lista de cidadãos diagnosticados com hipertensão
}
```

**Card de Cidadão Hipertenso:**
```html
<div class="bg-red-50 border border-red-200 rounded-lg p-3">
    <h5>Nome do Cidadão</h5>
    <div>
        <span>Idade anos</span>
        <span>Sexo</span>
    </div>
    <div>
        <span class="bg-red-600">PAS×PAD mmHg</span>
        <span class="bg-purple-600">Encaminhado</span>
        <!-- OU -->
        <span class="bg-yellow-600 animate-pulse">Pendente</span>
    </div>
    <p>Endereço</p>
</div>
```

**Dados esperados:**
```json
{
    "co_seq_cds_cad_individual": 789,
    "nome": "JOÃO DA SILVA",
    "idade": 45,
    "sexo": "M",
    "pas": 145,
    "pad": 95,
    "endereco": "RUA DAS FLORES, 123",
    "encaminhado_hiperdia": false
}
```

---

#### 2.5 Funções de Acesso Rápido

```javascript
// Acessar triagem em andamento
window.acessarTriagem = function(idDomicilio) {
    // TODO: Carregar dados da triagem e retomar do passo correto
};

// Ver resultados de domicílio triado
window.verResultados = function(idDomicilio) {
    // TODO: Abrir modal ou página com resultados completos
};

// Ver detalhes de cidadão hipertenso
window.verDetalhesCidadao = function(coSeqCadIndividual) {
    // TODO: Abrir modal com dados completos e opções de encaminhamento
};
```

---

### Arquivo 3: `static/rastreamento_cardiovascular_script.js`

#### Modificação na Inicialização (Linha 48)

```javascript
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventListeners();
    carregarFiltrosIniciais();
    carregarDashboardAcompanhamento();  // NOVO
});
```

---

## 🔌 Endpoints de API Necessários

### 1. `GET /api/rastreamento/dashboard`

**Descrição:** Retorna dados consolidados do dashboard

**Resposta:**
```json
{
    "success": true,
    "dashboard": {
        "em_triagem": [
            {
                "id_domicilio": 123,
                "endereco": "RUA DAS FLORES, 123 - CENTRO",
                "total_familias": 2,
                "total_integrantes": 8,
                "progresso": 65
            }
        ],
        "triados": [
            {
                "id_domicilio": 456,
                "endereco": "AV. BRASIL, 456 - JARDIM",
                "total_familias": 3,
                "total_triados": 12,
                "normais": 10,
                "hipertensos": 2,
                "data_conclusao": "2025-10-15"
            }
        ],
        "hipertensos": [
            {
                "co_seq_cds_cad_individual": 789,
                "nome": "JOÃO DA SILVA",
                "idade": 45,
                "sexo": "M",
                "pas": 145,
                "pad": 95,
                "endereco": "RUA DAS FLORES, 123",
                "encaminhado_hiperdia": false
            }
        ]
    }
}
```

**Lógica Backend (Exemplo em Python/Flask):**

```python
@app.route('/api/rastreamento/dashboard')
def get_dashboard_rastreamento():
    try:
        # Buscar domicílios em triagem
        em_triagem = """
            SELECT DISTINCT
                d.id_domicilio,
                d.endereco_completo as endereco,
                COUNT(DISTINCT f.id_familia) as total_familias,
                COUNT(DISTINCT i.co_seq_cds_cad_individual) as total_integrantes,
                -- Calcular progresso baseado em status
                COALESCE(
                    (COUNT(CASE WHEN r.status = 'concluido' THEN 1 END)::float /
                     NULLIF(COUNT(DISTINCT i.co_seq_cds_cad_individual), 0) * 100)::int,
                    0
                ) as progresso
            FROM sistemaaps.rastreamento_sessoes s
            JOIN tb_domicilio d ON d.id_domicilio = s.id_domicilio
            JOIN tb_familia f ON f.id_domicilio = d.id_domicilio
            JOIN tb_integrantes i ON i.id_familia = f.id_familia
            LEFT JOIN sistemaaps.rastreamento_resultados r ON r.co_seq_cds_cad_individual = i.co_seq_cds_cad_individual
            WHERE s.status = 'em_andamento'
            GROUP BY d.id_domicilio, d.endereco_completo
        """

        # Buscar domicílios triados
        triados = """
            SELECT DISTINCT
                d.id_domicilio,
                d.endereco_completo as endereco,
                COUNT(DISTINCT f.id_familia) as total_familias,
                COUNT(DISTINCT r.co_seq_cds_cad_individual) as total_triados,
                COUNT(CASE WHEN r.classificacao = 'NAO_HIPERTENSO' THEN 1 END) as normais,
                COUNT(CASE WHEN r.classificacao = 'HIPERTENSO' THEN 1 END) as hipertensos,
                MAX(s.data_conclusao)::date as data_conclusao
            FROM sistemaaps.rastreamento_sessoes s
            JOIN tb_domicilio d ON d.id_domicilio = s.id_domicilio
            JOIN tb_familia f ON f.id_domicilio = d.id_domicilio
            JOIN sistemaaps.rastreamento_resultados r ON r.id_sessao = s.id_sessao
            WHERE s.status = 'concluido'
            GROUP BY d.id_domicilio, d.endereco_completo
            ORDER BY data_conclusao DESC
            LIMIT 10
        """

        # Buscar hipertensos diagnosticados
        hipertensos = """
            SELECT
                i.co_seq_cds_cad_individual,
                i.nome_cidadao as nome,
                i.idade,
                i.sexo,
                r.media_pas as pas,
                r.media_pad as pad,
                d.endereco_completo as endereco,
                EXISTS(
                    SELECT 1 FROM sistemaaps.encaminhamentos e
                    WHERE e.co_seq_cds_cad_individual = i.co_seq_cds_cad_individual
                    AND e.programa = 'HIPERDIA'
                ) as encaminhado_hiperdia
            FROM sistemaaps.rastreamento_resultados r
            JOIN tb_integrantes i ON i.co_seq_cds_cad_individual = r.co_seq_cds_cad_individual
            JOIN tb_familia f ON f.id_familia = i.id_familia
            JOIN tb_domicilio d ON d.id_domicilio = f.id_domicilio
            WHERE r.classificacao = 'HIPERTENSO'
            ORDER BY r.data_diagnostico DESC
            LIMIT 20
        ```

        dashboard = {
            'em_triagem': executar_query(em_triagem),
            'triados': executar_query(triados),
            'hipertensos': executar_query(hipertensos)
        }

        return jsonify({'success': True, 'dashboard': dashboard})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

---

## 🎨 Cores e Estilos

### Card Em Triagem (Azul)
- **Borda:** `border-blue-500`
- **Fundo do card:** `bg-blue-50`
- **Barra de progresso:** `bg-blue-600`
- **Texto:** `text-blue-900`

### Card Triados (Verde)
- **Borda:** `border-green-500`
- **Fundo do card:** `bg-green-50`
- **Badge normais:** `bg-green-600`
- **Texto:** `text-green-900`

### Card Hipertensos (Vermelho)
- **Borda:** `border-red-500`
- **Fundo do card:** `bg-red-50`
- **Badge PAS×PAD:** `bg-red-600`
- **Badge pendente:** `bg-yellow-600 animate-pulse`
- **Badge encaminhado:** `bg-purple-600`
- **Texto:** `text-red-900`

---

## 📊 Estrutura de Dados

### Domicílio em Triagem
```typescript
interface DomicilioEmTriagem {
    id_domicilio: number;
    endereco: string;
    total_familias: number;
    total_integrantes: number;
    progresso: number; // 0-100
}
```

### Domicílio Triado
```typescript
interface DomicilioTriado {
    id_domicilio: number;
    endereco: string;
    total_familias: number;
    total_triados: number;
    normais: number;
    hipertensos: number;
    data_conclusao: string; // YYYY-MM-DD
}
```

### Cidadão Hipertenso
```typescript
interface CidadaoHipertenso {
    co_seq_cds_cad_individual: number;
    nome: string;
    idade: number;
    sexo: 'M' | 'F';
    pas: number;
    pad: number;
    endereco: string;
    encaminhado_hiperdia: boolean;
}
```

---

## 🚀 Próximos Passos

### Backend (Pendente)

1. **Criar endpoint `/api/rastreamento/dashboard`**
   - Implementar queries SQL
   - Retornar dados no formato especificado

2. **Criar tabelas de rastreamento** (se não existirem)
   - `sistemaaps.rastreamento_sessoes`
   - `sistemaaps.rastreamento_resultados`
   - `sistemaaps.encaminhamentos`

3. **Implementar funções de acesso rápido**
   - `acessarTriagem(idDomicilio)` - retomar triagem
   - `verResultados(idDomicilio)` - visualizar resultados
   - `verDetalhesCidadao(coSeq)` - detalhes e encaminhamento

### Frontend (Futuro)

1. **Modal de Resultados Detalhados**
   - Mostrar todos os dados da triagem
   - Gráficos de distribuição
   - Opção de reimprimir PDF

2. **Modal de Detalhes do Cidadão**
   - Histórico completo
   - Botão de encaminhamento para HIPERDIA
   - Integração com PEC

3. **Filtros no Dashboard**
   - Filtrar por equipe
   - Filtrar por período
   - Filtrar por status

4. **Atualização Automática**
   - Polling ou WebSocket
   - Atualizar contadores em tempo real

---

## ✅ Status da Implementação

**Frontend:** ✅ **COMPLETO**
- HTML dashboard criado
- JavaScript de renderização implementado
- Estilos aplicados
- Acesso rápido (stubs) criado

**Backend:** ⏳ **PENDENTE**
- Endpoint `/api/rastreamento/dashboard` precisa ser criado
- Queries SQL precisam ser implementadas
- Lógica de negócio precisa ser desenvolvida

---

## 📝 Exemplo de Uso

1. **Usuário acessa o painel**
   - Dashboard carrega automaticamente
   - Mostra 3 cards com estatísticas

2. **Usuário vê domicílio em triagem**
   - Clica no card
   - Sistema carrega triagem em andamento
   - Retoma do passo onde parou

3. **Usuário vê domicílio triado**
   - Clica no card
   - Modal/página mostra resultados completos
   - Opção de reimprimir relatório

4. **Usuário vê hipertenso diagnosticado**
   - Clica no card do cidadão
   - Modal mostra dados completos
   - Botão "Encaminhar para HIPERDIA" disponível
   - Sistema registra encaminhamento

---

**Documentação gerada automaticamente**
**Última atualização:** 2025-10-18
