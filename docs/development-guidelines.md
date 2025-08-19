# Guidelines de Desenvolvimento - Sistema APS

## 📋 Visão Geral

Este documento estabelece os padrões de desenvolvimento para o Sistema APS, garantindo consistência, qualidade e manutenibilidade do código.

## 🐍 Backend (Python/Flask)

### Estrutura do Código

#### Organização do app.py
```python
# 1. Imports
from flask import Flask, request, jsonify, render_template
import psycopg2
from datetime import datetime

# 2. Configuração da aplicação
app = Flask(__name__)
app.config['DEBUG'] = True

# 3. Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'database': 'esus',
    'user': 'postgres', 
    'password': 'EUC[x*x~Mc#S+H_Ui#xZBr0O~',
    'port': '5433'
}

# 4. Rotas organizadas por funcionalidade
```

### Convenções de Nomenclatura

#### Variáveis e Funções
```python
# ✅ Correto - snake_case em português
def buscar_pacientes_hiperdia():
    cod_cidadao = request.args.get('cod_cidadao')
    nome_paciente = 'João da Silva'
    data_nascimento = '1980-01-01'

# ❌ Evitar - camelCase ou inglês
def fetchHypertensionPatients():
    patientCode = request.args.get('patientCode')
```

#### Rotas da API
```python
# ✅ Padrão estabelecido
@app.route('/api/pacientes_hiperdia_has')
@app.route('/api/hiperdia/timeline/<int:cod_cidadao>')
@app.route('/api/equipes_microareas_hiperdia')

# Estrutura: /api/[programa]/[recurso]/[parametros]
```

### Manipulação de Banco de Dados

#### Conexão Segura
```python
def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f'Erro na conexão: {e}')
        return None

# Sempre usar context manager
def executar_query(query, params=None):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            result = cur.fetchall()
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        print(f'Erro na query: {e}')
        return None
    finally:
        conn.close()
```

#### Queries Parametrizadas
```python
# ✅ Correto - sempre usar parâmetros
query = """
    SELECT * FROM sistemaaps.tb_hiperdia_has_acompanhamento 
    WHERE cod_cidadao = %s AND status_acao = %s
"""
cur.execute(query, (cod_cidadao, 'PENDENTE'))

# ❌ Evitar - concatenação de strings
query = f"SELECT * FROM tabela WHERE id = {user_input}"
```

### Tratamento de Dados

#### Conversão Segura de Números
```python
def safe_float_conversion(value, default=0.0):
    """Converte valor para float de forma segura"""
    if value is None or value == '':
        return default
    try:
        # Remove vírgulas e converte pontos
        if isinstance(value, str):
            value = value.replace(',', '.')
        return float(value)
    except (ValueError, TypeError):
        return default

# Uso
pressao_sistolica = safe_float_conversion(request.form.get('pressao_sistolica'))
```

#### Formatação de Datas
```python
from datetime import datetime

# Padrão brasileiro DD/MM/YYYY
def format_date_br(date_obj):
    if date_obj:
        return date_obj.strftime('%d/%m/%Y')
    return ''

# ISO para banco de dados
def format_date_iso(date_str):
    try:
        date_obj = datetime.strptime(date_str, '%d/%m/%Y')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return None
```

### Mapeamento de Constantes

#### Sistema de Ações do HIPERDIA
```python
TIPO_ACAO_MAP_PY = {
    1: "Solicitar MRPA",
    2: "Avaliar Exames",
    3: "Modificar tratamento",
    4: "Orientar mudança estilo vida",
    5: "Solicitar Exames",
    6: "Reagendar Hiperdia",
    7: "Encaminhar médico",
    8: "Busca Ativa",
    9: "Agendar Hiperdia"
}

# Uso em templates
def get_acao_description(cod_acao):
    return TIPO_ACAO_MAP_PY.get(cod_acao, f"Ação {cod_acao}")
```

## 🌐 Frontend (JavaScript)

### Estrutura Modular

#### Organização de Arquivos
```
static/
├── hiperdiaApi.js          # Chamadas API
├── hiperdiaDom.js          # Manipulação DOM
├── hiperdia_has_script.js  # Controller principal
├── plafam_script.js        # Dashboard Plafam
└── adolescentes_script.js  # Dashboard Adolescentes
```

#### Padrão de Módulo
```javascript
// hiperdiaApi.js
export const hiperdiaApi = {
    fetchPacientesHiperdia: async (params) => {
        // implementação
    },
    registrarAcao: async (payload) => {
        // implementação
    }
};

// hiperdia_has_script.js  
import { hiperdiaApi } from './hiperdiaApi.js';
import { hiperdiaDom } from './hiperdiaDom.js';
```

### Convenções JavaScript

#### Nomenclatura
```javascript
// ✅ Camelcase para JavaScript
const proximaAcaoDisplay = 'Solicitar MRPA';
const codCidadao = 12345;
const dataAgendamento = '2024-01-15';

// ✅ Português para variáveis de negócio
const pacientesHiperdia = [];
const equipesDisponiveis = [];
const acoesPendentes = [];
```

#### Tratamento de Erros
```javascript
// ✅ Padrão para chamadas API
async function buscarPacientes(params) {
    try {
        const response = await hiperdiaApi.fetchPacientesHiperdia(params);
        return response;
    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        mostrarMensagemErro('Erro ao carregar dados dos pacientes');
        return { pacientes: [], total: 0 };
    }
}

// ✅ Validação de entrada
function validarFormulario(dados) {
    const erros = [];
    
    if (!dados.cod_cidadao) {
        erros.push('Código do cidadão é obrigatório');
    }
    
    if (!dados.data_agendamento) {
        erros.push('Data de agendamento é obrigatória');
    }
    
    return erros;
}
```

#### Manipulação do DOM
```javascript
// ✅ Seletores eficientes
const elementos = {
    tabela: document.getElementById('pacientes-table'),
    filtros: document.querySelector('[data-filtros]'),
    modal: document.getElementById('modal-acao')
};

// ✅ Event delegation
elementos.tabela.addEventListener('click', (event) => {
    if (event.target.matches('[data-acao="timeline"]')) {
        abrirTimeline(event.target.dataset.codCidadao);
    }
});
```

### Integração com Backend

#### Chamadas API Padronizadas
```javascript
const API_BASE_URL = ''; // Configurável

async function chamarAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}
```

## 🎨 Frontend (CSS/TailwindCSS)

### Padrões de Estilo

#### Classes Utilitárias
```html
<!-- ✅ Uso consistente do Tailwind -->
<div class="bg-white rounded-lg shadow-md p-6 mb-4">
    <h3 class="text-lg font-semibold text-gray-800 mb-3">Título</h3>
    <p class="text-gray-600 text-sm">Descrição</p>
</div>

<!-- ✅ Estados interativos -->
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
    Ação
</button>
```

#### Cores do Sistema
```css
/* Cores principais definidas no tema */
.cor-primaria { color: #3B82F6; }      /* blue-500 */
.cor-sucesso { color: #10B981; }       /* green-500 */
.cor-alerta { color: #F59E0B; }        /* yellow-500 */
.cor-erro { color: #EF4444; }          /* red-500 */
.cor-neutro { color: #6B7280; }        /* gray-500 */
```

## 🗄️ Banco de Dados

### Convenções SQL

#### Nomenclatura
```sql
-- ✅ Padrão estabelecido
CREATE TABLE sistemaaps.tb_hiperdia_has_medicamentos (
    cod_seq_medicamento SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    nome_medicamento VARCHAR(255),
    data_inicio DATE,
    data_fim DATE
);

-- Prefixos:
-- tb_ = tabela
-- vw_ = view  
-- fn_ = função
-- sp_ = stored procedure
```

#### Queries Complexas
```sql
-- ✅ Indentação e organização clara
SELECT 
    m.cod_paciente,
    m.nome_paciente,
    pa_futura.data_agendamento AS proxima_acao_data,
    pa_futura.cod_acao AS proxima_acao_tipo
FROM sistemaaps.vw_pacientes_hiperdia m
LEFT JOIN LATERAL (
    SELECT 
        data_agendamento, 
        cod_acao  
    FROM sistemaaps.tb_hiperdia_has_acompanhamento 
    WHERE cod_cidadao = m.cod_paciente 
      AND status_acao = 'PENDENTE'
    ORDER BY data_agendamento ASC  
    LIMIT 1
) pa_futura ON TRUE
WHERE m.equipe_nome = %s
ORDER BY m.nome_paciente;
```

## 🧪 Testes e Qualidade

### Comandos de Desenvolvimento

#### Executar Aplicação
```bash
# Desenvolvimento
python app.py

# A aplicação roda na porta 3030
# Debug habilitado
# Escuta em todas as interfaces (0.0.0.0)
```

#### Linting JavaScript
```bash
# Verificar qualidade do código JavaScript
npx eslint static/*.js

# Corrigir automaticamente (quando possível)
npx eslint static/*.js --fix
```

### Debugging

#### Backend Python
```python
# ✅ Logs estruturados
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def processar_dados(dados):
    logger.info(f'Processando {len(dados)} registros')
    # processo
    logger.info('Processamento concluído')
```

#### Frontend JavaScript
```javascript
// ✅ Console logs organizados
console.log('[LOG] hiperdiaApi.registrarAcao - Iniciando');
console.log('[LOG] Payload recebido:', payload);
console.log('[LOG] Resultado da API:', result);

// ✅ Debugging condicional
const DEBUG = window.location.hostname === 'localhost';
if (DEBUG) {
    console.log('Modo debug ativo');
}
```

## 📚 Documentação

### Comentários no Código

#### Python
```python
def buscar_proxima_acao(cod_cidadao):
    """
    Busca a próxima ação pendente de um paciente.
    
    Args:
        cod_cidadao (int): Código do cidadão
        
    Returns:
        dict: Dados da próxima ação ou None
    """
    pass
```

#### JavaScript
```javascript
/**
 * Registra uma nova ação para um paciente
 * @param {Object} payload - Dados da ação
 * @param {number} payload.cod_cidadao - Código do cidadão
 * @param {number} payload.cod_acao - Tipo da ação
 * @param {string} payload.data_agendamento - Data no formato YYYY-MM-DD
 * @returns {Promise<Object>} Resultado da operação
 */
async function registrarAcao(payload) {
    // implementação
}
```

## 🔐 Segurança

### Validação de Entrada

#### Backend
```python
def validar_entrada_numerica(valor, nome_campo):
    """Valida entrada numérica"""
    if valor is None:
        return None
    
    try:
        return int(valor)
    except (ValueError, TypeError):
        raise ValueError(f'Campo {nome_campo} deve ser numérico')

# Uso em rotas
@app.route('/api/paciente/<int:cod_cidadao>')
def get_paciente(cod_cidadao):
    if cod_cidadao <= 0:
        return jsonify({'erro': 'Código inválido'}), 400
```

#### Frontend
```javascript
function sanitizarEntrada(texto) {
    if (typeof texto !== 'string') return '';
    
    return texto
        .trim()
        .replace(/[<>\"']/g, '') // Remove caracteres perigosos
        .slice(0, 255); // Limita tamanho
}
```

## 📄 Boas Práticas

### Performance

#### Queries Otimizadas
- Use LIMIT para paginação
- Índices em campos de busca frequente
- LATERAL JOIN para subconsultas
- Window functions para cálculos

#### Frontend
- Debounce em campos de busca
- Event delegation para elementos dinâmicos
- Lazy loading para tabelas grandes
- Cache de dados quando apropriado

### Manutenibilidade

#### Modularização
- Separar lógica de negócio da apresentação
- Funções pequenas e focadas
- Reutilização de código comum
- Constantes centralizadas

#### Versionamento
- Commits descritivos em português
- Branches por feature
- Code review obrigatório
- Testes antes do merge