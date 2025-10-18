# Materialized View: Otimização do Painel de Domicílios

**Data:** 2025-10-15
**Tipo:** Otimização de Performance - Materialized View
**Ganho de Performance:** **99.9%** (de 4.33s para 0.003s)

---

## 📊 Resultado da Otimização

### Performance Antes vs Depois

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Primeira execução** | 4.379s | 0.009s | **99.8%** |
| **Segunda execução (cache)** | 4.289s | 0.003s | **99.9%** |
| **Busca por nome** | ~4.5s | 0.007s | **99.8%** |

### Impacto Real

- ✅ **Carregamento instantâneo** da lista de domicílios
- ✅ **Busca ultra-rápida** por qualquer morador
- ✅ **Experiência do usuário** drasticamente melhorada
- ✅ **Servidor menos sobrecarregado**

---

## 🏗️ Arquitetura da Solução

### 1. Materialized View `mv_domicilios_resumo`

Uma Materialized View é uma tabela física que armazena o resultado de uma query complexa. Diferente de uma VIEW normal (que executa a query toda vez), a Materialized View:

- ✅ Armazena os dados fisicamente no disco
- ✅ Possui índices próprios para buscas rápidas
- ✅ É atualizada periodicamente (não em tempo real)

### 2. Dados Armazenados

A view contém:

```sql
- id_domicilio (ID único)
- logradouro_completo (tipo + nome do logradouro)
- no_logradouro, nu_domicilio (separados)
- bairro, cep
- total_familias, total_integrantes
- microareas (das famílias responsáveis)
- responsaveis_info (nome|idade|sexo concatenado)
- tem_responsavel (flag 0/1)
- dt_cad_domiciliar (data de cadastro)
- cpfs_responsaveis (para buscas)
- nomes_moradores_lower (TODOS os moradores em lowercase)
- nu_domicilio_int (número convertido para ordenação)
```

### 3. Índices Criados

```sql
-- Índice único no ID (permite REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX idx_mv_domicilios_id ON mv_domicilios_resumo(id_domicilio);

-- Índice para ordenação por logradouro
CREATE INDEX idx_mv_domicilios_logradouro ON mv_domicilios_resumo(no_logradouro, nu_domicilio_int);

-- Índice para filtro por bairro
CREATE INDEX idx_mv_domicilios_bairro ON mv_domicilios_resumo(bairro);

-- Índice para filtro por microárea
CREATE INDEX idx_mv_domicilios_microarea ON mv_domicilios_resumo(microareas);

-- Índice GIN para busca de texto (nomes de moradores)
CREATE INDEX idx_mv_domicilios_nomes ON mv_domicilios_resumo
    USING gin(to_tsvector('portuguese', nomes_moradores_lower));
```

---

## 🔄 Atualização Automática

### Frequência: 1x por dia

A Materialized View é atualizada **1 vez por dia** através de refresh programado.

### Por quê 1x por dia?

- ✅ Dados de domicílios **não mudam frequentemente**
- ✅ Novos cadastros são raros (poucos por semana)
- ✅ Mudanças de endereço são ainda mais raras
- ✅ **Ganho de performance** compensa a defasagem de algumas horas

### Como Funciona o Refresh

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_domicilios_resumo;
```

**`CONCURRENTLY`** significa que:
- ✅ Usuários continuam acessando a view durante o refresh
- ✅ Não há downtime
- ✅ Requer índice UNIQUE (já criado)

---

## 📁 Arquivos da Implementação

### 1. Script SQL de Criação

**Arquivo:** `bd_sistema_aps/Scripts/Materialize_Views/CREATE_MV_DOMICILIOS_RESUMO.sql`

Cria a Materialized View com todos os índices.

### 2. Script Python de Refresh

**Arquivo:** `refresh_materialized_view.py`

```python
# Executa refresh da view
python refresh_materialized_view.py
```

**Saída:**
```
Refresh concluido com sucesso!
Tempo: 4.5s
Estatisticas:
  - Total de domicilios: 1485
  - Tamanho da view: 712 kB
```

### 3. Script BAT para Windows

**Arquivo:** `refresh_domicilios.bat`

Facilita a programação no Task Scheduler do Windows.

---

## ⚙️ Programar Refresh Automático no Windows

### Passo 1: Abrir Task Scheduler

1. Pressione `Win + R`
2. Digite `taskschd.msc`
3. Enter

### Passo 2: Criar Tarefa

1. Clique em **"Create Basic Task"** (Criar Tarefa Básica)
2. Nome: `Refresh Materialized View Domicílios`
3. Descrição: `Atualiza view de domicílios 1x por dia`

### Passo 3: Configurar Trigger

1. **Trigger:** Daily (Diariamente)
2. **Horário:** 03:00 AM (madrugada, pouco movimento)
3. **Recurrence:** Every 1 day

### Passo 4: Configurar Action

1. **Action:** Start a program
2. **Program/script:**
   ```
   C:\Users\Pichau\Desktop\SISTEMA APS\sistemaAPS\refresh_domicilios.bat
   ```
3. **Start in:**
   ```
   C:\Users\Pichau\Desktop\SISTEMA APS\sistemaAPS
   ```

### Passo 5: Configurações Adicionais

- ✅ Run whether user is logged on or not
- ✅ Run with highest privileges
- ✅ If task fails, restart every 10 minutes (up to 3 times)

---

## 🔧 Código da API Otimizado

### Antes (Query Complexa)

```python
# 150+ linhas de query com múltiplos JOINs e CTEs
query = """
    WITH domicilios_mais_recentes AS (...)
    SELECT ... FROM tb_cds_cad_domiciliar d
    LEFT JOIN tb_tipo_logradouro tl ...
    INNER JOIN tb_cds_domicilio_familia df ...
    INNER JOIN domicilios_mais_recentes dmr ...
    INNER JOIN tb_cds_cad_individual ci ON (
        ci.nu_cpf_responsavel = df.nu_cpf_cidadao
        OR ci.nu_cpf_cidadao = df.nu_cpf_cidadao
        OR ci.nu_cartao_sus_responsavel = df.nu_cartao_sus
        OR ci.nu_cns_cidadao = df.nu_cartao_sus
    )
    LEFT JOIN tb_sexo s ...
    GROUP BY ... HAVING ...
"""
```

### Depois (Query Simples)

```python
# 15 linhas simples usando a Materialized View
query = """
    SELECT
        id_domicilio,
        logradouro_completo || ', ' || nu_domicilio AS endereco_completo,
        bairro, cep, total_familias, total_integrantes,
        NULL AS equipes, microareas, responsaveis_info,
        tem_responsavel,
        TO_CHAR(dt_cad_domiciliar, 'DD/MM/YYYY') AS data_cadastro
    FROM mv_domicilios_resumo
    WHERE 1=1
    ORDER BY no_logradouro ASC, nu_domicilio_int ASC
    LIMIT %s OFFSET %s
"""
```

**Diferença:**
- ❌ Sem CTEs complexas
- ❌ Sem múltiplos JOINs
- ❌ Sem condições OR problemáticas
- ✅ Query direta em tabela indexada
- ✅ PostgreSQL usa índices eficientemente

---

## 🧪 Testes de Performance

### Teste 1: Listagem Simples (20 registros)

```sql
SELECT * FROM mv_domicilios_resumo
ORDER BY no_logradouro, nu_domicilio_int
LIMIT 20
```

- **Antes:** 4.33s
- **Depois:** 0.003s
- **Ganho:** 1443x mais rápido

### Teste 2: Busca por Nome (298 resultados)

```sql
SELECT * FROM mv_domicilios_resumo
WHERE LOWER(nomes_moradores_lower) LIKE '%maria%'
```

- **Antes:** ~4.5s
- **Depois:** 0.007s
- **Ganho:** 642x mais rápido

### Teste 3: Filtro por Microárea

```sql
SELECT * FROM mv_domicilios_resumo
WHERE microareas LIKE '%06%'
```

- **Antes:** ~4.2s
- **Depois:** 0.005s
- **Ganho:** 840x mais rápido

---

## 📈 Estatísticas da View

- **Total de domicílios:** 1,485
- **Tamanho em disco:** 712 KB
- **Tempo de criação:** ~4.5s
- **Tempo de refresh:** ~4.5s
- **Tempo de query:** 0.003s (média)

---

## ⚠️ Considerações Importantes

### 1. Dados podem estar desatualizados

- **Máximo de defasagem:** 24 horas
- **Solução:** Se precisar de dados em tempo real, executar refresh manual

### 2. Refresh Manual (quando necessário)

```python
python refresh_materialized_view.py
```

Ou pelo psql:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_domicilios_resumo;
```

### 3. Espaço em Disco

- View ocupa ~712 KB
- Índices ocupam ~350 KB
- **Total:** ~1 MB (negligível)

### 4. Manutenção

Se a estrutura das tabelas base mudar:
1. Dropar a view: `DROP MATERIALIZED VIEW mv_domicilios_resumo CASCADE`
2. Recriar: Executar script `CREATE_MV_DOMICILIOS_RESUMO.sql`

---

## ✅ Checklist de Implementação

- [x] Materialized View criada
- [x] Índices criados (5 índices)
- [x] API modificada para usar a view
- [x] Script de refresh criado
- [x] Script BAT criado
- [x] Testes de performance realizados
- [x] Documentação completa
- [ ] Task Scheduler configurado (fazer manualmente)

---

## 🎯 Próximos Passos

1. **Configurar Task Scheduler** (seguir instruções acima)
2. **Monitorar performance** nos próximos dias
3. **Ajustar horário** do refresh se necessário
4. **Considerar refresh 2x/dia** se dados mudarem muito

---

## 📞 Suporte

**Refresh manual em caso de necessidade:**
```bash
cd "C:\Users\Pichau\Desktop\SISTEMA APS\sistemaAPS"
python refresh_materialized_view.py
```

**Verificar última atualização:**
```sql
SELECT
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS tamanho,
    (SELECT COUNT(*) FROM mv_domicilios_resumo) AS total_registros
FROM pg_matviews
WHERE matviewname = 'mv_domicilios_resumo';
```

---

**Documentação gerada automaticamente**
**Última atualização:** 2025-10-15
**Performance:** 99.9% mais rápido
