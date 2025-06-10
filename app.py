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
        limit = 20
        offset = (page - 1) * limit

        query_params = {'limit': limit, 'offset': offset}
        count_params = {}

        # Query base com o nome da coluna CORRIGIDO para "microarea"
        base_query = """
        SELECT
            nome_paciente,
            cartao_sus,
            idade_calculada,
            microarea,
            metodo,
            nome_equipe
        FROM
            sistemaaps.mv_plafam
        """
        
        count_query = "SELECT COUNT(*) FROM sistemaaps.mv_plafam"

        if equipe != 'Todas':
            where_clause = " WHERE nome_equipe = %(equipe)s"
            base_query += where_clause
            count_query += where_clause
            query_params['equipe'] = equipe
            count_params['equipe'] = equipe

        cur.execute(count_query, count_params)
        total_pacientes = cur.fetchone()[0]
        
        base_query += " ORDER BY nome_paciente LIMIT %(limit)s OFFSET %(offset)s"
        
        cur.execute(base_query, query_params)
        dados = cur.fetchall()

        # Corrigido aqui também para corresponder ao novo nome da coluna
        colunas = [desc[0].replace('microarea', 'micro_area') for desc in cur.description]
        resultados = [dict(zip(colunas, linha)) for linha in dados]

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