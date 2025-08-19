# Esquema do Banco de Dados - Sistema APS

## 📋 Visão Geral

O Sistema APS utiliza PostgreSQL como SGBD, organizando os dados em múltiplos esquemas. O principal é o `sistemaaps` que contém todas as tabelas específicas dos programas de saúde.

## 🔧 Configuração

### Conexão
```
Host: localhost
Database: esus
User: postgres
Password: [configurado no app.py]
Port: 5433
```

### Extensões Necessárias
```sql
-- Para normalização de texto (busca sem acentos)
CREATE EXTENSION IF NOT EXISTS unaccent;
```

## 🏗️ Estrutura de Esquemas

```
esus (database)
├── sistemaaps (schema principal)
│   ├── Tabelas do HIPERDIA
│   ├── Tabelas do PLAFAM  
│   ├── Tabelas dos Adolescentes
│   └── Tabelas compartilhadas
├── public (schema padrão)
└── outros esquemas do e-SUS
```

## 📊 Programa HIPERDIA

### Tabela Principal de Acompanhamento
```sql
CREATE TABLE sistemaaps.tb_hiperdia_has_acompanhamento (
    cod_seq_acompanhamento SERIAL PRIMARY KEY,
    cod_cidadao INTEGER NOT NULL,
    cod_acao INTEGER NOT NULL,  -- Referência ao tipo de ação (1-9)
    data_agendamento DATE,
    data_realizacao DATE,
    status_acao VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, REALIZADA, CANCELADA
    observacoes TEXT,
    pressao_sistolica DECIMAL(5,2),
    pressao_diastolica DECIMAL(5,2),
    peso DECIMAL(5,2),
    altura DECIMAL(3,2),
    imc DECIMAL(4,2),
    circunferencia_abdominal DECIMAL(5,2),
    glicemia_jejum DECIMAL(5,2),
    glicemia_pos_prandial DECIMAL(5,2),
    hemoglobina_glicada DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_hiperdia_cidadao_status ON sistemaaps.tb_hiperdia_has_acompanhamento(cod_cidadao, status_acao);
CREATE INDEX idx_hiperdia_data_agendamento ON sistemaaps.tb_hiperdia_has_acompanhamento(data_agendamento);
CREATE INDEX idx_hiperdia_acao ON sistemaaps.tb_hiperdia_has_acompanhamento(cod_acao);
```

### Tipos de Ação (HIPERDIA)
```sql
-- Mapeamento dos tipos de ação
-- 1: "Solicitar MRPA"
-- 2: "Avaliar Exames" 
-- 3: "Modificar tratamento"
-- 4: "Orientar mudança estilo vida"
-- 5: "Solicitar Exames"
-- 6: "Reagendar Hiperdia"
-- 7: "Encaminhar médico"
-- 8: "Busca Ativa"
-- 9: "Agendar Hiperdia"
```

### Medicamentos (HIPERDIA)
```sql
CREATE TABLE sistemaaps.tb_hiperdia_has_medicamentos (
    cod_seq_medicamento SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    nome_medicamento VARCHAR(255) NOT NULL,
    dose VARCHAR(100),
    frequencia VARCHAR(100),
    data_inicio DATE NOT NULL,
    data_fim DATE,  -- NULL = medicamento ativo
    motivo_interrupcao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_medicamentos_cidadao ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao);
CREATE INDEX idx_medicamentos_ativo ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao, data_fim) 
    WHERE data_fim IS NULL;
```

### View de Pacientes (HIPERDIA)
```sql
CREATE VIEW sistemaaps.vw_pacientes_hiperdia AS
SELECT 
    p.cod_paciente,
    p.nome_paciente,
    p.data_nascimento,
    p.cpf,
    p.cns,
    p.telefone,
    p.endereco,
    p.microarea,
    p.equipe_nome,
    p.acs_nome,
    -- Dados específicos da hipertensão
    p.tem_hipertensao,
    p.tem_diabetes,
    p.data_diagnostico_has,
    p.data_diagnostico_dm,
    -- Última consulta
    uc.data_ultima_consulta,
    uc.pressao_sistolica_ultima,
    uc.pressao_diastolica_ultima,
    uc.peso_ultimo,
    uc.imc_ultimo
FROM sistemaaps.tb_pacientes p
LEFT JOIN (
    -- Subconsulta para última consulta
    SELECT DISTINCT ON (cod_cidadao)
        cod_cidadao,
        data_realizacao as data_ultima_consulta,
        pressao_sistolica as pressao_sistolica_ultima,
        pressao_diastolica as pressao_diastolica_ultima,
        peso as peso_ultimo,
        imc as imc_ultimo
    FROM sistemaaps.tb_hiperdia_has_acompanhamento
    WHERE status_acao = 'REALIZADA' 
      AND data_realizacao IS NOT NULL
    ORDER BY cod_cidadao, data_realizacao DESC
) uc ON p.cod_paciente = uc.cod_cidadao
WHERE p.tem_hipertensao = true OR p.tem_diabetes = true;
```

## 👥 Programa PLAFAM

### Métodos Contraceptivos
```sql
CREATE TABLE sistemaaps.tb_plafam_metodos (
    cod_seq_metodo SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    tipo_metodo VARCHAR(50) NOT NULL, -- 'Pílula', 'DIU', 'Implante', etc.
    data_inicio DATE NOT NULL,
    data_fim DATE,
    data_proxima_renovacao DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Duração por tipo de método (em dias)
-- Pílula/Mensal: 30 dias
-- Trimestral: 90 dias  
-- Implante: 1095 dias (3 anos)
-- DIU: 3650 dias (10 anos)
-- Laqueadura: Infinity (permanente)
```

### Status dos Métodos
```sql
-- Lógica de status baseada na data atual
SELECT 
    codcidadao,
    tipo_metodo,
    CASE 
        WHEN data_fim IS NOT NULL AND data_fim <= CURRENT_DATE THEN 'sem_metodo'
        WHEN data_proxima_renovacao IS NULL THEN 'sem_metodo'
        WHEN data_proxima_renovacao >= CURRENT_DATE THEN 'em_dia'
        WHEN data_proxima_renovacao < CURRENT_DATE 
         AND data_proxima_renovacao >= CURRENT_DATE - INTERVAL '6 months' THEN 'atrasado'
        WHEN data_proxima_renovacao < CURRENT_DATE - INTERVAL '6 months' THEN 'atrasado_6_meses'
        ELSE 'sem_metodo'
    END as status_metodo
FROM sistemaaps.tb_plafam_metodos
WHERE data_fim IS NULL OR data_fim > CURRENT_DATE;
```

### Convites (PLAFAM)
```sql
CREATE TABLE sistemaaps.tb_plafam_convites (
    cod_seq_convite SERIAL PRIMARY KEY,
    codcidadao INTEGER NOT NULL,
    tipo_convite VARCHAR(50), -- 'novo', 'renovacao', 'informativo'
    data_convite DATE DEFAULT CURRENT_DATE,
    metodo_recomendado VARCHAR(50),
    status_convite VARCHAR(20) DEFAULT 'ENVIADO', -- ENVIADO, COMPARECEU, NAO_COMPARECEU
    data_resposta DATE,
    observacoes TEXT
);
```

## 👦 Programa Adolescentes

### Acompanhamento de Adolescentes
```sql
CREATE TABLE sistemaaps.tb_adolescentes_acompanhamento (
    cod_seq_acompanhamento SERIAL PRIMARY KEY,
    cod_cidadao INTEGER NOT NULL,
    idade_na_consulta INTEGER,
    data_consulta DATE,
    tipo_atendimento VARCHAR(100), -- 'Consulta individual', 'Grupo educativo', etc.
    temas_abordados TEXT[],  -- Array de temas
    proxima_acao VARCHAR(200),
    data_proxima_acao DATE,
    status_acao VARCHAR(20) DEFAULT 'PENDENTE',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Timeline de Ações
```sql
-- View para timeline de adolescentes
CREATE VIEW sistemaaps.vw_adolescentes_timeline AS
SELECT 
    a.cod_seq_acompanhamento,
    a.cod_cidadao,
    p.nome_paciente,
    a.data_consulta,
    a.tipo_atendimento,
    a.temas_abordados,
    a.proxima_acao,
    a.data_proxima_acao,
    a.status_acao,
    -- Calcula idade na época da consulta
    EXTRACT(YEAR FROM AGE(a.data_consulta, p.data_nascimento)) as idade_na_consulta
FROM sistemaaps.tb_adolescentes_acompanhamento a
JOIN sistemaaps.tb_pacientes p ON a.cod_cidadao = p.cod_paciente
ORDER BY a.data_consulta DESC;
```

## 👤 Tabelas Compartilhadas

### Pacientes (Base)
```sql
CREATE TABLE sistemaaps.tb_pacientes (
    cod_paciente SERIAL PRIMARY KEY,
    nome_paciente VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    cns VARCHAR(20),
    data_nascimento DATE NOT NULL,
    sexo CHAR(1), -- 'M', 'F'
    telefone VARCHAR(20),
    endereco TEXT,
    microarea VARCHAR(10),
    equipe_nome VARCHAR(100),
    acs_nome VARCHAR(255),
    -- Condições de saúde
    tem_hipertensao BOOLEAN DEFAULT FALSE,
    tem_diabetes BOOLEAN DEFAULT FALSE,
    data_diagnostico_has DATE,
    data_diagnostico_dm DATE,
    -- Campos para adolescentes
    idade_atual INTEGER GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento))
    ) STORED,
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices essenciais
CREATE INDEX idx_pacientes_nome ON sistemaaps.tb_pacientes 
    USING gin(to_tsvector('portuguese', unaccent(nome_paciente)));
CREATE INDEX idx_pacientes_cpf ON sistemaaps.tb_pacientes(cpf);
CREATE INDEX idx_pacientes_cns ON sistemaaps.tb_pacientes(cns);
CREATE INDEX idx_pacientes_equipe ON sistemaaps.tb_pacientes(equipe_nome);
CREATE INDEX idx_pacientes_microarea ON sistemaaps.tb_pacientes(microarea);
CREATE INDEX idx_pacientes_hipertensao ON sistemaaps.tb_pacientes(tem_hipertensao) WHERE tem_hipertensao = true;
CREATE INDEX idx_pacientes_adolescentes ON sistemaaps.tb_pacientes(idade_atual) WHERE idade_atual BETWEEN 10 AND 19;
```

### Equipes e Microáreas
```sql
CREATE TABLE sistemaaps.tb_equipes (
    cod_equipe SERIAL PRIMARY KEY,
    nome_equipe VARCHAR(100) NOT NULL,
    tipo_equipe VARCHAR(50), -- 'ESF', 'NASF', etc.
    ativa BOOLEAN DEFAULT TRUE
);

CREATE TABLE sistemaaps.tb_microareas (
    cod_microarea SERIAL PRIMARY KEY,
    cod_equipe INTEGER REFERENCES sistemaaps.tb_equipes(cod_equipe),
    numero_microarea VARCHAR(10) NOT NULL,
    acs_responsavel VARCHAR(255),
    populacao_estimada INTEGER
);
```

## 🔍 Queries Importantes

### Próxima Ação (HIPERDIA)
```sql
-- Query usada para buscar próxima ação pendente
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

### Busca com Filtros (Todas as tabelas)
```sql
-- Padrão para busca com unaccent (sem acentos)
SELECT * FROM sistemaaps.vw_pacientes_hiperdia
WHERE unaccent(lower(nome_paciente)) LIKE unaccent(lower('%' || %s || '%'))
  AND equipe_nome = %s
  AND microarea = %s
ORDER BY nome_paciente
LIMIT %s OFFSET %s;
```

### Estatísticas por Programa
```sql
-- Total de pacientes HIPERDIA por equipe
SELECT 
    equipe_nome,
    COUNT(*) as total_pacientes,
    COUNT(CASE WHEN tem_hipertensao THEN 1 END) as total_hipertensos,
    COUNT(CASE WHEN tem_diabetes THEN 1 END) as total_diabeticos
FROM sistemaaps.vw_pacientes_hiperdia
GROUP BY equipe_nome
ORDER BY total_pacientes DESC;
```

## 📈 Performance e Otimização

### Índices Estratégicos
```sql
-- Para buscas frequentes
CREATE INDEX CONCURRENTLY idx_busca_geral ON sistemaaps.tb_pacientes 
    USING gin(to_tsvector('portuguese', unaccent(nome_paciente || ' ' || COALESCE(cpf, ''))));

-- Para filtros por data
CREATE INDEX CONCURRENTLY idx_acompanhamento_data_periodo 
    ON sistemaaps.tb_hiperdia_has_acompanhamento(data_agendamento, status_acao);

-- Para joins frequentes
CREATE INDEX CONCURRENTLY idx_acompanhamento_cidadao_data 
    ON sistemaaps.tb_hiperdia_has_acompanhamento(cod_cidadao, data_agendamento DESC);
```

### Views Materializadas (para relatórios)
```sql
CREATE MATERIALIZED VIEW sistemaaps.mv_estatisticas_mensais AS
SELECT 
    DATE_TRUNC('month', data_realizacao) as mes,
    cod_acao,
    COUNT(*) as total_acoes,
    COUNT(DISTINCT cod_cidadao) as pacientes_unicos
FROM sistemaaps.tb_hiperdia_has_acompanhamento
WHERE status_acao = 'REALIZADA'
  AND data_realizacao >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', data_realizacao), cod_acao;

-- Refresh automático (executar periodicamente)
REFRESH MATERIALIZED VIEW sistemaaps.mv_estatisticas_mensais;
```

## 🔐 Segurança e Permissões

### Usuários e Permissões
```sql
-- Usuário da aplicação (apenas o necessário)
CREATE USER app_sistemaaps WITH PASSWORD 'senha_segura';

-- Permissões mínimas
GRANT CONNECT ON DATABASE esus TO app_sistemaaps;
GRANT USAGE ON SCHEMA sistemaaps TO app_sistemaaps;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sistemaaps TO app_sistemaaps;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sistemaaps TO app_sistemaaps;

-- Não permitir DELETE ou DDL
REVOKE DELETE ON ALL TABLES IN SCHEMA sistemaaps FROM app_sistemaaps;
```

### Auditoria (opcional)
```sql
-- Trigger para auditoria de mudanças
CREATE OR REPLACE FUNCTION sistemaaps.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sistemaaps.tb_auditoria (
        tabela, operacao, dados_antigos, dados_novos, usuario, timestamp
    ) VALUES (
        TG_TABLE_NAME, TG_OP, 
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        current_user, NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## 🔧 Manutenção

### Backup Recomendado
```bash
# Backup completo
pg_dump -h localhost -p 5433 -U postgres -d esus > backup_sistemaaps_$(date +%Y%m%d).sql

# Backup apenas do schema sistemaaps
pg_dump -h localhost -p 5433 -U postgres -d esus -n sistemaaps > backup_sistemaaps_schema_$(date +%Y%m%d).sql
```

### Monitoramento
```sql
-- Queries para monitoramento
-- Tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'sistemaaps'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Queries mais lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%sistemaaps%'
ORDER BY mean_time DESC
LIMIT 10;
```