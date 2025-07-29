try:
    import psycopg2
    conn = psycopg2.connect(host="localhost", database="esus", user="postgres", password="EUC[x*x~Mc#S+H_Ui#xZBr0O~", port="5433")
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM sistemaaps.tb_hiperdia_has_medicamentos WHERE data_fim IS NULL OR data_fim > CURRENT_DATE")
    count = cur.fetchone()[0]
    print(f"Medicamentos ativos: {count}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")