#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Alterar cor do card Em Triagem de azul para cinza escuro"""

# Ler o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Substituir as cores azuis por cinza escuro
conteudo = conteudo.replace('border-blue-500', 'border-gray-700')
conteudo = conteudo.replace('text-blue-600', 'text-gray-700')

# Escrever o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'w', encoding='utf-8') as f:
    f.write(conteudo)

print("Cor do card 'Em Triagem' alterada com sucesso!")
print("  - border-blue-500 -> border-gray-700")
print("  - text-blue-600 -> text-gray-700")
