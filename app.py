from flask import Flask, render_template, jsonify, request
import psycopg2
import psycopg2.extras # Adicionado para DictCursor
from datetime import date, datetime

app = Flask(__name__)

# --- Configurações do Banco de Dados PostgreSQL ---
DB_HOST = "localhost"
DB_PORT = "5433"
DB_NAME = "esus"
DB_USER = "postgres"
DB_PASS = "uJLV}8ELrFLH{TaC*?-g{IVgx7l"

def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    return conn

# --- Função Auxiliar para construir a query ---
def build_filtered_query(args):
    """Constrói a cláusula WHERE e ORDER BY com base nos filtros e ordenação da requisição."""
    equipe = args.get('equipe', 'Todas')
    search_term = args.get('search', None)
    metodos = args.getlist('metodo')
    faixas_etarias = args.getlist('faixa_etaria')
    status_list = args.getlist('status')
    sort_by = args.get('sort_by', 'nome_asc')

    query_params = {}
    where_clauses = []

    # Filtro de Equipe
    if equipe != 'Todas':
        where_clauses.append("m.nome_equipe = %(equipe)s")
        query_params['equipe'] = equipe
    
    # Filtro de Busca por Nome
    if search_term:
        where_clauses.append("unaccent(m.nome_paciente) ILIKE unaccent(%(search)s)")
        query_params['search'] = f"%{search_term}%"

    # Filtro de Métodos Contraceptivos
    if metodos:
        where_clauses.append("m.metodo = ANY(%(metodos)s)")
        query_params['metodos'] = metodos
        
    # Filtro de Faixa Etária
    if faixas_etarias:
        age_conditions = []
        for faixa in faixas_etarias:
            min_age, max_age = faixa.split('-')
            age_conditions.append(f"m.idade_calculada BETWEEN {int(min_age)} AND {int(max_age)}")
        if age_conditions:
            where_clauses.append(f"({ ' OR '.join(age_conditions) })")

    # Filtro de Status de Acompanhamento
    if status_list:
        status_conditions = []
        if 'sem_metodo' in status_list:
            status_conditions.append("(m.metodo IS NULL OR m.metodo = '')")
        if 'gestante' in status_list:
            status_conditions.append("m.status_gravidez = 'Grávida'")
        if 'atrasado' in status_list:
            status_conditions.append("""
                (
                    (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                        ( (m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days') ) OR
                        ( m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days') )
                    ))
                )
            """)
        if 'em_dia' in status_list:
            status_conditions.append("""
                (
                    (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                        ( (m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days') ) OR
                        ( m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days') )
                    )) OR
                    ( m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%' )
                ) AND (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida')
            """)
        if status_conditions:
             where_clauses.append(f"({ ' OR '.join(status_conditions) })")


    # Lógica de Ordenação
    sort_mapping = {
        'nome_asc': 'm.nome_paciente ASC',
        'nome_desc': 'm.nome_paciente DESC',
        'idade_asc': 'm.idade_calculada ASC',
        'idade_desc': 'm.idade_calculada DESC',
        'metodo_asc': 'm.metodo ASC NULLS LAST',
        'status_asc': """
            CASE
                WHEN m.status_gravidez = 'Grávida' THEN 1
                WHEN (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                        ( (m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days') ) OR
                        ( m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days') )
                     )) THEN 2
                WHEN (m.metodo IS NULL OR m.metodo = '') THEN 3
                ELSE 4
            END ASC, m.nome_paciente ASC
        """
    }
    order_by_clause = " ORDER BY " + sort_mapping.get(sort_by, 'm.nome_paciente ASC')

    where_clause_str = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    return where_clause_str, order_by_clause, query_params

# --- Rotas do Aplicativo Flask ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/painel-plafam')
def painel_plafam():
    return render_template('Painel-Plafam.html')

@app.route('/painel-adolescentes')
def painel_adolescentes():
    return render_template('painel-adolescentes.html')

@app.route('/api/pacientes_plafam')
def api_pacientes_plafam():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        page = int(request.args.get('page', 1))
        limit = 20
        offset = (page - 1) * limit

        where_clause, order_by_clause, query_params = build_filtered_query(request.args)
        
        base_query = """
        SELECT
            m.cod_paciente, m.nome_paciente, m.cartao_sus, m.idade_calculada, m.microarea,
            m.metodo, m.nome_equipe, m.data_aplicacao, m.status_gravidez, m.data_provavel_parto,
            pa.status_acompanhamento, pa.data_acompanhamento,
            ag.nome_agente
        FROM sistemaaps.mv_plafam m
        LEFT JOIN sistemaaps.tb_plafam_acompanhamento pa ON m.cod_paciente = pa.co_cidadao
        LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
        """
        
        final_query = base_query + where_clause
        count_query = "SELECT COUNT(*) FROM sistemaaps.mv_plafam m" + where_clause

        count_params = query_params.copy()
        
        cur.execute(count_query, count_params)
        total_pacientes = cur.fetchone()[0]
        
        query_params['limit'] = limit
        query_params['offset'] = offset
        final_query += order_by_clause + " LIMIT %(limit)s OFFSET %(offset)s"
        
        cur.execute(final_query, query_params)
        dados = cur.fetchall()

        colunas_db = [desc[0] for desc in cur.description]
        colunas_frontend = [col.replace('microarea', 'micro_area').replace('status_gravidez', 'gestante') for col in colunas_db]
        
        resultados = []
        for linha in dados:
            linha_dict = dict(zip(colunas_frontend, linha))

            # --- Tratamento específico para data_aplicacao ---
            # Objetivo: Enviar para o frontend como 'YYYY-MM-DD' ou null.
            data_app_val = linha_dict.get('data_aplicacao')
            if data_app_val:
                if isinstance(data_app_val, date):  # Se for um objeto date do Python
                    linha_dict['data_aplicacao'] = data_app_val.strftime('%Y-%m-%d')
                elif isinstance(data_app_val, str):  # Se for uma string
                    try:
                        # Tenta converter de 'dd/mm/yyyy' (formato da view, como informado)
                        dt_obj = datetime.strptime(data_app_val, '%d/%m/%Y')
                        linha_dict['data_aplicacao'] = dt_obj.strftime('%Y-%m-%d')
                    except ValueError:
                        # Se não for 'dd/mm/yyyy', verifica se já é 'yyyy-mm-dd'
                        try:
                            datetime.strptime(data_app_val, '%Y-%m-%d')
                            # Se for, já está no formato correto, não precisa alterar.
                        except ValueError:
                            # Se não for nenhum dos formatos esperados, loga e define como None.
                            print(f"Alerta: Formato de data_aplicacao ('{data_app_val}') não reconhecido na API. Enviando como null.")
                            linha_dict['data_aplicacao'] = None
                else: # Algum outro tipo inesperado
                    print(f"Alerta: Tipo de data_aplicacao ({type(data_app_val)}) inesperado na API. Enviando como null.")
                    linha_dict['data_aplicacao'] = None
            else: # Se for None, False, 0, string vazia etc. vindo do banco
                linha_dict['data_aplicacao'] = None # Garante que seja null para o JS

            if linha_dict.get('data_provavel_parto') and isinstance(linha_dict['data_provavel_parto'], date):
                linha_dict['data_provavel_parto'] = linha_dict['data_provavel_parto'].strftime('%d/%m/%Y')
            if linha_dict.get('data_acompanhamento') and isinstance(linha_dict['data_acompanhamento'], date):
                linha_dict['data_acompanhamento'] = linha_dict['data_acompanhamento'].strftime('%d/%m/%Y')
            linha_dict['gestante'] = True if linha_dict.get('gestante') == 'Grávida' else False
            resultados.append(linha_dict)

        return jsonify({
            'pacientes': resultados,
            'total': total_pacientes,
            'page': page,
            'limit': limit,
            'pages': (total_pacientes + limit - 1) // limit if total_pacientes > 0 else 0
        })

    except Exception as e:
        print(f"Erro ao conectar ou consultar o banco de dados: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/export_data')
def api_export_data():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        where_clause, order_by_clause, query_params = build_filtered_query(request.args)

        base_query = """
        SELECT m.cod_paciente, m.nome_paciente, m.cartao_sus, m.idade_calculada, m.microarea, m.metodo, m.nome_equipe, 
               m.data_aplicacao, m.status_gravidez, m.data_provavel_parto, pa.status_acompanhamento, pa.data_acompanhamento,
               ag.nome_agente
        FROM sistemaaps.mv_plafam m
        LEFT JOIN sistemaaps.tb_plafam_acompanhamento pa ON m.cod_paciente = pa.co_cidadao
        LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
        """
        
        final_query = base_query + where_clause + order_by_clause
        
        cur.execute(final_query, query_params)
        dados = cur.fetchall()

        colunas_db = [desc[0] for desc in cur.description]
        colunas_frontend = [col.replace('microarea', 'micro_area').replace('status_gravidez', 'gestante') for col in colunas_db]
        
        resultados = []
        for linha in dados:
            linha_dict = dict(zip(colunas_frontend, linha))
            if linha_dict.get('data_aplicacao') and isinstance(linha_dict['data_aplicacao'], date):
                linha_dict['data_aplicacao'] = linha_dict['data_aplicacao'].strftime('%d/%m/%Y')
            if linha_dict.get('data_provavel_parto') and isinstance(linha_dict['data_provavel_parto'], date):
                linha_dict['data_provavel_parto'] = linha_dict['data_provavel_parto'].strftime('%d/%m/%Y')
            if linha_dict.get('data_acompanhamento') and isinstance(linha_dict['data_acompanhamento'], date):
                linha_dict['data_acompanhamento'] = linha_dict['data_acompanhamento'].strftime('%d/%m/%Y')
            linha_dict['gestante'] = True if linha_dict.get('gestante') == 'Grávida' else False
            resultados.append(linha_dict)

        return jsonify(resultados)

    except Exception as e:
        print(f"Erro na exportação: {e}")
        return jsonify({"erro": f"Erro no servidor durante a exportação: {e}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/update_acompanhamento', methods=['POST'])
def update_acompanhamento():
    data = request.get_json()
    co_cidadao = data.get('co_cidadao')
    status_str = data.get('status')

    if not co_cidadao or status_str is None:
        return jsonify({'sucesso': False, 'erro': 'Dados inválidos'}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if status_str == '0':
            sql_upsert = """
                INSERT INTO sistemaaps.tb_plafam_acompanhamento (co_cidadao, status_acompanhamento, data_acompanhamento)
                VALUES (%(co_cidadao)s, NULL, NULL)
                ON CONFLICT (co_cidadao) DO UPDATE
                SET status_acompanhamento = NULL,
                    data_acompanhamento = NULL;
            """
            cur.execute(sql_upsert, {'co_cidadao': co_cidadao})
        else:
            sql_upsert = """
                INSERT INTO sistemaaps.tb_plafam_acompanhamento (co_cidadao, status_acompanhamento, data_acompanhamento)
                VALUES (%(co_cidadao)s, %(status)s, CURRENT_DATE)
                ON CONFLICT (co_cidadao) DO UPDATE
                SET status_acompanhamento = EXCLUDED.status_acompanhamento,
                    data_acompanhamento = EXCLUDED.data_acompanhamento;
            """
            cur.execute(sql_upsert, {'status': int(status_str), 'co_cidadao': co_cidadao})
        
        conn.commit()
        
        return jsonify({'sucesso': True, 'mensagem': 'Acompanhamento atualizado com sucesso!'})

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao atualizar acompanhamento: {e}")
        return jsonify({'sucesso': False, 'erro': f"Erro no servidor: {e}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/equipes')
def api_equipes():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT nome_equipe, COUNT(*) as total_pacientes
            FROM sistemaaps.mv_plafam
            WHERE nome_equipe IS NOT NULL
            GROUP BY nome_equipe
            ORDER BY total_pacientes DESC;
        """)
        equipes = [row[0] for row in cur.fetchall()]
        return jsonify(equipes)
    except Exception as e:
        print(f"Erro ao buscar equipes: {e}")
        return jsonify({"erro": f"Não foi possível buscar equipes: {e}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/equipes_com_agentes_adolescentes')
def api_equipes_com_agentes_adolescentes():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Pega todas as equipes distintas de mv_plafam ou tb_agentes
        cur.execute("""
            SELECT DISTINCT nome_equipe 
            FROM (
                SELECT nome_equipe FROM sistemaaps.mv_plafam
                UNION
                SELECT nome_equipe FROM sistemaaps.tb_agentes
            ) AS equipes_unidas
            WHERE nome_equipe IS NOT NULL 
            ORDER BY nome_equipe
        """)
        equipes_db = cur.fetchall()
        
        resultado_final = []
        for eq_row in equipes_db:
            equipe_nome = eq_row['nome_equipe']
            
            # Contar adolescentes (14-18 anos) para a equipe atual
            cur.execute("""
                SELECT COUNT(DISTINCT m.cod_paciente)
                FROM sistemaaps.mv_plafam m
                WHERE m.nome_equipe = %s AND m.idade_calculada BETWEEN 14 AND 18
            """, (equipe_nome,))
            num_adolescentes = cur.fetchone()[0] or 0
            
            cur.execute("""
                SELECT micro_area, nome_agente 
                FROM sistemaaps.tb_agentes 
                WHERE nome_equipe = %s 
                ORDER BY micro_area, nome_agente
            """, (equipe_nome,))
            agentes_db = cur.fetchall()
            agentes = []
            if agentes_db:
                agentes = [{"micro_area": ag['micro_area'], "nome_agente": ag['nome_agente']} for ag in agentes_db]
            
            resultado_final.append({"nome_equipe": equipe_nome, "agentes": agentes, "num_adolescentes": num_adolescentes})
        
        # Ordenar as equipes pelo número de adolescentes em ordem decrescente
        resultado_final_ordenado = sorted(resultado_final, key=lambda x: x.get('num_adolescentes', 0), reverse=True)
                
        return jsonify(resultado_final_ordenado)
    except Exception as e:
        print(f"Erro ao buscar equipes com agentes: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/estatisticas_painel_adolescentes')
def api_estatisticas_painel_adolescentes():
    equipe_req = request.args.get('equipe', 'Todas')
    # Espera "Área MA - Agente NOME" ou "Todas"
    agente_selecionado_req = request.args.get('agente_selecionado', 'Todas') 

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        micro_area_filtro = None
        # nome_agente_filtro = None # Não usado diretamente no filtro SQL se mv_plafam não tiver nome_agente
        aplicar_filtro_agente_area = False

        if agente_selecionado_req != 'Todas' and agente_selecionado_req != 'Todas as áreas':
            # Exemplo: "Área 01 - Agente X" ou apenas "Área 01"
            if ' - ' in agente_selecionado_req:
                parts = agente_selecionado_req.split(' - ', 1)
                micro_area_str = parts[0].replace('Área ', '').strip()
            else: # Apenas "Área 01"
                micro_area_str = agente_selecionado_req.replace('Área ', '').strip()
            
            if micro_area_str: # micro_area_str pode ser apenas o número da área
                micro_area_filtro = micro_area_str
                aplicar_filtro_agente_area = True

        # --- Total de Adolescentes (14-18 anos) ---
        # Este é para o card "Adolescentes - 14 a 18 anos" (respeita filtro de equipe e agente/área)
        query_adolescentes_base = "SELECT COUNT(DISTINCT m.cod_paciente) FROM sistemaaps.mv_plafam m "
        
        # Cláusulas e parâmetros base para filtros de idade, equipe E área/agente
        base_where_clauses = ["m.idade_calculada BETWEEN 14 AND 18"]
        base_params = []

        if equipe_req != 'Todas':
            base_where_clauses.append("m.nome_equipe = %s")
            base_params.append(equipe_req)

        if aplicar_filtro_agente_area and micro_area_filtro:
            base_where_clauses.append("m.microarea = %s")
            base_params.append(micro_area_filtro)

        query_total_adolescentes_final = query_adolescentes_base + " WHERE " + " AND ".join(base_where_clauses)
        cur.execute(query_total_adolescentes_final, tuple(base_params))
        total_adolescentes = cur.fetchone()[0] or 0

        # --- Adolescentes (14-18) SEM MÉTODO (respeita filtro de equipe e agente/área) ---
        where_clauses_sem_metodo = list(base_where_clauses)
        condicao_sem_metodo = "(m.metodo IS NULL OR m.metodo = '')"
        where_clauses_sem_metodo.append(condicao_sem_metodo)
        query_adolescentes_sem_metodo_final = query_adolescentes_base + " WHERE " + " AND ".join(where_clauses_sem_metodo)
        cur.execute(query_adolescentes_sem_metodo_final, tuple(base_params)) # Reutiliza base_params pois a condição extra não tem placeholder
        adolescentes_sem_metodo_count = cur.fetchone()[0] or 0
        
        # --- Adolescentes (14-18) GESTANTES (respeita filtro de equipe e agente/área) ---
        where_clauses_gestantes = list(base_where_clauses)
        condicao_gestantes = "m.status_gravidez = 'Grávida'"
        where_clauses_gestantes.append(condicao_gestantes)
        query_adolescentes_gestantes_final = query_adolescentes_base + " WHERE " + " AND ".join(where_clauses_gestantes)
        cur.execute(query_adolescentes_gestantes_final, tuple(base_params))
        adolescentes_gestantes_count = cur.fetchone()[0] or 0

        # --- Adolescentes (14-18) COM MÉTODO EM DIA (respeita filtro de equipe e agente/área) ---
        where_clauses_metodo_em_dia = list(base_where_clauses)
        # A condição para 'MetodoEmDia' já está definida em build_timeline_query_filters, podemos reutilizar ou redefinir
        # Para clareza, vamos redefinir aqui, garantindo que não seja gestante.
        condicao_metodo_em_dia = """
        (
            (m.metodo IS NOT NULL AND m.metodo != '') AND 
            (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND 
            (
                (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                    ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                    (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                )) OR
                (m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%') 
            )
        )
        """
        where_clauses_metodo_em_dia.append(condicao_metodo_em_dia)
        query_adolescentes_metodo_em_dia_final = query_adolescentes_base + " WHERE " + " AND ".join(where_clauses_metodo_em_dia)
        cur.execute(query_adolescentes_metodo_em_dia_final, tuple(base_params))
        adolescentes_com_metodo_em_dia_count = cur.fetchone()[0] or 0

        # --- Adolescentes (14-18) COM MÉTODO ATRASADO (respeita filtro de equipe e agente/área) ---
        where_clauses_metodo_atrasado = list(base_where_clauses)
        condicao_metodo_atrasado = """
        (
            (m.metodo IS NOT NULL AND m.metodo != '') AND -- Garante que tem um método para estar atrasado
            (
                (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                    ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days'))
                )) OR
                (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                    (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                ))
            )
        )
        """
        where_clauses_metodo_atrasado.append(condicao_metodo_atrasado)
        query_adolescentes_metodo_atrasado_final = query_adolescentes_base + " WHERE " + " AND ".join(where_clauses_metodo_atrasado)
        cur.execute(query_adolescentes_metodo_atrasado_final, tuple(base_params))
        adolescentes_com_metodo_atrasado_count = cur.fetchone()[0] or 0

        return jsonify({
            "total_adolescentes": total_adolescentes, 
            "adolescentes_sem_metodo": adolescentes_sem_metodo_count,
            "adolescentes_com_metodo_atrasado": adolescentes_com_metodo_atrasado_count,
            "adolescentes_gestantes": adolescentes_gestantes_count,
            "adolescentes_metodo_em_dia": adolescentes_com_metodo_em_dia_count
        })
    except Exception as e:
        print(f"Erro ao buscar estatísticas de adolescentes: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

def build_timeline_query_filters(args):
    equipe = args.get('equipe', 'Todas')
    agente_selecionado = args.get('agente_selecionado', 'Todas as áreas')
    search_term = args.get('search_timeline', None)
    status_timeline = args.get('status_timeline', 'Todos')
    sort_by = args.get('sort_by_timeline', 'proxima_acao_asc') # Novo padrão de ordenação

    query_params = {}
    where_clauses = ["m.idade_calculada BETWEEN 14 AND 18"] # Foco em adolescentes

    if equipe != 'Todas':
        where_clauses.append("m.nome_equipe = %(equipe)s")
        query_params['equipe'] = equipe

    if agente_selecionado != 'Todas as áreas':
        if ' - ' in agente_selecionado:
            parts = agente_selecionado.split(' - ', 1)
            micro_area_str = parts[0].replace('Área ', '').strip()
            # nome_agente_str = parts[1].strip() # Poderia ser usado se o filtro fosse mais granular
            if micro_area_str:
                where_clauses.append("m.microarea = %(microarea_timeline)s")
                query_params['microarea_timeline'] = micro_area_str
        # Se não tiver ' - ', pode ser apenas a microárea, mas a lógica atual do JS envia com ' - ' ou 'Todas as áreas'

    if search_term:
        where_clauses.append("unaccent(m.nome_paciente) ILIKE unaccent(%(search_timeline)s)")
        query_params['search_timeline'] = f"%{search_term}%"

    if status_timeline == 'SemMetodo':
        where_clauses.append("(m.metodo IS NULL OR m.metodo = '')")
    elif status_timeline == 'MetodoVencido':
        where_clauses.append("""
            (
                (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                    ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days')) OR
                    (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                ))
            )
        """)
    elif status_timeline == 'MetodoEmDia':
        where_clauses.append("""
            (
                (m.metodo IS NOT NULL AND m.metodo != '') AND -- Paciente tem um método
                (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND -- Paciente não está grávida
                (
                    (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                        ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                        (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                    )) OR
                    (m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%') 
                )
            )
        """)
    elif status_timeline == 'Gestante':
        where_clauses.append("m.status_gravidez = 'Grávida'")
    # 'Todos' não adiciona filtro de status específico do método

    sort_mapping_timeline = {
        'nome_asc': 'm.nome_paciente ASC',
        'nome_desc': 'm.nome_paciente DESC',
        'idade_asc': 'm.idade_calculada ASC',
        'idade_desc': 'm.idade_calculada DESC',
        'proxima_acao_asc': 'data_proxima_acao_ordenacao ASC NULLS LAST, m.nome_paciente ASC'
    }
    # Default seguro para ordenação, caso sort_by seja inválido
    order_by_clause = " ORDER BY " + sort_mapping_timeline.get(sort_by, 'data_proxima_acao_ordenacao ASC NULLS LAST, m.nome_paciente ASC')
    
    where_clause_str = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    return where_clause_str, order_by_clause, query_params

@app.route('/api/timeline_adolescentes')
def api_timeline_adolescentes():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        page = int(request.args.get('page_timeline', 1))
        limit = 5 # Limite de 5 por página
        offset = (page - 1) * limit

        where_clause, order_by_clause, query_params = build_timeline_query_filters(request.args)

        base_query_fields = """
            m.cod_paciente, m.nome_paciente, m.cartao_sus, m.idade_calculada, m.microarea,
            m.metodo, m.nome_equipe, m.data_aplicacao, m.status_gravidez, m.data_provavel_parto,
            ag.nome_agente, m.nome_responsavel,
            pa_futura.data_acao AS data_proxima_acao_ordenacao,
            pa_futura.tipo_abordagem AS tipo_proxima_acao_ordenacao
        """
        
        from_join_clause = """
        FROM sistemaaps.mv_plafam m
        LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
        LEFT JOIN LATERAL (
            SELECT pa.data_acao, pa.tipo_abordagem
            FROM sistemaaps.tb_plafam_adolescentes pa
            WHERE pa.co_cidadao = m.cod_paciente
              AND pa.data_acao >= CURRENT_DATE
              AND pa.resultado_abordagem IS NULL
            ORDER BY pa.data_acao ASC
            LIMIT 1
        ) pa_futura ON TRUE
        """

        # FROM clause simplificado para a contagem, para evitar problemas de performance ou contagem incorreta com o JOIN LATERAL
        from_clause_for_count = """
        FROM sistemaaps.mv_plafam m
        LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
        """
        count_query = "SELECT COUNT(DISTINCT m.cod_paciente) " + from_clause_for_count + where_clause
        cur.execute(count_query, query_params)
        total_adolescentes = cur.fetchone()[0] or 0

        query_params_paginated = query_params.copy()
        query_params_paginated['limit'] = limit
        query_params_paginated['offset'] = offset
        final_query = "SELECT " + base_query_fields + from_join_clause + where_clause + order_by_clause + " LIMIT %(limit)s OFFSET %(offset)s"
        cur.execute(final_query, query_params_paginated)
        
        dados_adolescentes = []
        for row in cur.fetchall():
            row_dict = dict(row)
            # Inicializa os campos de próxima ação
            data_prox_acao_ord = row_dict.pop('data_proxima_acao_ordenacao', None)
            tipo_prox_acao_ord = row_dict.pop('tipo_proxima_acao_ordenacao', None)

            if data_prox_acao_ord and isinstance(data_prox_acao_ord, date):
                row_dict['proxima_acao_data_formatada'] = data_prox_acao_ord.strftime('%d/%m/%Y')
                tipo_abordagem_map_py = {
                    1: "Abordagem com pais",
                    2: "Abordagem direta com adolescente",
                    3: "Consulta na UBS",
                    4: "Entrega de convite"
                }
                row_dict['proxima_acao_descricao'] = tipo_abordagem_map_py.get(tipo_prox_acao_ord, 'Ação futura')
            else:
                row_dict['proxima_acao_data_formatada'] = None
                row_dict['proxima_acao_descricao'] = None


            # Tratamento de datas para cada linha
            data_app_val = row_dict.get('data_aplicacao')
            if data_app_val:
                if isinstance(data_app_val, date):
                    row_dict['data_aplicacao'] = data_app_val.strftime('%Y-%m-%d')
                elif isinstance(data_app_val, str):
                    try:
                        dt_obj = datetime.strptime(data_app_val, '%d/%m/%Y')
                        row_dict['data_aplicacao'] = dt_obj.strftime('%Y-%m-%d')
                    except ValueError:
                        try:
                            datetime.strptime(data_app_val, '%Y-%m-%d')
                            # Se já estiver no formato YYYY-MM-DD, não faz nada
                        except ValueError:
                            row_dict['data_aplicacao'] = None # Formato não reconhecido
                else:
                    row_dict['data_aplicacao'] = None # Tipo inesperado
            else:
                row_dict['data_aplicacao'] = None # Valor original era nulo ou vazio

            if row_dict.get('data_provavel_parto') and isinstance(row_dict.get('data_provavel_parto'), date):
                row_dict['data_provavel_parto'] = row_dict.get('data_provavel_parto').strftime('%d/%m/%Y')
            
            dados_adolescentes.append(row_dict)

        return jsonify({
            'adolescentes': dados_adolescentes,
            'total': total_adolescentes,
            'page': page,
            'limit': limit,
            'pages': (total_adolescentes + limit - 1) // limit if total_adolescentes > 0 else 0
        })
    except Exception as e:
        print(f"Erro na API timeline_adolescentes: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/adolescente_detalhes_timeline/<co_cidadao>')
def api_adolescente_detalhes_timeline(co_cidadao):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Buscar detalhes básicos da adolescente em mv_plafam
        cur.execute("""
            SELECT m.nome_paciente, m.idade_calculada, m.microarea, m.nome_equipe, m.cartao_sus, m.nome_responsavel,
                   ag.nome_agente,
                   m.metodo, m.data_aplicacao, m.status_gravidez, m.data_provavel_parto -- Para status no modal 
            FROM sistemaaps.mv_plafam m
            LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
            WHERE m.cod_paciente = %s AND m.idade_calculada BETWEEN 14 AND 18
        """, (co_cidadao,))
        detalhes_mv = cur.fetchone()

        if not detalhes_mv:
            return jsonify({"erro": "Adolescente não encontrada ou fora da faixa etária."}), 404
        
        # O nome_responsavel agora vem diretamente de mv_plafam

        cur.execute("""
            SELECT co_abordagem, tipo_abordagem, resultado_abordagem, observacoes, data_acao, responsavel_pela_acao
            FROM sistemaaps.tb_plafam_adolescentes
            WHERE co_cidadao = %(co_cidadao)s
            ORDER BY data_acao DESC, co_abordagem DESC
        """, {'co_cidadao': co_cidadao})
        eventos_timeline_db = cur.fetchall()

        eventos_timeline = []
        for evento in eventos_timeline_db:
            evento_dict = dict(evento)
            if evento_dict['data_acao'] and isinstance(evento_dict['data_acao'], date):
                evento_dict['data_acao'] = evento_dict['data_acao'].strftime('%Y-%m-%d')
            eventos_timeline.append(evento_dict)

        detalhes_finais = dict(detalhes_mv)
        detalhes_finais['proxima_acao_data_formatada'] = None
        detalhes_finais['proxima_acao_descricao'] = None

        # Buscar a próxima ação futura específica para esta adolescente para o modal
        cur.execute("""
            SELECT tipo_abordagem, data_acao
            FROM sistemaaps.tb_plafam_adolescentes
            WHERE co_cidadao = %(co_cidadao)s 
              AND data_acao >= CURRENT_DATE  -- Mudança para >=
              AND resultado_abordagem IS NULL
            ORDER BY data_acao ASC
            LIMIT 1;
        """, {'co_cidadao': co_cidadao})
        proxima_acao_especifica = cur.fetchone()

        if proxima_acao_especifica:
            tipo_abordagem_map_py = {
                1: "Abordagem com pais", 2: "Abordagem direta com adolescente",
                3: "Consulta na UBS", 4: "Entrega de convite"
            }
            detalhes_finais['proxima_acao_data_formatada'] = proxima_acao_especifica['data_acao'].strftime('%d/%m/%Y')
            detalhes_finais['proxima_acao_descricao'] = tipo_abordagem_map_py.get(proxima_acao_especifica['tipo_abordagem'], 'Ação futura')       

        return jsonify({
            "detalhes": detalhes_finais,
            "eventos_timeline": eventos_timeline
        })

    except Exception as e:
        print(f"Erro em api_adolescente_detalhes_timeline: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/adolescente/registrar_acao', methods=['POST'])
def api_registrar_acao_adolescente():
    data = request.get_json()
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        co_cidadao = data['co_cidadao']
        nome_adolescente = data.get('nome_adolescente')
        nome_responsavel_atual = data.get('nome_responsavel_atual')
        acao_atual_payload = data['acao_atual']
        proxima_acao_payload = data.get('proxima_acao')

        # Obter o próximo valor para co_abordagem de forma segura para múltiplas inserções
        cur.execute("SELECT MAX(co_abordagem) FROM sistemaaps.tb_plafam_adolescentes")
        max_co_abordagem = cur.fetchone()[0]
        next_co_abordagem_counter = (max_co_abordagem + 1) if max_co_abordagem is not None else 1

        # --- Etapa 1: Lidar com a Ação Atual ---
        # Verificar se existe uma ação futura pendente para esta adolescente para ser atualizada
        cur.execute("""
            SELECT co_abordagem
            FROM sistemaaps.tb_plafam_adolescentes
            WHERE co_cidadao = %(co_cidadao)s 
              AND data_acao >= CURRENT_DATE 
              AND resultado_abordagem IS NULL  -- Adicionado: apenas ações futuras PENDENTES
            ORDER BY data_acao ASC, co_abordagem ASC -- Garante seleção consistente
            LIMIT 1;
        """, {'co_cidadao': co_cidadao})
        pending_future_action = cur.fetchone()

        if pending_future_action:
            co_abordagem_to_update = pending_future_action[0]
            # Atualizar a ação futura existente com os detalhes da "acao_atual"
            cur.execute("""
                UPDATE sistemaaps.tb_plafam_adolescentes
                SET tipo_abordagem = %(tipo_abordagem)s,
                    resultado_abordagem = %(resultado_abordagem)s,
                    observacoes = %(observacoes)s,
                    data_acao = %(data_acao)s, -- Data em que a ação foi efetivamente realizada
                    responsavel_pela_acao = %(responsavel_pela_acao)s,
                    metodo_desejado = %(metodo_desejado)s,
                    nome_responsavel = %(nome_responsavel)s, -- Atualiza nome do responsável
                    nome_adolescente = %(nome_adolescente)s -- Atualiza nome da adolescente
                WHERE co_abordagem = %(co_abordagem)s;
            """, {
                'tipo_abordagem': acao_atual_payload.get('tipo_abordagem'),
                'resultado_abordagem': acao_atual_payload.get('resultado_abordagem'),
                'observacoes': acao_atual_payload.get('observacoes'),
                'data_acao': acao_atual_payload.get('data_acao'),
                'responsavel_pela_acao': acao_atual_payload.get('responsavel_pela_acao'),
                'metodo_desejado': acao_atual_payload.get('metodo_desejado'),
                'nome_responsavel': nome_responsavel_atual,
                'nome_adolescente': nome_adolescente,
                'co_abordagem': co_abordagem_to_update
            })
        else:
            # Nenhuma ação futura pendente, então insere "acao_atual" como um novo registro
            cur.execute("""
                INSERT INTO sistemaaps.tb_plafam_adolescentes
                (co_abordagem, co_cidadao, nome_adolescente, nome_responsavel,
                 tipo_abordagem, resultado_abordagem, observacoes,
                 data_acao, responsavel_pela_acao, metodo_desejado)
                VALUES (%(co_abordagem)s, %(co_cidadao)s, %(nome_adolescente)s, %(nome_responsavel)s,
                        %(tipo_abordagem)s, %(resultado_abordagem)s, %(observacoes)s,
                        %(data_acao)s, %(responsavel_pela_acao)s, %(metodo_desejado)s);
            """, {
                'co_abordagem': next_co_abordagem_counter,
                'co_cidadao': co_cidadao,
                'nome_adolescente': nome_adolescente,
                'nome_responsavel': nome_responsavel_atual,
                'tipo_abordagem': acao_atual_payload.get('tipo_abordagem'),
                'resultado_abordagem': acao_atual_payload.get('resultado_abordagem'),
                'observacoes': acao_atual_payload.get('observacoes'),
                'data_acao': acao_atual_payload.get('data_acao'),
                'responsavel_pela_acao': acao_atual_payload.get('responsavel_pela_acao'),
                'metodo_desejado': acao_atual_payload.get('metodo_desejado')
            })
            next_co_abordagem_counter += 1 # Incrementar para a próxima possível inserção

        # --- Etapa 2: Lidar com a Próxima Ação (se fornecida) ---
        # Esta é sempre uma inserção de uma nova ação futura
        if proxima_acao_payload:
            cur.execute("""
                INSERT INTO sistemaaps.tb_plafam_adolescentes
                (co_abordagem, co_cidadao, nome_adolescente, nome_responsavel,
                 tipo_abordagem, resultado_abordagem, observacoes,
                 data_acao, responsavel_pela_acao, metodo_desejado)
                VALUES (%(co_abordagem)s, %(co_cidadao)s, %(nome_adolescente)s, %(nome_responsavel)s,
                        %(tipo_abordagem)s, %(resultado_abordagem)s, %(observacoes)s,
                        %(data_acao)s, %(responsavel_pela_acao)s, %(metodo_desejado)s);
            """, {
                'co_abordagem': next_co_abordagem_counter, # Usa o contador, possivelmente incrementado
                'co_cidadao': co_cidadao,
                'nome_adolescente': nome_adolescente,
                'nome_responsavel': nome_responsavel_atual,
                'tipo_abordagem': proxima_acao_payload.get('tipo_abordagem'),
                'resultado_abordagem': None, # Próxima ação não tem resultado ainda
                'observacoes': None, # Observação da nova ação futura será vazia/nula
                'data_acao': proxima_acao_payload.get('data_acao'), # Data futura
                'responsavel_pela_acao': proxima_acao_payload.get('responsavel_pela_acao'),
                'metodo_desejado': proxima_acao_payload.get('metodo_desejado')
            })

        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Ação(ões) registrada(s) com sucesso!"})
    except Exception as e:
        if conn: conn.rollback()
        print(f"Erro ao registrar ação do adolescente: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/graficos_painel_adolescentes')
def api_graficos_painel_adolescentes():
    equipe_req = request.args.get('equipe', 'Todas')
    # agente_selecionado_req = request.args.get('agente_selecionado', 'Todas') # Não usado para estes gráficos

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # --- Dados para Gráfico de Pizza (Distribuição da Equipe) ---
        # Contagem total por status para a equipe selecionada (ou todas)
        
        base_where_pizza = ["m.idade_calculada BETWEEN 14 AND 18"]
        params_pizza = {}
        if equipe_req != 'Todas':
            base_where_pizza.append("m.nome_equipe = %(equipe)s")
            params_pizza['equipe'] = equipe_req
        
        where_clause_pizza_str = " WHERE " + " AND ".join(base_where_pizza) if base_where_pizza else ""

        query_pizza_status = f"""
            SELECT 
                SUM(CASE WHEN m.status_gravidez = 'Grávida' THEN 1 ELSE 0 END) as gestantes,
                SUM(CASE WHEN (m.metodo IS NULL OR m.metodo = '') AND (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') THEN 1 ELSE 0 END) as sem_metodo,
                SUM(CASE WHEN 
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days')) OR
                                (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                            )) OR
                            (m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%')
                        )
                    THEN 1 ELSE 0 END) as metodo_em_dia
            FROM sistemaaps.mv_plafam m
            {where_clause_pizza_str};
        """
        cur.execute(query_pizza_status, params_pizza)
        dados_pizza = cur.fetchone()

        # --- Dados para Gráfico de Barras (Distribuição por Micro-área) ---
        # Contagem por status AGRUPADO POR MICROÁREA para a equipe selecionada (ou todas)
        
        dados_barras_db = []

        if equipe_req != 'Todas':
            # Query para agrupar por AGENTE (via microarea) DENTRO DA EQUIPE SELECIONADA
            base_where_barras_agente = ["m.idade_calculada BETWEEN 14 AND 18", "m.nome_equipe = %(equipe)s"]
            params_barras_agente = {'equipe': equipe_req}
            where_clause_barras_agente_str = " WHERE " + " AND ".join(base_where_barras_agente)

            query_barras_status_por_agente = f"""
            SELECT 
                m.microarea, ag.nome_agente,
                SUM(CASE WHEN m.status_gravidez = 'Grávida' THEN 1 ELSE 0 END) as gestantes,
                SUM(CASE WHEN (m.metodo IS NULL OR m.metodo = '') AND (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') THEN 1 ELSE 0 END) as sem_metodo,
                SUM(CASE WHEN 
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days')) OR
                                (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                            )) OR
                            (m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%')
                        )
                    THEN 1 ELSE 0 END) as metodo_em_dia
            FROM sistemaaps.mv_plafam m
            LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
            {where_clause_barras_agente_str}
            GROUP BY m.microarea, ag.nome_agente
            ORDER BY m.microarea, ag.nome_agente;
            """
            cur.execute(query_barras_status_por_agente, params_barras_agente)
            dados_barras_db = cur.fetchall()
        else: # "Todas as Equipes" selecionado
            # Query para agrupar por EQUIPE
            query_barras_status_por_equipe = f"""
            SELECT 
                m.nome_equipe,
                SUM(CASE WHEN m.status_gravidez = 'Grávida' THEN 1 ELSE 0 END) as gestantes,
                SUM(CASE WHEN (m.metodo IS NULL OR m.metodo = '') AND (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') THEN 1 ELSE 0 END) as sem_metodo,
                SUM(CASE WHEN 
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days')) OR
                                (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                (m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                            )) OR
                            (m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%')
                        )
                    THEN 1 ELSE 0 END) as metodo_em_dia
            FROM sistemaaps.mv_plafam m
            WHERE m.idade_calculada BETWEEN 14 AND 18 AND m.nome_equipe IS NOT NULL
            GROUP BY m.nome_equipe
            ORDER BY m.nome_equipe;
            """
            cur.execute(query_barras_status_por_equipe)
            dados_barras_db = cur.fetchall()
        
        dados_barras = []
        if dados_barras_db:
            for row in dados_barras_db:
                dados_barras.append(dict(row))

        return jsonify({
            "pizza_data": dict(dados_pizza) if dados_pizza else {},
            "bar_chart_data": dados_barras
        })

    except Exception as e:
        print(f"Erro ao buscar dados para gráficos de adolescentes: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=3030, host='0.0.0.0')
