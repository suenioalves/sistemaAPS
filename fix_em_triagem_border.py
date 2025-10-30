#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Mudar a borda inferior do card Em Triagem de cinza para azul"""

# Ler o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar e alterar apenas a linha da borda do card Em Triagem
for i, line in enumerate(lines):
    if '<!-- 2. Em Triagem -->' in line:
        # A próxima linha contém a div com a borda
        if i + 1 < len(lines):
            if 'border-b-4 border-gray-700' in lines[i + 1] and 'em-triagem' in lines[i + 1]:
                lines[i + 1] = lines[i + 1].replace('border-gray-700', 'border-blue-500')
                print("Linha alterada:")
                print(f"  Linha {i+2}: border-gray-700 -> border-blue-500")
        break

# Escrever o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("\nBorda inferior do card 'Em Triagem' alterada para azul!")
