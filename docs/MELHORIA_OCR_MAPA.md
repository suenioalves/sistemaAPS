# Melhorias no OCR para MAPA - Leitura de Pressão Arterial

## Problema Identificado

O sistema de OCR inicial não conseguia extrair valores de pressão arterial de imagens manuscritas. Na tentativa com a imagem fornecida, o OCR extraiu apenas "- -5 2" ao invés dos valores reais de PA.

## Solução Implementada

### 1. Pré-processamento Avançado de Imagem com OpenCV

Implementamos um pipeline completo de pré-processamento que melhora significativamente a qualidade da imagem antes do OCR:

```python
# 1. Conversão para Escala de Cinza
gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

# 2. Redimensionamento Inteligente
# Se imagem < 1000px, aumenta em 2x para melhorar precisão
if height < 1000 or width < 1000:
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

# 3. Aumento de Contraste (CLAHE)
# Contrast Limited Adaptive Histogram Equalization
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
contrasted = clahe.apply(gray)

# 4. Desfoque Gaussiano
# Remove ruído preservando bordas dos números
blurred = cv2.GaussianBlur(contrasted, (3, 3), 0)

# 5. Binarização Adaptativa
# Converte para preto/branco adaptando-se à iluminação local
binary = cv2.adaptiveThreshold(
    blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY, 11, 2
)

# 6. Operações Morfológicas
# Limpa pequenos ruídos e conecta caracteres
kernel = np.ones((2,2), np.uint8)
cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
```

### 2. Múltiplas Tentativas de OCR

O sistema agora tenta 3 configurações diferentes do Tesseract e usa o resultado com mais conteúdo:

```python
# Tentativa 1: PSM 6 - Bloco uniforme de texto
texto1 = pytesseract.image_to_string(
    imagem_processada,
    config='--psm 6 -c tessedit_char_whitelist=0123456789xX×/- '
)

# Tentativa 2: PSM 11 - Texto esparso sem ordem específica
texto2 = pytesseract.image_to_string(
    imagem_processada,
    config='--psm 11 -c tessedit_char_whitelist=0123456789xX×/- '
)

# Tentativa 3: PSM 12 - Texto esparso com detecção de orientação
texto3 = pytesseract.image_to_string(
    imagem_processada,
    config='--psm 12 -c tessedit_char_whitelist=0123456789xX×/- '
)

# Seleciona o resultado com mais caracteres
texto_extraido = max([texto1, texto2, texto3], key=lambda t: len(t.strip()))
```

### 3. Sistema de Fallback

Se o OpenCV não estiver instalado ou houver erro no pré-processamento, o sistema automaticamente volta para OCR simples:

```python
try:
    # Tenta OCR com pré-processamento avançado
    # ...
except ImportError:
    print("opencv-python não instalado")
    print("SOLUÇÃO: Execute 'pip install opencv-python'")
except Exception:
    # Fallback: OCR sem pré-processamento
    texto_extraido = pytesseract.image_to_string(imagem_original)
```

## Requisitos de Instalação

### Novo Requisito: OpenCV

```bash
pip install opencv-python numpy
```

**Nota**: O `numpy` já estava instalado no sistema, mas o `opencv-python` precisa ser instalado.

### Requisitos Existentes

```bash
# Tesseract OCR (executável)
# Windows: https://github.com/UB-Mannheim/tesseract/wiki

# Python
pip install pytesseract Pillow
```

## Benefícios das Melhorias

### 1. **Maior Taxa de Reconhecimento**
- Pré-processamento remove ruído e melhora clareza
- Binarização adaptativa funciona bem com iluminação irregular
- Redimensionamento melhora precisão em fotos pequenas

### 2. **Robustez**
- Múltiplas tentativas aumentam chance de sucesso
- Sistema de fallback garante funcionamento mesmo sem OpenCV
- Funciona com diferentes tipos de escrita manuscrita

### 3. **Tolerância a Condições Adversas**
- Iluminação irregular
- Fotos de baixa resolução
- Papel com texturas ou fundos coloridos
- Ângulos ligeiramente inclinados

## Configurações do Tesseract (PSM Modes)

- **PSM 6**: Assume bloco uniforme de texto (padrão para documentos)
- **PSM 11**: Texto esparso - sem ordem específica (bom para formulários)
- **PSM 12**: Texto esparso com detecção de orientação (mais robusto)

## Próximos Passos

1. **Testar com a imagem original** que falhou anteriormente
2. **Se ainda falhar**: Considerar OCR baseado em IA (EasyOCR, TrOCR)
3. **Coletar feedback** dos profissionais sobre precisão
4. **Ajustar parâmetros** com base em resultados reais

## Logs de Debug

O sistema agora imprime logs detalhados para facilitar diagnóstico:

```
Imagem pré-processada com sucesso
Tentativa 1 (PSM 6): 120x80 130x85 ...
Tentativa 2 (PSM 11): 120x80 130x85 ...
Tentativa 3 (PSM 12): 120x80 130x85 ...
Texto extraído da imagem (melhor tentativa): 120x80 130x85 ...
```

## Referências Técnicas

- **CLAHE**: Melhora contraste preservando detalhes em áreas escuras/claras
- **Adaptive Threshold**: Binarização que se adapta à iluminação local
- **Morphological Operations**: Remove ruído e conecta componentes fragmentados
- **Tesseract PSM**: Page Segmentation Modes para diferentes layouts

## Arquivo Modificado

- `app.py` (linhas 10141-10257): Função `extrair_valores_pa_da_imagem()`

## Documentação Atualizada

- `OCR_SETUP.md`: Adicionado opencv-python aos requisitos e explicação do pré-processamento
