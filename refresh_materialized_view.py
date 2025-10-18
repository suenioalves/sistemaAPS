"""
Script para refresh da Materialized View mv_domicilios_resumo
Executar 1x por dia (programar no Task Scheduler do Windows ou cron)
"""
import psycopg2
import sys
import time
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Log
print("=" * 80)
print(f"REFRESH Materialized View - {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
print("=" * 80)

try:
    conn = psycopg2.connect(
        host="localhost",
        port="5433",
        database="esus",
        user="postgres",
        password="EUC[x*x~Mc#S+H_Ui#xZBr0O~"
    )

    conn.autocommit = True
    cur = conn.cursor()

    print("\nIniciando refresh da Materialized View...")
    print("Isso pode demorar alguns segundos...")

    inicio = time.time()

    # REFRESH CONCURRENTLY permite que queries continuem funcionando durante o refresh
    # Requer índice UNIQUE (já criado: idx_mv_domicilios_id)
    cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_domicilios_resumo")

    fim = time.time()

    print(f"\nRefresh concluido com sucesso!")
    print(f"Tempo: {fim - inicio:.2f}s")

    # Verificar estatísticas
    cur.execute("SELECT COUNT(*) FROM mv_domicilios_resumo")
    total = cur.fetchone()[0]

    cur.execute("""
        SELECT pg_size_pretty(pg_total_relation_size('mv_domicilios_resumo'))
    """)
    tamanho = cur.fetchone()[0]

    print(f"\nEstatisticas:")
    print(f"  - Total de domicilios: {total}")
    print(f"  - Tamanho da view: {tamanho}")

    cur.close()
    conn.close()

    print("\n" + "=" * 80)
    print("Refresh finalizado com sucesso!")
    print("=" * 80)

    sys.exit(0)

except Exception as e:
    print(f"\nERRO ao fazer refresh: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
