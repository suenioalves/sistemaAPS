import psycopg2
import psycopg2.extras

def debug_tratamento_filter():
    """Debug detalhado do filtro Tratamento"""
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="esus", 
            user="postgres",
            password="EUC[x*x~Mc#S+H_Ui#xZBr0O~",
            port="5433"
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("=== DEBUG DO FILTRO TRATAMENTO ===\n")
        
        # 1. Verificar dados na tabela tb_hiperdia_has_medicamentos
        print("1. Verificando dados na tb_hiperdia_has_medicamentos:")
        cur.execute("""
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT codcidadao) as pacientes_distintos,
                COUNT(CASE WHEN data_fim IS NULL THEN 1 END) as sem_data_fim,
                COUNT(CASE WHEN data_fim > CURRENT_DATE THEN 1 END) as data_fim_futura,
                COUNT(CASE WHEN data_fim IS NULL OR data_fim > CURRENT_DATE THEN 1 END) as medicamentos_ativos
            FROM sistemaaps.tb_hiperdia_has_medicamentos
        """)
        stats = cur.fetchone()
        print(f"   Total de registros: {stats['total_registros']}")
        print(f"   Pacientes distintos: {stats['pacientes_distintos']}")
        print(f"   Sem data_fim: {stats['sem_data_fim']}")
        print(f"   Data_fim futura: {stats['data_fim_futura']}")
        print(f"   Medicamentos ativos: {stats['medicamentos_ativos']}")
        
        # 2. Verificar alguns códigos de pacientes
        print("\n2. Códigos de pacientes com medicamentos ativos:")
        cur.execute("""
            SELECT DISTINCT codcidadao
            FROM sistemaaps.tb_hiperdia_has_medicamentos
            WHERE data_fim IS NULL OR data_fim > CURRENT_DATE
            LIMIT 10
        """)
        pacientes_med = [row['codcidadao'] for row in cur.fetchall()]
        print(f"   Primeiros 10 códigos: {pacientes_med}")
        
        # 3. Verificar se esses pacientes estão na mv_hiperdia_hipertensao
        if pacientes_med:
            print("\n3. Verificando se pacientes existem na mv_hiperdia_hipertensao:")
            format_ids = ','.join(str(id) for id in pacientes_med)
            cur.execute(f"""
                SELECT cod_paciente, nome_paciente
                FROM sistemaaps.mv_hiperdia_hipertensao
                WHERE cod_paciente IN ({format_ids})
                LIMIT 5
            """)
            pacientes_mv = cur.fetchall()
            print(f"   Encontrados na MV: {len(pacientes_mv)}")
            for p in pacientes_mv:
                print(f"     - {p['cod_paciente']}: {p['nome_paciente']}")
        
        # 4. Testar a consulta LATERAL JOIN isoladamente
        print("\n4. Testando LATERAL JOIN isoladamente:")
        cur.execute("""
            SELECT 
                m.cod_paciente,
                m.nome_paciente,
                tratamento.tratamento_atual,
                LENGTH(tratamento.tratamento_atual) as tamanho_string
            FROM sistemaaps.mv_hiperdia_hipertensao m
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(
                    '<b>' || med.nome_medicamento || '</b> (' || 
                    CASE 
                        WHEN med.dose IS NOT NULL AND med.frequencia IS NOT NULL 
                        THEN med.dose || ' comprimido(s) - ' || med.frequencia || 'x ao dia'
                        WHEN med.frequencia IS NOT NULL 
                        THEN med.frequencia || 'x ao dia'
                        ELSE 'Conforme prescrição'
                    END || ') - ' || TO_CHAR(med.data_inicio, 'DD/MM/YYYY'),
                    '<br>'
                    ORDER BY med.data_inicio DESC, med.nome_medicamento
                ) AS tratamento_atual
                FROM sistemaaps.tb_hiperdia_has_medicamentos med
                WHERE med.codcidadao = m.cod_paciente 
                  AND (med.data_fim IS NULL OR med.data_fim > CURRENT_DATE)
            ) tratamento ON TRUE
            WHERE tratamento.tratamento_atual IS NOT NULL 
              AND TRIM(tratamento.tratamento_atual) != ''
            LIMIT 10
        """)
        
        resultados = cur.fetchall()
        print(f"   Pacientes encontrados com tratamento: {len(resultados)}")
        
        for r in resultados:
            tratamento_limpo = r['tratamento_atual'].replace('<b>', '').replace('</b>', '').replace('<br>', ' | ')
            print(f"     - {r['cod_paciente']}: {r['nome_paciente']}")
            print(f"       Tratamento ({r['tamanho_string']} chars): {tratamento_limpo[:100]}...")
        
        # 5. Testar consulta simples sem LATERAL
        print("\n5. Teste simples - pacientes com medicamentos:")
        cur.execute("""
            SELECT DISTINCT m.cod_paciente, m.nome_paciente
            FROM sistemaaps.mv_hiperdia_hipertensao m
            INNER JOIN sistemaaps.tb_hiperdia_has_medicamentos med 
                ON med.codcidadao = m.cod_paciente
            WHERE med.data_fim IS NULL OR med.data_fim > CURRENT_DATE
            LIMIT 10
        """)
        
        simples = cur.fetchall()
        print(f"   Pacientes com INNER JOIN: {len(simples)}")
        for s in simples:
            print(f"     - {s['cod_paciente']}: {s['nome_paciente']}")
        
        # 6. Verificar problemas de encoding ou caracteres especiais
        print("\n6. Verificando problemas de encoding:")
        cur.execute("""
            SELECT 
                codcidadao,
                nome_medicamento,
                LENGTH(nome_medicamento) as tamanho,
                ASCII(SUBSTRING(nome_medicamento, 1, 1)) as primeiro_char_ascii
            FROM sistemaaps.tb_hiperdia_has_medicamentos
            WHERE data_fim IS NULL OR data_fim > CURRENT_DATE
            LIMIT 5
        """)
        
        encoding_test = cur.fetchall()
        for e in encoding_test:
            print(f"   - Paciente {e['codcidadao']}: '{e['nome_medicamento']}' (len={e['tamanho']}, ascii={e['primeiro_char_ascii']})")
            
    except Exception as e:
        print(f"Erro: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    debug_tratamento_filter()