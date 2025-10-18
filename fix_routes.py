"""
Corrige a posição das rotas de rastreamento no app.py
Move as rotas que estão depois do if __name__ para antes dele
"""

# Ler arquivo
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar a posição do if __name__
if_main_marker = "if __name__ == '__main__':"
if_main_pos = content.find(if_main_marker)

if if_main_pos == -1:
    print("ERRO: Não encontrou if __name__")
    exit(1)

# Dividir o conteúdo
before_if_main = content[:if_main_pos]
after_if_main = content[if_main_pos:]

# Encontrar onde começam as rotas de rastreamento (depois do if __main__)
marker_rastreamento = "# MÓDULO DE RASTREAMENTO CARDIOVASCULAR"
rotas_start = after_if_main.find(marker_rastreamento)

if rotas_start == -1:
    print("ERRO: Não encontrou as rotas de rastreamento")
    exit(1)

# Separar:
# 1. if __name__ e app.run (primeiras linhas do after_if_main até as rotas)
if_main_section = after_if_main[:rotas_start]

# 2. As rotas de rastreamento (tudo após o marker até o final)
rotas_section = after_if_main[rotas_start:]

# Reconstruir na ordem correta
novo_conteudo = before_if_main + "\n" + rotas_section + "\n\n" + if_main_section

# Fazer backup
with open('app_backup_antes_fix.py', 'w', encoding='utf-8') as f:
    f.write(content)

# Salvar corrigido
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(novo_conteudo)

print("Backup salvo em: app_backup_antes_fix.py")
print("Arquivo app.py corrigido!")
print("Rotas movidas para ANTES do if __name__")
print("\nAgora reinicie o servidor Flask:")
print("1. Ctrl+C para parar")
print("2. python app.py para iniciar")
