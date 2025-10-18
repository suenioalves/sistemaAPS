"""
Recreate materialized view with equipes column
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

# Read SQL file
with open('bd_sistema_aps/Scripts/Materialize_Views/CREATE_MV_DOMICILIOS_RESUMO.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

print("Executando DROP e CREATE da Materialized View...")
print("Isso pode demorar alguns segundos...")

try:
    # Execute the full SQL script
    cur.execute(sql)
    conn.commit()

    print("\nMaterialized View criada com sucesso!")

    # Get statistics
    cur.execute("SELECT COUNT(*) FROM mv_domicilios_resumo")
    total = cur.fetchone()[0]

    print(f"Total de domicílios: {total}")

except Exception as e:
    print(f"ERRO: {e}")
    conn.rollback()

cur.close()
conn.close()
