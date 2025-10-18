# Melhoria: Busca por Qualquer Morador no Painel de Domicílios

**Data:** 2025-10-15
**Módulo:** Painel de Domicílios e Famílias
**Tipo:** Melhoria de Funcionalidade

---

## 📋 Descrição da Melhoria

Implementada funcionalidade para permitir que a busca no painel de domicílios retorne resultados quando o usuário buscar pelo nome de **qualquer pessoa** que more no domicílio, não apenas pelos responsáveis familiares.

### Comportamento Anterior

A busca textual no painel de domicílios funcionava apenas para:
- ✅ Endereços (rua, avenida, bairro)
- ✅ **Apenas responsáveis familiares** (`st_responsavel_familiar = 1`)

Se o usuário buscasse pelo nome de um dependente (criança, cônjuge não-responsável, etc.), **nenhum resultado era retornado**.

### Comportamento Atual

Agora a busca retorna domicílios quando o usuário busca por:
- ✅ Endereços (rua, avenida, bairro)
- ✅ **Qualquer morador** (responsável ou não)

---

## 🔧 Alterações Implementadas

### Arquivo Modificado: `app.py`

**Rota:** `/api/domicilios/list` (linha 565-584)

#### Antes (Busca apenas por responsáveis):
```python
else:
    # Busca por nome de responsável familiar
    cte_filtro = """
    WITH domicilios_filtrados AS (
        SELECT DISTINCT d.co_seq_cds_cad_domiciliar
        FROM tb_cds_cad_domiciliar d
        INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
        INNER JOIN tb_cds_cad_individual ci_busca ON (
            ci_busca.nu_cpf_responsavel = df.nu_cpf_cidadao
            OR ci_busca.nu_cpf_cidadao = df.nu_cpf_cidadao
            OR ci_busca.nu_cartao_sus_responsavel = df.nu_cartao_sus
            OR ci_busca.nu_cns_cidadao = df.nu_cartao_sus
        )
        WHERE d.st_versao_atual = 1
          AND df.st_mudanca = 0
          AND ci_busca.st_versao_atual = 1
          AND ci_busca.st_ficha_inativa = 0
          AND ci_busca.st_responsavel_familiar = 1  -- ❌ LIMITAVA A RESPONSÁVEIS
          AND LOWER(ci_busca.no_cidadao) LIKE LOWER(%s)
    )
    """
```

#### Depois (Busca por qualquer morador):
```python
else:
    # Busca por nome de QUALQUER morador (responsável ou não)
    cte_filtro = """
    WITH domicilios_filtrados AS (
        SELECT DISTINCT d.co_seq_cds_cad_domiciliar
        FROM tb_cds_cad_domiciliar d
        INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
        INNER JOIN tb_cds_cad_individual ci_busca ON (
            ci_busca.nu_cpf_responsavel = df.nu_cpf_cidadao
            OR ci_busca.nu_cpf_cidadao = df.nu_cpf_cidadao
            OR ci_busca.nu_cartao_sus_responsavel = df.nu_cartao_sus
            OR ci_busca.nu_cns_cidadao = df.nu_cartao_sus
        )
        WHERE d.st_versao_atual = 1
          AND df.st_mudanca = 0
          AND ci_busca.st_versao_atual = 1
          AND ci_busca.st_ficha_inativa = 0
          -- ✅ REMOVIDO: AND ci_busca.st_responsavel_familiar = 1
          AND LOWER(ci_busca.no_cidadao) LIKE LOWER(%s)
    )
    """
```

**Mudança:** Removida a linha `AND ci_busca.st_responsavel_familiar = 1` para permitir busca por qualquer morador ativo.

---

## 🧪 Testes Realizados

### Cenário de Teste

**Domicílio:** BECO CUNHA GOMES 01, 721
**Total de moradores:** 10 pessoas

**Moradores:**
- ✅ CARMEM RODRIGUES PEREIRA (Responsável)
- ANA HAICHA RODRIGUES ALVES (Dependente)
- ESTER RODRIGUES ALVES (Dependente)
- KAILANE DA SILVA DIAS (Dependente)
- MARINHO GABRIEL RODRIGUES ALVES (Dependente)
- MIRIAN RODRIGUES ALVES (Dependente)
- MOISES RODRIGUES ALVES (Dependente)
- OZANIR VIEIRA DIAS (Dependente)
- RAIMUNDO DIAS DA SILVA (Dependente)
- VITOR EMANUEL RODRIGUES ALVES (Dependente)

### Teste 1: Buscar por Responsável Familiar ✅

**Busca:** "CARMEM RODRIGUES"
**Resultado:** 1 domicílio encontrado
**Status:** ✅ **OK** - Funcionou como antes

### Teste 2: Buscar por Morador Não-Responsável ✅

**Busca:** "ANA HAICHA"
**Resultado:** 1 domicílio encontrado
**Status:** ✅ **OK** - Agora funciona! (antes retornava 0 resultados)

---

## 📊 Benefícios da Melhoria

### 1. **Maior Facilidade de Busca**
Agentes Comunitários de Saúde (ACS) podem encontrar domicílios buscando pelo nome de qualquer morador, não apenas pelo responsável.

### 2. **Casos de Uso Reais**

**Antes:**
- ACS quer encontrar o domicílio da criança "João Silva"
- Busca por "João Silva"
- ❌ Nenhum resultado (pois João não é responsável)
- Precisa buscar pelo nome do pai/mãe

**Agora:**
- ACS quer encontrar o domicílio da criança "João Silva"
- Busca por "João Silva"
- ✅ Domicílio encontrado!

### 3. **Melhor Experiência do Usuário**
Mais intuitivo e natural - se a pessoa mora no domicílio, a busca deve encontrá-la.

---

## ⚙️ Filtros Mantidos

A busca continua respeitando os seguintes filtros de segurança:

- ✅ `st_versao_atual = 1` - Apenas cadastros atuais
- ✅ `st_ficha_inativa = 0` - Apenas fichas ativas
- ✅ `df.st_mudanca = 0` - Apenas famílias que ainda moram no domicílio
- ✅ `d.st_versao_atual = 1` - Apenas domicílios com cadastro atual

**Nota:** Pessoas com fichas inativas ou que se mudaram não aparecem nos resultados.

---

## 🎯 Exemplos de Uso

### Exemplo 1: Buscar por Dependente
```
Usuário digita: "KAILANE SILVA"
Sistema retorna: BECO CUNHA GOMES 01, 721
```

### Exemplo 2: Buscar por Responsável (como antes)
```
Usuário digita: "CARMEM RODRIGUES"
Sistema retorna: BECO CUNHA GOMES 01, 721
```

### Exemplo 3: Buscar por Endereço (sem mudanças)
```
Usuário digita: "RUA CUNHA GOMES"
Sistema retorna: Todos domicílios na Rua Cunha Gomes
```

---

## 📝 Observações Técnicas

### Performance

A query continua otimizada:
- ✅ Usa CTE `domicilios_filtrados` para pré-filtrar domicílios
- ✅ Usa índices em CPF e CNS
- ✅ `DISTINCT` evita duplicações
- ✅ Filtros aplicados antes dos JOINs

### Compatibilidade

- ✅ Não quebra funcionalidade existente
- ✅ Busca por endereço continua funcionando
- ✅ Busca por responsável continua funcionando
- ✅ Adiciona novo caso de uso (busca por dependente)

---

## ✅ Status Final

**Status:** ✅ **IMPLEMENTADO E VALIDADO**
**Data de Conclusão:** 2025-10-15
**Impacto:** Positivo - Melhora significativa na usabilidade
**Breaking Changes:** Nenhum

---

## 📚 Documentação Relacionada

- [api-documentation.md](./api-documentation.md) - Documentação da API
- [QUERY_11_DOMICILIOS_COM_INTEGRANTES.md](./QUERY_11_DOMICILIOS_COM_INTEGRANTES.md) - Query base
- [frontend-guidelines.md](./frontend-guidelines.md) - Guidelines do frontend

---

**Documentação gerada automaticamente**
**Última atualização:** 2025-10-15
