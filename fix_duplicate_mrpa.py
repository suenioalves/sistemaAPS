#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Remove duplicate MRPA endpoints from app.py"""

# Ler o arquivo
with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar as duas ocorrências do comentário MRPA ENDPOINTS
ocorrencias = []
for i, line in enumerate(lines):
    if '# MRPA ENDPOINTS' in line:
        ocorrencias.append(i)

print(f"Encontradas {len(ocorrencias)} ocorrencias do comentario MRPA ENDPOINTS nas linhas: {ocorrencias}")

if len(ocorrencias) == 2:
    # Manter a segunda ocorrência e remover a primeira
    primeira_linha = ocorrencias[0] - 2  # Incluindo as linhas de separador antes

    # Encontrar onde termina o primeiro bloco (procurar pelo próximo comentário ou if __name__)
    segunda_linha_inicio = ocorrencias[1] - 2

    # Remover linhas da primeira até o início da segunda
    novo_conteudo = lines[:primeira_linha] + lines[segunda_linha_inicio:]

    # Escrever arquivo
    with open('app.py', 'w', encoding='utf-8') as f:
        f.writelines(novo_conteudo)

    print(f"Removidas linhas {primeira_linha} ate {segunda_linha_inicio-1}")
    print("Duplicatas removidas com sucesso!")
else:
    print("Numero inesperado de ocorrencias. Verifique manualmente.")
