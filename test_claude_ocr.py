"""
Script de teste para validar OCR com Claude API
Usa a imagem de exemplo de MAPA para testar extração de valores

Uso:
    python test_claude_ocr.py
"""

import os
import sys
import base64
import json
from anthropic import Anthropic

# Caminho da imagem de teste
IMAGEM_TESTE = "WhatsApp Image 2025-10-18 at 10.03.23.jpeg"

def carregar_imagem_base64(caminho_imagem):
    """Carrega imagem e converte para base64"""
    with open(caminho_imagem, 'rb') as f:
        imagem_bytes = f.read()
    return base64.b64encode(imagem_bytes).decode('utf-8')

def testar_claude_ocr():
    """Testa extração de valores de PA usando Claude API"""

    print("="*80)
    print("TESTE DE OCR COM CLAUDE API")
    print("="*80)
    print()

    # Verificar API key
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ ERRO: ANTHROPIC_API_KEY não configurada!")
        print()
        print("Configure a API key primeiro:")
        print("  Windows: set ANTHROPIC_API_KEY=sk-ant-...")
        print("  Linux/Mac: export ANTHROPIC_API_KEY=sk-ant-...")
        print()
        return

    print(f"✅ API Key encontrada: {api_key[:20]}...")
    print()

    # Carregar imagem
    if not os.path.exists(IMAGEM_TESTE):
        print(f"❌ ERRO: Imagem não encontrada: {IMAGEM_TESTE}")
        return

    print(f"📷 Carregando imagem: {IMAGEM_TESTE}")
    imagem_base64 = carregar_imagem_base64(IMAGEM_TESTE)
    print(f"✅ Imagem carregada ({len(imagem_base64)} bytes em base64)")
    print()

    # Criar cliente
    print("🔌 Conectando com Claude API...")
    client = Anthropic(api_key=api_key)
    print("✅ Cliente criado com sucesso")
    print()

    # Prompt
    prompt = """Analise esta imagem de um formulário de Monitoramento Residencial de Pressão Arterial (MAPA/MRPA).

Extraia TODOS os valores de pressão arterial escritos à mão na tabela. A tabela tem:
- Coluna "ANTES DO CAFÉ DA MANHÃ (EM JEJUM)": com 3 medidas (1ª, 2ª, 3ª)
- Coluna "ANTES DO JANTAR (EM JEJUM)": com 3 medidas (1ª, 2ª, 3ª)

Os valores estão no formato "XXXxYY" ou "XXX×YY" onde:
- XXX = Pressão Arterial Sistólica (PAS)
- YY = Pressão Arterial Diastólica (PAD)

IMPORTANTE:
- Leia TODAS as linhas da tabela (geralmente 5 dias)
- Retorne APENAS valores do PRIMEIRO DIA (primeira linha de medições após o cabeçalho)
- Se um valor estiver ilegível ou faltando, use null

Retorne APENAS um JSON válido no seguinte formato (sem texto adicional):
{
    "manha1": {"pas": 150, "pad": 80},
    "manha2": {"pas": 148, "pad": 80},
    "manha3": {"pas": 160, "pad": 90},
    "noite1": {"pas": 142, "pad": 90},
    "noite2": {"pas": 132, "pad": 90},
    "noite3": {"pas": 140, "pad": 90}
}"""

    print("🤖 Enviando imagem para Claude...")
    print()

    try:
        # Chamar API
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": imagem_base64,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ],
                }
            ],
        )

        # Extrair resposta
        resposta_texto = message.content[0].text
        print("📥 RESPOSTA DO CLAUDE:")
        print("-"*80)
        print(resposta_texto)
        print("-"*80)
        print()

        # Parse JSON
        resposta_limpa = resposta_texto.strip()
        if '```json' in resposta_limpa:
            resposta_limpa = resposta_limpa.split('```json')[1].split('```')[0].strip()
        elif '```' in resposta_limpa:
            resposta_limpa = resposta_limpa.split('```')[1].split('```')[0].strip()

        valores = json.loads(resposta_limpa)

        print("✅ JSON PARSEADO COM SUCESSO:")
        print("-"*80)
        print(json.dumps(valores, indent=2, ensure_ascii=False))
        print("-"*80)
        print()

        # Validar valores
        print("🔍 VALIDAÇÃO DOS VALORES:")
        print()

        keys = ['manha1', 'manha2', 'manha3', 'noite1', 'noite2', 'noite3']
        labels = {
            'manha1': '☀️ Manhã - 1ª medida',
            'manha2': '☀️ Manhã - 2ª medida',
            'manha3': '☀️ Manhã - 3ª medida',
            'noite1': '🌙 Noite - 1ª medida',
            'noite2': '🌙 Noite - 2ª medida',
            'noite3': '🌙 Noite - 3ª medida',
        }

        total_validos = 0
        total_invalidos = 0

        for key in keys:
            label = labels[key]
            if key in valores and valores[key]:
                pas = valores[key].get('pas')
                pad = valores[key].get('pad')

                if pas and pad:
                    # Validar
                    valido = True
                    erros = []

                    if not (50 <= pas <= 300):
                        valido = False
                        erros.append(f"PAS fora do range (50-300)")

                    if not (30 <= pad <= 200):
                        valido = False
                        erros.append(f"PAD fora do range (30-200)")

                    if pad >= pas:
                        valido = False
                        erros.append(f"PAD >= PAS")

                    if valido:
                        print(f"  ✅ {label}: {pas}×{pad} mmHg")
                        total_validos += 1
                    else:
                        print(f"  ❌ {label}: {pas}×{pad} mmHg - INVÁLIDO ({', '.join(erros)})")
                        total_invalidos += 1
                else:
                    print(f"  ⚠️  {label}: Não extraído")
                    total_invalidos += 1
            else:
                print(f"  ⚠️  {label}: Não encontrado")
                total_invalidos += 1

        print()
        print("="*80)
        print("RESUMO:")
        print(f"  ✅ Valores válidos: {total_validos}/6")
        print(f"  ❌ Valores inválidos ou faltando: {total_invalidos}/6")

        if total_validos == 6:
            print()
            print("🎉 SUCESSO TOTAL! Todos os 6 valores foram extraídos corretamente!")
        elif total_validos >= 4:
            print()
            print("✅ Bom resultado! Maioria dos valores foi extraída.")
        else:
            print()
            print("⚠️  Resultado parcial. Considere melhorar qualidade da imagem.")

        print("="*80)

        # Informações de uso
        print()
        print("📊 USO DA API:")
        print(f"  Tokens de entrada: {message.usage.input_tokens}")
        print(f"  Tokens de saída: {message.usage.output_tokens}")
        print(f"  Custo estimado: ~${(message.usage.input_tokens * 0.003 + message.usage.output_tokens * 0.015) / 1000:.4f} USD")
        print()

    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return

if __name__ == '__main__':
    testar_claude_ocr()
