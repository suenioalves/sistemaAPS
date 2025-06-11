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

        # Parâmetros da requisição
        equipe = request.args.get('equipe', 'Todas')
        page = int(request.args.get('page', 1))
        search_term = request.args.get('search', None)
        limit = 20
        offset = (page - 1) * limit

        # Parâmetros de Filtro
        metodos = request.args.getlist('metodo')
        faixas_etarias = request.args.getlist('faixa_etaria')
        status_list = request.args.getlist('status')

        query_params = {'limit': limit, 'offset': offset}
        
        # Base da query
        base_query = """
        SELECT
            nome_paciente, cartao_sus, idade_calculada, microarea,
            metodo, nome_equipe, data_aplicacao, status_gravidez, data_provavel_parto
        FROM
            sistemaaps.mv_plafam
        """
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
            # Garante que 'sem_metodo' não entre aqui
            metodos_filtrados = [m for m in metodos if m != 'sem_metodo']
            if metodos_filtrados:
                where_clauses.append("metodo ILIKE ANY(%(metodos)s)")
                query_params['metodos'] = [f'%{m}%' for m in metodos_filtrados]
            
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
                # Lógica para atrasado: método hormonal com mais de X dias
                status_conditions.append("""
                    (
                        ( (metodo ILIKE '%mensal%' OR metodo ILIKE '%pílula%') AND data_aplicacao < (CURRENT_DATE - INTERVAL '30 days') ) OR
                        ( metodo ILIKE '%trimestral%' AND data_aplicacao < (CURRENT_DATE - INTERVAL '90 days') )
                    )
                """)
            if 'em_dia' in status_list:
                 # Lógica para em dia: método de longa duração ou hormonal dentro do prazo
                status_conditions.append("""
                    (
                        ( (metodo ILIKE '%mensal%' OR metodo ILIKE '%pílula%') AND data_aplicacao >= (CURRENT_DATE - INTERVAL '30 days') ) OR
                        ( metodo ILIKE '%trimestral%' AND data_aplicacao >= (CURRENT_DATE - INTERVAL '90 days') ) OR
                        ( metodo ILIKE '%diu%' OR metodo ILIKE '%implante%' OR metodo ILIKE '%laqueadura%' )
                    ) AND (status_gravidez IS NULL OR status_gravidez != 'Grávida')
                """)
            if status_conditions:
                 where_clauses.append(f"({ ' OR '.join(status_conditions) })")

        # Monta a query final
        final_query = base_query
        if where_clauses:
            final_query += " WHERE " + " AND ".join(where_clauses)
        
        # A query de contagem deve ter os mesmos filtros
        count_query = final_query.replace(
            'SELECT\n            nome_paciente, cartao_sus, idade_calculada, microarea,\n            metodo, nome_equipe, data_aplicacao, status_gravidez, data_provavel_parto', 
            'SELECT COUNT(*)'
        )
        
        # Copia os parâmetros para a query de contagem, removendo os de paginação
        count_params = query_params.copy()
        if 'limit' in count_params: del count_params['limit']
        if 'offset' in count_params: del count_params['offset']

        cur.execute(count_query, count_params)
        total_pacientes = cur.fetchone()[0]
        
        final_query += " ORDER BY nome_paciente LIMIT %(limit)s OFFSET %(offset)s"
        
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
