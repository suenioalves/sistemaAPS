# Documentação da API - Sistema APS

## 📋 Visão Geral

A API REST do Sistema APS fornece endpoints para todos os programas de saúde. Todas as rotas retornam JSON e seguem padrões RESTful.

**Base URL**: `http://localhost:3030`

## 🔐 Autenticação

Atualmente o sistema não implementa autenticação. Todas as rotas são públicas.

## 📊 Programa HIPERDIA

### Listar Pacientes Hipertensos

```http
GET /api/pacientes_hiperdia_has
```

#### Parâmetros Query

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `equipe` | string | Nome da equipe | `"ESF Vila Nova"` |
| `microarea` | string | Número da microárea | `"001"` |
| `search` | string | Busca por nome/CPF | `"João Silva"` |
| `page` | integer | Página (inicia em 1) | `1` |
| `per_page` | integer | Itens por página | `20` |
| `sort_by` | string | Campo de ordenação | `"nome_paciente"` |
| `status_filter` | string | Filtro de status | `"com_acao_pendente"` |

#### Exemplo de Requisição

```bash
curl "http://localhost:3030/api/pacientes_hiperdia_has?equipe=ESF%20Vila%20Nova&page=1&per_page=20"
```

#### Exemplo de Resposta

```json
{
    "pacientes": [
        {
            "cod_paciente": 12345,
            "nome_paciente": "João Silva Santos",
            "data_nascimento": "1980-05-15",
            "cpf": "123.456.789-00",
            "telefone": "(11) 99999-9999",
            "endereco": "Rua das Flores, 123",
            "microarea": "001",
            "equipe_nome": "ESF Vila Nova",
            "acs_nome": "Maria Oliveira",
            "tem_hipertensao": true,
            "tem_diabetes": false,
            "data_ultima_consulta": "2024-01-15",
            "pressao_sistolica_ultima": 140.0,
            "pressao_diastolica_ultima": 90.0,
            "proxima_acao_data": "2024-02-15",
            "proxima_acao_tipo": 1
        }
    ],
    "total": 156,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
}
```

### Buscar Timeline de Paciente

```http
GET /api/hiperdia/timeline/{cod_cidadao}
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `cod_cidadao` | integer | Código do cidadão |

#### Parâmetros Query

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `period` | string | Período (`all`, `6m`, `1y`) | `all` |

#### Exemplo de Resposta

```json
{
    "eventos": [
        {
            "cod_seq_acompanhamento": 789,
            "cod_acao": 1,
            "tipo_acao": "Solicitar MRPA",
            "data_agendamento": "2024-02-15",
            "data_realizacao": null,
            "status_acao": "PENDENTE",
            "pressao_sistolica": null,
            "pressao_diastolica": null,
            "observacoes": "Paciente com pressão alterada na última consulta"
        },
        {
            "cod_seq_acompanhamento": 788,
            "cod_acao": 9,
            "tipo_acao": "Agendar Hiperdia",
            "data_agendamento": "2024-01-15",
            "data_realizacao": "2024-01-15",
            "status_acao": "REALIZADA",
            "pressao_sistolica": 140.0,
            "pressao_diastolica": 90.0,
            "peso": 85.5,
            "imc": 28.5,
            "observacoes": "Consulta de rotina. Pressão ligeiramente elevada."
        }
    ]
}
```

### Registrar Nova Ação

```http
POST /api/hiperdia/registrar_acao
```

#### Body da Requisição

```json
{
    "cod_cidadao": 12345,
    "cod_acao": 1,
    "data_agendamento": "2024-02-15",
    "observacoes": "Solicitar MRPA devido pressão elevada",
    "pressao_sistolica": 140.0,
    "pressao_diastolica": 90.0,
    "peso": 85.5,
    "altura": 1.75,
    "circunferencia_abdominal": 95.0,
    "glicemia_jejum": 110.0
}
```

#### Exemplo de Resposta

```json
{
    "success": true,
    "message": "Ação registrada com sucesso",
    "cod_seq_acompanhamento": 790
}
```

### Atualizar Ação Existente

```http
PUT /api/hiperdia/update_acao/{cod_acompanhamento}
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `cod_acompanhamento` | integer | Código do acompanhamento |

#### Body da Requisição

```json
{
    "data_realizacao": "2024-02-15",
    "status_acao": "REALIZADA",
    "pressao_sistolica": 130.0,
    "pressao_diastolica": 85.0,
    "observacoes": "MRPA realizado. Pressão controlada."
}
```

### Cancelar Ação

```http
POST /api/hiperdia/cancelar_acao/{cod_acompanhamento}
```

#### Exemplo de Resposta

```json
{
    "success": true,
    "message": "Ação cancelada com sucesso"
}
```

### Buscar Medicamentos do Paciente

```http
GET /api/hiperdia/medicamentos_atuais/{cod_cidadao}
```

#### Exemplo de Resposta

```json
{
    "medicamentos": [
        {
            "cod_seq_medicamento": 456,
            "nome_medicamento": "Losartana 50mg",
            "dose": "1 comprimido",
            "frequencia": "1x ao dia",
            "data_inicio": "2024-01-01",
            "data_fim": null
        },
        {
            "cod_seq_medicamento": 457,
            "nome_medicamento": "Hidroclorotiazida 25mg",
            "dose": "1 comprimido",
            "frequencia": "1x ao dia",
            "data_inicio": "2024-01-01",
            "data_fim": null
        }
    ]
}
```

### Adicionar Medicamento

```http
POST /api/hiperdia/medicamentos
```

#### Body da Requisição

```json
{
    "codcidadao": 12345,
    "nome_medicamento": "Anlodipino 5mg",
    "dose": "1 comprimido",
    "frequencia": "1x ao dia",
    "data_inicio": "2024-02-15"
}
```

### Interromper Medicamento

```http
PUT /api/hiperdia/medicamentos/{cod_seq_medicamento}/interromper
```

#### Body da Requisição

```json
{
    "motivo": "Efeitos adversos",
    "data_fim": "2024-02-15"
}
```

## 📋 Estatísticas HIPERDIA

### Total de Hipertensos

```http
GET /api/get_total_hipertensos
```

#### Parâmetros Query

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `equipe` | string | Nome da equipe |
| `microarea` | string | Número da microárea |

#### Exemplo de Resposta

```json
{
    "total": 156
}
```

### Hipertensos com MRPA Pendente

```http
GET /api/get_hipertensos_mrpa_pendente
```

#### Exemplo de Resposta

```json
{
    "total": 23
}
```

## 👥 Programa PLAFAM

### Listar Mulheres em Idade Fértil

```http
GET /api/pacientes_plafam
```

#### Parâmetros Query

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `equipe` | string | Nome da equipe | - |
| `microarea` | string | Número da microárea | - |
| `idade_min` | integer | Idade mínima | `15` |
| `idade_max` | integer | Idade máxima | `49` |
| `status_metodo` | string | Status do método contraceptivo | - |
| `page` | integer | Página | `1` |
| `per_page` | integer | Itens por página | `20` |

#### Valores para `status_metodo`

- `em_dia`: Método contraceptivo em dia
- `atrasado`: Método atrasado até 6 meses
- `atrasado_6_meses`: Método atrasado mais de 6 meses
- `sem_metodo`: Sem método contraceptivo

#### Exemplo de Resposta

```json
{
    "pacientes": [
        {
            "cod_paciente": 98765,
            "nome_paciente": "Maria Santos Silva",
            "data_nascimento": "1990-03-20",
            "idade": 34,
            "telefone": "(11) 88888-8888",
            "endereco": "Av. Principal, 456",
            "microarea": "002",
            "equipe_nome": "ESF Centro",
            "acs_nome": "Ana Costa",
            "status_metodo": "em_dia",
            "tipo_metodo_atual": "Pílula",
            "data_proxima_renovacao": "2024-03-15"
        }
    ],
    "total": 89,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
}
```

### Registrar Método Contraceptivo

```http
POST /api/plafam/registrar_metodo
```

#### Body da Requisição

```json
{
    "codcidadao": 98765,
    "tipo_metodo": "DIU",
    "data_inicio": "2024-02-15",
    "data_proxima_renovacao": "2034-02-15",
    "observacoes": "DIU Mirena inserido sem intercorrências"
}
```

### Gerar Convites

```http
POST /api/plafam/gerar_convites
```

#### Body da Requisição

```json
{
    "equipe": "ESF Centro",
    "microarea": "002",
    "tipo_convite": "renovacao",
    "pacientes_selecionados": [98765, 98766, 98767]
}
```

## 👦 Programa Adolescentes

### Listar Adolescentes

```http
GET /api/pacientes_adolescentes
```

#### Parâmetros Query

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `equipe` | string | Nome da equipe | - |
| `microarea` | string | Número da microárea | - |
| `idade_min` | integer | Idade mínima | `10` |
| `idade_max` | integer | Idade máxima | `19` |
| `sexo` | string | Sexo (`M`, `F`) | - |
| `page` | integer | Página | `1` |

#### Exemplo de Resposta

```json
{
    "pacientes": [
        {
            "cod_paciente": 54321,
            "nome_paciente": "Pedro Oliveira",
            "data_nascimento": "2008-07-10",
            "idade": 15,
            "sexo": "M",
            "telefone": "(11) 77777-7777",
            "endereco": "Rua da Juventude, 789",
            "microarea": "003",
            "equipe_nome": "ESF Jardim",
            "acs_nome": "Carlos Lima",
            "ultima_consulta": "2024-01-10",
            "proxima_acao": "Consulta individual",
            "data_proxima_acao": "2024-04-10"
        }
    ],
    "total": 45,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
}
```

### Registrar Consulta de Adolescente

```http
POST /api/adolescentes/registrar_consulta
```

#### Body da Requisição

```json
{
    "cod_cidadao": 54321,
    "data_consulta": "2024-02-15",
    "tipo_atendimento": "Consulta individual",
    "temas_abordados": [
        "Saúde sexual",
        "Prevenção de IST",
        "Métodos contraceptivos"
    ],
    "proxima_acao": "Consulta de acompanhamento",
    "data_proxima_acao": "2024-05-15",
    "observacoes": "Adolescente interessado em informações sobre contracepção"
}
```

## 🏥 Dados Gerais

### Listar Equipes e Microáreas

```http
GET /api/equipes_microareas_hiperdia
```

#### Exemplo de Resposta

```json
{
    "equipes": [
        {
            "nome_equipe": "ESF Vila Nova",
            "microareas": [
                {
                    "numero": "001",
                    "acs_responsavel": "Maria Oliveira",
                    "total_pacientes": 450
                },
                {
                    "numero": "002", 
                    "acs_responsavel": "João Santos",
                    "total_pacientes": 380
                }
            ]
        }
    ]
}
```

### Buscar Medicamentos para Hipertensão

```http
GET /api/hiperdia/medicamentos_hipertensao
```

#### Exemplo de Resposta

```json
{
    "medicamentos": [
        {
            "nome": "Losartana 50mg",
            "categoria": "IECA/BRA"
        },
        {
            "nome": "Anlodipino 5mg", 
            "categoria": "Bloqueador de canal de cálcio"
        },
        {
            "nome": "Hidroclorotiazida 25mg",
            "categoria": "Diurético"
        }
    ]
}
```

## ❌ Códigos de Erro

### Códigos HTTP

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Requisição inválida |
| `404` | Recurso não encontrado |
| `500` | Erro interno do servidor |

### Exemplos de Erro

#### 400 - Bad Request

```json
{
    "error": "Parâmetro 'cod_cidadao' é obrigatório",
    "status": 400
}
```

#### 404 - Not Found

```json
{
    "error": "Paciente não encontrado",
    "status": 404
}
```

#### 500 - Internal Server Error

```json
{
    "error": "Erro interno do servidor",
    "details": "Erro de conexão com o banco de dados",
    "status": 500
}
```

## 🔧 Utilitários para Desenvolvimento

### Testando a API

#### Com curl

```bash
# Listar pacientes
curl -X GET "http://localhost:3030/api/pacientes_hiperdia_has?equipe=ESF%20Vila%20Nova"

# Registrar ação
curl -X POST "http://localhost:3030/api/hiperdia/registrar_acao" \
  -H "Content-Type: application/json" \
  -d '{
    "cod_cidadao": 12345,
    "cod_acao": 1,
    "data_agendamento": "2024-02-15",
    "observacoes": "Teste via curl"
  }'
```

#### Com JavaScript (Frontend)

```javascript
// Buscar pacientes
const response = await fetch('/api/pacientes_hiperdia_has?equipe=ESF Vila Nova');
const data = await response.json();

// Registrar ação
const response = await fetch('/api/hiperdia/registrar_acao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        cod_cidadao: 12345,
        cod_acao: 1,
        data_agendamento: '2024-02-15',
        observacoes: 'Nova ação'
    })
});
```

## 📊 Limites e Paginação

### Paginação Padrão

- **Página inicial**: 1
- **Itens por página (padrão)**: 20
- **Máximo de itens por página**: 100

### Headers de Resposta

A API retorna informações de paginação no body da resposta:

```json
{
    "pacientes": [...],
    "total": 156,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
}
```

## 🚀 Performance

### Cache

Atualmente não há cache implementado. Todas as requisições fazem consultas diretas ao banco.

### Rate Limiting

Não há rate limiting implementado.

### Otimizações Recomendadas

1. Implementar cache para consultas frequentes
2. Usar paginação eficiente com cursors
3. Implementar compressão gzip
4. Adicionar índices no banco para queries comuns

## 🔐 Segurança

### Validação de Entrada

- Todos os parâmetros são validados
- Queries usam parâmetros seguros (psycopg2)
- Proteção contra SQL injection

### CORS

CORS está habilitado para desenvolvimento local.

### Recomendações

1. Implementar autenticação JWT
2. Adicionar HTTPS em produção
3. Validar permissões por equipe/microárea
4. Implementar auditoria de ações