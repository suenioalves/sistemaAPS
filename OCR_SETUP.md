# Setup OCR para Leitura de Imagens - MAPA

## Instalação do Tesseract OCR

### Windows:

1. **Baixar Tesseract:**
   - Acesse: https://github.com/UB-Mannheim/tesseract/wiki
   - Baixe o instalador: `tesseract-ocr-w64-setup-5.3.3.exe`
   - Execute e instale (geralmente em `C:\Program Files\Tesseract-OCR`)

2. **Adicionar ao PATH:**
   - Adicione `C:\Program Files\Tesseract-OCR` às variáveis de ambiente
   - Ou configure no código:
   ```python
   import pytesseract
   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
   ```

3. **Instalar bibliotecas Python:**
   ```bash
   pip install pytesseract Pillow opencv-python numpy
   ```

   **Nota**: O `opencv-python` é necessário para o pré-processamento de imagem que melhora significativamente a precisão do OCR em textos manuscritos.

### Linux/Mac:

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# Mac
brew install tesseract

# Python
pip install pytesseract Pillow opencv-python numpy
```

## Como Funciona

1. **Upload de Imagem:**
   - Profissional clica em "📷 Enviar Foto"
   - Seleciona foto do papel com medições escritas à mão
   - Pode usar câmera do celular diretamente

2. **Processamento OCR:**
   - **Pré-processamento da imagem** com OpenCV para melhorar precisão:
     - Conversão para escala de cinza
     - Redimensionamento se imagem pequena (< 1000px)
     - Aumento de contraste com CLAHE
     - Desfoque gaussiano para reduzir ruído
     - Binarização adaptativa para texto mais nítido
     - Operações morfológicas para limpeza
   - **OCR com múltiplas tentativas** usando diferentes configurações do Tesseract
   - Backend extrai texto da imagem e busca padrões de PA: `120x80`, `12x8`, `120/80`, etc.
   - Normaliza valores abreviados: `12x8` → `120x80`

3. **Revisão:**
   - Sistema mostra valores extraídos em tabela editável
   - Profissional pode corrigir valores errados
   - Campos em verde: valores detectados
   - Campos em amarelo: não detectados (preencher manualmente)

4. **Confirmação:**
   - Profissional clica "Confirmar Valores"
   - Valores são transferidos para o formulário MAPA
   - Profissional revisa e clica "SALVAR DIA"

## Formatos Suportados

O sistema reconhece estes formatos de escrita:
- `120x80`
- `120×80`
- `120/80`
- `120 x 80`
- `120 80`
- `12x8` (normalizado para 120x80)
- `13x9` (normalizado para 130x90)

## Dicas para Melhor Reconhecimento

1. **Iluminação**: Foto com boa iluminação natural ou artificial
2. **Papel**: Papel plano (sem dobras ou vincos)
3. **Ângulo**: Câmera perpendicular ao papel (evitar perspectiva)
4. **Foco**: Foco nítido nos números (não borrado)
5. **Legibilidade**: Letras grandes e legíveis
6. **Contraste**: Tinta escura em papel claro funciona melhor
7. **Resolução**: Fotos em alta resolução (o sistema redimensiona automaticamente se necessário)

**Nota**: O sistema agora inclui pré-processamento avançado de imagem que melhora significativamente a taxa de reconhecimento, mesmo com fotos de qualidade moderada.

## Fallback

Se OCR não estiver disponível ou falhar:
- Sistema mostra mensagem de erro
- Profissional pode preencher manualmente
- Todos os campos continuam funcionando normalmente
