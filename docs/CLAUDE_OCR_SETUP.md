# Configuração do Claude OCR para Leitura de Manuscritos

## Visão Geral

O sistema agora usa a **API do Claude (Anthropic)** com visão multimodal para extrair valores de pressão arterial de imagens manuscritas. Esta solução é **muito superior** ao Tesseract OCR tradicional para textos escritos à mão.

## Por Que Claude OCR?

### Tesseract OCR (tradicional)
- ❌ Projetado para texto impresso
- ❌ Baixa precisão em manuscritos
- ❌ Mesmo com pré-processamento avançado, falha em caligrafia irregular
- ✅ Gratuito e offline

### Claude API com Visão Multimodal
- ✅ **Excelente precisão** em textos manuscritos
- ✅ Entende contexto (formulários médicos, tabelas)
- ✅ Pode interpretar letras ambíguas usando contexto
- ✅ Retorna dados estruturados (JSON)
- ❌ Pago (mas custo muito baixo)
- ❌ Requer internet

## Custos da API Claude

**Modelo usado**: `claude-3-5-sonnet-20241022`

**Preços** (outubro 2024):
- **Input**: $3.00 / milhão de tokens (~$0.015 por imagem)
- **Output**: $15.00 / milhão de tokens (~$0.003 por imagem)
- **Custo total por imagem**: ~$0.018 (menos de 2 centavos USD)

**Exemplo prático**:
- 100 imagens processadas = ~$1.80 USD
- 1000 imagens processadas = ~$18.00 USD

## Passo a Passo de Configuração

### 1. Criar Conta Anthropic

1. Acesse: https://console.anthropic.com/
2. Clique em **"Sign Up"**
3. Crie uma conta com email ou Google
4. Confirme seu email

### 2. Adicionar Créditos

1. No console Anthropic, vá em **"Settings" > "Billing"**
2. Adicione um método de pagamento
3. Adicione créditos (mínimo $5 USD recomendado)
4. Você receberá créditos gratuitos iniciais para testar

### 3. Gerar API Key

1. No console, vá em **"API Keys"**
2. Clique em **"Create Key"**
3. Dê um nome (ex: "Sistema APS - OCR")
4. **COPIE A CHAVE** (formato: `sk-ant-api03-...`)
5. ⚠️ **IMPORTANTE**: Salve em local seguro, não será mostrada novamente

### 4. Configurar no Sistema

#### Opção A: Variável de Ambiente (Recomendado)

**Windows (PowerShell):**
```powershell
# Temporário (apenas para sessão atual)
$env:ANTHROPIC_API_KEY="sk-ant-api03-sua-chave-aqui"

# Permanente (para usuário)
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'sk-ant-api03-sua-chave-aqui', 'User')
```

**Windows (CMD):**
```cmd
set ANTHROPIC_API_KEY=sk-ant-api03-sua-chave-aqui
```

**Linux/Mac:**
```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-api03-sua-chave-aqui"

# Recarregar
source ~/.bashrc
```

#### Opção B: Arquivo .env

1. Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite `.env` e adicione sua chave:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-sua-chave-aqui
   ```

3. Instale python-dotenv:
   ```bash
   pip install python-dotenv
   ```

4. Adicione no início de `app.py`:
   ```python
   from dotenv import load_dotenv
   load_dotenv()
   ```

#### Opção C: Hardcoded (NÃO recomendado para produção)

Edite `app.py` linha 29:
```python
ANTHROPIC_API_KEY = "sk-ant-api03-sua-chave-aqui"
```

⚠️ **NUNCA** commit a chave no Git!

### 5. Instalar Dependências

```bash
pip install anthropic
```

### 6. Reiniciar Servidor Flask

```bash
python app.py
```

## Como Funciona

### Fluxo de Processamento

```
1. Profissional carrega foto do formulário manuscrito
   ↓
2. Frontend envia imagem em base64 para backend
   ↓
3. Backend verifica se ANTHROPIC_API_KEY está configurada
   ↓
4a. SE configurada → Usa Claude API (visão multimodal)
    - Envia imagem + prompt estruturado
    - Claude analisa formulário e extrai valores
    - Retorna JSON com 6 medições
   ↓
4b. SE NÃO configurada → Fallback para Tesseract OCR
    - Pré-processamento com OpenCV
    - OCR tradicional (menor precisão)
   ↓
5. Sistema valida valores extraídos
   ↓
6. Profissional revisa e confirma valores
```

### Exemplo de Request/Response

**Request para Claude API:**
```python
{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "data": "..."}},
                {"type": "text", "text": "Extraia valores de PA..."}
            ]
        }
    ]
}
```

**Response do Claude:**
```json
{
    "manha1": {"pas": 150, "pad": 80},
    "manha2": {"pas": 148, "pad": 80},
    "manha3": {"pas": 160, "pad": 90},
    "noite1": {"pas": 142, "pad": 90},
    "noite2": {"pas": 132, "pad": 90},
    "noite3": {"pas": 140, "pad": 90}
}
```

## Validação de Valores

O sistema valida automaticamente:
- ✅ PAS entre 50-300 mmHg
- ✅ PAD entre 30-200 mmHg
- ✅ PAD < PAS (diastólica menor que sistólica)
- ❌ Valores inválidos são descartados

## Logs e Debugging

O sistema imprime logs detalhados no console:

```
Tentando OCR com Claude API (visão multimodal)...
Resposta bruta do Claude: {"manha1": {"pas": 150, "pad": 80}, ...}
Claude API retornou: {'manha1': {'pas': 150, 'pad': 80}, ...}
```

Se Claude falhar:
```
Erro ao usar Claude API: ANTHROPIC_API_KEY não configurada
Tentando fallback com Tesseract OCR...
Usando Tesseract OCR...
```

## Testando a Configuração

### Teste 1: Verificar API Key

```python
# No console Python
import os
print(os.environ.get('ANTHROPIC_API_KEY'))
# Deve mostrar: sk-ant-api03-...
```

### Teste 2: Testar Conexão

```python
from anthropic import Anthropic
client = Anthropic(api_key="sua-chave-aqui")
print("API configurada com sucesso!")
```

### Teste 3: Processar Imagem Real

1. Acesse: http://localhost:3030/painel-rastreamento-cardiovascular
2. Navegue até Step 4 (MAPA)
3. Clique em "📷 Enviar Foto"
4. Selecione uma foto de formulário manuscrito
5. Verifique console do servidor:
   - "Tentando OCR com Claude API..." = ✅ Configurado
   - "Usando Tesseract OCR..." = ❌ API key não encontrada

## Troubleshooting

### Erro: "ANTHROPIC_API_KEY não configurada"

**Causa**: Variável de ambiente não foi definida

**Solução**:
1. Defina variável de ambiente (veja seção 4)
2. Reinicie servidor Flask
3. Verifique com `echo $ANTHROPIC_API_KEY` (Linux/Mac) ou `echo %ANTHROPIC_API_KEY%` (Windows)

### Erro: "Authentication failed"

**Causa**: API key inválida ou expirada

**Solução**:
1. Verifique se copiou a chave completa
2. Gere nova chave no console Anthropic
3. Atualize variável de ambiente

### Erro: "Insufficient credits"

**Causa**: Créditos da conta esgotados

**Solução**:
1. Acesse console Anthropic > Billing
2. Adicione créditos à conta

### Claude retorna valores vazios

**Causa**: Imagem de má qualidade ou ilegível

**Solução**:
1. Tire foto com melhor iluminação
2. Foque bem os números
3. Use papel plano (sem dobras)
4. Profissional pode editar manualmente valores na interface

## Segurança

### ⚠️ NUNCA:
- ❌ Commit API key no Git
- ❌ Compartilhe sua chave
- ❌ Use em código frontend (JavaScript)
- ❌ Exponha em logs públicos

### ✅ SEMPRE:
- ✅ Use variáveis de ambiente
- ✅ Adicione `.env` ao `.gitignore`
- ✅ Rotacione chaves periodicamente
- ✅ Use chaves diferentes para dev/prod

## Alternativas Gratuitas (Futuro)

Se custo for problema, considerar:
- **EasyOCR** (open-source, usa deep learning)
- **TrOCR** (Transformers-based OCR)
- **PaddleOCR** (suporta manuscrito)

Porém, nenhuma dessas terá a mesma precisão que Claude para manuscritos médicos.

## Suporte

Dúvidas sobre:
- **API Claude**: https://docs.anthropic.com/
- **Preços**: https://www.anthropic.com/pricing
- **Sistema APS**: Consulte documentação interna

---

**Última atualização**: Outubro 2025
**Versão do Claude**: 3.5 Sonnet (20241022)
