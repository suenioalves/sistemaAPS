#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Reverter cor do card Em Triagem de cinza para azul"""

# Ler o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar e alterar apenas as linhas do card Em Triagem
in_em_triagem = False
for i, line in enumerate(lines):
    if '<!-- 2. Em Triagem -->' in line:
        in_em_triagem = True

    if in_em_triagem:
        # Alterar as cores nas próximas linhas
        if 'border-gray-700' in line and 'em-triagem' in line:
            lines[i] = line.replace('border-gray-700', 'border-blue-500')
        if 'text-gray-700' in line and 'count-em-triagem' in line:
            lines[i] = lines[i].replace('text-gray-700', 'text-blue-600')
        if 'text-gray-700' in line and 'Em Triagem</div>' in line:
            lines[i] = lines[i].replace('text-gray-700', 'text-blue-600')

        # Parar após o fechamento do card
        if in_em_triagem and '</div>' in line and 'Em Triagem' in line:
            in_em_triagem = False

# Escrever o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Cor do card 'Em Triagem' revertida com sucesso!")
print("  - border-gray-700 -> border-blue-500")
print("  - text-gray-700 -> text-blue-600")
