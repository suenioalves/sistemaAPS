import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="esus",
    user="postgres",
    password="EUC[x*x~Mc#S+H_Ui#xZBr0O~",
    port="5433"
)
cur = conn.cursor()

print("Colunas da view sistemaaps.mv_hiperdia_hipertensao:")
print("=" * 60)

cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'sistemaaps'
    AND table_name = 'mv_hiperdia_hipertensao'
    ORDER BY ordinal_position
""")

for row in cur.fetchall():
    print(f"  {row[0]:<40} {row[1]}")

print("\n" + "=" * 60)
print("Amostra de dados (primeiras 2 linhas):")
print("=" * 60)

cur.execute("SELECT * FROM sistemaaps.mv_hiperdia_hipertensao LIMIT 2")
if cur.description:
    colunas = [desc[0] for desc in cur.description]
    print("Colunas:", colunas)

    for row in cur.fetchall():
        print("\nRegistro:")
        for i, col in enumerate(colunas):
            print(f"  {col}: {row[i]}")

cur.close()
conn.close()
