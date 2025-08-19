# Arquitetura do Sistema APS

## 📋 Visão Geral

O Sistema APS é uma aplicação web para gestão de atenção primária à saúde, desenvolvida especificamente para unidades básicas de saúde no Brasil. O sistema gerencia múltiplos programas de saúde com foco em prevenção e acompanhamento contínuo de pacientes.

## 🏗️ Arquitetura Geral

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   Banco de      │
│   (Browser)     │◄──►│     Flask       │◄──►│   Dados         │
│                 │    │    Python       │    │  PostgreSQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                       │
        │              ┌─────────────────┐              │
        └─────────────►│   Static Files  │              │
                       │   JS/CSS/HTML   │              │
                       └─────────────────┘              │
                                │                       │
                       ┌─────────────────┐              │
                       │   Templates     │              │
                       │    Jinja2       │              │
                       └─────────────────┘              │
                                                        │
                       ┌─────────────────┐              │
                       │   SQL Scripts   │◄─────────────┘
                       │   Views/Stored  │
                       │   Procedures    │
                       └─────────────────┘
```

## 🔧 Componentes Principais

### Backend (Flask)
- **Arquivo Principal**: `app.py` (~3.258 linhas)
- **Framework**: Flask com PostgreSQL
- **Porta**: 3030
- **Configuração**: Debug habilitado, escuta em todas as interfaces (0.0.0.0)
- **Conexão DB**: PostgreSQL na porta 5433, database "esus"

### Frontend
- **Templates**: Jinja2 para renderização server-side
- **JavaScript**: Modular ES6+ com API fetch
- **CSS**: TailwindCSS com tema customizado
- **Ícones**: RemixIcon
- **Gráficos**: ECharts
- **PDF**: jsPDF para relatórios e convites

### Banco de Dados
- **SGBD**: PostgreSQL
- **Database**: "esus"
- **Porta**: 5433
- **Esquemas**: Múltiplos, principal `sistemaaps`
- **Extensões**: unaccent para normalização de texto

## 📁 Estrutura de Diretórios

```
sistemaAPS/
├── app.py                      # Aplicação Flask principal
├── CLAUDE.md                   # Instruções para desenvolvimento
├── firebase.json               # Configuração para deploy
├── templates/                  # Templates HTML Jinja2
│   ├── painel-hiperdia-has.html
│   ├── painel-plafam.html
│   └── painel-adolescentes.html
├── static/                     # Arquivos estáticos
│   ├── hiperdia_has_script.js  # Dashboard Hiperdia
│   ├── plafam_script.js        # Dashboard Plafam
│   ├── adolescentes_script.js  # Dashboard Adolescentes
│   ├── hiperdiaApi.js          # API calls Hiperdia
│   └── hiperdiaDom.js          # DOM manipulation Hiperdia
├── bd_sistema_aps/            # Scripts SQL
│   └── Scripts/               # 50+ arquivos SQL organizados
└── docs/                      # Documentação (este diretório)
```

## 🎯 Programas de Saúde

### HIPERDIA (Hipertensão/Diabetes)
- **Objetivo**: Monitoramento de pacientes hipertensos e diabéticos
- **Funcionalidades**:
  - Sistema de ações pendentes (tipos 1-9)
  - Timeline de acompanhamento
  - Controle de medicamentos
  - MRPA (Monitorização Residencial da Pressão Arterial)

### PLAFAM (Planejamento Familiar)
- **Objetivo**: Acompanhamento de métodos contraceptivos
- **Funcionalidades**:
  - Rastreamento de métodos por duração
  - Sistema de convites automatizados
  - Filtros por faixa etária
  - Geração de PDF para convites

### Adolescentes
- **Objetivo**: Cuidados específicos para adolescentes
- **Funcionalidades**:
  - Timeline de ações
  - Sistema de acompanhamento
  - Materiais informativos para pais

## 🔄 Fluxo de Dados

### 1. Requisição do Usuário
```
Browser → Flask Route → SQL Query → PostgreSQL
```

### 2. Resposta do Sistema
```
PostgreSQL → Python Processing → JSON/HTML → Browser
```

### 3. Interações JavaScript
```
User Action → JS Event → API Call → Backend → Database → Response → DOM Update
```

## 🗄️ Padrões de Banco de Dados

### Convenções de Nomenclatura
- **Tabelas**: `tb_[programa]_[entidade]`
- **Campos**: snake_case em português
- **Chaves**: `cod_[entidade]` para identificadores

### Estrutura por Programa
```sql
-- Hiperdia
sistemaaps.tb_hiperdia_has_medicamentos
sistemaaps.tb_hiperdia_has_acompanhamento

-- Plafam
sistemaaps.tb_plafam_*

-- Adolescentes
sistemaaps.tb_adolescentes_*
```

## 🔐 Segurança

### Práticas Implementadas
- Queries parametrizadas (prevenção SQL injection)
- Extensão unaccent para normalização segura de texto
- Validação de entrada nos endpoints

### Pontos de Atenção
- Credenciais do banco hardcoded (migrar para variáveis de ambiente)
- Autenticação/autorização não implementada

## 📊 Performance

### Otimizações Implementadas
- Window functions para cálculos complexos
- LATERAL JOINs para subconsultas eficientes
- Índices em campos de busca frequente
- Views materializadas para relatórios

### Monitoramento
- Logs de performance em desenvolvimento
- Query profiling disponível

## 🌐 Deploy

### Ambientes Suportados
- **Desenvolvimento**: Local com Flask debug
- **Produção**: Firebase Hosting (configurado)
- **Container**: Suporte a DevContainer

### Requisitos do Sistema
- Python 3.8+
- PostgreSQL 12+
- Node.js (para ferramentas de build)
- Extensão unaccent do PostgreSQL

## 🔄 Integração com Sistemas Externos

### E-SUS (Sistema Nacional)
- Estrutura compatível com padrões do Ministério da Saúde
- Campos padronizados para interoperabilidade
- Códigos de cidadão compatíveis

## 📈 Escalabilidade

### Limitações Atuais
- Aplicação monolítica em arquivo único
- Sem cache implementado
- Conexão direta com banco (sem pool)

### Melhorias Sugeridas
- Modularização do backend
- Implementação de cache (Redis)
- Connection pooling
- Microserviços por programa de saúde