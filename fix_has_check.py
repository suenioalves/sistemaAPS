"""Script para corrigir verificação de HAS"""

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Texto antigo
old_text = """            -- Verificar se já tem diagnóstico de HAS (view materializada)
            CASE WHEN EXISTS (
                SELECT 1 FROM sistemaaps.mv_hiperdia_hipertensao h
                WHERE h.co_seq_cds_cad_individual = ci.co_seq_cds_cad_individual
            ) THEN true ELSE false END as tem_diagnostico_has,"""

# Texto novo
new_text = """            -- Verificar se já tem diagnóstico de HAS (view materializada)
            CASE WHEN EXISTS (
                SELECT 1
                FROM sistemaaps.mv_hiperdia_hipertensao h
                INNER JOIN tb_cidadao c ON c.co_seq_cidadao = h.cod_paciente
                WHERE c.co_unico_ultima_ficha = ci.co_unico_ficha
                AND c.st_ativo = 1
            ) THEN true ELSE false END as tem_diagnostico_has,"""

content = content.replace(old_text, new_text)

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Correção aplicada com sucesso!")
