"""
Find tables related to equipe
"""
import psycopg2
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

conn = psycopg2.connect(
    host="localhost",
    port="5433",
    database="esus",
    user="postgres",
    password="EUC[x*x~Mc#S+H_Ui#xZBr0O~"
)

cur = conn.cursor()

print("=" * 80)
print("TABELAS RELACIONADAS A EQUIPE/VINCULACAO")
print("=" * 80)

cur.execute("""
    SELECT table_name, table_schema
    FROM information_schema.tables
    WHERE (table_name LIKE '%equipe%' OR table_name LIKE '%vinc%')
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
""")

tables = cur.fetchall()

print(f"\nTotal de tabelas encontradas: {len(tables)}\n")
for table, schema in tables:
    print(f"  - {schema}.{table}")

# Try to find tb_cidadao_vinculacao_equipe
print("\n" + "=" * 80)
print("ESTRUTURA DA TABELA tb_cidadao_vinculacao_equipe")
print("=" * 80)

try:
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'tb_cidadao_vinculacao_equipe'
        ORDER BY ordinal_position
    """)

    cols = cur.fetchall()
    if cols:
        print("\nColunas:")
        for col, dtype in cols:
            print(f"  - {col} ({dtype})")
    else:
        print("\nTabela não encontrada!")
except Exception as e:
    print(f"\nErro: {e}")

# Check tb_equipe structure
print("\n" + "=" * 80)
print("ESTRUTURA DA TABELA tb_equipe")
print("=" * 80)

try:
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'tb_equipe'
        ORDER BY ordinal_position
    """)

    cols = cur.fetchall()
    if cols:
        print("\nColunas:")
        for col, dtype in cols:
            print(f"  - {col} ({dtype})")
except Exception as e:
    print(f"\nErro: {e}")

# Check tb_cds_cad_individual for equipe-related fields
print("\n" + "=" * 80)
print("CAMPOS DE EQUIPE EM tb_cds_cad_individual")
print("=" * 80)

cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'tb_cds_cad_individual'
      AND (column_name LIKE '%equipe%' OR column_name LIKE '%micro%' OR column_name LIKE '%ine%')
    ORDER BY ordinal_position
""")

cols = cur.fetchall()
print("\nColunas relacionadas a equipe:")
for col, dtype in cols:
    print(f"  - {col} ({dtype})")

cur.close()
conn.close()
