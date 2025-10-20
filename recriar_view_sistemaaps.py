"""
Script para recriar a Materialized View mv_domicilios_resumo no schema sistemaaps
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

print("=" * 80)
print("RECRIANDO MATERIALIZED VIEW NO SCHEMA SISTEMAAPS")
print("=" * 80)

# Passo 1: Dropar a view antiga se existir (sem schema)
print("\n1. Removendo view antiga (sem schema)...")
try:
    cur.execute("DROP MATERIALIZED VIEW IF EXISTS mv_domicilios_resumo CASCADE;")
    conn.commit()
    print("   [OK] View antiga removida")
except Exception as e:
    print(f"   [INFO] {e}")
    conn.rollback()

# Passo 2: Dropar a view no schema sistemaaps se existir
print("\n2. Removendo view no schema sistemaaps (se existir)...")
try:
    cur.execute("DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_domicilios_resumo CASCADE;")
    conn.commit()
    print("   [OK] View no sistemaaps removida")
except Exception as e:
    print(f"   [INFO] {e}")
    conn.rollback()

# Passo 3: Executar o script de criação
print("\n3. Executando script de criação...")
with open('bd_sistema_aps/Scripts/Materialize_Views/CREATE_MV_DOMICILIOS_RESUMO.sql', 'r', encoding='utf-8') as f:
    sql_script = f.read()

try:
    cur.execute(sql_script)
    conn.commit()
    print("   [OK] View criada com sucesso!")
except Exception as e:
    print(f"   [ERRO] {e}")
    conn.rollback()
    exit(1)

# Passo 4: Verificar criação
print("\n4. Verificando criação...")
cur.execute("""
    SELECT
        schemaname,
        matviewname,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS tamanho
    FROM pg_matviews
    WHERE matviewname = 'mv_domicilios_resumo'
""")
result = cur.fetchall()

if result:
    for row in result:
        print(f"   [OK] View encontrada: {row[0]}.{row[1]} - Tamanho: {row[2]}")
else:
    print("   [ERRO] View não encontrada!")
    exit(1)

# Passo 5: Contar registros
print("\n5. Contando registros...")
cur.execute("SELECT COUNT(*) FROM sistemaaps.mv_domicilios_resumo")
total = cur.fetchone()[0]
print(f"   [OK] Total de registros: {total}")

cur.close()
conn.close()

print("\n" + "=" * 80)
print("PROCESSO CONCLUIDO COM SUCESSO!")
print("=" * 80)
print("\nAgora a view esta no schema sistemaaps.mv_domicilios_resumo")
print("Todas as referencias no codigo foram atualizadas.")
