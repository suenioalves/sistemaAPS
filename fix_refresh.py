#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para adicionar auto-refresh nas tabelas após finalizar triagem
"""

import re

file_path = r"c:\Users\Pichau\Desktop\SISTEMA APS\sistemaAPS\static\dashboard_rastreamento.js"

# Ler o arquivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Padrão 1: salvarResultadosParciais - após carregarDashboardAcompanhamento()
pattern1 = r"(carregarDashboardAcompanhamento\(\);)\s*(\}\s*else\s*\{\s*alert\('Erro ao salvar: '\s*\+\s*data\.message\);)"
replacement1 = r"""\1
            // Atualizar também as tabelas de Suspeitos HAS e Não Hipertensos
            if (typeof carregarSuspeitosHAS === 'function') {
                carregarSuspeitosHAS(1);
            }
            if (typeof carregarNaoHipertensos === 'function') {
                carregarNaoHipertensos(1);
            }
        \2"""

# Padrão 2: finalizarTriagem - após remover família
pattern2 = r"(fecharModalTriagem\(\);\s*carregarDashboardAcompanhamento\(\);)\s*(\}\s*else\s*\{\s*alert\('Erro ao remover: '\s*\+\s*data\.message\);)"
replacement2 = r"""\1
                // Atualizar também as tabelas de Suspeitos HAS e Não Hipertensos
                if (typeof carregarSuspeitosHAS === 'function') {
                    carregarSuspeitosHAS(1);
                }
                if (typeof carregarNaoHipertensos === 'function') {
                    carregarNaoHipertensos(1);
                }
            \2"""

# Padrão 3: finalizarTriagem - após salvar triados
pattern3 = r"(fecharModalTriagem\(\);\s*carregarDashboardAcompanhamento\(\);)\s*(\}\s*else\s*\{\s*alert\('Erro ao finalizar: '\s*\+\s*data\.message\);)"
replacement3 = r"""\1
            // Atualizar também as tabelas de Suspeitos HAS e Não Hipertensos
            if (typeof carregarSuspeitosHAS === 'function') {
                carregarSuspeitosHAS(1);
            }
            if (typeof carregarNaoHipertensos === 'function') {
                carregarNaoHipertensos(1);
            }
        \2"""

# Aplicar substituições
content = re.sub(pattern1, replacement1, content, count=1)
content = re.sub(pattern2, replacement2, content, count=1)
content = re.sub(pattern3, replacement3, content, count=1)

# Escrever o arquivo
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Arquivo atualizado com sucesso!")
print("✓ Adicionado auto-refresh para Suspeitos HAS e Não Hipertensos após finalizar triagem")
