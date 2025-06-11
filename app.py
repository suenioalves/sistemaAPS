from flask import Flask, render_template, jsonify, request
import psycopg2
from datetime import date

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
        where_clauses.append("nome_equipe = %(equipe)s")
        query_params['equipe'] = equipe
    
    # Filtro de Busca por Nome
    if search_term:
        where_clauses.append("unaccent(nome_paciente) ILIKE unaccent(%(search)s)")
        query_params['search'] = f"%{search_term}%"

    # Filtro de Métodos Contraceptivos
    if metodos:
        where_clauses.append("metodo = ANY(%(metodos)s)")
        query_params['metodos'] = metodos
        
    # Filtro de Faixa Etária
    if faixas_etarias:
        age_conditions = []
        for faixa in faixas_etarias:
            min_age, max_age = faixa.split('-')
            age_conditions.append(f"idade_calculada BETWEEN {int(min_age)} AND {int(max_age)}")
        if age_conditions:
            where_clauses.append(f"({ ' OR '.join(age_conditions) })")

    # Filtro de Status de Acompanhamento
    if status_list:
        status_conditions = []
        if 'sem_metodo' in status_list:
            status_conditions.append("(metodo IS NULL OR metodo = '')")
        if 'gestante' in status_list:
            status_conditions.append("status_gravidez = 'Grávida'")
        if 'atrasado' in status_list:
            status_conditions.append("""
                (
                    ( (metodo ILIKE '%%mensal%%' OR metodo ILIKE '%%pílula%%') AND data_aplicacao < (CURRENT_DATE - INTERVAL '30 days') ) OR
                    ( metodo ILIKE '%%trimestral%%' AND data_aplicacao < (CURRENT_DATE - INTERVAL '90 days') )
                )
            """)
        if 'em_dia' in status_list:
            status_conditions.append("""
                (
                    ( (metodo ILIKE '%%mensal%%' OR metodo ILIKE '%%pílula%%') AND data_aplicacao >= (CURRENT_DATE - INTERVAL '30 days') ) OR
                    ( metodo ILIKE '%%trimestral%%' AND data_aplicacao >= (CURRENT_DATE - INTERVAL '90 days') ) OR
                    ( metodo ILIKE '%%diu%%' OR metodo ILIKE '%%implante%%' OR metodo ILIKE '%%laqueadura%%' )
                ) AND (status_gravidez IS NULL OR status_gravidez != 'Grávida')
            """)
        if status_conditions:
             where_clauses.append(f"({ ' OR '.join(status_conditions) })")

    # Lógica de Ordenação
    sort_mapping = {
        'nome_asc': 'nome_paciente ASC',
        'nome_desc': 'nome_paciente DESC',
        'idade_asc': 'idade_calculada ASC',
        'idade_desc': 'idade_calculada DESC',
        'metodo_asc': 'metodo ASC NULLS LAST',
        'status_asc': """
            CASE
                WHEN status_gravidez = 'Grávida' THEN 1
                WHEN ( (metodo ILIKE '%%mensal%%' OR metodo ILIKE '%%pílula%%') AND data_aplicacao < (CURRENT_DATE - INTERVAL '30 days') ) OR
                     ( metodo ILIKE '%%trimestral%%' AND data_aplicacao < (CURRENT_DATE - INTERVAL '90 days') ) THEN 2
                WHEN (metodo IS NULL OR metodo = '') THEN 3
                ELSE 4
            END ASC, nome_paciente ASC
        """
    }
    order_by_clause = " ORDER BY " + sort_mapping.get(sort_by, 'nome_paciente ASC')

    where_clause_str = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    return where_clause_str, order_by_clause, query_params


# --- Rotas do Aplicativo Flask ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/painel-plafam')
def painel_plafam():
    return render_template('Painel-Plafam.html')

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
            nome_paciente, cartao_sus, idade_calculada, microarea,
            metodo, nome_equipe, data_aplicacao, status_gravidez, data_provavel_parto
        FROM sistemaaps.mv_plafam
        """
        
        final_query = base_query + where_clause
        count_query = "SELECT COUNT(*) FROM sistemaaps.mv_plafam" + where_clause

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
            if linha_dict.get('data_aplicacao') and isinstance(linha_dict['data_aplicacao'], date):
                linha_dict['data_aplicacao'] = linha_dict['data_aplicacao'].strftime('%Y-%m-%d')
            if linha_dict.get('data_provavel_parto') and isinstance(linha_dict['data_provavel_parto'], date):
                linha_dict['data_provavel_parto'] = linha_dict['data_provavel_parto'].strftime('%d/%m/%Y')
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

        base_query = "SELECT nome_paciente, cartao_sus, idade_calculada, microarea, metodo, nome_equipe, data_aplicacao, status_gravidez, data_provavel_parto FROM sistemaaps.mv_plafam"
        
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

@app.route('/api/equipes')
def api_equipes():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # MODIFICADO: Conta pacientes por equipe e ordena
        cur.execute("""
            SELECT nome_equipe, COUNT(*) as total_pacientes
            FROM sistemaaps.mv_plafam
            WHERE nome_equipe IS NOT NULL
            GROUP BY nome_equipe
            ORDER BY total_pacientes DESC;
        """)
        # Retorna apenas o nome da equipe, mantendo a ordem
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

if __name__ == '__main__':
    app.run(debug=True, port=3030, host='0.0.0.0')
