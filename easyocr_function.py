"""
Função de extração de valores de PA usando EasyOCR
Será integrada ao app.py após testes
"""

import re
import json
from PIL import Image
import io
import cv2
import numpy as np


def extrair_valores_pa_com_easyocr(imagem_bytes):
    """
    Extrai valores de pressão arterial usando EasyOCR (gratuito, deep learning)
    Melhor que Tesseract para manuscritos

    Args:
        imagem_bytes: bytes da imagem

    Returns:
        dict com valores para 6 medições:
        {
            'manha1': {'pas': 150, 'pad': 80},
            'manha2': {'pas': 148, 'pad': 80},
            ...
        }
    """
    try:
        import easyocr

        print("Inicializando EasyOCR...")

        # Criar reader (português + inglês para números)
        # gpu=False para usar CPU (mais lento mas funciona em qualquer máquina)
        reader = easyocr.Reader(['pt', 'en'], gpu=False)

        # Converter bytes para imagem PIL
        imagem_pil = Image.open(io.BytesIO(imagem_bytes))

        # Converter PIL para numpy array (formato OpenCV)
        img_array = np.array(imagem_pil)

        # Pré-processamento para melhorar OCR
        if len(img_array.shape) == 2:
            gray = img_array
        elif img_array.shape[2] == 4:  # RGBA
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGBA2GRAY)
        else:  # RGB
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

        # Aumentar contraste
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrasted = clahe.apply(gray)

        # Binarização
        _, binary = cv2.threshold(contrasted, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        print("Executando OCR com EasyOCR...")

        # Executar OCR
        # result é lista de tuplas: (bbox, texto, confiança)
        results = reader.readtext(binary)

        print(f"EasyOCR encontrou {len(results)} regiões de texto")

        # Extrair todo o texto
        textos = []
        for (bbox, texto, confianca) in results:
            print(f"  - '{texto}' (confiança: {confianca:.2f})")
            textos.append(texto)

        # Juntar todo o texto
        texto_completo = ' '.join(textos)
        print(f"Texto completo extraído: {texto_completo}")

        # Padrões para detectar valores de PA
        # Exemplos: 120x80, 12x8, 120/80, 120 x 80, 120 80
        padroes = [
            r'(\d{2,3})\s*[x×X/]\s*(\d{2,3})',  # 120x80, 120×80, 120/80
            r'(\d{1,2})\s*[x×X/]\s*(\d{1,2})(?!\d)',  # 12x8 (abreviado)
            r'(\d{2,3})\s+(\d{2,3})'  # 120 80 (separado por espaço)
        ]

        # Encontrar todos os valores de PA no texto
        valores_encontrados = []
        for padrao in padroes:
            matches = re.findall(padrao, texto_completo)
            for pas_str, pad_str in matches:
                pas, pad = normalizar_valor_pa(pas_str, pad_str)
                if pas and pad:
                    valores_encontrados.append({'pas': pas, 'pad': pad})
                    print(f"  ✓ Valor PA encontrado: {pas}×{pad}")

        print(f"Total de valores PA válidos encontrados: {len(valores_encontrados)}")

        # Distribuir valores encontrados nas 6 posições (3 manhã + 3 noite)
        keys = ['manha1', 'manha2', 'manha3', 'noite1', 'noite2', 'noite3']
        resultado = {}

        for i, key in enumerate(keys):
            if i < len(valores_encontrados):
                resultado[key] = valores_encontrados[i]
            else:
                resultado[key] = {}

        return resultado

    except Exception as e:
        print(f"Erro ao usar EasyOCR: {str(e)}")
        import traceback
        traceback.print_exc()
        # Retornar estrutura vazia em caso de erro
        return {
            'manha1': {}, 'manha2': {}, 'manha3': {},
            'noite1': {}, 'noite2': {}, 'noite3': {}
        }


def normalizar_valor_pa(pas_str, pad_str):
    """
    Normaliza valores de PA
    Exemplos:
    - 12, 8 -> 120, 80
    - 120, 80 -> 120, 80
    - 13, 9 -> 130, 90
    """
    try:
        pas = int(pas_str)
        pad = int(pad_str)

        # Se valores estão abreviados (12x8), multiplicar por 10
        if pas < 20 and pad < 20:
            pas *= 10
            pad *= 10

        # Validar limites
        if not (50 <= pas <= 300 and 30 <= pad <= 200):
            return None, None

        # Validar que PAD < PAS
        if pad >= pas:
            return None, None

        return pas, pad
    except (ValueError, TypeError):
        return None, None


# Teste rápido
if __name__ == '__main__':
    print("Testando EasyOCR com imagem de exemplo...")

    # Carregar imagem de teste
    imagem_path = "WhatsApp Image 2025-10-18 at 10.03.23.jpeg"

    with open(imagem_path, 'rb') as f:
        imagem_bytes = f.read()

    print(f"\nProcessando {imagem_path}...")
    print("="*80)

    valores = extrair_valores_pa_com_easyocr(imagem_bytes)

    print("\n" + "="*80)
    print("RESULTADO:")
    print(json.dumps(valores, indent=2))
    print("="*80)

    # Contar válidos
    total_validos = sum(1 for v in valores.values() if v and 'pas' in v)
    print(f"\n✓ {total_validos}/6 valores extraídos com sucesso")
