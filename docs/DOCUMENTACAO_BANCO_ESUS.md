# Documentação do Banco de Dados e-SUS PEC

## Visão Geral

O banco de dados PostgreSQL do e-SUS PEC (Prontuário Eletrônico do Cidadão) armazena informações de saúde da Atenção Primária, incluindo cadastros de domicílios, famílias, cidadãos e atendimentos.

## Configuração de Conexão

```python
DB_CONFIG = {
    'host': 'localhost',
    'port': '5433',
    'database': 'esus',
    'user': 'postgres',
    'password': 'EUC[x*x~Mc#S+H_Ui#xZBr0O~'
}
```

## Estrutura de Tabelas Principais

### 1. **Domicílios**

#### `tb_cds_cad_domiciliar`
Tabela de cadastro domiciliar com informações de endereço.

**Principais colunas:**
- `co_seq_cds_cad_domiciliar` (BIGINT) - ID único do domicílio
- `tp_logradouro` (BIGINT) - Tipo de logradouro (FK para tb_tipo_logradouro)
- `no_logradouro` (VARCHAR) - Nome do logradouro
- `nu_domicilio` (VARCHAR) - Número do domicílio
- `no_bairro` (VARCHAR) - Bairro
- `nu_cep` (VARCHAR) - CEP
- `ds_complemento` (VARCHAR) - Complemento
- `ds_ponto_referencia` (VARCHAR) - Ponto de referência
- `co_unico_domicilio` (VARCHAR) - UUID único do domicílio
- `st_versao_atual` (INTEGER) - Flag indicando se é a versão atual (1 = sim)
- `dt_cad_domiciliar` (TIMESTAMP) - Data do cadastro

**Importante:** Sempre filtrar por `st_versao_atual = 1` para obter apenas registros ativos.

---

### 2. **Famílias**

#### `tb_familia`
Tabela de núcleos familiares vinculados a domicílios.

**Principais colunas:**
- `co_seq_familia` (BIGINT) - ID único da família
- `nu_cpf_cns_responsavel` (VARCHAR) - CPF ou CNS do responsável familiar
- `nu_ine` (VARCHAR) - Identificador Nacional de Equipe
- `nu_cnes` (VARCHAR) - Código Nacional de Estabelecimento de Saúde
- `co_cds_domicilio` (BIGINT) - FK para tb_cds_cad_domiciliar
- `qt_membro` (INTEGER) - Quantidade de membros
- `co_renda_familiar` (BIGINT) - FK para tb_renda_familiar
- `dt_reside_desde` (DATE) - Data desde quando reside
- `st_familia_ainda_reside` (INTEGER) - Flag se ainda reside (1 = sim)

#### `tb_cds_domicilio_familia`
Relacionamento entre domicílios e famílias via CDS.

**Principais colunas:**
- `co_seq_cds_domicilio_familia` (BIGINT) - ID único
- `co_cds_cad_domiciliar` (BIGINT) - FK para domicílio
- `nu_cartao_sus` (VARCHAR) - CNS do responsável (hash)
- `nu_cpf_cidadao` (VARCHAR) - CPF do responsável
- `dt_nascimento` (TIMESTAMP) - Data nascimento do responsável
- `qt_membros_familia` (INTEGER) - Quantidade de membros
- `co_renda_familiar` (BIGINT) - FK para renda
- `st_mudanca` (INTEGER) - Flag se mudou-se (0 = ainda reside)

---

### 3. **Cidadãos**

#### `tb_cidadao`
Tabela mestre de cidadãos com dados consolidados.

**Principais colunas:**
- `co_seq_cidadao` (BIGINT) - ID único do cidadão
- `no_cidadao` (VARCHAR) - Nome completo
- `no_cidadao_filtro` (VARCHAR) - Nome normalizado para busca
- `nu_cpf` (VARCHAR) - CPF
- `nu_cns` (VARCHAR) - Cartão Nacional de Saúde
- `dt_nascimento` (DATE) - Data de nascimento
- `no_sexo` (VARCHAR) - Sexo
- `co_raca_cor` (BIGINT) - FK para raça/cor
- `no_mae` (VARCHAR) - Nome da mãe
- `no_pai` (VARCHAR) - Nome do pai
- `nu_micro_area` (VARCHAR) - Microárea onde reside
- `nu_area` (VARCHAR) - Área
- `ds_logradouro` (VARCHAR) - Endereço
- `nu_numero` (VARCHAR) - Número
- `no_bairro` (VARCHAR) - Bairro
- `ds_cep` (VARCHAR) - CEP
- `nu_telefone_celular` (VARCHAR) - Telefone celular
- `ds_email` (VARCHAR) - E-mail
- `st_ativo` (INTEGER) - Status ativo (1 = ativo)
- `st_faleceu` (INTEGER) - Flag se faleceu (0 = vivo)
- `dt_obito` (DATE) - Data de óbito

#### `tb_cds_cad_individual`
Ficha de cadastro individual de cidadãos (CDS).

**Principais colunas:**
- `co_seq_cds_cad_individual` (BIGINT) - ID único do cadastro
- `no_cidadao` (VARCHAR) - Nome do cidadão
- `no_cidadao_filtro` (VARCHAR) - Nome normalizado
- `nu_cpf_cidadao` (VARCHAR) - CPF
- `nu_cns_cidadao` (VARCHAR) - CNS
- `dt_nascimento` (TIMESTAMP) - Data nascimento
- `co_sexo` (BIGINT) - FK para sexo
- `co_raca_cor` (BIGINT) - FK para raça/cor
- `no_mae_cidadao` (VARCHAR) - Nome da mãe
- `no_pai_cidadao` (VARCHAR) - Nome do pai
- `nu_micro_area` (VARCHAR) - Microárea
- `st_responsavel_familiar` (INTEGER) - Flag se é responsável (1 = sim)
- `nu_cpf_responsavel` (VARCHAR) - CPF do responsável familiar
- `nu_cns_responsavel` (VARCHAR) - CNS do responsável familiar
- `st_versao_atual` (INTEGER) - Versão atual (1 = sim)
- `st_ficha_inativa` (INTEGER) - Ficha ativa (0 = ativa)
- `dt_cad_individual` (TIMESTAMP) - Data do cadastro

---

### 4. **Núcleo Familiar**

#### `tb_cidadao_nucleo_familiar`
Relacionamento entre cidadãos e famílias.

**Principais colunas:**
- `co_seq_cidadao_nucleo_familiar` (BIGINT) - ID único
- `co_cidadao` (BIGINT) - FK para tb_cidadao
- `nu_cpf_cns_responsavel` (VARCHAR) - CPF/CNS do responsável
- `st_responsavel` (INTEGER) - Flag se é responsável (1 = sim)
- `co_grau_parentesco` (INTEGER) - FK para grau de parentesco
- `nu_ine` (VARCHAR) - Identificador da equipe
- `nu_cnes` (VARCHAR) - CNES
- `st_mudou_se` (INTEGER) - Flag se mudou-se

---

### 5. **Equipes de Saúde**

#### `tb_equipe`
Equipes de Saúde da Família (ESF/PSF).

**Principais colunas:**
- `co_seq_equipe` (BIGINT) - ID único
- `nu_ine` (VARCHAR) - Identificador Nacional da Equipe
- `no_equipe` (VARCHAR) - Nome da equipe (ex: "PSF - 03", "URBANA I")
- `nu_cnes` (VARCHAR) - CNES da unidade

#### `tb_cidadao_vinculacao_equipe`
Vinculação de cidadãos às equipes.

**Principais colunas:**
- `co_cidadao` (BIGINT) - FK para tb_cidadao
- `nu_ine` (VARCHAR) - FK para tb_equipe

---

### 6. **Tabelas Auxiliares**

#### `tb_tipo_logradouro`
Tipos de logradouros (Rua, Avenida, etc.).

**Principais colunas:**
- `co_tipo_logradouro` (BIGINT) - ID único
- `no_tipo_logradouro` (VARCHAR) - Nome do tipo (ex: "RUA", "AVENIDA")

#### `tb_sexo`
Tabela de sexos.

**Principais colunas:**
- `co_seq_sexo` (BIGINT) - ID único
- `no_sexo` (VARCHAR) - "MASCULINO" ou "FEMININO"

#### `tb_raca_cor`
Raça/cor segundo classificação do IBGE.

**Principais colunas:**
- `co_seq_raca_cor` (BIGINT) - ID único
- `ds_raca_cor` (VARCHAR) - Descrição

#### `tb_grau_parentesco`
Grau de parentesco familiar.

**Principais colunas:**
- `co_grau_parentesco` (BIGINT) - ID único
- `no_grau_parentesco` (VARCHAR) - Descrição (ex: "Filho(a)", "Cônjuge")

#### `tb_renda_familiar`
Faixas de renda familiar.

**Principais colunas:**
- `co_renda_familiar` (BIGINT) - ID único (CORRIGIDO)
- `no_renda_familiar` (VARCHAR) - Descrição da faixa (ex: "1 SALÁRIO MÍNIMO", "3 SALÁRIOS MÍNIMOS")

---

## Relacionamentos Principais

```
tb_cds_cad_domiciliar (Domicílio)
    ↓ (1:N)
tb_cds_domicilio_familia (Família no Domicílio)
    ↓ (1:N)
tb_cidadao (Cidadão)
    ↓ (1:N)
tb_cidadao_nucleo_familiar (Núcleo Familiar)
    ↓ (N:1)
tb_familia (Família)
```

**Alternativa via CDS:**
```
tb_cds_cad_individual (Cadastro Individual)
    ↓
tb_cidadao (Cidadão Mestre)
    ↓
tb_cidadao_vinculacao_equipe
    ↓
tb_equipe (Equipe de Saúde)
```

---

## Queries Essenciais

### Listar Domicílios Ativos

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

### Listar Famílias por Domicílio

```sql
SELECT
    d.co_seq_cds_cad_domiciliar AS id_domicilio,
    df.co_seq_cds_domicilio_familia AS id_familia,
    df.nu_cpf_cidadao AS cpf_responsavel,
    df.qt_membros_familia
FROM tb_cds_cad_domiciliar d
INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
WHERE d.st_versao_atual = 1
  AND df.st_mudanca = 0;
```

### Buscar Cidadão por CPF/CNS/Nome

```sql
SELECT
    c.no_cidadao,
    c.nu_cpf,
    c.nu_cns,
    TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
    c.no_sexo,
    e.no_equipe
FROM tb_cidadao c
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
WHERE (c.nu_cpf = '12345678901' OR c.nu_cns = '123456789012345' OR LOWER(c.no_cidadao) LIKE '%nome%')
  AND c.st_ativo = 1;
```

### Identificar Responsável Familiar

```sql
SELECT
    c.no_cidadao,
    c.nu_cpf,
    c.nu_cns,
    ci.st_responsavel_familiar
FROM tb_cidadao c
INNER JOIN tb_cds_cad_individual ci ON (ci.nu_cpf_cidadao = c.nu_cpf OR ci.nu_cns_cidadao = c.nu_cns)
WHERE ci.st_responsavel_familiar = 1
  AND ci.st_versao_atual = 1;
```

### Listar Cidadãos por Microárea

```sql
SELECT
    ci.no_cidadao,
    ci.nu_cpf_cidadao,
    ci.nu_cns_cidadao,
    ci.nu_micro_area,
    e.no_equipe
FROM tb_cds_cad_individual ci
LEFT JOIN tb_cidadao c ON c.nu_cpf = ci.nu_cpf_cidadao OR c.nu_cns = ci.nu_cns_cidadao
LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
WHERE ci.nu_micro_area = '01'
  AND ci.st_versao_atual = 1
  AND ci.st_ficha_inativa = 0;
```

---

## Observações Importantes

1. **Versionamento:** Muitas tabelas possuem `st_versao_atual` para controlar versões. Sempre filtrar por `= 1`.

2. **Soft Delete:** Muitas tabelas usam flags como `st_ativo`, `st_ficha_inativa`, etc. ao invés de deletar registros.

3. **Normalização de Nomes:** As colunas `*_filtro` contêm versões normalizadas dos nomes para facilitar buscas.

4. **Hashing de CNS:** Em algumas tabelas (como `tb_cds_domicilio_familia`), o CNS pode estar hasheado.

5. **Microáreas:** São identificadas por strings de 2-3 caracteres (ex: "01", "02", "03A").

6. **Equipes:** Nomes variam: "PSF - 03", "URBANA I", "RIO JAVARI", "RIBEIRINHA", etc.

7. **Relacionamentos Complexos:** Existem múltiplas formas de relacionar domicílios → famílias → cidadãos. As queries devem considerar as diferentes estruturas.

---

## Total de Tabelas

O banco de dados possui **1.101 tabelas**, incluindo:
- Tabelas de dados (`tb_*`)
- Tabelas de auditoria (`ta_*`)
- Tabelas de log (`tl_*`)
- Tabelas de relacionamento (`rl_*`)

---

## Arquivo de Queries SQL

Todas as queries SQL prontas para uso estão disponíveis no arquivo:
**`queries_sql_esus.sql`**

Este arquivo contém 10 queries principais comentadas e parametrizadas para facilitar o uso.
