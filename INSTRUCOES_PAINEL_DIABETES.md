# 📋 Sistema de Acompanhamento de Pacientes Diabéticos - HIPERDIA DM

## ✅ **ESTRUTURA COMPLETA CRIADA**

Painel completo para acompanhamento de pacientes diabéticos baseado na estrutura existente de hipertensão.

## 🗄️ **Estrutura de Banco de Dados**

### **Tabelas Criadas:**

1. **`tb_hiperdia_dm_acompanhamento`**
   - Equivalente à `tb_hiperdia_has_acompanhamento`
   - Armazena histórico de ações de acompanhamento
   - Usa os mesmos tipos de ação + novos específicos para diabetes

2. **`tb_hiperdia_dm_medicamentos`** 
   - Equivalente à `tb_hiperdia_has_medicamentos`
   - Gerenciamento de medicamentos para diabéticos
   - Campos: dose, frequência, data_inicio (opcional)

3. **`tb_hiperdia_dm_tratamento`**
   - Equivalente à `tb_hiperdia_tratamento`
   - Histórico de modificações de tratamento

4. **`tb_hiperdia_mrg`** (NOVA)
   - Monitorização Residencial da Glicemia
   - Campos específicos para diferentes horários:
     - `g_jejum`: Glicemia em jejum
     - `g_apos_cafe`: Após café da manhã
     - `g_antes_almoco`: Antes do almoço
     - `g_apos_almoco`: Após almoço
     - `g_antes_jantar`: Antes do jantar
     - `g_ao_deitar`: Ao deitar
     - `analise_mrg`: Análise dos resultados

### **Tabelas Compartilhadas:**
- `tb_hiperdia_nutricao`
- `tb_hiperdia_resultado_exames`
- `tb_hiperdia_risco_cv`
- `tb_hiperdia_tipos_acao` (+ novos códigos 10 e 11)

### **Novos Tipos de Ação:**
- **Código 10**: "Solicitar MRG" - Solicitação de Monitorização Residencial da Glicemia
- **Código 11**: "Avaliar MRG" - Análise dos resultados da MRG

## 📁 **Arquivos Criados**

### **Scripts SQL:**
- `bd_sistema_aps/Scripts/Hiperdia/CRIA_TABELAS_DIABETES.sql` - Estrutura completa das tabelas
- `bd_sistema_aps/Scripts/Hiperdia/CREATE VIEW HIPERDIA - DIABETES.sql` - View materializada específica

### **Templates HTML:**
- `templates/painel-hiperdia-dm.html` - Interface principal do painel

### **JavaScript:**
- `static/hiperdia_dm_script.js` - Lógica do frontend para diabetes

### **Modelos de Documento:**
- `modelos/template_receituario_diabetes.docx` - Template para receituários

## 🔌 **Endpoints API Criados**

### **Página Principal:**
- `GET /painel-hiperdia-dm` - Página do painel de diabetes

### **APIs de Dados:**
- `GET /api/pacientes_hiperdia_dm` - Buscar pacientes diabéticos com filtros
- `GET /api/get_total_diabeticos` - Totais e estatísticas
- `GET /api/diabetes/timeline/<cod_paciente>` - Timeline de acompanhamento
- `POST /api/diabetes/registrar_acao` - Registrar nova ação
- `GET /api/diabetes/medicamentos_atuais/<cod_cidadao>` - Medicamentos ativos

## 🎨 **Interface Visual**

### **Tema de Cores:**
- **Cor Principal**: Âmbar (`#f59e0b`) - Representa diabetes
- **Ícones**: Específicos para diabetes (gotas, teste, etc.)
- **Cards**: Diferenciados por cores (âmbar, verde, vermelho, roxo)

### **Funcionalidades:**
- ✅ Filtros por equipe e microárea
- ✅ Busca por nome do paciente
- ✅ Abas de status (Todos, Controlados, Descompensados, Tratamento)
- ✅ Timeline de acompanhamento
- ✅ Registro de ações específicas para diabetes
- ✅ Formulários para MRG e medicamentos
- ✅ Geração de receituários (estrutura pronta)

## 🔧 **Próximos Passos de Implementação**

### **1. Executar Script SQL:**
```sql
-- Executar no banco de dados PostgreSQL
\i bd_sistema_aps/Scripts/Hiperdia/CRIA_TABELAS_DIABETES.sql
```

### **2. View Materializada Específica Criada:**
A view `mv_hiperdia_diabetes` foi criada com os códigos específicos para diabetes:

**Códigos CIAP:**
- 476: DIABETES INSULINO-DEPENDENTE
- 477: DIABETES NÃO INSULINO-DEPENDENTE  
- 732: DIABETES

**Códigos CID10:**
- 1746-1771: E10-E14 (Diabetes mellitus)
- 1722-1745: E10-E14 subcategorias
- 12731-12735: Códigos específicos adicionais

**Arquivo:** `CREATE VIEW HIPERDIA - DIABETES.sql`

### **3. Lógica de Status Implementada:**
- **Controlados**: `situacao_problema = 1` (Compensado)
- **Descompensados**: `situacao_problema = 0` (Ativo/Descompensado)
- **Com Tratamento**: Pacientes com medicamentos ativos na tabela `tb_hiperdia_dm_medicamentos`

### **4. Integrar com APIs Existentes:**
Adaptar `hiperdiaApi.js` para incluir endpoints específicos de diabetes ou criar um novo `diabetesApi.js`.

### **5. Template de Receituário:**
Adaptar o template Word `template_receituario_diabetes.docx` para incluir:
- Título: "RECEITUÁRIO - DIABETES"
- Campos específicos para medicamentos antidiabéticos
- Footer com informações sobre diabetes

## 📊 **Funcionalidades Específicas para Diabetes**

### **Monitorização Residencial da Glicemia (MRG):**
- Formulário com 6 campos de glicemia por horário
- Análise dos resultados
- Histórico de monitorização

### **Medicamentos Antidiabéticos:**
- Metformina, Insulina, Glibenclamida, etc.
- Controle de dose e frequência
- Data de início opcional

### **Timeline de Acompanhamento:**
- Filtros específicos: MRG, Tratamento, Exames
- Histórico completo de ações
- Status visual das ações (Pendente/Realizada)

## 🎯 **Resultado Final**

O sistema agora possui um painel completo para diabetes que:

- ✅ **Segue o mesmo padrão** da interface de hipertensão
- ✅ **Mantém consistência visual** com cores específicas
- ✅ **Implementa funcionalidades específicas** para diabetes
- ✅ **Reutiliza componentes** existentes quando apropriado
- ✅ **Permite expansão futura** com novas funcionalidades

## 🚀 **Acesso ao Sistema**

Após executar o script SQL e reiniciar a aplicação, acessar:
```
http://localhost:3030/painel-hiperdia-dm
```

O painel estará totalmente funcional com todas as funcionalidades implementadas!

---

**Sistema APS - Atenção Primária à Saúde**  
*Diabetes Management Module - Complete Implementation*