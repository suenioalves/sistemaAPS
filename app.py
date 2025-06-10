from flask import Flask, render_template, jsonify
import psycopg2
from datetime import date # Importe date para usar CURRENT_DATE no Python (se necessário, mas o SQL já tem)

app = Flask(__name__)

# --- Configurações do Banco de Dados PostgreSQL ---
# SUBSTITUA ESTES DADOS PELOS SEUS REAIS.
DB_HOST = "localhost"
DB_PORT = "5433"
DB_NAME = "esus"
DB_USER = "postgres" # Seu usuário PostgreSQL
DB_PASS = "uJLV}8ELrFLH{TaC*?-g{IVgx7l" # Sua senha PostgreSQL

# Função para estabelecer a conexão com o banco de dados
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

@app.route('/teste-tabela')
def teste_tabela():
    return render_template('teste_tabela.html')


# Rota da API para buscar dados de pacientes de Planejamento Familiar do PostgreSQL
@app.route('/api/pacientes_plafam')
def api_pacientes_plafam():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # --- Nova query SQL: calcula a idade e retorna as colunas esperadas ---
        sql_query = """
        SELECT
            c.no_cidadao AS nome_paciente, -- Mantém o nome original como 'nome_paciente'
            c.nu_cns AS cartao_sus,       -- Mantém o cartão SUS original como 'cartao_sus'
            DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento))::int AS idade_calculada -- Idade calculada
        FROM
            tb_cidadao c
        WHERE
            c.st_ativo = 1 AND c.st_faleceu = 0
            AND c.no_sexo = 'FEMININO'
            AND (DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) >= 14
            AND DATE_PART('year', AGE(CURRENT_DATE, c.dt_nascimento)) <= 45)
        LIMIT 20; -- Limitar a 20 resultados para teste
        """
        cur.execute(sql_query)
        dados = cur.fetchall()

        colunas = [desc[0] for desc in cur.description]
        resultados = []
        for linha in dados:
            linha_dict = dict(zip(colunas, linha))
            
            # Adiciona as colunas estáticas que o frontend espera, mas que não vêm do SQL por enquanto
            linha_dict['metodo_atual'] = 'Pílula Anticoncepcional' # Exemplo estático
            linha_dict['data_aplicacao'] = date.today().strftime('%d/%m/%Y') # Exemplo estático (data atual)
            linha_dict['status_acompanhamento'] = 'Em dia' # Exemplo estático
            linha_dict['data_convite'] = date.today().strftime('%d/%m/%Y') # Exemplo estático
            linha_dict['status_convite'] = 'Convidado' # Exemplo estático
            
            resultados.append(linha_dict)

        return jsonify(resultados)
    except Exception as e:
        print(f"Erro ao conectar ou consultar o banco de dados: {e}")
        return jsonify({"erro": f"Não foi possível buscar dados: {e}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=3030, host='0.0.0.0')