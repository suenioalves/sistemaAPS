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

        equipe = request.args.get('equipe', 'Todas')
        page = int(request.args.get('page', 1))
        search_term = request.args.get('search', None) # Captura o termo de busca
        limit = 20
        offset = (page - 1) * limit

        query_params = {'limit': limit, 'offset': offset}
        count_params = {}

        # Query base com as colunas da sua view
        base_query = """
        SELECT
            nome_paciente, cartao_sus, idade_calculada, microarea,
            metodo, nome_equipe, data_aplicacao, status_gravidez, data_provavel_parto
        FROM
            sistemaaps.mv_plafam
        WHERE 1=1
        """
        
        count_query = "SELECT COUNT(*) FROM sistemaaps.mv_plafam WHERE 1=1"

        # Adiciona filtro de equipe se não for "Todas"
        if equipe != 'Todas':
            base_query += " AND nome_equipe = %(equipe)s"
            count_query += " AND nome_equipe = %(equipe)s"
            query_params['equipe'] = equipe
            count_params['equipe'] = equipe
        
        # Adiciona filtro de busca se um termo for fornecido
        if search_term:
            # unaccent() remove acentos. ILIKE é case-insensitive.
            # Nota: a extensão 'unaccent' precisa estar habilitada no seu PostgreSQL.
            # Se não estiver, execute: CREATE EXTENSION IF NOT EXISTS unaccent;
            search_filter = " AND unaccent(nome_paciente) ILIKE unaccent(%(search)s)"
            base_query += search_filter
            count_query += search_filter
            query_params['search'] = f"%{search_term}%"
            count_params['search'] = f"%{search_term}%"

        cur.execute(count_query, count_params)
        total_pacientes = cur.fetchone()[0]
        
        base_query += " ORDER BY nome_paciente LIMIT %(limit)s OFFSET %(offset)s"
        
        cur.execute(base_query, query_params)
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
            
            if linha_dict.get('gestante') == 'Grávida':
                linha_dict['gestante'] = True
            else:
                linha_dict['gestante'] = False

            resultados.append(linha_dict)

        return jsonify({
            'pacientes': resultados,
            'total': total_pacientes,
            'page': page,
            'limit': limit,
            'pages': (total_pacientes + limit - 1) // limit
        })

    except Exception as e:
        print(f"Erro ao conectar ou consultar o banco de dados: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
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
        cur.execute("SELECT DISTINCT nome_equipe FROM sistemaaps.mv_plafam WHERE nome_equipe IS NOT NULL ORDER BY nome_equipe")
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
