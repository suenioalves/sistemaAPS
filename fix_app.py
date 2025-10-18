"""
Script para corrigir a posição das rotas de rastreamento no app.py
"""

# Ler o arquivo completo
with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar a linha do if __name__
if_main_line = None
for i, line in enumerate(lines):
    if line.strip().startswith("if __name__ == '__main__':"):
        if_main_line = i
        break

print(f"Linha do if __name__: {if_main_line + 1}")

# Separar o código em 3 partes:
# 1. Antes do if __name__
# 2. Rotas adicionadas depois (que precisam ser movidas)
# 3. if __name__ e o que vem depois

parte_antes = lines[:if_main_line]
parte_if_main = lines[if_main_line:]

# Procurar linhas adicionadas depois do if __name__ que começam com comentário ou @app
linhas_extras = []
linhas_if_main_limpas = []

for i, line in enumerate(parte_if_main):
    # Se é a primeira linha (if __name__) ou a linha do app.run, mantém
    if i == 0 or 'app.run' in line:
        linhas_if_main_limpas.append(line)
    # Se é linha em branco ou comentário/decorator de rota, move para antes
    elif line.strip().startswith('#') or line.strip().startswith('@app') or line.strip().startswith('def ') or 'return ' in line or 'conn' in line or 'cur' in line or 'try:' in line or 'except' in line or 'finally:' in line or 'query' in line or 'psycopg2' in line:
        linhas_extras.append(line)
    else:
        linhas_if_main_limpas.append(line)

# Reconstruir o arquivo
novo_conteudo = parte_antes + ['\n'] + linhas_extras + ['\n'] + linhas_if_main_limpas

# Salvar backup
with open('app_backup.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Backup criado: app_backup.py")

# Salvar arquivo corrigido
with open('app.py', 'w', encoding='utf-8') as f:
    f.writelines(novo_conteudo)

print("Arquivo app.py corrigido!")
print(f"Total de linhas movidas: {len(linhas_extras)}")
