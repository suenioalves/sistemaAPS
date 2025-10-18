"""
Teste simples do EasyOCR sem Unicode problemático
"""
import sys
import os

# Forçar encoding UTF-8 no Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

import easyocr
import cv2
import numpy as np
from PIL import Image

print("Testando EasyOCR...")
print("="*80)

# Carregar imagem
imagem_path = "WhatsApp Image 2025-10-18 at 10.03.23.jpeg"
print(f"Carregando: {imagem_path}")

# Criar reader (primeira vez baixa modelos ~100MB)
print("Inicializando EasyOCR (pode demorar na primeira vez)...")
reader = easyocr.Reader(['pt', 'en'], gpu=False, verbose=False)
print("EasyOCR inicializado!")

# Ler imagem
img = cv2.imread(imagem_path)

# Converter para escala de cinza
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Aplicar OCR
print("\nExecutando OCR...")
results = reader.readtext(gray)

print(f"\nEasyOCR encontrou {len(results)} regioes de texto:\n")

# Mostrar resultados
for i, (bbox, texto, conf) in enumerate(results, 1):
    print(f"{i}. '{texto}' (confianca: {conf:.2f})")

# Buscar valores de PA
import re

texto_completo = ' '.join([text for (_, text, _) in results])
print(f"\nTexto completo: {texto_completo}")

# Padrões de PA
padroes = [
    r'(\d{2,3})\s*[x×X/]\s*(\d{2,3})',  # 120x80
    r'(\d{1,2})\s*[x×X/]\s*(\d{1,2})(?!\d)',  # 12x8
]

valores_pa = []
for padrao in padroes:
    matches = re.findall(padrao, texto_completo)
    for pas_str, pad_str in matches:
        try:
            pas = int(pas_str)
            pad = int(pad_str)

            # Normalizar abreviados
            if pas < 20 and pad < 20:
                pas *= 10
                pad *= 10

            # Validar
            if 50 <= pas <= 300 and 30 <= pad <= 200 and pad < pas:
                valores_pa.append(f"{pas}x{pad}")
        except:
            pass

print(f"\nValores de PA encontrados: {len(valores_pa)}")
for i, val in enumerate(valores_pa, 1):
    print(f"  {i}. {val}")

print("\n" + "="*80)
print(f"RESULTADO: {len(valores_pa)}/6 valores extraidos")
