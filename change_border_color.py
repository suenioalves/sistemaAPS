#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Alterar cor do contorno de preto para cinza escuro"""

# Ler o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Substituir apenas na linha do contorno do grupo
# border-4 border-black -> border-4 border-gray-700
conteudo = conteudo.replace(
    'class="md:col-span-4 border-4 border-black rounded-xl p-4 bg-gray-50 relative">',
    'class="md:col-span-4 border-4 border-gray-700 rounded-xl p-4 bg-gray-50 relative">'
)

# Também alterar a cor do texto do título para cinza escuro
conteudo = conteudo.replace(
    '<span class="text-sm font-bold text-black">Triagem de Hipertensão nos Domicílios/Famílias</span>',
    '<span class="text-sm font-bold text-gray-700">Triagem de Hipertensão nos Domicílios/Famílias</span>'
)

# Escrever o arquivo
with open('templates/painel-rastreamento-cardiovascular.html', 'w', encoding='utf-8') as f:
    f.write(conteudo)

print("Cor do contorno alterada com sucesso!")
print("  - border-black -> border-gray-700")
print("  - text-black (titulo) -> text-gray-700")
