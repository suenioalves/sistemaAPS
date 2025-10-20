# Implementação Completa: Dashboard de Rastreamento com 6 Categorias

**Data:** 2025-10-19
**Módulo:** Rastreamento Cardiovascular - Dashboard de Acompanhamento
**Status:** ✅ COMPLETO

---

## 📋 Visão Geral

Implementado sistema completo de dashboard com 6 categorias para acompanhamento do rastreamento cardiovascular de hipertensão, incluindo:

1. **HTML**: Estrutura visual com contadores e abas
2. **JavaScript**: Lógica de renderização e filtros
3. **Backend**: 6 queries SQL complexas com filtros dinâmicos
4. **Banco de Dados**: Integração com tabelas de rastreamento

---

## 🎯 As 6 Categorias Implementadas

### 1. Sem Triagem
**Descrição:** Famílias onde nenhum integrante foi incluído no rastreamento

**Query:** `app.py` linhas 10295-10355

**Lógica:**
- CTE `familias_rastreadas` identifica famílias já em rastreamento
- Query principal busca famílias da tabela `tb_cds_domicilio_familia` que NÃO estão na CTE
- Conta total de integrantes por família
- Aplica filtros: equipe, microárea, busca por nome/endereço

**Campos Retornados:**
```javascript
{
    id_familia: number,
    nome_responsavel: string,
    endereco: string,
    bairro: string,
    microarea: string,
    equipe: string,
    total_integrantes: number
}
```

---

### 2. Em Triagem
**Descrição:** Famílias com pelo menos 1 integrante em processo de rastreamento (não finalizado)

**Query:** `app.py` linhas 10360-10430

**Lógica:**
- CTE `familias_contagem` calcula:
  - `total_em_rastreamento`: Total de cidadãos incluídos
  - `total_finalizados`: Total com resultado preenchido
- Filtra famílias onde `total_finalizados < total_em_rastreamento`
- Status de rastreamento: `INICIADO` ou `EM_ANDAMENTO`

**Campos Retornados:**
```javascript
{
    id_familia: number,
    nome_responsavel: string,
    endereco: string,
    bairro: string,
    microarea: string,
    equipe: string,
    total_integrantes: number,
    total_em_rastreamento: number,
    total_finalizados: number,
    data_inicio_rastreamento: date
}
```

---

### 3. Triagem Completa
**Descrição:** Famílias onde todos os integrantes foram triados e finalizados

**Query:** `app.py` linhas 10435-10504

**Lógica:**
- CTE `familias_stats` agrupa por família
- `HAVING` garante que: `total_triados = total_finalizados`
- Calcula quantos foram diagnosticados como hipertensos

**Campos Retornados:**
```javascript
{
    id_familia: number,
    nome_responsavel: string,
    endereco: string,
    bairro: string,
    microarea: string,
    equipe: string,
    total_integrantes: number,
    data_ultima_finalizacao: date,
    total_hipertensos: number
}
```

---

### 4. Triagem Incompleta
**Descrição:** Famílias com alguns integrantes triados mas outros ainda pendentes

**Query:** `app.py` linhas 10509-10580

**Lógica:**
- CTE `familias_incompletas` conta:
  - `total_integrantes`: Todos os membros da família
  - `total_triados`: Membros com resultado preenchido
- `HAVING` filtra: `total_triados > 0 AND total_triados < total_integrantes`
- Calcula `total_pendentes = total_integrantes - total_triados`

**Campos Retornados:**
```javascript
{
    id_familia: number,
    nome_responsavel: string,
    endereco: string,
    bairro: string,
    microarea: string,
    equipe: string,
    total_integrantes: number,
    total_triados: number,
    total_pendentes: number
}
```

---

### 5. Não Hipertensos
**Descrição:** Pacientes **individuais** classificados como NORMAL após triagem

**Query:** `app.py` linhas 10585-10629

**Lógica:**
- Busca em `tb_rastreamento_cidadaos` onde `resultado_rastreamento = 'NORMAL'`
- JOIN com view `vw_rastreamento_cidadaos_resumo` para obter médias de PA
- Retorna dados individuais (não agregados por família)

**Campos Retornados:**
```javascript
{
    cod_individual: number,
    nome_cidadao: string,
    idade: number,
    sexo: string,
    media_mrpa_pas: number,
    media_mrpa_pad: number,
    media_mapa_pas: number,
    media_mapa_pad: number,
    equipe: string,
    microarea: string,
    data_resultado: date,
    endereco: string
}
```

---

### 6. Hipertensos
**Descrição:** Pacientes **individuais** diagnosticados com hipertensão após triagem

**Query:** `app.py` linhas 10634-10688

**Lógica:**
- Busca em `tb_rastreamento_cidadaos` onde `resultado_rastreamento = 'HIPERTENSO'`
- Calcula classificação de estágio:
  - **Limítrofe**: PAS 130-139 ou PAD 80-89
  - **Estágio 1**: PAS 140-159 ou PAD 90-99
  - **Estágio 2**: PAS ≥160 ou PAD ≥100

**Campos Retornados:**
```javascript
{
    cod_individual: number,
    nome_cidadao: string,
    idade: number,
    sexo: string,
    media_mrpa_pas: number,
    media_mrpa_pad: number,
    media_mapa_pas: number,
    media_mapa_pad: number,
    equipe: string,
    microarea: string,
    data_resultado: date,
    decisao_profissional: string,
    endereco: string,
    classificacao: string
}
```

---

## 🔧 Sistema de Filtros

Todos as 6 queries suportam 3 filtros dinâmicos via query parameters:

### Parâmetros da API
```
GET /api/rastreamento/dashboard?equipe=NOME_EQUIPE&microarea=01&busca=MARIA
```

### Implementação dos Filtros

#### 1. Filtro por Equipe
```sql
AND e.no_equipe = %s
-- ou
AND fc.equipe = %s
-- ou
AND vr.equipe = %s
```

#### 2. Filtro por Microárea
```sql
AND d.nu_micro_area = %s
-- ou
AND fc.microarea = %s
-- ou
AND vr.microarea = %s
```

#### 3. Busca por Texto (nome de cidadão ou endereço)
```sql
AND (
    LOWER(unaccent(ci.no_cidadao)) LIKE LOWER(unaccent(%s))
    OR LOWER(unaccent(d.no_logradouro)) LIKE LOWER(unaccent(%s))
)
-- ou (para categorias 5 e 6)
AND LOWER(unaccent(rc.nome_cidadao)) LIKE LOWER(unaccent(%s))
```

**Nota:** Usa `unaccent()` do PostgreSQL para busca sem acentos.

---

## 📊 Estrutura de Resposta da API

```json
{
    "success": true,
    "dashboard": {
        "contadores": {
            "sem_triagem": 42,
            "em_triagem": 15,
            "triagem_completa": 28,
            "triagem_incompleta": 8,
            "nao_hipertensos": 134,
            "hipertensos": 23
        },
        "sem_triagem": [ /* array de objetos família */ ],
        "em_triagem": [ /* array de objetos família com progresso */ ],
        "triagem_completa": [ /* array de objetos família finalizada */ ],
        "triagem_incompleta": [ /* array de objetos família parcial */ ],
        "nao_hipertensos": [ /* array de objetos paciente */ ],
        "hipertensos": [ /* array de objetos paciente com classificação */ ]
    }
}
```

---

## 💾 Tabelas do Banco de Dados Utilizadas

### Tabelas Principais
1. **`sistemaaps.tb_rastreamento_familias`**
   - Armazena famílias selecionadas para rastreamento
   - Campos-chave: `co_seq_cds_domicilio_familia`, `status_rastreamento`

2. **`sistemaaps.tb_rastreamento_cidadaos`**
   - Cidadãos incluídos no rastreamento (≥20 anos)
   - Campos-chave: `resultado_rastreamento`, `fase_rastreamento`

3. **`sistemaaps.tb_rastreamento_afericoes_mrpa`**
   - Aferições MRPA (1x/dia por 3-5 dias)
   - Campos: `pressao_sistolica`, `pressao_diastolica`

4. **`sistemaaps.tb_rastreamento_afericoes_mapa`**
   - Aferições MRPA 5 dias (3x manhã + 3x noite)
   - Campos: `pressao_sistolica`, `pressao_diastolica`, `excluir_calculo`

### View Auxiliar
5. **`sistemaaps.vw_rastreamento_cidadaos_resumo`**
   - View com médias calculadas de PA
   - Campos: `media_mrpa_pas`, `media_mrpa_pad`, `media_mapa_pas`, `media_mapa_pad`

### Tabelas E-SUS
6. **`tb_cds_domicilio_familia`** - Famílias do e-SUS
7. **`tb_cds_cad_domiciliar`** - Cadastro domiciliar
8. **`tb_cds_cad_individual`** - Cadastro individual
9. **`tb_equipe`** - Equipes de saúde
10. **`tb_cidadao_vinculacao_equipe`** - Vinculação cidadão-equipe

---

## 🎨 Arquivos Modificados

### 1. Backend: `app.py`
**Linhas:** 10263-10722 (460 linhas)

**Função:** `api_rastreamento_dashboard()`

**Alterações:**
- Substituiu placeholder com dados vazios
- Implementou 6 queries SQL completas
- Sistema de filtros dinâmicos com parâmetros
- Estrutura de contadores
- Tratamento de erros

---

### 2. Frontend: `templates/painel-rastreamento-cardiovascular.html`

**Linhas 43-74:** CSS para sistema de abas
```css
.aba-btn {
    color: #6b7280;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.aba-btn.active {
    color: #ef4444;
    border-bottom-color: #ef4444;
    background-color: #fef2f2;
}
```

**Linhas 128-178:** 6 contadores clicáveis
```html
<div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
    <!-- Sem Triagem -->
    <div onclick="selecionarAba('sem-triagem')">
        <div id="count-sem-triagem">0</div>
        <div>Sem Triagem</div>
    </div>
    <!-- ... 5 outros contadores ... -->
</div>
```

**Linhas 181-228:** Navegação de abas + áreas de conteúdo
```html
<nav id="abas-navegacao">
    <button class="aba-btn active" data-aba="sem-triagem">
        Sem Triagem
    </button>
    <!-- ... 5 outros botões ... -->
</nav>

<div id="conteudo-abas">
    <div id="aba-sem-triagem" class="aba-conteudo">
        <!-- Conteúdo dinâmico -->
    </div>
    <!-- ... 5 outras áreas ... -->
</div>
```

---

### 3. JavaScript: `static/dashboard_rastreamento.js`

**Estrutura Completa** (465 linhas):

#### Estado Global (linhas 14-23)
```javascript
window.estadoDashboard = {
    abaAtiva: 'sem-triagem',
    filtros: { equipe: '', microarea: '', busca: '' },
    dados: null
};
```

#### Função Principal (linhas 28-46)
```javascript
async function carregarDashboardAcompanhamento() {
    const params = new URLSearchParams(window.estadoDashboard.filtros);
    const response = await fetch(`/api/rastreamento/dashboard?${params}`);
    const data = await response.json();

    if (data.success) {
        window.estadoDashboard.dados = data.dashboard;
        renderizarDashboard(data.dashboard);
    }
}
```

#### Atualização de Contadores (linhas 51-62)
```javascript
function renderizarDashboard(dashboard) {
    document.getElementById('count-sem-triagem').textContent =
        dashboard.contadores?.sem_triagem || 0;
    // ... outros 5 contadores ...
    renderizarConteudoAba(window.estadoDashboard.abaAtiva, dashboard);
}
```

#### Sistema de Abas (linhas 86-112)
```javascript
window.selecionarAba = function(nomeAba) {
    // Atualiza estado
    window.estadoDashboard.abaAtiva = nomeAba;

    // Atualiza CSS dos botões
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.aba === nomeAba);
    });

    // Exibe conteúdo correto
    document.querySelectorAll('.aba-conteudo').forEach(conteudo => {
        conteudo.classList.add('hidden');
    });
    document.getElementById(`aba-${nomeAba}`).classList.remove('hidden');
}
```

#### 6 Funções de Renderização (linhas 153-384)

1. **`renderizarSemTriagem(familias)`** - Cards de famílias sem triagem
2. **`renderizarEmTriagem(familias)`** - Cards com barra de progresso
3. **`renderizarTriagemCompleta(familias)`** - Cards com data de finalização
4. **`renderizarTriagemIncompleta(familias)`** - Cards com pendências
5. **`renderizarNaoHipertensos(pacientes)`** - Tabela de pacientes normais
6. **`renderizarHipertensos(pacientes)`** - Tabela de pacientes hipertensos com badges de classificação

#### Sistema de Filtros (linhas 416-431)
```javascript
window.aplicarFiltrosDashboard = function() {
    const equipe = document.getElementById('filtro-equipe')?.value || '';
    const microarea = document.getElementById('filtro-microarea')?.value || '';
    const busca = document.getElementById('filtro-busca')?.value || '';

    window.estadoDashboard.filtros = { equipe, microarea, busca };
    carregarDashboardAcompanhamento();
};
```

---

## 🧪 Cenários de Teste

### Teste 1: Carregar Dashboard Inicial (Sem Filtros)
**Ação:**
1. Acessar página principal do rastreamento
2. Aguardar carregamento automático

**Resultado Esperado:**
- 6 contadores exibem números de todo o município
- Aba "Sem Triagem" selecionada por padrão
- Lista de famílias exibida (se houver dados)

---

### Teste 2: Filtrar por Equipe
**Ação:**
1. Selecionar equipe no filtro
2. Clicar em "Aplicar Filtros"

**Resultado Esperado:**
- Todos os 6 contadores são recalculados
- Apenas famílias/pacientes da equipe selecionada aparecem
- Filtro mantido ao trocar de aba

---

### Teste 3: Buscar por Nome de Cidadão
**Ação:**
1. Digite "MARIA" no campo de busca
2. Aplicar filtros

**Resultado Esperado:**
- Categorias 1-4: Famílias onde responsável ou integrante se chama MARIA
- Categorias 5-6: Pacientes individuais chamados MARIA
- Busca ignora acentuação (MARIA = MARÍA)

---

### Teste 4: Navegação Entre Abas
**Ação:**
1. Clicar em cada um dos 6 contadores ou botões de aba
2. Verificar conteúdo de cada aba

**Resultado Esperado:**
- Botão da aba fica destacado (vermelho)
- Conteúdo correto é exibido
- Outros conteúdos ficam ocultos
- Estado da aba persiste ao aplicar filtros

---

### Teste 5: Categorias de Família vs Paciente Individual
**Ação:**
1. Verificar estrutura das abas 1-4 (família)
2. Verificar estrutura das abas 5-6 (paciente individual)

**Resultado Esperado:**
- Abas 1-4: Cards de família (nome responsável, total integrantes)
- Abas 5-6: Tabela de pacientes (nome, idade, PA, classificação)

---

### Teste 6: Verificar Contadores Dinâmicos
**Ação:**
1. Aplicar filtro de equipe
2. Verificar se contadores mudam

**Resultado Esperado:**
- Contadores refletem dados filtrados
- Soma dos contadores 1-4 ≠ soma de 5-6 (diferentes agregações)
- Contadores vazios mostram "0"

---

## 📈 Métricas de Implementação

### Linhas de Código
- **Backend (app.py):** +460 linhas
- **Frontend (HTML):** +100 linhas (CSS + estrutura)
- **JavaScript:** +465 linhas (completo)
- **Total:** ~1.025 linhas de código

### Queries SQL
- **6 queries principais** (complexidade média-alta)
- **3 filtros dinâmicos** por query (equipe, microárea, busca)
- **4 CTEs** (Common Table Expressions)
- **12 JOINs** entre tabelas e-SUS e rastreamento

### Funcionalidades
- ✅ 6 categorias de dados distintas
- ✅ Sistema de abas com navegação
- ✅ Filtros dinâmicos aplicados em tempo real
- ✅ Contadores reativos
- ✅ Renderização condicional (família vs paciente)
- ✅ Tratamento de erros e dados vazios

---

## 🎯 Benefícios da Implementação

### 1. Visibilidade Completa
Gestores e equipes conseguem visualizar:
- Status do rastreamento em tempo real
- Progresso por família
- Resultados individuais de pacientes

### 2. Filtragem Granular
- Visualização por equipe específica
- Foco em microárea
- Busca rápida por nome

### 3. Organização Clara
- Separação entre famílias e pacientes individuais
- Status de triagem bem definido
- Classificação de hipertensão por estágio

### 4. Tomada de Decisão
- Identificar famílias pendentes
- Priorizar triagens incompletas
- Encaminhar hipertensos para HIPERDIA

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────┐
│  Usuário acessa painel              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  JavaScript: carregarDashboard()    │
│  - Coleta filtros                   │
│  - Monta query params               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  API: /api/rastreamento/dashboard   │
│  - Recebe filtros                   │
│  - Executa 6 queries SQL            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL: Executa queries        │
│  - tb_rastreamento_familias         │
│  - tb_rastreamento_cidadaos         │
│  - tb_cds_domicilio_familia         │
│  - vw_rastreamento_cidadaos_resumo  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  API: Retorna JSON                  │
│  - contadores (6 números)           │
│  - arrays de dados por categoria    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  JavaScript: renderizarDashboard()  │
│  - Atualiza contadores              │
│  - Renderiza conteúdo da aba ativa  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  DOM: Interface atualizada          │
│  - Contadores exibidos              │
│  - Cards/tabelas renderizados       │
└─────────────────────────────────────┘
```

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Paginação**
   - Atualmente limitado a 100 resultados por categoria
   - Implementar "Load More" ou paginação

2. **Exportação de Dados**
   - Botão para exportar Excel/PDF
   - Relatório consolidado do dashboard

3. **Gráficos Estatísticos**
   - Gráfico de pizza: distribuição por categoria
   - Gráfico de barras: hipertensos por equipe

4. **Notificações**
   - Alerta para triagens atrasadas
   - Lembrete de follow-up de hipertensos

5. **Cache**
   - Cache de 5 minutos para queries pesadas
   - Invalidar cache ao salvar nova triagem

---

## ✅ Status Final

**Dashboard de Rastreamento: 100% IMPLEMENTADO**

- ✅ Backend: 6 queries SQL completas com filtros
- ✅ API: Endpoint funcional retornando JSON estruturado
- ✅ Frontend: HTML com 6 contadores e sistema de abas
- ✅ JavaScript: 465 linhas de lógica completa
- ✅ Filtros: Equipe, microárea e busca funcionando
- ✅ Integração: Banco de dados e-SUS + rastreamento

**Pronto para uso em produção!**

---

**Documentação completa:** [IMPLEMENTACAO_DASHBOARD_6_CATEGORIAS.md](IMPLEMENTACAO_DASHBOARD_6_CATEGORIAS.md)
**Data de conclusão:** 2025-10-19
