#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Reverter cor do card Em Triagem de cinza para azul"""

# Ler o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Reverter as cores de cinza para azul (apenas nas linhas do card Em Triagem)
# Precisamos ser específicos para não alterar outros elementos

# Encontrar e substituir a seção do card Em Triagem
import re

# Padrão para encontrar o card Em Triagem
pattern_card = r'(<!-- 2\. Em Triagem -->.*?<div class="bg-white rounded-lg shadow-sm p-3 text-center cursor-pointer hover:shadow-md transition-shadow border-b-4 )border-gray-700(".*?onclick="selecionarAba\(\'em-triagem\'\)">.*?<div class="text-2xl font-bold )text-gray-700(" id="count-em-triagem">0</div>.*?<div class="text-\[10px\] )text-gray-700( mt-1 font-semibold leading-tight">Em Triagem</div>.*?</div>)'

replacement = r'\1border-blue-500\2\3text-blue-600\4\5text-blue-600\6'

conteudo_novo = re.sub(pattern_card, replacement, conteudo, flags=re.DOTALL)

# Se o regex não funcionar, fazer substituição manual mais segura
if conteudo_novo == conteudo:
    # Buscar especificamente a linha do card Em Triagem
    lines = conteudo.split('\n')
    for i, line in enumerate(lines):
        if '<!-- 2. Em Triagem -->' in line:
            # Próximas 5 linhas são do card Em Triagem
            for j in range(i, min(i+6, len(lines))):
                if 'border-gray-700' in lines[j] and 'em-triagem' in lines[j]:
                    lines[j] = lines[j].replace('border-gray-700', 'border-blue-500')
                if 'text-gray-700' in lines[j] and ('count-em-triagem' in lines[j] or 'Em Triagem' in lines[j]):
                    lines[j] = lines[j].replace('text-gray-700', 'text-blue-600')
            break
    conteudo_novo = '\n'.join(lines)

# Escrever o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'w', encoding='utf-8') as f:
    f.write(conteudo_novo)

print("Cor do card 'Em Triagem' revertida com sucesso!")
print("  - border-gray-700 -> border-blue-500")
print("  - text-gray-700 -> text-blue-600")
