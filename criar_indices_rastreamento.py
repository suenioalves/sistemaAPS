"""
Script para criar índices nas tabelas de rastreamento para melhorar performance
"""
import psycopg2

# Conectar ao banco
conn = psycopg2.connect(
    host="localhost",
    database="esus",
    user="postgres",
    password="EUC[x*x~Mc#S+H_Ui#xZBr0O~",
    port="5433"
)
cur = conn.cursor()

print("Criando índices para melhorar performance do dashboard de rastreamento...")

# Índices na tabela tb_cds_domicilio_familia
indices = [
    # Índice para o JOIN com mv_domicilios_resumo
    """CREATE INDEX IF NOT EXISTS idx_domicilio_familia_cad_domiciliar
       ON tb_cds_domicilio_familia(co_cds_cad_domiciliar)
       WHERE st_mudanca = 0;""",

    # Índice para filtrar por st_mudanca
    """CREATE INDEX IF NOT EXISTS idx_domicilio_familia_mudanca
       ON tb_cds_domicilio_familia(st_mudanca);""",

    # Índice na tabela de rastreamento para LEFT JOIN
    """CREATE INDEX IF NOT EXISTS idx_rastreamento_familias_domicilio
       ON sistemaaps.tb_rastreamento_familias(co_seq_cds_domicilio_familia);""",

    # Índice composto para melhor performance
    """CREATE INDEX IF NOT EXISTS idx_domicilio_familia_composto
       ON tb_cds_domicilio_familia(co_cds_cad_domiciliar, co_seq_cds_domicilio_familia)
       WHERE st_mudanca = 0;""",
]

for i, sql in enumerate(indices, 1):
    try:
        print(f"\n[{i}/{len(indices)}] Executando índice...")
        print(sql)
        cur.execute(sql)
        conn.commit()
        print("[OK] Indice criado com sucesso!")
    except Exception as e:
        print(f"[ERRO] Erro ao criar indice: {e}")
        conn.rollback()

# Atualizar estatísticas das tabelas
print("\n\nAtualizando estatísticas das tabelas...")
tabelas = [
    "tb_cds_domicilio_familia",
    "sistemaaps.tb_rastreamento_familias",
    "sistemaaps.mv_domicilios_resumo"
]

for tabela in tabelas:
    try:
        print(f"  ANALYZE {tabela}...")
        cur.execute(f"ANALYZE {tabela};")
        conn.commit()
        print(f"  [OK] {tabela} analisada")
    except Exception as e:
        print(f"  [ERRO] Erro: {e}")
        conn.rollback()

cur.close()
conn.close()

print("\n\n[OK] Processo concluido! Teste novamente o dashboard.")
