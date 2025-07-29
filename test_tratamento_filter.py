import psycopg2
import psycopg2.extras

def test_tratamento_filter():
    """Testa o filtro ComTratamento com a nova consulta"""
    conn = None
    cur = None
    try:
        # Conectar ao banco
        conn = psycopg2.connect(
            host="localhost",
            database="esus",
            user="postgres",
            password="EUC[x*x~Mc#S+H_Ui#xZBr0O~",
            port="5433"
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("=== TESTANDO FILTRO TRATAMENTO ===\n")
        
        # 1. Verificar quantos medicamentos ativos existem
        print("1. Verificando medicamentos ativos na tb_hiperdia_has_medicamentos:")
        cur.execute("""
            SELECT COUNT(*) as total_medicamentos_ativos,
                   COUNT(DISTINCT codcidadao) as pacientes_com_medicamentos
            FROM sistemaaps.tb_hiperdia_has_medicamentos 
            WHERE data_fim IS NULL OR data_fim > CURRENT_DATE
        """)
        result = cur.fetchone()
        print(f"   - Total de medicamentos ativos: {result['total_medicamentos_ativos']}")
        print(f"   - Pacientes com medicamentos: {result['pacientes_com_medicamentos']}")
        
        # 2. Mostrar alguns exemplos de medicamentos
        print("\n2. Exemplos de medicamentos ativos:")
        cur.execute("""
            SELECT codcidadao, nome_medicamento, dose, frequencia, data_inicio, data_fim
            FROM sistemaaps.tb_hiperdia_has_medicamentos 
            WHERE data_fim IS NULL OR data_fim > CURRENT_DATE
            ORDER BY data_inicio DESC
            LIMIT 5
        """)
        medicamentos = cur.fetchall()
        if medicamentos:
            for med in medicamentos:
                print(f"   - Paciente {med['codcidadao']}: {med['nome_medicamento']} "
                      f"({med['dose']} comp - {med['frequencia']}x/dia) desde {med['data_inicio']}")
        else:
            print("   - Nenhum medicamento encontrado")
        
        # 3. Testar a nova consulta do tratamento
        print("\n3. Testando a nova consulta de tratamento:")
        cur.execute("""
            SELECT m.cod_paciente, m.nome_paciente, tratamento.tratamento_atual
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
            WHERE tratamento.tratamento_atual IS NOT NULL AND tratamento.tratamento_atual != ''
            LIMIT 5
        """)
        pacientes_com_tratamento = cur.fetchall()
        
        print(f"   - Pacientes encontrados com tratamento: {len(pacientes_com_tratamento)}")
        if pacientes_com_tratamento:
            print("   - Exemplos:")
            for pac in pacientes_com_tratamento:
                tratamento_limpo = pac['tratamento_atual'].replace('<b>', '').replace('</b>', '').replace('<br>', ' | ')
                print(f"     * {pac['nome_paciente']}: {tratamento_limpo}")
        
        # 4. Verificar se há correspondência entre as tabelas
        print("\n4. Verificando correspondência entre tabelas:")
        cur.execute("""
            SELECT COUNT(DISTINCT med.codcidadao) as total_na_medicamentos,
                   COUNT(DISTINCT m.cod_paciente) as total_na_hiperdia
            FROM sistemaaps.tb_hiperdia_has_medicamentos med
            FULL OUTER JOIN sistemaaps.mv_hiperdia_hipertensao m ON med.codcidadao = m.cod_paciente
            WHERE med.data_fim IS NULL OR med.data_fim > CURRENT_DATE
        """)
        corresp = cur.fetchone()
        print(f"   - Pacientes com medicamentos: {corresp['total_na_medicamentos']}")
        print(f"   - Pacientes hipertensos correspondentes: {corresp['total_na_hiperdia']}")
        
        print("\n=== TESTE CONCLUÍDO ===")
        
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
    test_tratamento_filter()