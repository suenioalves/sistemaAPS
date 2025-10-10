# 📊 Resumo da Estrutura do Banco de Dados e-SUS PEC

## ✅ Descobertas Principais

### 🗄️ Informações do Banco
- **SGBD:** PostgreSQL
- **Host:** localhost:5433
- **Database:** esus
- **Total de Tabelas:** 1.101 tabelas

### 🏠 Como Funciona a Estrutura de Domicílios → Famílias → Cidadãos

#### 1. **DOMICÍLIOS** (`tb_cds_cad_domiciliar`)
Armazena informações de endereços residenciais.

**Principais campos:**
```
- co_seq_cds_cad_domiciliar (ID único)
- tp_logradouro (tipo: Rua, Avenida, etc.)
- no_logradouro (nome da rua)
- nu_domicilio (número)
- no_bairro
- nu_cep
- st_versao_atual = 1 (filtrar sempre por isso)
```

#### 2. **FAMÍLIAS** (`tb_cds_domicilio_familia`)
Vincula famílias aos domicílios.

**Principais campos:**
```
- co_seq_cds_domicilio_familia (ID único)
- co_cds_cad_domiciliar (FK → domicílio)
- nu_cpf_cidadao (CPF do responsável)
- nu_cartao_sus (CNS do responsável - pode estar hasheado)
- qt_membros_familia
- st_mudanca = 0 (família ainda reside)
```

#### 3. **CIDADÃOS** (`tb_cidadao`)
Tabela mestre com dados consolidados dos cidadãos.

**Principais campos:**
```
- co_seq_cidadao (ID único)
- no_cidadao (nome completo)
- nu_cpf
- nu_cns (Cartão Nacional de Saúde)
- dt_nascimento
- no_sexo
- no_mae, no_pai
- nu_micro_area (microárea onde reside)
- ds_logradouro, nu_numero, no_bairro
- st_ativo = 1 (filtrar apenas ativos)
```

#### 4. **CADASTRO INDIVIDUAL** (`tb_cds_cad_individual`)
Fichas de cadastro individual (CDS) dos cidadãos.

**Principais campos:**
```
- co_seq_cds_cad_individual (ID único)
- no_cidadao
- nu_cpf_cidadao, nu_cns_cidadao
- nu_micro_area
- st_responsavel_familiar = 1 (se é responsável)
- nu_cpf_responsavel (CPF do responsável familiar)
- st_versao_atual = 1 (versão atual)
- st_ficha_inativa = 0 (ficha ativa)
```

#### 5. **EQUIPES** (`tb_equipe`)
Equipes de Saúde da Família.

**Principais campos:**
```
- co_seq_equipe
- nu_ine (Identificador Nacional da Equipe)
- no_equipe (ex: "PSF - 03", "URBANA I", "RIBEIRINHA")
```

**Vinculação:** `tb_cidadao_vinculacao_equipe` liga cidadãos às equipes.

---

## 📋 Queries SQL Essenciais

### 1️⃣ Listar Domicílios
```sql
SELECT
    d.co_seq_cds_cad_domiciliar,
    tl.no_tipo_logradouro || ' ' || d.no_logradouro || ', ' || d.nu_domicilio AS endereco,
    d.no_bairro,
    d.nu_cep
FROM tb_cds_cad_domiciliar d
LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
WHERE d.st_versao_atual = 1;
```

### 2️⃣ Listar Famílias de um Domicílio
```sql
SELECT
    df.co_seq_cds_domicilio_familia,
    df.nu_cpf_cidadao AS cpf_responsavel,
    df.qt_membros_familia
FROM tb_cds_domicilio_familia df
WHERE df.co_cds_cad_domiciliar = <ID_DOMICILIO>
  AND df.st_mudanca = 0;
```

### 3️⃣ Buscar Cidadão
```sql
SELECT
    c.no_cidadao,
    c.nu_cpf,
    c.nu_cns,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
    c.nu_micro_area,
    e.no_equipe
FROM tb_cidadao c
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
WHERE (c.nu_cpf = '<CPF>' OR c.nu_cns = '<CNS>' OR LOWER(c.no_cidadao) LIKE '%<NOME>%')
  AND c.st_ativo = 1;
```

### 4️⃣ Listar Cidadãos por Microárea
```sql
SELECT
    ci.no_cidadao,
    ci.nu_cpf_cidadao,
    ci.nu_micro_area,
    ci.st_responsavel_familiar,
    e.no_equipe
FROM tb_cds_cad_individual ci
LEFT JOIN tb_cidadao c ON c.nu_cpf = ci.nu_cpf_cidadao OR c.nu_cns = ci.nu_cns_cidadao
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
WHERE ci.nu_micro_area = '<MICROAREA>'
  AND ci.st_versao_atual = 1
  AND ci.st_ficha_inativa = 0;
```

### 5️⃣ Identificar Responsável Familiar
```sql
SELECT
    c.no_cidadao,
    c.nu_cpf,
    ci.st_responsavel_familiar
FROM tb_cidadao c
INNER JOIN tb_cds_cad_individual ci ON (ci.nu_cpf_cidadao = c.nu_cpf OR ci.nu_cns_cidadao = c.nu_cns)
WHERE ci.st_responsavel_familiar = 1
  AND ci.st_versao_atual = 1
  AND c.st_ativo = 1;
```

---

## 🔗 Relacionamentos

```
┌─────────────────────────┐
│ tb_cds_cad_domiciliar   │ ◄── Domicílio (endereço)
│ (Domicílio)             │
└────────────┬────────────┘
             │ 1:N
             ▼
┌─────────────────────────┐
│ tb_cds_domicilio_familia│ ◄── Família vinculada ao domicílio
│ (Família)               │
└────────────┬────────────┘
             │ Responsável (CPF/CNS)
             ▼
┌─────────────────────────┐
│ tb_cidadao              │ ◄── Cidadão (dados consolidados)
│ (Cidadão Mestre)        │
└────────────┬────────────┘
             │ 1:1
             ▼
┌─────────────────────────┐
│ tb_cds_cad_individual   │ ◄── Ficha de cadastro individual
│ (Cadastro CDS)          │
└─────────────────────────┘
             │ N:1
             ▼
┌─────────────────────────┐
│ tb_cidadao_vinculacao_  │ ◄── Vinculação com equipe
│ equipe                  │
└────────────┬────────────┘
             │ N:1
             ▼
┌─────────────────────────┐
│ tb_equipe               │ ◄── Equipe de Saúde da Família
│ (Equipe)                │
└─────────────────────────┘
```

---

## 🎯 Campos Importantes para Filtros

### ⚠️ **SEMPRE** filtrar por:

1. **`st_versao_atual = 1`**
   - Em: `tb_cds_cad_domiciliar`, `tb_cds_cad_individual`
   - Garante que está usando a versão mais atual do registro

2. **`st_ativo = 1`**
   - Em: `tb_cidadao`
   - Garante que o cidadão está ativo no sistema

3. **`st_ficha_inativa = 0`**
   - Em: `tb_cds_cad_individual`
   - Garante que a ficha está ativa

4. **`st_mudanca = 0`**
   - Em: `tb_cds_domicilio_familia`
   - Garante que a família ainda reside no domicílio

5. **`st_faleceu = 0`**
   - Em: `tb_cidadao`
   - Exclui pessoas falecidas (se necessário)

---

## 🗂️ Arquivos Gerados

### 1. **queries_sql_esus.sql**
Arquivo com 10 queries SQL prontas para uso, totalmente comentadas e parametrizadas.

### 2. **DOCUMENTACAO_BANCO_ESUS.md**
Documentação completa da estrutura do banco com:
- Descrição detalhada de todas as tabelas principais
- Relacionamentos entre tabelas
- Exemplos de uso
- Observações importantes

### 3. **consulta_banco_esus.py**
Script Python interativo com:
- Menu de consultas
- Funções prontas para:
  - Listar domicílios
  - Listar famílias
  - Buscar cidadãos
  - Estatísticas por microárea
  - Identificar responsáveis familiares

### 4. **Este Resumo (RESUMO_ESTRUTURA_BANCO.md)**
Guia rápido de consulta.

---

## 🚀 Como Usar

### Via Python:
```bash
python consulta_banco_esus.py
```

### Via SQL Direto:
1. Conecte ao PostgreSQL:
   ```bash
   psql -h localhost -p 5433 -U postgres -d esus
   ```

2. Execute as queries do arquivo `queries_sql_esus.sql`

### Via Código Python (exemplo):
```python
from consulta_banco_esus import ConsultaBancoESUS

consulta = ConsultaBancoESUS()
consulta.conectar()

# Buscar cidadão
consulta.buscar_cidadao(cpf='12345678901')

# Listar por microárea
consulta.listar_cidadaos_microarea('01', limite=50)

consulta.desconectar()
```

---

## 📊 Estatísticas do Sistema

Com base nos testes realizados:

- **Microáreas cadastradas:** Várias (01, 02, 03, 04, etc.)
- **Cidadãos por microárea:**
  - Microárea 01: ~1.635 cidadãos
  - Microárea 02: ~2.470 cidadãos
  - Microárea 03: ~2.278 cidadãos
  - Microárea 04: ~1.407 cidadãos

- **Equipes:** PSF (PSF 1, 2, 3), URBANA (I, II, III), RIBEIRINHA, COMUNIDADES

---

## ✅ Conclusão

Agora você pode:

1. ✅ Listar domicílios diretamente do PostgreSQL
2. ✅ Identificar famílias que pertencem a cada domicílio
3. ✅ Listar integrantes (cidadãos) de cada família
4. ✅ Identificar quem é o responsável familiar
5. ✅ Filtrar por microárea e equipe de saúde
6. ✅ Fazer todas essas consultas via SQL puro, sem depender dos CSVs

**Tudo via SQL direto no banco PostgreSQL! 🎉**
