from flask import Flask, render_template, jsonify, request, Response
import psycopg2
import psycopg2.extras # Adicionado para DictCursor
from datetime import date, datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
import tempfile
from docxtpl import DocxTemplate
import os
# Importação do docx2pdf será feita condicionalmente dentro da função

# Global map for action types
TIPO_ACAO_MAP_PY = {
    1: "Solicitar MRPA",
    2: "Avaliar MRPA",
    3: "Modificar tratamento",
    4: "Solicitar Exames",
    5: "Avaliar Exames",
    6: "Avaliar RCV",
    7: "Encaminhar para nutrição",
    8: "Registrar consulta nutrição",
    9: "Agendar Hiperdia"
}
# Função auxiliar para conversão segura para float
def safe_float_conversion(value):
    try:
        if value is None:
            return None
        return float(value)
    except (ValueError, TypeError):
        print(f"Warning: Could not convert value '{value}' to float. Returning None.")
        return None
 
app = Flask(__name__)

# --- Configurações do Banco de Dados PostgreSQL ---
DB_HOST = "localhost"
DB_PORT = "5433"
DB_NAME = "esus"
DB_USER = "postgres"
DB_PASS = "EUC[x*x~Mc#S+H_Ui#xZBr0O~"

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
    status_timeline = args.get('status_timeline', 'Todos')  # Novo filtro para as abas
    sort_by = args.get('sort_by', 'nome_asc')
    
    # Filtros de aplicação
    aplicacao_data_inicial = args.get('aplicacao_data_inicial')
    aplicacao_data_final = args.get('aplicacao_data_final')
    aplicacao_metodo = args.get('aplicacao_metodo', 'trimestral')

    print(f"DEBUG: status_timeline recebido: {status_timeline}")

    query_params = {}
    where_clauses = []

    # Filtro de Equipe
    if equipe != 'Todas':
        where_clauses.append("m.nome_equipe = %(equipe)s")
        query_params['equipe'] = equipe
    
    # Filtro de Microárea
    microarea = args.get('microarea', 'Todas as áreas')
    if microarea != 'Todas as áreas':
        if ' - ' in microarea:
            parts = microarea.split(' - ', 1)
            micro_area_str = parts[0].replace('Área ', '').strip()
        else:
            micro_area_str = microarea.replace('Área ', '').strip()
        
        if micro_area_str:
            where_clauses.append("m.microarea = %(microarea)s")
            query_params['microarea'] = micro_area_str
    
    # Filtro de Busca por Nome
    if search_term:
        where_clauses.append("UPPER(m.nome_paciente) LIKE UPPER(%(search)s)")
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

    # Filtro de Status das Abas (status_timeline)
    if status_timeline != 'Todos':
        print(f"DEBUG: Aplicando filtro status_timeline: {status_timeline}")
        if status_timeline == 'SemMetodo':
            where_clauses.append("(m.metodo IS NULL OR m.metodo = '')")
            print("DEBUG: Adicionado filtro SemMetodo")
        elif status_timeline == 'Gestante':
            where_clauses.append("m.status_gravidez = 'Grávida'")
            print("DEBUG: Adicionado filtro Gestante")
        elif status_timeline == 'MetodoVencido':
            where_clauses.append("""
                (
                    (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                        ( (m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '30 days') ) OR
                        ( m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days') )
                    ))
                )
            """)
            print("DEBUG: Adicionado filtro MetodoVencido")
        elif status_timeline == 'MetodoEmDia':
            where_clauses.append("""
                (
                    (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                        ( (m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days') ) OR
                        ( m.metodo ILIKE '%%trimestral%%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days') )
                    )) OR
                    ( m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%' )
                ) AND (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida')
            """)
            print("DEBUG: Adicionado filtro MetodoEmDia")

    # Filtro de Status de Acompanhamento (mantido para compatibilidade)
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

    # Filtro de Controle de Aplicações
    if aplicacao_data_inicial and aplicacao_data_final and aplicacao_metodo == 'trimestral':
        # Para o trimestral, buscar pacientes cuja próxima aplicação deve ocorrer no período escolhido
        # Se o usuário escolheu o período 01/10/2025 a 10/10/2025
        # Devemos buscar pacientes cuja aplicação + 90 dias está entre 01/10/2025 e 10/10/2025
        where_clauses.append("""
            (
                m.metodo ILIKE '%%trimestral%%' AND
                m.data_aplicacao IS NOT NULL AND
                m.data_aplicacao != '' AND
                (TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') + INTERVAL '90 days') BETWEEN 
                    TO_DATE(%(aplicacao_data_inicial)s, 'YYYY-MM-DD') AND
                    TO_DATE(%(aplicacao_data_final)s, 'YYYY-MM-DD')
            )
        """)
        query_params['aplicacao_data_inicial'] = aplicacao_data_inicial
        query_params['aplicacao_data_final'] = aplicacao_data_final
        print(f"DEBUG: Adicionado filtro de aplicações - Data inicial: {aplicacao_data_inicial}, Data final: {aplicacao_data_final}")

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
    
    print(f"DEBUG: where_clause_str final: {where_clause_str}")
    print(f"DEBUG: query_params: {query_params}")
    
    return where_clause_str, order_by_clause, query_params

# --- Rotas do Aplicativo Flask ---
@app.route('/') # Rota para a página inicial
def home():
    return render_template('index.html')

@app.route('/painel-plafam')
def painel_plafam():
    return render_template('Painel-Plafam.html')

@app.route('/painel-adolescentes')
def painel_adolescentes():
    return render_template('painel-adolescentes.html')

@app.route('/painel-hiperdia-has')
def painel_hiperdia_has():
    return render_template('painel-hiperdia-has.html')


@app.route('/api/pacientes_plafam')
def api_pacientes_plafam():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))  # Limite configurável, padrão 10
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

@app.route('/api/estatisticas_painel_plafam')
def api_estatisticas_painel_plafam():
    equipe_req = request.args.get('equipe', 'Todas')
    microarea_req = request.args.get('microarea', 'Todas as áreas')

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # --- Total de Mulheres (14-45 anos) ---
        query_mulheres_base = "SELECT COUNT(DISTINCT m.cod_paciente) FROM sistemaaps.mv_plafam m "
        
        # Cláusulas e parâmetros base para filtros de idade, equipe E área/agente
        base_where_clauses = ["m.idade_calculada BETWEEN 14 AND 45"]
        base_params = []

        if equipe_req != 'Todas':
            base_where_clauses.append("m.nome_equipe = %s")
            base_params.append(equipe_req)

        if microarea_req != 'Todas as áreas':
            if ' - ' in microarea_req:
                parts = microarea_req.split(' - ', 1)
                micro_area_str = parts[0].replace('Área ', '').strip()
            else:
                micro_area_str = microarea_req.replace('Área ', '').strip()
            
            if micro_area_str:
                base_where_clauses.append("m.microarea = %s")
                base_params.append(micro_area_str)

        query_total_mulheres_final = query_mulheres_base + " WHERE " + " AND ".join(base_where_clauses)
        cur.execute(query_total_mulheres_final, tuple(base_params))
        total_mulheres = cur.fetchone()[0] or 0

        # --- Mulheres (14-45) SEM MÉTODO ---
        where_clauses_sem_metodo = list(base_where_clauses)
        condicao_sem_metodo = "(m.metodo IS NULL OR m.metodo = '')"
        where_clauses_sem_metodo.append(condicao_sem_metodo)
        query_mulheres_sem_metodo_final = query_mulheres_base + " WHERE " + " AND ".join(where_clauses_sem_metodo)
        cur.execute(query_mulheres_sem_metodo_final, tuple(base_params))
        mulheres_sem_metodo_count = cur.fetchone()[0] or 0
        
        # --- Mulheres (14-45) GESTANTES ---
        where_clauses_gestantes = list(base_where_clauses)
        condicao_gestantes = "m.status_gravidez = 'Grávida'"
        where_clauses_gestantes.append(condicao_gestantes)
        query_mulheres_gestantes_final = query_mulheres_base + " WHERE " + " AND ".join(where_clauses_gestantes)
        cur.execute(query_mulheres_gestantes_final, tuple(base_params))
        mulheres_gestantes_count = cur.fetchone()[0] or 0

        # --- Mulheres (14-45) COM MÉTODO EM DIA ---
        where_clauses_metodo_em_dia = list(base_where_clauses)
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
        query_mulheres_metodo_em_dia_final = query_mulheres_base + " WHERE " + " AND ".join(where_clauses_metodo_em_dia)
        cur.execute(query_mulheres_metodo_em_dia_final, tuple(base_params))
        mulheres_com_metodo_em_dia_count = cur.fetchone()[0] or 0

        # --- Mulheres (14-45) COM MÉTODO ATRASADO ---
        where_clauses_metodo_atrasado = list(base_where_clauses)
        condicao_metodo_atrasado = """
        (
            (m.metodo IS NOT NULL AND m.metodo != '') AND 
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
        query_mulheres_metodo_atrasado_final = query_mulheres_base + " WHERE " + " AND ".join(where_clauses_metodo_atrasado)
        cur.execute(query_mulheres_metodo_atrasado_final, tuple(base_params))
        mulheres_com_metodo_atrasado_count = cur.fetchone()[0] or 0

        return jsonify({
            "total_adolescentes": total_mulheres,  # Mantém o nome para compatibilidade com o frontend
            "adolescentes_sem_metodo": mulheres_sem_metodo_count,
            "adolescentes_com_metodo_atrasado": mulheres_com_metodo_atrasado_count,
            "adolescentes_gestantes": mulheres_gestantes_count,
            "adolescentes_metodo_em_dia": mulheres_com_metodo_em_dia_count
        })
    except Exception as e:
        print(f"Erro ao buscar estatísticas do painel Plafam: {e}")
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
    proxima_acao = args.get('proxima_acao', 'all')

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
        where_clauses.append("(UPPER(m.nome_paciente) LIKE UPPER(%(search_timeline)s) OR UPPER(m.nome_responsavel) LIKE UPPER(%(search_timeline)s))")
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

    # Filtro por próxima ação
    if proxima_acao != 'all':
        try:
            tipo_acao = int(proxima_acao)
            where_clauses.append("pa_futura.tipo_abordagem = %(proxima_acao_tipo)s")
            query_params['proxima_acao_tipo'] = tipo_acao
        except (ValueError, TypeError):
            pass  # Ignorar valores inválidos

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
    return where_clause_str, order_by_clause, query_params, proxima_acao

@app.route('/api/timeline_adolescentes')
def api_timeline_adolescentes(): # Rota para a timeline de adolescentes
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        page = int(request.args.get('page_timeline', 1))
        limit = int(request.args.get('limit', 10)) # Limite de 10 por página (padrão)
        offset = (page - 1) * limit

        where_clause, order_by_clause, query_params, proxima_acao = build_timeline_query_filters(request.args)

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

        # Para contagem, usar FROM clause completo se filtro de próxima ação for aplicado
        if proxima_acao != 'all':
            from_clause_for_count = from_join_clause
        else:
            # FROM clause simplificado para a contagem, para evitar problemas de performance
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
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
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
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
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
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
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


# --- Funções e Rotas para o Painel Hiperdia HAS ---

@app.route('/api/equipes_microareas_hiperdia')
def api_equipes_microareas_hiperdia():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Etapa 1: Buscar equipes, suas microáreas distintas e contagem de pacientes
        cur.execute("""
            SELECT 
                nome_equipe, 
                array_agg(DISTINCT microarea ORDER BY microarea ASC) as microareas_list,
                COUNT(DISTINCT cod_paciente) as total_pacientes_hipertensos
            FROM sistemaaps.mv_hiperdia_hipertensao
            WHERE nome_equipe IS NOT NULL AND microarea IS NOT NULL
            GROUP BY nome_equipe
            ORDER BY total_pacientes_hipertensos DESC, nome_equipe ASC;
        """)
        equipes_com_microareas = cur.fetchall()

        resultado_final = []
        for equipe_row in equipes_com_microareas:
            equipe_nome = equipe_row["nome_equipe"]
            
            # Etapa 2: Para cada equipe, buscar os agentes associados às suas microáreas
            # Usamos as microáreas da mv_hiperdia_hipertensao para garantir que só listamos agentes
            # de microáreas que de fato têm pacientes hipertensos naquela equipe.
            cur.execute("""
                SELECT DISTINCT ta.micro_area, ta.nome_agente
                FROM sistemaaps.tb_agentes ta
                WHERE ta.nome_equipe = %s AND ta.micro_area IN (
                    SELECT DISTINCT mh.microarea 
                    FROM sistemaaps.mv_hiperdia_hipertensao mh 
                    WHERE mh.nome_equipe = %s AND mh.microarea IS NOT NULL
                )
                ORDER BY ta.micro_area, ta.nome_agente;
            """, (equipe_nome, equipe_nome))
            agentes_db = cur.fetchall()
            agentes_formatados = [{"micro_area": ag["micro_area"], "nome_agente": ag["nome_agente"]} for ag in agentes_db]

            resultado_final.append({
                "nome_equipe": equipe_nome,
                "agentes": agentes_formatados, # Similar ao painel adolescentes
                "num_pacientes": equipe_row["total_pacientes_hipertensos"]
            })
        return jsonify(resultado_final)
    except Exception as e:
        print(f"Erro ao buscar equipes e microáreas para Hiperdia HAS: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


def build_hiperdia_has_filters(args):
    equipe = args.get('equipe', 'Todas')
    microarea_selecionada = args.get('microarea', 'Todas') # 'Todas' ou o número da microárea
    search_term = args.get('search', None)
    sort_by = args.get('sort_by', 'proxima_acao_asc') # Exemplo de ordenação padrão
    status_filter = args.get('status', 'Todos') # Novo filtro de status

    query_params = {}
    where_clauses = []
    # O filtro de status foi removido pois a coluna 'status_controle' não existe na view.

    if equipe != 'Todas':
        where_clauses.append("m.nome_equipe = %(equipe)s") # Adicionado alias 'm.'
        query_params['equipe'] = equipe

    # Tratamento para microarea_selecionada (pode ser "Área X - Agente Y" ou "Área X")
    if microarea_selecionada != 'Todas' and microarea_selecionada and microarea_selecionada != 'Todas as áreas':
        if ' - ' in microarea_selecionada:
            micro_area_str = microarea_selecionada.split(' - ')[0].replace('Área ', '').strip()
        else:
            micro_area_str = microarea_selecionada.replace('Área ', '').strip()
        
        if micro_area_str:
            where_clauses.append("m.microarea = %(microarea)s") # Adicionado alias 'm.'
            query_params['microarea'] = micro_area_str

    if search_term:
        where_clauses.append("UPPER(m.nome_paciente) LIKE UPPER(%(search)s)") # Adicionado alias 'm.'
        query_params['search'] = f"%{search_term}%"


    # Mapeamento de ordenação (pode ser expandido)
    sort_mapping = {
        'nome_asc': 'nome_paciente ASC',
        'nome_desc': 'nome_paciente DESC',
        'idade_asc': 'idade_calculada ASC',
        'idade_desc': 'idade_calculada DESC',
        'proxima_acao_asc': 'data_proxima_acao_ordenacao ASC NULLS LAST, m.nome_paciente ASC', # Adicionado para consistência
        'proxima_acao_desc': 'data_proxima_acao_ordenacao DESC NULLS FIRST, m.nome_paciente DESC'
    }
    order_by_clause = " ORDER BY " + sort_mapping.get(sort_by, 'data_proxima_acao_ordenacao ASC NULLS LAST, m.nome_paciente ASC') # Adicionado alias 'm.'
    
    return where_clauses, order_by_clause, query_params, status_filter

@app.route('/api/pacientes_hiperdia_has')
def api_pacientes_hiperdia_has():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10)) # Padrão de 10, mas pode ser alterado pelo frontend
        offset = (page - 1) * limit

        where_clauses, order_by_clause, query_params, status_filter = build_hiperdia_has_filters(request.args)
        
        fields = """
            m.cod_paciente, m.nome_paciente, m.cartao_sus, m.idade_calculada, m.nome_equipe, m.microarea,
            m.dt_nascimento, m.situacao_problema, ag.nome_agente,
            pa_futura.data_agendamento AS data_proxima_acao_ordenacao,
            pa_futura.cod_acao AS tipo_proxima_acao_ordenacao,
            tratamento.tratamento_atual,
            ultima_mrpa.mrpa_atual,
            exames.exames_atuais
        """
        from_join_clause = """
        FROM sistemaaps.mv_hiperdia_hipertensao m
        LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
        LEFT JOIN LATERAL (
            SELECT STRING_AGG(
                '<b>' || med.nome_medicamento || '</b> (' || 
                CASE 
                    WHEN med.dose IS NOT NULL AND med.frequencia IS NOT NULL 
                    THEN med.dose || ' comprimido(s) - ' || med.frequencia || 'x ao dia'
                    WHEN med.frequencia IS NOT NULL 
                    THEN med.frequencia || 'x ao dia'
                    ELSE 'Conforme prescrição'
                END || ')' || 
                CASE 
                    WHEN med.data_inicio IS NOT NULL 
                    THEN ' - ' || TO_CHAR(med.data_inicio, 'DD/MM/YYYY')
                    ELSE ''
                END,
                '<br>'
                ORDER BY 
                    CASE WHEN med.data_inicio IS NOT NULL THEN med.data_inicio ELSE '1900-01-01'::date END DESC, 
                    med.nome_medicamento
            ) AS tratamento_atual
            FROM sistemaaps.tb_hiperdia_has_medicamentos med
            WHERE med.codcidadao = m.cod_paciente 
              AND (med.data_fim IS NULL OR med.data_fim > CURRENT_DATE)
        ) tratamento ON TRUE
        LEFT JOIN LATERAL (
            SELECT mrpa.media_pa_sistolica || 'x' || mrpa.media_pa_diastolica || 'mmHg' AS mrpa_atual
            FROM sistemaaps.tb_hiperdia_mrpa mrpa
            JOIN sistemaaps.tb_hiperdia_has_acompanhamento ac ON mrpa.cod_acompanhamento = ac.cod_acompanhamento
            WHERE ac.cod_cidadao = m.cod_paciente
            ORDER BY mrpa.data_mrpa DESC
            LIMIT 1
        ) ultima_mrpa ON TRUE
        LEFT JOIN LATERAL (
            SELECT STRING_AGG(ex.nome_procedimento || ': ' || ex.resultado_exame, '<br>' ORDER BY ex.data_exame DESC) AS exames_atuais
            FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY co_proced ORDER BY data_exame DESC) as rn FROM sistemaaps.mv_hiperdia_exames WHERE co_seq_cidadao = m.cod_paciente AND co_proced IN (4500, 4507, 199)) ex
            WHERE ex.rn = 1
        ) exames ON TRUE
        LEFT JOIN LATERAL (
            SELECT data_agendamento, cod_acao  
            FROM sistemaaps.tb_hiperdia_has_acompanhamento 
            WHERE cod_cidadao = m.cod_paciente 
              AND status_acao = 'PENDENTE'
              AND data_agendamento >= CURRENT_DATE 
            ORDER BY data_agendamento ASC  
            LIMIT 1
        ) pa_futura ON TRUE
        """

        # Adiciona o filtro de status aqui, onde pa_futura está disponível
        if status_filter == 'AcoesPendentes':
            where_clauses.append("pa_futura.data_agendamento IS NOT NULL")
        elif status_filter == 'ComTratamento':
            where_clauses.append("tratamento.tratamento_atual IS NOT NULL AND TRIM(tratamento.tratamento_atual) != ''")

        where_clause_str = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Executa a contagem primeiro, com todos os filtros aplicados
        count_query = f"SELECT COUNT(*) {from_join_clause} {where_clause_str}"
        cur.execute(count_query, query_params)
        total_pacientes = cur.fetchone()[0] or 0

        # Agora, executa a busca paginada
        query_params_paginated = query_params.copy()
        query_params_paginated['limit'] = limit
        query_params_paginated['offset'] = offset
        final_query = f"SELECT {fields} {from_join_clause} {where_clause_str} {order_by_clause} LIMIT %(limit)s OFFSET %(offset)s"
        cur.execute(final_query, query_params_paginated)
        
        pacientes = [dict(row) for row in cur.fetchall()]

        for p in pacientes: # Formatar datas se necessário
            if p.get('dt_nascimento') and isinstance(p['dt_nascimento'], date):
                p['dt_nascimento'] = p['dt_nascimento'].strftime('%d/%m/%Y')

            # Formatar próxima ação para o frontend
            if p.get('data_proxima_acao_ordenacao') and isinstance(p['data_proxima_acao_ordenacao'], date):
                p['proxima_acao_data_formatada'] = p['data_proxima_acao_ordenacao'].strftime('%d/%m/%Y')
                p['proxima_acao_descricao'] = TIPO_ACAO_MAP_PY.get(p['tipo_proxima_acao_ordenacao'], 'Ação futura')
            else:
                p['proxima_acao_data_formatada'] = None
                p['proxima_acao_descricao'] = None


        return jsonify({
            'pacientes': pacientes,
            'total': total_pacientes,
            'page': page,
            'limit': limit,
            'pages': (total_pacientes + limit - 1) // limit if total_pacientes > 0 else 0
        })
    except Exception as e:
        print(f"Erro na API /api/pacientes_hiperdia_has: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route('/api/get_total_hipertensos')
def api_get_total_hipertensos():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        where_clauses, _, query_params, status_filter = build_hiperdia_has_filters(request.args)

        # Para a contagem, precisamos do JOIN LATERAL se o filtro for 'AcoesPendentes' ou 'ComTratamento'
        from_join_clause = """
        FROM sistemaaps.mv_hiperdia_hipertensao m
        LEFT JOIN LATERAL (
            SELECT data_agendamento
            FROM sistemaaps.tb_hiperdia_has_acompanhamento
            WHERE cod_cidadao = m.cod_paciente
              AND status_acao = 'PENDENTE'
              AND data_agendamento >= CURRENT_DATE
            ORDER BY data_agendamento ASC
            LIMIT 1
        ) pa_futura ON TRUE
        LEFT JOIN LATERAL (
            SELECT STRING_AGG(
                '<b>' || med.nome_medicamento || '</b> (' || 
                CASE 
                    WHEN med.dose IS NOT NULL AND med.frequencia IS NOT NULL 
                    THEN med.dose || ' comprimido(s) - ' || med.frequencia || 'x ao dia'
                    WHEN med.frequencia IS NOT NULL 
                    THEN med.frequencia || 'x ao dia'
                    ELSE 'Conforme prescrição'
                END || ')' || 
                CASE 
                    WHEN med.data_inicio IS NOT NULL 
                    THEN ' - ' || TO_CHAR(med.data_inicio, 'DD/MM/YYYY')
                    ELSE ''
                END,
                '<br>'
                ORDER BY 
                    CASE WHEN med.data_inicio IS NOT NULL THEN med.data_inicio ELSE '1900-01-01'::date END DESC, 
                    med.nome_medicamento
            ) AS tratamento_atual
            FROM sistemaaps.tb_hiperdia_has_medicamentos med
            WHERE med.codcidadao = m.cod_paciente 
              AND (med.data_fim IS NULL OR med.data_fim > CURRENT_DATE)
        ) tratamento ON TRUE
        """
        if status_filter == 'AcoesPendentes':
            where_clauses.append("pa_futura.data_agendamento IS NOT NULL")
        elif status_filter == 'ComTratamento':
            where_clauses.append("tratamento.tratamento_atual IS NOT NULL AND TRIM(tratamento.tratamento_atual) != ''")
        where_clause = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        count_query = f"SELECT COUNT(*) {from_join_clause} {where_clause}"
        cur.execute(count_query, query_params)
        total_pacientes = cur.fetchone()[0] or 0

        return jsonify({'total_pacientes': total_pacientes})

    except Exception as e:
        print(f"Erro na API /api/get_total_hipertensos: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/get_hipertensos_mrpa_pendente')
def api_get_hipertensos_mrpa_pendente():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        where_clauses, _, query_params, status_filter = build_hiperdia_has_filters(request.args)
        # Condição para QUALQUER ação pendente
        pendente_condition = "EXISTS (SELECT 1 FROM sistemaaps.tb_hiperdia_has_acompanhamento ha WHERE ha.cod_cidadao = m.cod_paciente AND ha.status_acao = 'PENDENTE')"
        
        # Adiciona a condição de ação pendente à lista de condições existentes
        where_clauses.append(pendente_condition)

        # Constrói a string final da cláusula WHERE
        final_where_clause = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        base_query = "FROM sistemaaps.mv_hiperdia_hipertensao m"
        # Conta pacientes distintos para não contar o mesmo paciente várias vezes se ele tiver múltiplas ações pendentes
        count_query = "SELECT COUNT(DISTINCT m.cod_paciente) " + base_query + final_where_clause
        cur.execute(count_query, query_params)
        total_pacientes = cur.fetchone()[0] or 0

        return jsonify({'total_pacientes': total_pacientes})

    except Exception as e:
        app.logger.exception(f"Erro na API /api/get_hipertensos_acoes_pendentes: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route('/api/hiperdia/timeline/<int:cod_cidadao>')
def api_hiperdia_timeline(cod_cidadao):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        period_filter = request.args.get('period', 'all') # Novo: Captura o filtro de período

        # Query base para buscar todas as ações de um paciente
        base_sql_query = """
            SELECT 
                ac.cod_acompanhamento, ac.cod_cidadao, ac.cod_acao, ta.dsc_acao,
                ac.status_acao,
                ac.responsavel_pela_acao,
                ac.data_realizacao,
                ac.data_agendamento,
                ac.observacoes,
                re.colesterol_total, re.hdl, re.ldl, re.triglicerideos, re.glicemia_jejum, 
                re.hemoglobina_glicada, re.ureia, re.creatinina, re.sodio, re.potassio, re.acido_urico,
                tr.tipo_ajuste, tr.medicamentos_novos,
                rcv.idade, rcv.sexo, rcv.tabagismo, rcv.diabetes, rcv.colesterol_total as rcv_colesterol, rcv.pressao_sistolica,
                mrpa.media_pa_sistolica, mrpa.media_pa_diastolica, mrpa.analise_mrpa,
                nu.peso, nu.imc, nu.circunferencia_abdominal, nu.orientacoes_nutricionais,
                next_ac.cod_acao AS next_action_cod,
                next_ac.data_agendamento AS next_action_date
            FROM 
                sistemaaps.tb_hiperdia_has_acompanhamento ac
            JOIN 
                sistemaaps.tb_hiperdia_tipos_acao ta ON ac.cod_acao = ta.cod_acao
            LEFT JOIN
                sistemaaps.tb_hiperdia_resultados_exames re ON ac.cod_acompanhamento = re.cod_acompanhamento
            LEFT JOIN
                sistemaaps.tb_hiperdia_tratamento tr ON ac.cod_acompanhamento = tr.cod_acompanhamento
            LEFT JOIN
                sistemaaps.tb_hiperdia_risco_cv rcv ON ac.cod_acompanhamento = rcv.cod_acompanhamento
            LEFT JOIN
                sistemaaps.tb_hiperdia_nutricao nu ON ac.cod_acompanhamento = nu.cod_acompanhamento
            LEFT JOIN
                sistemaaps.tb_hiperdia_mrpa mrpa ON ac.cod_acompanhamento = mrpa.cod_acompanhamento
            LEFT JOIN LATERAL (
                SELECT ha_next.cod_acao, ha_next.data_agendamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento ha_next
                WHERE ha_next.cod_acao_origem = ac.cod_acompanhamento
                  AND ha_next.status_acao = 'PENDENTE'
                  AND ha_next.data_agendamento >= CURRENT_DATE
                ORDER BY ha_next.data_agendamento ASC
                LIMIT 1
            ) next_ac ON TRUE
        """
        
        where_clauses = ["ac.cod_cidadao = %(cod_cidadao)s"]
        query_params = {'cod_cidadao': cod_cidadao}

        # Adiciona o filtro de período à cláusula WHERE
        if period_filter != 'all':
            try:
                days = int(period_filter.replace('d', ''))
                where_clauses.append(f"COALESCE(ac.data_realizacao, ac.data_agendamento) >= CURRENT_DATE - INTERVAL '{days} days'")
            except ValueError:
                # Se o filtro for inválido, ignora
                pass

        where_clause_str = " WHERE " + " AND ".join(where_clauses)
        order_by_clause = """
            ORDER BY
                COALESCE(ac.data_realizacao, ac.data_agendamento) DESC, ac.cod_acompanhamento DESC;
        """

        final_query = base_sql_query + where_clause_str + order_by_clause
        cur.execute(final_query, query_params)

        eventos = []
        for row in cur.fetchall():
            evento = {
                'cod_acompanhamento': row['cod_acompanhamento'],
                'cod_cidadao': row['cod_cidadao'],
                'cod_acao': row['cod_acao'],
                'dsc_acao': row['dsc_acao'],
                'status_acao': row['status_acao'],
                'responsavel_pela_acao': row['responsavel_pela_acao'], # Adicionado aqui
                'data_realizacao': row['data_realizacao'].strftime('%Y-%m-%d') if row['data_realizacao'] else None, # Adicionado aqui
                'data_agendamento': row['data_agendamento'].strftime('%Y-%m-%d') if row['data_agendamento'] else None,
                'observacoes': row['observacoes'],
            }
            # Se for uma avaliação de exames e houver resultados, agrupa-os
            # Checa se pelo menos um dos campos de exame foi preenchido
            if row['cod_acao'] == 5 and any([
                row['colesterol_total'] is not None,
                row['hdl'] is not None,
                row['ldl'] is not None,
                row['triglicerideos'] is not None,
                row['glicemia_jejum'] is not None,
                row['hemoglobina_glicada'] is not None,
                row['ureia'] is not None,
                row['creatinina'] is not None,
                row['sodio'] is not None,
                row['potassio'] is not None,
                row['acido_urico'] is not None
            ]):
                evento['resultados_exames'] = {
                    'colesterol_total': row['colesterol_total'], 'hdl': row['hdl'], 'ldl': row['ldl'],
                    'triglicerideos': row['triglicerideos'], 'glicemia_jejum': row['glicemia_jejum'],
                    'hemoglobina_glicada': safe_float_conversion(row['hemoglobina_glicada']),
                    'ureia': row['ureia'], 'creatinina': safe_float_conversion(row['creatinina']),
                    'sodio': row['sodio'], 'potassio': safe_float_conversion(row['potassio']),
                    'acido_urico': safe_float_conversion(row['acido_urico']),
                }
            # Se for uma modificação de tratamento e houver dados, agrupa-os
            if row['cod_acao'] == 3 and row['tipo_ajuste'] is not None:
                evento['treatment_modification'] = {
                    'tipo_ajuste': row['tipo_ajuste'],
                    'medicamentos_novos': row['medicamentos_novos'],
                }
            # Se for uma avaliação de RCV e houver dados, agrupa-os
            if row['cod_acao'] == 6 and row['idade'] is not None:
                evento['risk_assessment_details'] = {
                    'idade': row['idade'],
                    'sexo': row['sexo'],
                    'tabagismo': row['tabagismo'],
                    'diabetes': row['diabetes'],
                    'colesterol_total': row['rcv_colesterol'],
                    'pressao_sistolica': row['pressao_sistolica'],
                }
            # Se for um registro de consulta de nutrição e houver dados, agrupa-os
            if row['cod_acao'] == 8 and row['peso'] is not None:
                evento['nutrition_details'] = {
                    'peso': safe_float_conversion(row['peso']),
                    'imc': safe_float_conversion(row['imc']),
                    'circunferencia_abdominal': row['circunferencia_abdominal'],
                    'orientacoes_nutricionais': row['orientacoes_nutricionais'],
                }
            # Se for uma avaliação de MRPA e houver dados, agrupa-os
            if row['cod_acao'] == 2 and row['media_pa_sistolica'] is not None:
                evento['mrpa_details'] = {
                    'media_pa_sistolica': row['media_pa_sistolica'],
                    'media_pa_diastolica': row['media_pa_diastolica'],
                    'analise_mrpa': row['analise_mrpa'],
                }

            eventos.append(evento)
        
        return jsonify(eventos)

    except Exception as e:
        print(f"Erro na API /api/hiperdia/timeline: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/cancelar_acao/<int:cod_acompanhamento>', methods=['POST'])
def api_cancelar_acao_hiperdia(cod_acompanhamento):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Primeiro, buscar informações da ação para identificar referências posteriores
        cur.execute("""
            SELECT cod_cidadao, cod_acao, status_acao, cod_acao_origem
            FROM sistemaaps.tb_hiperdia_has_acompanhamento
            WHERE cod_acompanhamento = %(cod_acompanhamento)s
        """, {'cod_acompanhamento': cod_acompanhamento})
        
        acao_info = cur.fetchone()
        if not acao_info:
            conn.rollback()
            return jsonify({"sucesso": False, "erro": "Ação não encontrada."}), 404

        cod_cidadao, cod_acao, status_acao, cod_acao_origem = acao_info

        # Se a ação não estiver pendente, não permitir cancelamento
        if status_acao != 'PENDENTE':
            conn.rollback()
            return jsonify({"sucesso": False, "erro": "Apenas ações pendentes podem ser canceladas."}), 400

        # Buscar todas as ações posteriores que referenciam esta ação
        cur.execute("""
            SELECT cod_acompanhamento, cod_acao, status_acao
            FROM sistemaaps.tb_hiperdia_has_acompanhamento
            WHERE cod_acao_origem = %(cod_acompanhamento)s
            ORDER BY cod_acompanhamento ASC
        """, {'cod_acompanhamento': cod_acompanhamento})
        
        acoes_posteriores = cur.fetchall()

        # Iniciar transação para remoção em cascata
        try:
            # 1. Remover dados relacionados à ação principal (se existirem)
            # Remover dados de MRPA
            cur.execute("""
                DELETE FROM sistemaaps.tb_hiperdia_mrpa
                WHERE cod_acompanhamento = %(cod_acompanhamento)s
            """, {'cod_acompanhamento': cod_acompanhamento})

            # Remover dados de tratamento
            cur.execute("""
                DELETE FROM sistemaaps.tb_hiperdia_tratamento
                WHERE cod_acompanhamento = %(cod_acompanhamento)s
            """, {'cod_acompanhamento': cod_acompanhamento})

            # Remover dados de resultados de exames
            cur.execute("""
                DELETE FROM sistemaaps.tb_hiperdia_resultados_exames
                WHERE cod_acompanhamento = %(cod_acompanhamento)s
            """, {'cod_acompanhamento': cod_acompanhamento})

            # Remover dados de risco cardiovascular
            cur.execute("""
                DELETE FROM sistemaaps.tb_hiperdia_risco_cv
                WHERE cod_acompanhamento = %(cod_acompanhamento)s
            """, {'cod_acompanhamento': cod_acompanhamento})

            # Remover dados de nutrição
            cur.execute("""
                DELETE FROM sistemaaps.tb_hiperdia_nutricao
                WHERE cod_acompanhamento = %(cod_acompanhamento)s
            """, {'cod_acompanhamento': cod_acompanhamento})

            # 2. Remover ações posteriores em cascata (recursivamente)
            for acao_posterior in acoes_posteriores:
                cod_acompanhamento_posterior = acao_posterior[0]
                
                # Remover dados relacionados à ação posterior
                cur.execute("""
                    DELETE FROM sistemaaps.tb_hiperdia_mrpa
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s
                """, {'cod_acompanhamento': cod_acompanhamento_posterior})

                cur.execute("""
                    DELETE FROM sistemaaps.tb_hiperdia_tratamento
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s
                """, {'cod_acompanhamento': cod_acompanhamento_posterior})

                cur.execute("""
                    DELETE FROM sistemaaps.tb_hiperdia_resultados_exames
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s
                """, {'cod_acompanhamento': cod_acompanhamento_posterior})

                cur.execute("""
                    DELETE FROM sistemaaps.tb_hiperdia_risco_cv
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s
                """, {'cod_acompanhamento': cod_acompanhamento_posterior})

                cur.execute("""
                    DELETE FROM sistemaaps.tb_hiperdia_nutricao
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s
                """, {'cod_acompanhamento': cod_acompanhamento_posterior})

                # Remover a ação posterior
                cur.execute("""
                    DELETE FROM sistemaaps.tb_hiperdia_has_acompanhamento
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s
                """, {'cod_acompanhamento': cod_acompanhamento_posterior})

            # 3. Finalmente, remover a ação principal
            cur.execute("""
                DELETE FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_acompanhamento = %(cod_acompanhamento)s
            """, {'cod_acompanhamento': cod_acompanhamento})

            # Verificar se alguma linha foi realmente removida
            if cur.rowcount == 0:
                conn.rollback()
                return jsonify({"sucesso": False, "erro": "Ação não encontrada para remoção."}), 404

            conn.commit()
            
            # Contar quantas ações foram removidas
            total_removidas = 1 + len(acoes_posteriores)  # ação principal + ações posteriores
            
            mensagem = f"Ação e {len(acoes_posteriores)} ação(ões) posterior(es) removida(s) com sucesso!"
            if len(acoes_posteriores) == 0:
                mensagem = "Ação removida com sucesso!"
            
            return jsonify({
                "sucesso": True, 
                "mensagem": mensagem,
                "acoes_removidas": total_removidas
            })

        except Exception as e:
            conn.rollback()
            print(f"Erro durante a remoção em cascata: {e}")
            return jsonify({"sucesso": False, "erro": f"Erro durante a remoção: {str(e)}"}), 500

    except Exception as e:
        if conn: conn.rollback()
        print(f"Erro ao cancelar ação do Hiperdia: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/pending_action/<int:cod_cidadao>/<int:cod_acao>', methods=['GET'])
def api_hiperdia_pending_action_by_type(cod_cidadao, cod_acao):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        cur.execute("""
            SELECT cod_acompanhamento, cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao
            FROM sistemaaps.tb_hiperdia_has_acompanhamento
            WHERE cod_cidadao = %(cod_cidadao)s
              AND cod_acao = %(cod_acao)s
              AND status_acao = 'PENDENTE'
            ORDER BY data_agendamento ASC
            LIMIT 1;
        """, {'cod_cidadao': cod_cidadao, 'cod_acao': cod_acao})
        
        pending_action = cur.fetchone()

        if pending_action:
            # Format dates for consistency with frontend
            action_dict = dict(pending_action)
            if action_dict.get('data_agendamento') and isinstance(action_dict['data_agendamento'], date):
                action_dict['data_agendamento'] = action_dict['data_agendamento'].strftime('%Y-%m-%d')
            if action_dict.get('data_realizacao') and isinstance(action_dict['data_realizacao'], date):
                action_dict['data_realizacao'] = action_dict['data_realizacao'].strftime('%Y-%m-%d')
            return jsonify(action_dict)
        else:
            return jsonify({"message": "No pending action found."}), 404

    except Exception as e:
        print(f"Erro ao buscar ação pendente por tipo: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/latest_pending_action/<int:cod_cidadao>/<int:cod_acao>', methods=['GET'])
def api_hiperdia_latest_pending_action_by_type(cod_cidadao, cod_acao):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        cur.execute("""
            SELECT cod_acompanhamento, cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao
            FROM sistemaaps.tb_hiperdia_has_acompanhamento
            WHERE cod_cidadao = %(cod_cidadao)s
              AND cod_acao = %(cod_acao)s
              AND status_acao = 'PENDENTE'
            ORDER BY data_agendamento DESC, cod_acompanhamento DESC
            LIMIT 1;
        """, {'cod_cidadao': cod_cidadao, 'cod_acao': cod_acao})
        
        latest_pending_action = cur.fetchone()

        if latest_pending_action:
            # Format dates for consistency with frontend
            action_dict = dict(latest_pending_action)
            if action_dict.get('data_agendamento') and isinstance(action_dict['data_agendamento'], date):
                action_dict['data_agendamento'] = action_dict['data_agendamento'].strftime('%Y-%m-%d')
            if action_dict.get('data_realizacao') and isinstance(action_dict['data_realizacao'], date):
                action_dict['data_realizacao'] = action_dict['data_realizacao'].strftime('%Y-%m-%d')
            return jsonify(action_dict)
        else:
            return jsonify({"message": "No latest pending action found."}), 404

    except Exception as e:
        print(f"Erro ao buscar a ação pendente mais recente por tipo: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/update_acao/<int:cod_acompanhamento>', methods=['PUT'])
def api_hiperdia_update_acao(cod_acompanhamento):
    data = request.get_json()
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cod_cidadao = data.get('cod_cidadao')
        cod_acao_atual = data.get('cod_acao_atual')
        data_acao_atual_str = data.get('data_acao_atual')
        observacoes_atuais = data.get('observacoes')
        responsavel_pela_acao = data.get('responsavel_pela_acao')
        status_acao = data.get('status_acao', 'REALIZADA') # Default to REALIZADA for updates

        print(f"[LOG] Iniciando api_hiperdia_update_acao - cod_acompanhamento: {cod_acompanhamento}, cod_acao_atual: {cod_acao_atual}")
        print(f"[LOG] Dados recebidos: {data}")

        if not all([cod_cidadao, cod_acao_atual, data_acao_atual_str]):
            print(f"[LOG] Dados incompletos - cod_cidadao: {cod_cidadao}, cod_acao_atual: {cod_acao_atual}, data_acao_atual_str: {data_acao_atual_str}")
            return jsonify({"sucesso": False, "erro": "Dados incompletos para atualização."}), 400

        data_realizacao_acao = datetime.strptime(data_acao_atual_str, '%Y-%m-%d').date()

        # Update the main accompaniment record
        sql_update_acompanhamento = """
            UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
            SET status_acao = %(status_acao)s,
                data_realizacao = %(data_realizacao)s,
                observacoes = %(observacoes)s,
                responsavel_pela_acao = %(responsavel_pela_acao)s
            WHERE cod_acompanhamento = %(cod_acompanhamento)s
            RETURNING cod_acompanhamento;
        """
        print(f"[LOG] Executando UPDATE na tabela tb_hiperdia_has_acompanhamento")
        cur.execute(sql_update_acompanhamento, {
            'status_acao': status_acao,
            'data_realizacao': data_realizacao_acao,
            'observacoes': observacoes_atuais,
            'responsavel_pela_acao': responsavel_pela_acao,
            'cod_acompanhamento': cod_acompanhamento
        })
        updated_row = cur.fetchone()
        if not updated_row:
            print(f"[LOG] ERRO: Ação de acompanhamento não encontrada para atualização")
            return jsonify({"sucesso": False, "erro": "Ação de acompanhamento não encontrada para atualização."}), 404
        
        cod_acompanhamento_atualizado = updated_row[0]
        print(f"[LOG] Ação atualizada com sucesso - cod_acompanhamento: {cod_acompanhamento_atualizado}")

        # Handle specific data based on action type
        if int(cod_acao_atual) == 3: # Modificar tratamento
            print(f"[LOG] Processando Modificar tratamento (cod_acao = 3)")
            treatment_data = data.get('treatment_modification')
            if not treatment_data:
                return jsonify({"sucesso": False, "erro": "Dados da modificação de tratamento não fornecidos."}), 400
            
            # Check if a treatment record already exists for this cod_acompanhamento
            cur.execute("SELECT 1 FROM sistemaaps.tb_hiperdia_tratamento WHERE cod_acompanhamento = %s", (cod_acompanhamento_atualizado,))
            exists = cur.fetchone()

            if exists:
                sql_upsert_tratamento = """
                    UPDATE sistemaaps.tb_hiperdia_tratamento
                    SET tipo_ajuste = %(tipo_ajuste)s,
                        medicamentos_novos = %(medicamentos_novos)s,
                        data_modificacao = %(data_modificacao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                """
            else:
                sql_upsert_tratamento = """
                    INSERT INTO sistemaaps.tb_hiperdia_tratamento
                    (cod_acompanhamento, tipo_ajuste, medicamentos_novos, data_modificacao)
                    VALUES (%(cod_acompanhamento)s, %(tipo_ajuste)s, %(medicamentos_novos)s, %(data_modificacao)s);
                """
            cur.execute(sql_upsert_tratamento, {
                'cod_acompanhamento': cod_acompanhamento_atualizado,
                'tipo_ajuste': treatment_data.get('tipo_ajuste'),
                'medicamentos_novos': treatment_data.get('medicamentos_novos'),
                'data_modificacao': data_realizacao_acao
            })

        elif int(cod_acao_atual) == 2: # Avaliar MRPA
            print(f"[LOG] Processando Avaliar MRPA (cod_acao = 2)")
            
            # Verificar se há dados da avaliação do MRPA (aceitar ambas as chaves)
            mrpa_assessment_data = data.get('mrpa_assessment_data') or data.get('mrpa_results')
            if not mrpa_assessment_data:
                print(f"[LOG] ERRO: Dados da avaliação do MRPA não fornecidos")
                return jsonify({"sucesso": False, "erro": "Dados da avaliação do MRPA não fornecidos."}), 400
            
            print(f"[LOG] Dados da avaliação do MRPA recebidos: {mrpa_assessment_data}")
            
            # Buscar ação pendente de "Avaliar MRPA" para este paciente
            cur.execute('''
                SELECT cod_acompanhamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_cidadao = %(cod_cidadao)s
                    AND cod_acao = 2
                    AND status_acao = 'PENDENTE'
                ORDER BY data_agendamento ASC
                LIMIT 1;
            ''', {'cod_cidadao': cod_cidadao})
            pending_mrpa = cur.fetchone()

            if pending_mrpa:
                # Se existe uma ação pendente, atualizar ela
                cod_acompanhamento_realizado = pending_mrpa[0]
                print(f"[LOG] Atualizando ação pendente de Avaliar MRPA - cod_acompanhamento: {cod_acompanhamento_realizado}")
                cur.execute('''
                    UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                    SET status_acao = 'REALIZADA',
                        data_realizacao = %(data_realizacao)s,
                        observacoes = %(observacoes)s,
                        responsavel_pela_acao = %(responsavel_pela_acao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                ''', {
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes_atuais,
                    'responsavel_pela_acao': responsavel_pela_acao,
                    'cod_acompanhamento': cod_acompanhamento_realizado
                })
                print(f"[LOG] Ação pendente de Avaliar MRPA atualizada para REALIZADA")
            else:
                # Se não existe ação pendente, criar uma nova ação realizada
                print(f"[LOG] Criando nova ação de Avaliar MRPA")
                cur.execute('''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, 2, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, %(observacoes)s, %(responsavel_pela_acao)s)
                    RETURNING cod_acompanhamento;
                ''', {
                    'cod_cidadao': cod_cidadao,
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes_atuais,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                cod_acompanhamento_realizado = cur.fetchone()[0]
                print(f"[LOG] Nova ação de Avaliar MRPA criada - cod_acompanhamento: {cod_acompanhamento_realizado}")

            # Mapear os campos do frontend para o formato esperado pelo banco
            mapped_data = {
                'pressao_sistolica': mrpa_assessment_data.get('media_pa_sistolica') or mrpa_assessment_data.get('pressao_sistolica'),
                'pressao_diastolica': mrpa_assessment_data.get('media_pa_diastolica') or mrpa_assessment_data.get('pressao_diastolica'),
                'frequencia_cardiaca': mrpa_assessment_data.get('frequencia_cardiaca', 0),
                'decisao_tratamento': mrpa_assessment_data.get('decision') or mrpa_assessment_data.get('decisao_tratamento', ''),
                'observacoes': mrpa_assessment_data.get('analise_mrpa') or mrpa_assessment_data.get('observacoes', '')
            }
            
            # Salvar os dados da avaliação do MRPA
            print(f"[LOG] Salvando dados da avaliação do MRPA na tabela tb_hiperdia_mrpa")
            sql_insert_mrpa = """
                INSERT INTO sistemaaps.tb_hiperdia_mrpa
                (cod_acompanhamento, data_mrpa, media_pa_sistolica, media_pa_diastolica, analise_mrpa)
                VALUES (%(cod_acompanhamento)s, %(data_mrpa)s, %(media_pa_sistolica)s, %(media_pa_diastolica)s, %(analise_mrpa)s);
            """
            params = {
                'cod_acompanhamento': cod_acompanhamento_realizado,
                'data_mrpa': data_realizacao_acao,
                'media_pa_sistolica': mapped_data.get('pressao_sistolica'),
                'media_pa_diastolica': mapped_data.get('pressao_diastolica'),
                'analise_mrpa': mapped_data.get('observacoes')
            }
            cur.execute(sql_insert_mrpa, params)
            print(f"[LOG] Dados da avaliação do MRPA salvos com sucesso")
            
            # Verificar se a decisão é "Manter tratamento" e criar "Solicitar Exames" se for
            decisao_tratamento = mrpa_assessment_data.get('decision', '').lower()
            if 'manter' in decisao_tratamento or 'maintain' in decisao_tratamento or 'manter tratamento' in decisao_tratamento:
                print(f"[LOG] Decisão é 'Manter tratamento'. Criando ação 'Solicitar Exames' automaticamente.")
                
                # Criar ação futura "Solicitar Exames" (pendente) para hoje
                cod_proxima_acao_pendente = 4 # Solicitar Exames
                data_agendamento_proxima = data_realizacao_acao # Mesma data (hoje)
                sql_insert_pendente = '''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Solicitação de exames após avaliação do MRPA com decisão de manter tratamento.', %(responsavel_pela_acao)s);
                '''
                cur.execute(sql_insert_pendente, {
                    'cod_cidadao': cod_cidadao,
                    'cod_acao': cod_proxima_acao_pendente,
                    'data_agendamento': data_agendamento_proxima,
                    'cod_acao_origem': cod_acompanhamento_realizado,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                print(f"[LOG] Ação futura 'Solicitar Exames' criada automaticamente")
            elif 'modificar' in decisao_tratamento or 'modify' in decisao_tratamento or 'modificar tratamento' in decisao_tratamento:
                print(f"[LOG] Decisão é 'Modificar tratamento'. Criando ação 'Modificar tratamento' automaticamente.")
                
                # Criar ação futura "Modificar tratamento" (pendente) para hoje
                cod_proxima_acao_pendente = 3 # Modificar tratamento
                data_agendamento_proxima = data_realizacao_acao # Mesma data (hoje)
                sql_insert_pendente = '''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Tratamento a ser modificado conforme avaliação do MRPA.', %(responsavel_pela_acao)s);
                '''
                cur.execute(sql_insert_pendente, {
                    'cod_cidadao': cod_cidadao,
                    'cod_acao': cod_proxima_acao_pendente,
                    'data_agendamento': data_agendamento_proxima,
                    'cod_acao_origem': cod_acompanhamento_realizado,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                print(f"[LOG] Ação futura 'Modificar tratamento' criada automaticamente")
            else:
                print(f"[LOG] Decisão não reconhecida: '{decisao_tratamento}'. Não será criada ação automática.")

        elif int(cod_acao_atual) == 5: # Avaliar Exames
            print(f"[LOG] Processando Avaliar Exames (cod_acao = 5) - buscando ação pendente existente")
            
            # Verificar se há dados dos resultados dos exames
            lab_exam_results = data.get('lab_exam_results')
            if not lab_exam_results:
                print(f"[LOG] ERRO: Resultados dos exames não fornecidos")
                return jsonify({"sucesso": False, "erro": "Resultados dos exames não fornecidos."}), 400
            
            print(f"[LOG] Dados dos resultados dos exames recebidos: {lab_exam_results}")
            
            # Validação dos campos numéricos para evitar overflow
            if lab_exam_results.get('potassio') and float(lab_exam_results.get('potassio', 0)) > 99.9:
                return jsonify({"sucesso": False, "erro": "Valor do potássio não pode ser maior que 99.9."}), 400
            
            if lab_exam_results.get('hemoglobina_glicada') and float(lab_exam_results.get('hemoglobina_glicada', 0)) > 99.99:
                return jsonify({"sucesso": False, "erro": "Valor da hemoglobina glicada não pode ser maior que 99.99."}), 400
            
            if lab_exam_results.get('creatinina') and float(lab_exam_results.get('creatinina', 0)) > 99.99:
                return jsonify({"sucesso": False, "erro": "Valor da creatinina não pode ser maior que 99.99."}), 400
            
            if lab_exam_results.get('acido_urico') and float(lab_exam_results.get('acido_urico', 0)) > 99.99:
                return jsonify({"sucesso": False, "erro": "Valor do ácido úrico não pode ser maior que 99.99."}), 400
            
            # Buscar ação pendente de "Avaliar Exames" para este paciente
            cur.execute('''
                SELECT cod_acompanhamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_cidadao = %(cod_cidadao)s
                    AND cod_acao = 5
                    AND status_acao = 'PENDENTE'
                ORDER BY data_agendamento ASC
                LIMIT 1;
            ''', {'cod_cidadao': cod_cidadao})
            pending_exames = cur.fetchone()

            if pending_exames:
                # Se existe uma ação pendente, atualizar ela
                cod_acompanhamento_realizado = pending_exames[0]
                print(f"[LOG] Atualizando ação pendente de Avaliar Exames - cod_acompanhamento: {cod_acompanhamento_realizado}")
                cur.execute('''
                    UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                    SET status_acao = 'REALIZADA',
                        data_realizacao = %(data_realizacao)s,
                        observacoes = %(observacoes)s,
                        responsavel_pela_acao = %(responsavel_pela_acao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                ''', {
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes_atuais,
                    'responsavel_pela_acao': responsavel_pela_acao,
                    'cod_acompanhamento': cod_acompanhamento_realizado
                })
                print(f"[LOG] Ação pendente de Avaliar Exames atualizada para REALIZADA")
            else:
                # Se não existe ação pendente, criar uma nova ação realizada
                print(f"[LOG] Criando nova ação de Avaliar Exames")
                cur.execute('''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, 5, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, %(observacoes)s, %(responsavel_pela_acao)s)
                    RETURNING cod_acompanhamento;
                ''', {
                    'cod_cidadao': cod_cidadao,
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes_atuais,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                cod_acompanhamento_realizado = cur.fetchone()[0]
                print(f"[LOG] Nova ação de Avaliar Exames criada - cod_acompanhamento: {cod_acompanhamento_realizado}")

            # Salvar os dados dos resultados dos exames
            print(f"[LOG] Salvando dados dos resultados dos exames na tabela tb_hiperdia_resultados_exames")
            cur.execute("SELECT 1 FROM sistemaaps.tb_hiperdia_resultados_exames WHERE cod_acompanhamento = %s", (cod_acompanhamento_realizado,))
            exists = cur.fetchone()

            if exists:
                sql_upsert_exames = """
                    UPDATE sistemaaps.tb_hiperdia_resultados_exames
                    SET data_avaliacao = %(data_avaliacao)s, colesterol_total = %(colesterol_total)s, hdl = %(hdl)s, 
                        ldl = %(ldl)s, triglicerideos = %(triglicerideos)s, glicemia_jejum = %(glicemia_jejum)s, 
                        hemoglobina_glicada = %(hemoglobina_glicada)s, ureia = %(ureia)s, creatinina = %(creatinina)s, 
                        sodio = %(sodio)s, potassio = %(potassio)s, acido_urico = %(acido_urico)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                """
            else:
                sql_upsert_exames = """
                    INSERT INTO sistemaaps.tb_hiperdia_resultados_exames
                    (cod_acompanhamento, data_avaliacao, colesterol_total, hdl, ldl, triglicerideos, glicemia_jejum, hemoglobina_glicada, ureia, creatinina, sodio, potassio, acido_urico)
                    VALUES (%(cod_acompanhamento)s, %(data_avaliacao)s, %(colesterol_total)s, %(hdl)s, %(ldl)s, %(triglicerideos)s, %(glicemia_jejum)s, %(hemoglobina_glicada)s, %(ureia)s, %(creatinina)s, %(sodio)s, %(potassio)s, %(acido_urico)s);
                """
            params = {'cod_acompanhamento': cod_acompanhamento_realizado, 'data_avaliacao': data_realizacao_acao}
            params.update(lab_exam_results)
            cur.execute(sql_upsert_exames, params)
            print(f"[LOG] Dados dos resultados dos exames salvos com sucesso")

            # Criar automaticamente "Avaliar RCV" (cod_acao = 6) como PENDENTE
            print(f"[LOG] Criando ação 'Avaliar RCV' automaticamente")
            cod_proxima_acao_pendente = 6 # Avaliar RCV
            data_agendamento_proxima = data_realizacao_acao # Mesma data (hoje)
            sql_insert_pendente = '''
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Avaliação de Risco Cardiovascular após análise dos exames.', %(responsavel_pela_acao)s);
            '''
            cur.execute(sql_insert_pendente, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_proxima_acao_pendente,
                'data_agendamento': data_agendamento_proxima,
                'cod_acao_origem': cod_acompanhamento_realizado,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            print(f"[LOG] Ação futura 'Avaliar RCV' criada automaticamente")

        elif int(cod_acao_atual) == 8: # Registrar consulta nutrição
            print(f"[LOG] Processando Registrar consulta nutrição (cod_acao = 8)")
            nutrition_data = data.get('nutrition_data')
            if not nutrition_data:
                return jsonify({"sucesso": False, "erro": "Dados da consulta de nutrição não fornecidos."}), 400
            # Buscar ação pendente de "Registrar consulta nutrição" para este paciente
            cur.execute('''
                SELECT cod_acompanhamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_cidadao = %(cod_cidadao)s
                  AND cod_acao = 8
                  AND status_acao = 'PENDENTE'
                ORDER BY data_agendamento ASC
                LIMIT 1;
            ''', {'cod_cidadao': cod_cidadao})
            pending_nutricao = cur.fetchone()
            if pending_nutricao:
                # Se existe uma ação pendente, atualizar ela
                cod_acompanhamento_realizado = pending_nutricao[0]
                cur.execute('''
                    UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                    SET status_acao = 'REALIZADA',
                        data_realizacao = %(data_realizacao)s,
                        observacoes = %(observacoes)s,
                        responsavel_pela_acao = %(responsavel_pela_acao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                ''', {
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes_atuais,
                    'responsavel_pela_acao': responsavel_pela_acao,
                    'cod_acompanhamento': cod_acompanhamento_realizado
                })
                # Atualiza/insere dados na tabela de nutrição
                cur.execute("SELECT 1 FROM sistemaaps.tb_hiperdia_nutricao WHERE cod_acompanhamento = %s", (cod_acompanhamento_realizado,))
                exists = cur.fetchone()
                if exists:
                    sql_upsert_nutricao = """
                        UPDATE sistemaaps.tb_hiperdia_nutricao
                        SET data_avaliacao = %(data_avaliacao)s, peso = %(peso)s, imc = %(imc)s, 
                            circunferencia_abdominal = %(circunferencia_abdominal)s, orientacoes_nutricionais = %(orientacoes_nutricionais)s
                        WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                    """
                else:
                    sql_upsert_nutricao = """
                    INSERT INTO sistemaaps.tb_hiperdia_nutricao
                    (cod_acompanhamento, data_avaliacao, peso, imc, circunferencia_abdominal, orientacoes_nutricionais)
                    VALUES (%(cod_acompanhamento)s, %(data_avaliacao)s, %(peso)s, %(imc)s, %(circunferencia_abdominal)s, %(orientacoes_nutricionais)s);
                """
                params = {'cod_acompanhamento': cod_acompanhamento_realizado, 'data_avaliacao': data_realizacao_acao}
                params.update(nutrition_data)
                cur.execute(sql_upsert_nutricao, params)
                # Criar ação futura "Agendar Hiperdia" (pendente) para daqui a 1 ano
                cod_proxima_acao_pendente = 9 # Agendar Hiperdia
                data_agendamento_proxima = data_realizacao_acao + timedelta(days=365)
                sql_insert_pendente = '''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, '<span style="color: #1e40af; font-weight: bold;">Hiperdia concluído!</span> Agendar novo hiperdia para daqui 6 meses há 1 ano, conforme seja necessário.', %(responsavel_pela_acao)s);
                '''
                cur.execute(sql_insert_pendente, {
                    'cod_cidadao': cod_cidadao,
                    'cod_acao': cod_proxima_acao_pendente,
                    'data_agendamento': data_agendamento_proxima,
                    'cod_acao_origem': cod_acompanhamento_realizado,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
            else:
                print(f"[LOG] Nenhuma ação pendente de Registrar Nutrição encontrada para atualizar. Nenhuma nova ação será criada.")

        elif int(cod_acao_atual) == 4: # Solicitar Exames
            print(f"[LOG] Processando Solicitar Exames (cod_acao = 4)")
            
            # Buscar ação pendente de "Solicitar Exames" para este paciente
            cur.execute('''
                SELECT cod_acompanhamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_cidadao = %(cod_cidadao)s
                    AND cod_acao = 4
                    AND status_acao = 'PENDENTE'
                ORDER BY data_agendamento ASC
                LIMIT 1;
            ''', {'cod_cidadao': cod_cidadao})
            pending_exames = cur.fetchone()

            if pending_exames:
                # Se existe uma ação pendente, atualizar ela
                cod_acompanhamento_realizado = pending_exames[0]
                print(f"[LOG] Atualizando ação pendente de Solicitar Exames - cod_acompanhamento: {cod_acompanhamento_realizado}")
                cur.execute('''
                    UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                    SET status_acao = 'REALIZADA',
                        data_realizacao = %(data_realizacao)s,
                        observacoes = %(observacoes)s,
                        responsavel_pela_acao = %(responsavel_pela_acao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                ''', {
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao,
                    'cod_acompanhamento': cod_acompanhamento_realizado
                })
                print(f"[LOG] Ação pendente de Solicitar Exames atualizada para REALIZADA")
            else:
                # Se não existe ação pendente, criar uma nova ação realizada
                print(f"[LOG] Criando nova ação de Solicitar Exames")
                cur.execute('''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, 4, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, %(observacoes)s, %(responsavel_pela_acao)s)
                    RETURNING cod_acompanhamento;
                ''', {
                    'cod_cidadao': cod_cidadao,
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                cod_acompanhamento_realizado = cur.fetchone()[0]
                print(f"[LOG] Nova ação de Solicitar Exames criada - cod_acompanhamento: {cod_acompanhamento_realizado}")

            # Criar automaticamente "Avaliar Exames" (cod_acao = 5) como PENDENTE
            print(f"[LOG] Criando ação 'Avaliar Exames' automaticamente")
            cod_proxima_acao_pendente = 5 # Avaliar Exames
            data_agendamento_proxima = data_realizacao_acao + timedelta(days=7) # 7 dias para aguardar os exames
            sql_insert_pendente = '''
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Avaliação dos exames solicitados após 7 dias.', %(responsavel_pela_acao)s);
            '''
            cur.execute(sql_insert_pendente, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_proxima_acao_pendente,
                'data_agendamento': data_agendamento_proxima,
                'cod_acao_origem': cod_acompanhamento_realizado,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            print(f"[LOG] Ação futura 'Avaliar Exames' criada automaticamente para 7 dias")

        elif int(cod_acao_atual) == 6: # Avaliar RCV
            print(f"[LOG] Processando Avaliar RCV (cod_acao = 6) - atualizando ação existente")
            
            # Verificar se há dados da avaliação de RCV
            risk_assessment_data = data.get('risk_assessment_data')
            if not risk_assessment_data:
                print(f"[LOG] ERRO: Dados da avaliação de RCV não fornecidos")
                return jsonify({"sucesso": False, "erro": "Dados da avaliação de RCV não fornecidos."}), 400
            
            print(f"[LOG] Dados da avaliação de RCV recebidos: {risk_assessment_data}")
            
            # CORREÇÃO: Usar diretamente o cod_acompanhamento passado como parâmetro
            # em vez de fazer uma nova busca por ações pendentes
            cod_acompanhamento_realizado = cod_acompanhamento_atualizado
            print(f"[LOG] Usando cod_acompanhamento existente: {cod_acompanhamento_realizado}")

            # Salvar os dados do RCV
            print(f"[LOG] Salvando dados do RCV na tabela tb_hiperdia_risco_cv")
            cur.execute("SELECT 1 FROM sistemaaps.tb_hiperdia_risco_cv WHERE cod_acompanhamento = %s", (cod_acompanhamento_realizado,))
            exists = cur.fetchone()
            if exists:
                print(f"[LOG] Atualizando dados existentes do RCV")
                sql_upsert_rcv = """
                    UPDATE sistemaaps.tb_hiperdia_risco_cv
                    SET data_avaliacao = %(data_avaliacao)s, idade = %(idade)s, sexo = %(sexo)s, 
                        tabagismo = %(tabagismo)s, diabetes = %(diabetes)s, colesterol_total = %(colesterol_total)s, 
                        pressao_sistolica = %(pressao_sistolica)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                """
            else:
                print(f"[LOG] Inserindo novos dados do RCV")
                sql_upsert_rcv = """
                    INSERT INTO sistemaaps.tb_hiperdia_risco_cv
                    (cod_acompanhamento, data_avaliacao, idade, sexo, tabagismo, diabetes, colesterol_total, pressao_sistolica)
                    VALUES (%(cod_acompanhamento)s, %(data_avaliacao)s, %(idade)s, %(sexo)s, %(tabagismo)s, %(diabetes)s, %(colesterol_total)s, %(pressao_sistolica)s);
                """
            params = {'cod_acompanhamento': cod_acompanhamento_realizado, 'data_avaliacao': data_realizacao_acao}
            params.update(risk_assessment_data)
            cur.execute(sql_upsert_rcv, params)
            print(f"[LOG] Dados do RCV salvos com sucesso")

            # Criar ação futura "Encaminhar para nutrição" (pendente)
            cod_proxima_acao_pendente = 7 # Encaminhar para nutrição
            data_agendamento_proxima = data_realizacao_acao # pode ser para hoje mesmo
            sql_insert_pendente = '''
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Encaminhamento para avaliação nutricional.', %(responsavel_pela_acao)s);
            '''
            cur.execute(sql_insert_pendente, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_proxima_acao_pendente,
                'data_agendamento': data_agendamento_proxima,
                'cod_acao_origem': cod_acompanhamento_realizado,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            print(f"[LOG] Ação futura 'Encaminhar para nutrição' criada")

        elif int(cod_acao_atual) == 1: # Solicitar MRPA
            print(f"[LOG] Processando Solicitar MRPA (cod_acao = 1)")
            
            # 1. Marcar "Agendar Hiperdia" (cod_acao = 9) pendente como REALIZADA
            print(f"[LOG] Marcando ações 'Agendar Hiperdia' pendentes como realizadas")
            sql_update_agendar_hiperdia = """
                UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                SET status_acao = 'REALIZADA',
                    data_agendamento = %(data_realizacao)s,
                    data_realizacao = %(data_realizacao)s,
                    responsavel_pela_acao = %(responsavel_pela_acao)s
                WHERE cod_cidadao = %(cod_cidadao)s
                  AND cod_acao = 9
                  AND status_acao = 'PENDENTE';
            """
            cur.execute(sql_update_agendar_hiperdia, {
                'data_realizacao': data_realizacao_acao,
                'responsavel_pela_acao': responsavel_pela_acao,
                'cod_cidadao': cod_cidadao
            })
            print(f"[LOG] Ações 'Agendar Hiperdia' pendentes marcadas como realizadas")
            
            # 2. Criar "Solicitar MRPA" como REALIZADA com a data de hoje
            print(f"[LOG] Criando ação 'Solicitar MRPA' como REALIZADA")
            sql_insert_solicitar_mrpa = """
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, 1, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, 'Solicitação de MRPA para monitorização da pressão arterial.', %(responsavel_pela_acao)s)
                RETURNING cod_acompanhamento;
            """
            cur.execute(sql_insert_solicitar_mrpa, {
                'cod_cidadao': cod_cidadao,
                'data_realizacao': data_realizacao_acao,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            cod_acompanhamento_criado = cur.fetchone()[0]
            print(f"[LOG] Ação 'Solicitar MRPA' criada como REALIZADA - cod_acompanhamento: {cod_acompanhamento_criado}")
            
            # 3. Criar automaticamente "Avaliar MRPA" (cod_acao = 2) como PENDENTE para 7 dias
            print(f"[LOG] Criando ação 'Avaliar MRPA' automaticamente para 7 dias")
            cod_proxima_acao_pendente = 2 # Avaliar MRPA
            data_agendamento_proxima = data_realizacao_acao + timedelta(days=7) # 7 dias
            sql_insert_pendente = '''
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Avaliação do MRPA após 7 dias de monitorização.', %(responsavel_pela_acao)s);
            '''
            cur.execute(sql_insert_pendente, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_proxima_acao_pendente,
                'data_agendamento': data_agendamento_proxima,
                'cod_acao_origem': cod_acompanhamento_criado,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            print(f"[LOG] Ação futura 'Avaliar MRPA' criada automaticamente para 7 dias")

        elif int(cod_acao_atual) == 7: # Encaminhar para Nutrição
            print(f"[LOG] Criando ação pendente Registrar Nutrição (cod_acao=8)")
            try:
                cur.execute('''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, 8, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Aguardando registro da consulta de nutrição.', %(responsavel_pela_acao)s)
                ''', {
                    'cod_cidadao': cod_cidadao,
                    'data_agendamento': data_realizacao_acao,
                    'cod_acao_origem': cod_acompanhamento_atualizado,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                print(f"[LOG] Ação pendente Registrar Nutrição criada com sucesso")
            except Exception as e:
                print(f"[LOG] ERRO ao criar ação pendente Registrar Nutrição: {e}")

        conn.commit()
        print(f"[LOG] Commit realizado com sucesso - Ação {cod_acao_atual} atualizada")
        return jsonify({"sucesso": True, "mensagem": "Ação atualizada com sucesso!"})

    except Exception as e:
        if conn: conn.rollback()
        print(f"[LOG] ERRO ao atualizar ação do Hiperdia: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route('/api/hiperdia/medicamentos/<int:cod_cidadao>')
def api_get_medicamentos_hiperdia(cod_cidadao):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        sql_query = """
            SELECT 
                codmedicamento, 
                codCidadao as cod_cidadao, 
                medicamento, 
                posologia, 
                dt_inicio_tratamento
            FROM 
                sistemaaps.mv_hiperdia_hipertensao_medicamentos
            WHERE 
                codCidadao = %(cod_cidadao)s
            ORDER BY 
                dt_inicio_tratamento DESC, medicamento ASC;
        """
        
        cur.execute(sql_query, {'cod_cidadao': cod_cidadao})
        medicamentos_db = cur.fetchall()
        
        medicamentos = []
        for row in medicamentos_db:
            med_dict = dict(row)
            if med_dict.get('dt_inicio_tratamento') and isinstance(med_dict['dt_inicio_tratamento'], date):
                med_dict['dt_inicio_tratamento'] = med_dict['dt_inicio_tratamento'].strftime('%d/%m/%Y')
            medicamentos.append(med_dict)
            
        return jsonify(medicamentos)

    except Exception as e:
        print(f"Erro na API /api/hiperdia/medicamentos: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/registrar_acao', methods=['POST'])
def api_registrar_acao_hiperdia():
    data = request.get_json()
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cod_cidadao = data.get('cod_cidadao')
        cod_acao_atual = data.get('cod_acao_atual')
        data_acao_atual_str = data.get('data_acao_atual')
        observacoes = data.get('observacoes')
        responsavel_pela_acao = data.get('responsavel_pela_acao')
        status_acao = data.get('status_acao', 'REALIZADA')

        print(f"[LOG] Iniciando api_registrar_acao_hiperdia - cod_cidadao: {cod_cidadao}, cod_acao_atual: {cod_acao_atual}")
        print(f"[LOG] Dados recebidos: {data}")

        if not all([cod_cidadao, cod_acao_atual, data_acao_atual_str]):
            print(f"[LOG] Dados incompletos - cod_cidadao: {cod_cidadao}, cod_acao_atual: {cod_acao_atual}, data_acao_atual_str: {data_acao_atual_str}")
            return jsonify({"sucesso": False, "erro": "Dados incompletos para registro."}), 400

        data_realizacao_acao = datetime.strptime(data_acao_atual_str, '%Y-%m-%d').date()

        # Tratamento especial para "Solicitar MRPA" - marcar "Agendar Hiperdia" como realizado e criar "Solicitar MRPA" como pendente
        if int(cod_acao_atual) == 1: # Solicitar MRPA
            print(f"[LOG] Processando Solicitar MRPA (cod_acao = 1)")
            
            # 1. Marcar "Agendar Hiperdia" (cod_acao = 9) pendente como REALIZADA
            print(f"[LOG] Marcando ações 'Agendar Hiperdia' pendentes como realizadas")
            sql_update_agendar_hiperdia = """
                UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                SET status_acao = 'REALIZADA',
                    data_agendamento = %(data_realizacao)s,
                    data_realizacao = %(data_realizacao)s,
                    responsavel_pela_acao = %(responsavel_pela_acao)s
                WHERE cod_cidadao = %(cod_cidadao)s
                  AND cod_acao = 9
                  AND status_acao = 'PENDENTE';
            """
            cur.execute(sql_update_agendar_hiperdia, {
                'data_realizacao': data_realizacao_acao,
                'responsavel_pela_acao': responsavel_pela_acao,
                'cod_cidadao': cod_cidadao
            })
            print(f"[LOG] Ações 'Agendar Hiperdia' pendentes marcadas como realizadas")
            
            # 2. Criar "Solicitar MRPA" como REALIZADA com a data de hoje
            print(f"[LOG] Criando ação 'Solicitar MRPA' como REALIZADA")
            sql_insert_solicitar_mrpa = """
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, 1, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, 'Solicitação de MRPA para monitorização da pressão arterial.', %(responsavel_pela_acao)s)
                RETURNING cod_acompanhamento;
            """
            cur.execute(sql_insert_solicitar_mrpa, {
                'cod_cidadao': cod_cidadao,
                'data_realizacao': data_realizacao_acao,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            cod_acompanhamento_criado = cur.fetchone()[0]
            print(f"[LOG] Ação 'Solicitar MRPA' criada como REALIZADA - cod_acompanhamento: {cod_acompanhamento_criado}")
            
            # 3. Criar automaticamente "Avaliar MRPA" (cod_acao = 2) como PENDENTE para 7 dias
            print(f"[LOG] Criando ação 'Avaliar MRPA' automaticamente para 7 dias")
            cod_proxima_acao_pendente = 2 # Avaliar MRPA
            data_agendamento_proxima = data_realizacao_acao + timedelta(days=7) # 7 dias
            sql_insert_pendente = '''
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Avaliação do MRPA após 7 dias de monitorização.', %(responsavel_pela_acao)s);
            '''
            cur.execute(sql_insert_pendente, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_proxima_acao_pendente,
                'data_agendamento': data_agendamento_proxima,
                'cod_acao_origem': cod_acompanhamento_criado,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            print(f"[LOG] Ação futura 'Avaliar MRPA' criada automaticamente para 7 dias")

        # Tratamento especial para "Avaliar MRPA" - buscar ação pendente existente
        elif int(cod_acao_atual) == 2: # Avaliar MRPA
            print(f"[LOG] Processando Avaliar MRPA (cod_acao = 2) - buscando ação pendente existente")
            
            # Verificar se há dados da avaliação do MRPA (aceitar ambas as chaves)
            mrpa_assessment_data = data.get('mrpa_assessment_data') or data.get('mrpa_results')
            if not mrpa_assessment_data:
                print(f"[LOG] ERRO: Dados da avaliação do MRPA não fornecidos")
                return jsonify({"sucesso": False, "erro": "Dados da avaliação do MRPA não fornecidos."}), 400
            
            print(f"[LOG] Dados da avaliação do MRPA recebidos: {mrpa_assessment_data}")
            
            # Buscar ação pendente de "Avaliar MRPA" para este paciente
            cur.execute('''
                SELECT cod_acompanhamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_cidadao = %(cod_cidadao)s
                    AND cod_acao = 2
                    AND status_acao = 'PENDENTE'
                ORDER BY data_agendamento ASC
                LIMIT 1;
            ''', {'cod_cidadao': cod_cidadao})
            pending_mrpa = cur.fetchone()

            if pending_mrpa:
                # Se existe uma ação pendente, atualizar ela
                cod_acompanhamento_realizado = pending_mrpa[0]
                print(f"[LOG] Atualizando ação pendente de Avaliar MRPA - cod_acompanhamento: {cod_acompanhamento_realizado}")
                cur.execute('''
                    UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                    SET status_acao = 'REALIZADA',
                        data_realizacao = %(data_realizacao)s,
                        observacoes = %(observacoes)s,
                        responsavel_pela_acao = %(responsavel_pela_acao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                ''', {
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao,
                    'cod_acompanhamento': cod_acompanhamento_realizado
                })
                print(f"[LOG] Ação pendente de Avaliar MRPA atualizada para REALIZADA")
            else:
                # Se não existe ação pendente, criar uma nova ação realizada
                print(f"[LOG] Criando nova ação de Avaliar MRPA")
                cur.execute('''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, 2, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, %(observacoes)s, %(responsavel_pela_acao)s)
                    RETURNING cod_acompanhamento;
                ''', {
                    'cod_cidadao': cod_cidadao,
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                cod_acompanhamento_realizado = cur.fetchone()[0]
                print(f"[LOG] Nova ação de Avaliar MRPA criada - cod_acompanhamento: {cod_acompanhamento_realizado}")

            # Mapear os campos do frontend para o formato esperado pelo banco
            mapped_data = {
                'pressao_sistolica': mrpa_assessment_data.get('media_pa_sistolica') or mrpa_assessment_data.get('pressao_sistolica'),
                'pressao_diastolica': mrpa_assessment_data.get('media_pa_diastolica') or mrpa_assessment_data.get('pressao_diastolica'),
                'frequencia_cardiaca': mrpa_assessment_data.get('frequencia_cardiaca', 0),
                'decisao_tratamento': mrpa_assessment_data.get('decision') or mrpa_assessment_data.get('decisao_tratamento', ''),
                'observacoes': mrpa_assessment_data.get('analise_mrpa') or mrpa_assessment_data.get('observacoes', '')
            }
            
            # Salvar os dados da avaliação do MRPA
            print(f"[LOG] Salvando dados da avaliação do MRPA na tabela tb_hiperdia_mrpa")
            sql_insert_mrpa = """
                INSERT INTO sistemaaps.tb_hiperdia_mrpa
                (cod_acompanhamento, data_mrpa, media_pa_sistolica, media_pa_diastolica, analise_mrpa)
                VALUES (%(cod_acompanhamento)s, %(data_mrpa)s, %(media_pa_sistolica)s, %(media_pa_diastolica)s, %(analise_mrpa)s);
            """
            params = {
                'cod_acompanhamento': cod_acompanhamento_realizado,
                'data_mrpa': data_realizacao_acao,
                'media_pa_sistolica': mapped_data.get('pressao_sistolica'),
                'media_pa_diastolica': mapped_data.get('pressao_diastolica'),
                'analise_mrpa': mapped_data.get('observacoes')
            }
            cur.execute(sql_insert_mrpa, params)
            print(f"[LOG] Dados da avaliação do MRPA salvos com sucesso")
            
            # Verificar a decisão e criar ações futuras conforme necessário
            decisao_tratamento = mrpa_assessment_data.get('decision', '').lower()
            if 'manter' in decisao_tratamento or 'maintain' in decisao_tratamento or 'manter tratamento' in decisao_tratamento:
                print(f"[LOG] Decisão é 'Manter tratamento'. Criando ação 'Solicitar Exames' automaticamente.")
                
                # Criar ação futura "Solicitar Exames" (pendente) para hoje
                cod_proxima_acao_pendente = 4 # Solicitar Exames
                data_agendamento_proxima = data_realizacao_acao # Mesma data (hoje)
                sql_insert_pendente = '''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Solicitação de exames após avaliação do MRPA com decisão de manter tratamento.', %(responsavel_pela_acao)s);
                '''
                cur.execute(sql_insert_pendente, {
                    'cod_cidadao': cod_cidadao,
                    'cod_acao': cod_proxima_acao_pendente,
                    'data_agendamento': data_agendamento_proxima,
                    'cod_acao_origem': cod_acompanhamento_realizado,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                print(f"[LOG] Ação futura 'Solicitar Exames' criada automaticamente")
            elif 'modificar' in decisao_tratamento or 'modify' in decisao_tratamento or 'modificar tratamento' in decisao_tratamento:
                print(f"[LOG] Decisão é 'Modificar tratamento'. Criando ação 'Modificar tratamento' automaticamente.")
                
                # Criar ação futura "Modificar tratamento" (pendente) para hoje
                cod_proxima_acao_pendente = 3 # Modificar tratamento
                data_agendamento_proxima = data_realizacao_acao # Mesma data (hoje)
                sql_insert_pendente = '''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Tratamento a ser modificado conforme avaliação do MRPA.', %(responsavel_pela_acao)s);
                '''
                cur.execute(sql_insert_pendente, {
                    'cod_cidadao': cod_cidadao,
                    'cod_acao': cod_proxima_acao_pendente,
                    'data_agendamento': data_agendamento_proxima,
                    'cod_acao_origem': cod_acompanhamento_realizado,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                print(f"[LOG] Ação futura 'Modificar tratamento' criada automaticamente")
            else:
                print(f"[LOG] Decisão não reconhecida: '{decisao_tratamento}'. Não será criada ação automática.")

        elif int(cod_acao_atual) == 4: # Solicitar Exames
            print(f"[LOG] Processando Solicitar Exames (cod_acao = 4)")
            
            # Buscar ação pendente de "Solicitar Exames" para este paciente
            cur.execute('''
                SELECT cod_acompanhamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_cidadao = %(cod_cidadao)s
                    AND cod_acao = 4
                    AND status_acao = 'PENDENTE'
                ORDER BY data_agendamento ASC
                LIMIT 1;
            ''', {'cod_cidadao': cod_cidadao})
            pending_exames = cur.fetchone()

            if pending_exames:
                # Se existe uma ação pendente, atualizar ela
                cod_acompanhamento_realizado = pending_exames[0]
                print(f"[LOG] Atualizando ação pendente de Solicitar Exames - cod_acompanhamento: {cod_acompanhamento_realizado}")
                cur.execute('''
                    UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                    SET status_acao = 'REALIZADA',
                        data_realizacao = %(data_realizacao)s,
                        observacoes = %(observacoes)s,
                        responsavel_pela_acao = %(responsavel_pela_acao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                ''', {
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao,
                    'cod_acompanhamento': cod_acompanhamento_realizado
                })
                print(f"[LOG] Ação pendente de Solicitar Exames atualizada para REALIZADA")
            else:
                # Se não existe ação pendente, criar uma nova ação realizada
                print(f"[LOG] Criando nova ação de Solicitar Exames")
                cur.execute('''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, 4, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, %(observacoes)s, %(responsavel_pela_acao)s)
                    RETURNING cod_acompanhamento;
                ''', {
                    'cod_cidadao': cod_cidadao,
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                cod_acompanhamento_realizado = cur.fetchone()[0]
                print(f"[LOG] Nova ação de Solicitar Exames criada - cod_acompanhamento: {cod_acompanhamento_realizado}")

            # Criar automaticamente "Avaliar Exames" (cod_acao = 5) como PENDENTE
            print(f"[LOG] Criando ação 'Avaliar Exames' automaticamente")
            cod_proxima_acao_pendente = 5 # Avaliar Exames
            data_agendamento_proxima = data_realizacao_acao + timedelta(days=7) # 7 dias para aguardar os exames
            sql_insert_pendente = '''
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Avaliação dos exames solicitados após 7 dias.', %(responsavel_pela_acao)s);
            '''
            cur.execute(sql_insert_pendente, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_proxima_acao_pendente,
                'data_agendamento': data_agendamento_proxima,
                'cod_acao_origem': cod_acompanhamento_realizado,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            print(f"[LOG] Ação futura 'Avaliar Exames' criada automaticamente para 7 dias")

        elif int(cod_acao_atual) == 5: # Avaliar Exames
            print(f"[LOG] Processando Avaliar Exames (cod_acao = 5) - buscando ação pendente existente")
            
            # Verificar se há dados dos resultados dos exames
            lab_exam_results = data.get('lab_exam_results')
            if not lab_exam_results:
                print(f"[LOG] ERRO: Resultados dos exames não fornecidos")
                return jsonify({"sucesso": False, "erro": "Resultados dos exames não fornecidos."}), 400
            
            print(f"[LOG] Dados dos resultados dos exames recebidos: {lab_exam_results}")
            
            # Validação dos campos numéricos para evitar overflow
            if lab_exam_results.get('potassio') and float(lab_exam_results.get('potassio', 0)) > 99.9:
                return jsonify({"sucesso": False, "erro": "Valor do potássio não pode ser maior que 99.9."}), 400
            
            if lab_exam_results.get('hemoglobina_glicada') and float(lab_exam_results.get('hemoglobina_glicada', 0)) > 99.99:
                return jsonify({"sucesso": False, "erro": "Valor da hemoglobina glicada não pode ser maior que 99.99."}), 400
            
            if lab_exam_results.get('creatinina') and float(lab_exam_results.get('creatinina', 0)) > 99.99:
                return jsonify({"sucesso": False, "erro": "Valor da creatinina não pode ser maior que 99.99."}), 400
            
            if lab_exam_results.get('acido_urico') and float(lab_exam_results.get('acido_urico', 0)) > 99.99:
                return jsonify({"sucesso": False, "erro": "Valor do ácido úrico não pode ser maior que 99.99."}), 400
            
            # Buscar ação pendente de "Avaliar Exames" para este paciente
            cur.execute('''
                SELECT cod_acompanhamento
                FROM sistemaaps.tb_hiperdia_has_acompanhamento
                WHERE cod_cidadao = %(cod_cidadao)s
                    AND cod_acao = 5
                    AND status_acao = 'PENDENTE'
                ORDER BY data_agendamento ASC
                LIMIT 1;
            ''', {'cod_cidadao': cod_cidadao})
            pending_exames = cur.fetchone()

            if pending_exames:
                # Se existe uma ação pendente, atualizar ela
                cod_acompanhamento_realizado = pending_exames[0]
                print(f"[LOG] Atualizando ação pendente de Avaliar Exames - cod_acompanhamento: {cod_acompanhamento_realizado}")
                cur.execute('''
                    UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                    SET status_acao = 'REALIZADA',
                        data_realizacao = %(data_realizacao)s,
                        observacoes = %(observacoes)s,
                        responsavel_pela_acao = %(responsavel_pela_acao)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                ''', {
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao,
                    'cod_acompanhamento': cod_acompanhamento_realizado
                })
                print(f"[LOG] Ação pendente de Avaliar Exames atualizada para REALIZADA")
            else:
                # Se não existe ação pendente, criar uma nova ação realizada
                print(f"[LOG] Criando nova ação de Avaliar Exames")
                cur.execute('''
                    INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                    (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                    VALUES (%(cod_cidadao)s, 5, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, %(observacoes)s, %(responsavel_pela_acao)s)
                    RETURNING cod_acompanhamento;
                ''', {
                    'cod_cidadao': cod_cidadao,
                    'data_realizacao': data_realizacao_acao,
                    'observacoes': observacoes,
                    'responsavel_pela_acao': responsavel_pela_acao
                })
                cod_acompanhamento_realizado = cur.fetchone()[0]
                print(f"[LOG] Nova ação de Avaliar Exames criada - cod_acompanhamento: {cod_acompanhamento_realizado}")

            # Salvar os dados dos resultados dos exames
            print(f"[LOG] Salvando dados dos resultados dos exames na tabela tb_hiperdia_resultados_exames")
            cur.execute("SELECT 1 FROM sistemaaps.tb_hiperdia_resultados_exames WHERE cod_acompanhamento = %s", (cod_acompanhamento_realizado,))
            exists = cur.fetchone()

            if exists:
                sql_upsert_exames = """
                    UPDATE sistemaaps.tb_hiperdia_resultados_exames
                    SET data_avaliacao = %(data_avaliacao)s, colesterol_total = %(colesterol_total)s, hdl = %(hdl)s, 
                        ldl = %(ldl)s, triglicerideos = %(triglicerideos)s, glicemia_jejum = %(glicemia_jejum)s, 
                        hemoglobina_glicada = %(hemoglobina_glicada)s, ureia = %(ureia)s, creatinina = %(creatinina)s, 
                        sodio = %(sodio)s, potassio = %(potassio)s, acido_urico = %(acido_urico)s
                    WHERE cod_acompanhamento = %(cod_acompanhamento)s;
                """
            else:
                sql_upsert_exames = """
                    INSERT INTO sistemaaps.tb_hiperdia_resultados_exames
                    (cod_acompanhamento, data_avaliacao, colesterol_total, hdl, ldl, triglicerideos, glicemia_jejum, hemoglobina_glicada, ureia, creatinina, sodio, potassio, acido_urico)
                    VALUES (%(cod_acompanhamento)s, %(data_avaliacao)s, %(colesterol_total)s, %(hdl)s, %(ldl)s, %(triglicerideos)s, %(glicemia_jejum)s, %(hemoglobina_glicada)s, %(ureia)s, %(creatinina)s, %(sodio)s, %(potassio)s, %(acido_urico)s);
                """
            params = {'cod_acompanhamento': cod_acompanhamento_realizado, 'data_avaliacao': data_realizacao_acao}
            params.update(lab_exam_results)
            cur.execute(sql_upsert_exames, params)
            print(f"[LOG] Dados dos resultados dos exames salvos com sucesso")

            # Criar automaticamente "Avaliar RCV" (cod_acao = 6) como PENDENTE
            print(f"[LOG] Criando ação 'Avaliar RCV' automaticamente")
            cod_proxima_acao_pendente = 6 # Avaliar RCV
            data_agendamento_proxima = data_realizacao_acao # Mesma data (hoje)
            sql_insert_pendente = '''
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, cod_acao_origem, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, 'PENDENTE', %(data_agendamento)s, %(cod_acao_origem)s, 'Avaliação de Risco Cardiovascular após análise dos exames.', %(responsavel_pela_acao)s);
            '''
            cur.execute(sql_insert_pendente, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_proxima_acao_pendente,
                'data_agendamento': data_agendamento_proxima,
                'cod_acao_origem': cod_acompanhamento_realizado,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            print(f"[LOG] Ação futura 'Avaliar RCV' criada automaticamente")

        elif int(cod_acao_atual) == 1: # Solicitar MRPA
            print(f"[LOG] Processando Solicitar MRPA (cod_acao = 1)")
            
            # 1. Marcar "Agendar Hiperdia" (cod_acao = 9) pendente como REALIZADA
            print(f"[LOG] Marcando ações 'Agendar Hiperdia' pendentes como realizadas")
            sql_update_agendar_hiperdia = """
                UPDATE sistemaaps.tb_hiperdia_has_acompanhamento
                SET status_acao = 'REALIZADA',
                    data_agendamento = %(data_realizacao)s,
                    data_realizacao = %(data_realizacao)s,
                    responsavel_pela_acao = %(responsavel_pela_acao)s
                WHERE cod_cidadao = %(cod_cidadao)s
                  AND cod_acao = 9
                  AND status_acao = 'PENDENTE';
            """
            cur.execute(sql_update_agendar_hiperdia, {
                'data_realizacao': data_realizacao_acao,
                'responsavel_pela_acao': responsavel_pela_acao,
                'cod_cidadao': cod_cidadao
            })
            print(f"[LOG] Ações 'Agendar Hiperdia' pendentes marcadas como realizadas")
            
            # 2. Criar "Solicitar MRPA" como REALIZADA com a data de hoje
            print(f"[LOG] Criando ação 'Solicitar MRPA' como REALIZADA")
            sql_insert_solicitar_mrpa = """
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, 1, 'REALIZADA', %(data_realizacao)s, %(data_realizacao)s, 'Solicitação de MRPA para monitorização da pressão arterial.', %(responsavel_pela_acao)s)
                RETURNING cod_acompanhamento;
            """
            cur.execute(sql_insert_solicitar_mrpa, {
                'cod_cidadao': cod_cidadao,
                'data_realizacao': data_realizacao_acao,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            cod_acompanhamento_criado = cur.fetchone()[0]
            print(f"[LOG] Ação 'Solicitar MRPA' criada como REALIZADA - cod_acompanhamento: {cod_acompanhamento_criado}")

        else:
            # Criar nova ação para outras ações
            sql_insert_acompanhamento = """
                INSERT INTO sistemaaps.tb_hiperdia_has_acompanhamento
                (cod_cidadao, cod_acao, status_acao, data_agendamento, data_realizacao, observacoes, responsavel_pela_acao)
                VALUES (%(cod_cidadao)s, %(cod_acao)s, %(status_acao)s, %(data_realizacao)s, %(data_realizacao)s, %(observacoes)s, %(responsavel_pela_acao)s)
                RETURNING cod_acompanhamento;
            """
            print(f"[LOG] Executando INSERT na tabela tb_hiperdia_has_acompanhamento")
            cur.execute(sql_insert_acompanhamento, {
                'cod_cidadao': cod_cidadao,
                'cod_acao': cod_acao_atual,
                'status_acao': status_acao,
                'data_realizacao': data_realizacao_acao,
                'observacoes': observacoes,
                'responsavel_pela_acao': responsavel_pela_acao
            })
            cod_acompanhamento_criado = cur.fetchone()[0]
            print(f"[LOG] Nova ação criada - cod_acompanhamento: {cod_acompanhamento_criado}")

            # Handle specific data based on action type
            # (Removido o tratamento específico da ação 6 - Avaliar RCV, pois agora está no bloco elif acima)

        conn.commit()
        print(f"[LOG] Commit realizado com sucesso - Ação {cod_acao_atual} registrada")
        return jsonify({"sucesso": True, "mensagem": "Ação registrada com sucesso!"})

    except Exception as e:
        if conn: conn.rollback()
        print(f"[LOG] ERRO ao registrar ação do Hiperdia: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/graficos_painel_plafam')
def api_graficos_painel_plafam():
    equipe_req = request.args.get('equipe', 'Todas')
    # Não há filtro de idade aqui!
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # --- Gráfico de Pizza (Distribuição da Equipe) ---
        base_where_pizza = []
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
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                            )) OR
                            (m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%')
                        )
                    THEN 1 ELSE 0 END) as metodo_em_dia
            FROM sistemaaps.mv_plafam m
            {where_clause_pizza_str};
        """
        cur.execute(query_pizza_status, params_pizza)
        dados_pizza = cur.fetchone()

        # --- Gráfico de Barras (Distribuição por Micro-área ou Equipe) ---
        dados_barras_db = []
        if equipe_req != 'Todas':
            base_where_barras_agente = ["m.nome_equipe = %(equipe)s"]
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
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
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
        else:
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
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') < (CURRENT_DATE - INTERVAL '90 days'))
                            ))
                        )
                    THEN 1 ELSE 0 END) as metodo_atraso,
                SUM(CASE WHEN
                        (m.metodo IS NOT NULL AND m.metodo != '') AND
                        (m.status_gravidez IS NULL OR m.status_gravidez != 'Grávida') AND
                        (
                            (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                                ((m.metodo ILIKE '%%mensal%%' OR m.metodo ILIKE '%%pílula%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                                ((m.metodo ILIKE '%%trimestral%%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                            )) OR
                            (m.metodo ILIKE '%%diu%%' OR m.metodo ILIKE '%%implante%%' OR m.metodo ILIKE '%%laqueadura%%')
                        )
                    THEN 1 ELSE 0 END) as metodo_em_dia
            FROM sistemaaps.mv_plafam m
            WHERE m.nome_equipe IS NOT NULL
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
        print(f"Erro ao buscar dados para gráficos do painel plafam: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/indicadores_plafam')
def api_indicadores_plafam():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 1. Mulheres de 19 a 45 anos em uso de métodos seguros
        query_mulheres_metodo_seguro = """
            SELECT COUNT(DISTINCT m.cod_paciente)
            FROM sistemaaps.mv_plafam m
            WHERE m.idade_calculada BETWEEN 19 AND 45
              AND (
                m.metodo ILIKE '%diu%' OR m.metodo ILIKE '%implante%' OR m.metodo ILIKE '%laqueadura%' OR
                m.metodo ILIKE '%injet%' OR m.metodo ILIKE '%pílula%' OR m.metodo ILIKE '%oral%'
              )
              AND (
                (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                    ((m.metodo ILIKE '%mensal%' OR m.metodo ILIKE '%pílula%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                    (m.metodo ILIKE '%trimestral%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                ))
                OR (m.metodo ILIKE '%diu%' OR m.metodo ILIKE '%implante%' OR m.metodo ILIKE '%laqueadura%')
              )
        """
        cur.execute(query_mulheres_metodo_seguro)
        mulheres_19_45_metodo_seguro = cur.fetchone()[0] or 0

        # 2. Adolescentes de 14 a 18 anos em uso regular de métodos
        query_adolescentes_metodo_regular = """
            SELECT COUNT(DISTINCT m.cod_paciente)
            FROM sistemaaps.mv_plafam m
            WHERE m.idade_calculada BETWEEN 14 AND 18
              AND m.metodo IS NOT NULL AND m.metodo != ''
              AND (
                (m.data_aplicacao IS NOT NULL AND m.data_aplicacao != '' AND (
                    ((m.metodo ILIKE '%mensal%' OR m.metodo ILIKE '%pílula%') AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '30 days')) OR
                    (m.metodo ILIKE '%trimestral%' AND TO_DATE(m.data_aplicacao, 'DD/MM/YYYY') >= (CURRENT_DATE - INTERVAL '90 days'))
                ))
                OR (m.metodo ILIKE '%diu%' OR m.metodo ILIKE '%implante%' OR m.metodo ILIKE '%laqueadura%')
              )
        """
        cur.execute(query_adolescentes_metodo_regular)
        adolescentes_14_18_metodo_regular = cur.fetchone()[0] or 0

        # 3. Número de gestantes adolescentes (14 a 18 anos)
        query_gestantes_adolescentes = """
            SELECT COUNT(DISTINCT m.cod_paciente)
            FROM sistemaaps.mv_plafam m
            WHERE m.idade_calculada BETWEEN 14 AND 18
              AND m.status_gravidez = 'Grávida'
        """
        cur.execute(query_gestantes_adolescentes)
        gestantes_adolescentes_14_18 = cur.fetchone()[0] or 0

        return jsonify({
            'mulheres_19_45_metodo_seguro': mulheres_19_45_metodo_seguro,
            'adolescentes_14_18_metodo_regular': adolescentes_14_18_metodo_regular,
            'gestantes_adolescentes_14_18': gestantes_adolescentes_14_18
        })
    except Exception as e:
        print(f"Erro ao buscar indicadores do plafam: {e}")
        return jsonify({'erro': f'Erro no servidor: {e}'}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/equipes_com_agentes_plafam')
def api_equipes_com_agentes_plafam():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        # Pega todas as equipes distintas de mv_plafam ou tb_agentes
        cur.execute('''
            SELECT DISTINCT nome_equipe 
            FROM (
                SELECT nome_equipe FROM sistemaaps.mv_plafam
                UNION
                SELECT nome_equipe FROM sistemaaps.tb_agentes
            ) AS equipes_unidas
            WHERE nome_equipe IS NOT NULL 
            ORDER BY nome_equipe
        ''')
        equipes_db = cur.fetchall()
        resultado_final = []
        for eq_row in equipes_db:
            equipe_nome = eq_row['nome_equipe']
            # Contar mulheres 14-45 anos para a equipe atual
            cur.execute('''
                SELECT COUNT(DISTINCT m.cod_paciente)
                FROM sistemaaps.mv_plafam m
                WHERE m.nome_equipe = %s AND m.idade_calculada BETWEEN 14 AND 45
            ''', (equipe_nome,))
            num_mulheres = cur.fetchone()[0] or 0
            cur.execute('''
                SELECT micro_area, nome_agente 
                FROM sistemaaps.tb_agentes 
                WHERE nome_equipe = %s 
                ORDER BY micro_area, nome_agente
            ''', (equipe_nome,))
            agentes_db = cur.fetchall()
            agentes = []
            if agentes_db:
                agentes = [{"micro_area": ag['micro_area'], "nome_agente": ag['nome_agente']} for ag in agentes_db]
            resultado_final.append({"nome_equipe": equipe_nome, "agentes": agentes, "num_mulheres": num_mulheres})
        resultado_final_ordenado = sorted(resultado_final, key=lambda x: x.get('num_mulheres', 0), reverse=True)
        return jsonify(resultado_final_ordenado)
    except Exception as e:
        print(f"Erro ao buscar equipes com agentes plafam: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/medicamentos_atuais/<int:cod_cidadao>')
def api_get_medicamentos_atuais_hiperdia(cod_cidadao):
    """Busca medicamentos atuais de um paciente combinando view existente e tabela manual"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Busca medicamentos da tabela manual
        sql_manual = """
            SELECT 
                cod_seq_medicamentos as cod_seq_medicamento,
                'manual' as origem,
                codcidadao, 
                nome_medicamento, 
                CASE 
                    WHEN COALESCE(dose, 1) = 1 THEN '1 comprimido'
                    WHEN COALESCE(dose, 1) = 2 THEN '2 comprimidos'
                    WHEN COALESCE(dose, 1) = 3 THEN '3 comprimidos'
                    WHEN COALESCE(dose, 1) = 4 THEN '4 comprimidos'
                    WHEN COALESCE(dose, 1) = 5 THEN '5 comprimidos'
                    ELSE COALESCE(dose, 1)::text || ' comprimidos'
                END as dose_texto,
                COALESCE(dose, 1) as dose,
                CASE 
                    WHEN COALESCE(frequencia, 1) = 1 THEN '1x ao dia'
                    WHEN COALESCE(frequencia, 1) = 2 THEN '2x ao dia'
                    WHEN COALESCE(frequencia, 1) = 3 THEN '3x ao dia'
                    WHEN COALESCE(frequencia, 1) = 4 THEN '4x ao dia'
                    ELSE COALESCE(frequencia, 1)::text || 'x ao dia'
                END as frequencia_texto,
                COALESCE(frequencia, 1) as frequencia,
                data_inicio,
                data_fim,
                null as motivo_interrupcao,
                observacao as observacoes
            FROM 
                sistemaaps.tb_hiperdia_has_medicamentos
            WHERE 
                codcidadao = %(cod_cidadao)s
                AND (data_fim IS NULL OR data_fim > CURRENT_DATE)
        """
        
        medicamentos = []
        
        # Busca apenas da tabela manual
        try:
            cur.execute(sql_manual, {'cod_cidadao': cod_cidadao})
            medicamentos_manual = cur.fetchall()
            
            for row in medicamentos_manual:
                med_dict = dict(row)
                if med_dict.get('data_inicio') and isinstance(med_dict['data_inicio'], date):
                    med_dict['data_inicio'] = med_dict['data_inicio'].strftime('%Y-%m-%d')
                if med_dict.get('data_fim') and isinstance(med_dict['data_fim'], date):
                    med_dict['data_fim'] = med_dict['data_fim'].strftime('%Y-%m-%d')
                medicamentos.append(med_dict)
        except Exception as e:
            print(f"Erro ao buscar medicamentos manuais: {e}")
            # Se houver erro, retorna lista vazia
        
        # Ordena por data de início (mais recente primeiro), tratando valores None
        medicamentos.sort(key=lambda x: x.get('data_inicio') or '', reverse=True)
            
        return jsonify(medicamentos)

    except Exception as e:
        print(f"Erro na API /api/hiperdia/medicamentos_atuais: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/medicamentos', methods=['POST'])
def api_adicionar_medicamento_hiperdia():
    """Adiciona um novo medicamento para um paciente"""
    data = request.get_json()
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cod_cidadao = data.get('codcidadao')
        nome_medicamento = data.get('nome_medicamento')
        dose = data.get('dose')
        frequencia = data.get('frequencia')
        data_inicio = data.get('data_inicio')
        observacao = data.get('observacoes', '')  # Mapear observacoes para observacao

        if not all([cod_cidadao, nome_medicamento, dose, frequencia]):
            return jsonify({"sucesso": False, "erro": "Dados incompletos para adicionar medicamento. Campos obrigatórios: nome, dose e frequência."}), 400

        # Converter dose e frequência para inteiros
        try:
            dose_num = int(dose)
            frequencia_num = int(frequencia)
        except (ValueError, TypeError):
            return jsonify({"sucesso": False, "erro": "Dose e frequência devem ser números válidos."}), 400

        # Se data_inicio não foi fornecida ou está vazia, usar data atual
        if not data_inicio or data_inicio.strip() == '':
            from datetime import date
            data_inicio = date.today()

        sql_insert = """
            INSERT INTO sistemaaps.tb_hiperdia_has_medicamentos
            (codcidadao, nome_medicamento, dose, frequencia, data_inicio, observacao)
            VALUES (%(codcidadao)s, %(nome_medicamento)s, %(dose)s, %(frequencia)s, %(data_inicio)s, %(observacao)s)
            RETURNING cod_seq_medicamentos;
        """

        cur.execute(sql_insert, {
            'codcidadao': cod_cidadao,
            'nome_medicamento': nome_medicamento,
            'dose': dose_num,
            'frequencia': frequencia_num,
            'data_inicio': data_inicio,
            'observacao': observacao
        })

        cod_seq_medicamento = cur.fetchone()[0]
        conn.commit()

        return jsonify({
            "sucesso": True, 
            "mensagem": "Medicamento adicionado com sucesso",
            "cod_seq_medicamento": cod_seq_medicamento
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro na API adicionar medicamento: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/medicamentos/<int:cod_seq_medicamento>', methods=['PUT'])
def api_atualizar_medicamento_hiperdia(cod_seq_medicamento):
    """Atualiza um medicamento existente"""
    data = request.get_json()
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Campos que podem ser atualizados
        nome_medicamento = data.get('nome_medicamento')
        dose = data.get('dose')
        frequencia = data.get('frequencia')
        observacao = data.get('observacoes')  # Mapear para observacao

        # Construir query dinâmica baseada nos campos fornecidos
        update_fields = []
        params = {'cod_seq_medicamentos': cod_seq_medicamento}

        if nome_medicamento is not None:
            update_fields.append("nome_medicamento = %(nome_medicamento)s")
            params['nome_medicamento'] = nome_medicamento

        if dose is not None:
            try:
                dose_num = int(dose)
                update_fields.append("dose = %(dose)s")
                params['dose'] = dose_num
            except (ValueError, TypeError):
                return jsonify({"sucesso": False, "erro": "Dose deve ser um número válido."}), 400

        if frequencia is not None:
            try:
                frequencia_num = int(frequencia)
                update_fields.append("frequencia = %(frequencia)s")
                params['frequencia'] = frequencia_num
            except (ValueError, TypeError):
                return jsonify({"sucesso": False, "erro": "Frequência deve ser um número válido."}), 400

        if observacao is not None:
            update_fields.append("observacao = %(observacao)s")
            params['observacao'] = observacao

        if not update_fields:
            return jsonify({"sucesso": False, "erro": "Nenhum campo para atualizar fornecido."}), 400

        sql_update = f"""
            UPDATE sistemaaps.tb_hiperdia_has_medicamentos
            SET {', '.join(update_fields)}
            WHERE cod_seq_medicamentos = %(cod_seq_medicamentos)s;
        """

        cur.execute(sql_update, params)
        
        if cur.rowcount == 0:
            return jsonify({"sucesso": False, "erro": "Medicamento não encontrado."}), 404

        conn.commit()

        return jsonify({
            "sucesso": True, 
            "mensagem": "Medicamento atualizado com sucesso"
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro na API atualizar medicamento: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/medicamentos/<int:cod_seq_medicamento>/interromper', methods=['PUT'])
def api_interromper_medicamento_hiperdia(cod_seq_medicamento):
    """Interrompe um medicamento definindo data_fim e motivo"""
    data = request.get_json()
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        data_fim = data.get('data_fim')
        motivo = data.get('motivo', 'Interrompido pelo profissional')

        if not data_fim:
            return jsonify({"sucesso": False, "erro": "Data de fim é obrigatória para interromper medicamento."}), 400

        sql_update = """
            UPDATE sistemaaps.tb_hiperdia_has_medicamentos
            SET data_fim = %(data_fim)s
            WHERE cod_seq_medicamentos = %(cod_seq_medicamentos)s;
        """

        cur.execute(sql_update, {
            'data_fim': data_fim,
            'cod_seq_medicamentos': cod_seq_medicamento
        })

        if cur.rowcount == 0:
            return jsonify({"sucesso": False, "erro": "Medicamento não encontrado."}), 404

        conn.commit()

        return jsonify({
            "sucesso": True, 
            "mensagem": "Medicamento interrompido com sucesso"
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro na API interromper medicamento: {e}")
        return jsonify({"sucesso": False, "erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/export_plafam')
def api_export_plafam():
    """API para exportação completa de dados do Plafam sem limitação de paginação"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Usar a mesma lógica de filtros da API principal, mas sem paginação
        where_clause, order_by_clause, query_params = build_filtered_query(request.args)
        
        base_query = """
        SELECT
            m.cod_paciente, m.nome_paciente, m.cartao_sus, m.idade_calculada, m.microarea,
            m.metodo, m.nome_equipe, m.data_aplicacao, m.status_gravidez, m.data_provavel_parto,
            pa.status_acompanhamento, pa.data_acompanhamento,
            ag.nome_agente
        FROM sistemaaps.mv_plafam m
        LEFT JOIN sistemaaps.tb_plafam_acompanhamento pa ON m.cod_paciente = pa.co_cidadao
        LEFT JOIN sistemaaps.tb_agentes ag ON m.microarea = ag.micro_area AND m.nome_equipe = ag.nome_equipe
        """
        
        # Construir query final sem limit e offset
        final_query = base_query + where_clause + " " + order_by_clause
        
        print(f"DEBUG Export Plafam Query: {final_query}")
        print(f"DEBUG Export Plafam Params: {query_params}")
        
        cur.execute(final_query, query_params)
        pacientes = cur.fetchall()
        
        # Converter para formato JSON
        pacientes_list = []
        for pac in pacientes:
            pac_dict = {
                'cod_paciente': pac[0],
                'nome_paciente': pac[1],
                'cartao_sus': pac[2],
                'idade_calculada': pac[3],
                'microarea': pac[4],
                'metodo': pac[5],
                'nome_equipe': pac[6],
                'data_aplicacao': pac[7],
                'status_gravidez': pac[8],
                'data_provavel_parto': pac[9],
                'status_acompanhamento': pac[10],
                'data_acompanhamento': pac[11],
                'nome_agente': pac[12]
            }
            pacientes_list.append(pac_dict)
        
        print(f"DEBUG Export Plafam: Retornando {len(pacientes_list)} registros")
        return jsonify(pacientes_list)
        
    except Exception as e:
        print(f"Erro na API export_plafam: {e}")
        return jsonify({'erro': f'Erro no servidor: {e}'}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/debug_table_structure')
def api_debug_table_structure():
    """Debug: Verifica a estrutura da tabela tb_hiperdia_has_medicamentos"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Verificar se a tabela existe e suas colunas
        sql_query = """
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'sistemaaps' 
            AND table_name = 'tb_hiperdia_has_medicamentos'
            ORDER BY ordinal_position;
        """
        
        cur.execute(sql_query)
        columns = cur.fetchall()
        
        return jsonify({
            "tabela": "tb_hiperdia_has_medicamentos",
            "colunas": [dict(row) for row in columns]
        })

    except Exception as e:
        print(f"Erro ao verificar estrutura da tabela: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/medicamentos_hipertensao')
def api_get_medicamentos_hipertensao():
    """Busca medicamentos anti-hipertensivos da tabela tb_medicamento"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        sql_query = """
            SELECT 
                co_seq_medicamento,
                no_principio_ativo_filtro as nome_medicamento
            FROM 
                public.tb_medicamento
            WHERE 
                co_seq_medicamento BETWEEN 195 AND 196 OR co_seq_medicamento BETWEEN 222 AND 224 OR
                co_seq_medicamento BETWEEN 276 AND 288 OR co_seq_medicamento BETWEEN 317 AND 323 OR
                co_seq_medicamento BETWEEN 372 AND 374 OR co_seq_medicamento BETWEEN 429 AND 431 OR
                co_seq_medicamento BETWEEN 454 AND 457 OR co_seq_medicamento BETWEEN 471 AND 472 OR
                co_seq_medicamento BETWEEN 542 AND 547 OR co_seq_medicamento BETWEEN 551 AND 554 OR
                co_seq_medicamento BETWEEN 600 AND 603 OR co_seq_medicamento BETWEEN 700 AND 702 OR
                co_seq_medicamento BETWEEN 787 AND 790 OR co_seq_medicamento BETWEEN 848 AND 850 OR
                co_seq_medicamento BETWEEN 1027 AND 1035 OR co_seq_medicamento BETWEEN 1114 AND 1118 OR
                co_seq_medicamento BETWEEN 1169 AND 1172 OR co_seq_medicamento BETWEEN 1228 AND 1229 OR
                co_seq_medicamento BETWEEN 1362 AND 1367 OR co_seq_medicamento BETWEEN 1479 AND 1484 OR
                co_seq_medicamento BETWEEN 1572 AND 1573 OR co_seq_medicamento BETWEEN 1614 AND 1617 OR
                co_seq_medicamento BETWEEN 1682 AND 1683 OR co_seq_medicamento BETWEEN 1768 AND 1769 OR
                co_seq_medicamento BETWEEN 1785 AND 1790 OR co_seq_medicamento BETWEEN 1867 AND 1868 OR
                co_seq_medicamento BETWEEN 1890 AND 1897 OR co_seq_medicamento BETWEEN 2111 AND 2118 OR
                co_seq_medicamento BETWEEN 2386 AND 2391 OR co_seq_medicamento BETWEEN 2411 AND 2417 OR
                co_seq_medicamento BETWEEN 2670 AND 2674 OR co_seq_medicamento BETWEEN 2723 AND 2724 OR
                co_seq_medicamento BETWEEN 2783 AND 2784 OR co_seq_medicamento BETWEEN 2846 AND 2862 OR
                co_seq_medicamento BETWEEN 2889 AND 2892 OR co_seq_medicamento BETWEEN 2937 AND 2938 OR
                co_seq_medicamento BETWEEN 3004 AND 3006 OR co_seq_medicamento BETWEEN 3156 AND 3157 OR
                co_seq_medicamento BETWEEN 3249 AND 3250 OR co_seq_medicamento BETWEEN 3268 AND 3269 OR
                co_seq_medicamento IN (199, 447, 516, 1085, 1165, 1668, 1688, 1803, 2258, 2934, 2942, 2957, 2987, 3068, 3179, 3218, 3301, 3343)
            ORDER BY 
                no_principio_ativo_filtro ASC;
        """
        
        cur.execute(sql_query)
        medicamentos_db = cur.fetchall()
        
        medicamentos = []
        for row in medicamentos_db:
            med_dict = dict(row)
            medicamentos.append(med_dict)
            
        return jsonify(medicamentos)

    except Exception as e:
        print(f"Erro na API /api/hiperdia/medicamentos_hipertensao: {e}")
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/generate_prescriptions_pdf_old', methods=['POST'])
def api_generate_prescriptions_pdf_old():
    """Versão antiga usando ReportLab - mantida como backup"""
    # Código antigo mantido...
    pass

@app.route('/api/hiperdia/generate_prescriptions_pdf', methods=['POST'])
def api_generate_prescriptions_pdf():
    """Gera PDF com receituários usando template Word - versão aprimorada"""
    import unicodedata
    import tempfile
    import os
    from datetime import datetime
    import calendar
    
    def remove_acentos(texto):
        """Remove acentos do texto"""
        return unicodedata.normalize('NFD', texto).encode('ascii', 'ignore').decode('ascii')
    
    data = request.get_json()
    patients = data.get('patients', [])
    
    if not patients:
        return jsonify({"erro": "Nenhum paciente selecionado"}), 400
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Caminho para o template dinâmico
        template_path = os.path.join(os.path.dirname(__file__), 'modelos', 'template_receituario_dynamic.docx')
        
        print(f"DEBUG: Template path: {template_path}")
        print(f"DEBUG: Template exists: {os.path.exists(template_path)}")
        if os.path.exists(template_path):
            print(f"DEBUG: Template size: {os.path.getsize(template_path)} bytes")
        
        # Criar diretório temporário
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"DEBUG: Temp directory: {temp_dir}")
            output_files = []
            
            for i, patient in enumerate(patients):
                # Buscar dados do paciente
                sql_paciente = """
                    SELECT 
                        nome_paciente,
                        cartao_sus,
                        dt_nascimento,
                        sexo
                    FROM sistemaaps.mv_hiperdia_hipertensao
                    WHERE cod_paciente = %(cod_paciente)s
                """
                
                cur.execute(sql_paciente, {'cod_paciente': patient['cod_paciente']})
                paciente_dados = cur.fetchone()
                
                if not paciente_dados:
                    continue
                    
                paciente_dict = dict(paciente_dados)
                
                # Buscar medicamentos
                sql_medicamentos = """
                    SELECT 
                        nome_medicamento,
                        dose,
                        frequencia,
                        data_inicio,
                        observacao,
                        updated_at
                    FROM sistemaaps.tb_hiperdia_has_medicamentos
                    WHERE codcidadao = %(cod_paciente)s
                    AND (data_fim IS NULL OR data_fim > CURRENT_DATE)
                    ORDER BY nome_medicamento
                """
                
                cur.execute(sql_medicamentos, {'cod_paciente': patient['cod_paciente']})
                medicamentos = cur.fetchall()
                
                if not medicamentos:
                    continue
                
                # Preparar dados para o template
                hoje = datetime.now()
                
                # Calcular idade
                if paciente_dict['dt_nascimento']:
                    idade = hoje.year - paciente_dict['dt_nascimento'].year
                    if hoje.month < paciente_dict['dt_nascimento'].month or \
                       (hoje.month == paciente_dict['dt_nascimento'].month and hoje.day < paciente_dict['dt_nascimento'].day):
                        idade -= 1
                else:
                    idade = "?"
                
                # Preparar lista de medicamentos
                medicamentos_lista = []
                for idx, med in enumerate(medicamentos, 1):
                    med_dict = dict(med)
                    nome = med_dict['nome_medicamento'].upper()
                    dose = med_dict['dose']
                    freq = med_dict['frequencia']
                    total_comprimidos = dose * freq * 30
                    
                    # Preparar instruções - um horário por linha
                    instrucoes = []
                    if freq == 1:
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
                    elif freq == 2:
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 18:00 horas")
                    elif freq == 3:
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 14:00 horas")
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 22:00 horas")
                    elif freq == 4:
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 12:00 horas")
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 18:00 horas")
                        instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 24:00 horas")
                    
                    medicamentos_lista.append({
                        'numero': idx,
                        'nome': nome,
                        'quantidade': total_comprimidos,
                        'instrucoes': instrucoes
                    })
                
                # Calcular tamanho da fonte baseado na quantidade de medicamentos
                num_medicamentos = len(medicamentos_lista)
                
                # Definir tamanho da fonte baseado na quantidade de medicamentos
                if num_medicamentos <= 2:  # 1-2 medicamentos
                    font_size = 14
                elif num_medicamentos == 3:  # 3 medicamentos
                    font_size = 12
                elif num_medicamentos == 4:  # 4 medicamentos
                    font_size = 10
                elif num_medicamentos == 5:  # 5 medicamentos
                    font_size = 8
                else:  # 6+ medicamentos (usar menor fonte disponível)
                    font_size = 8
                
                print(f"DEBUG: {num_medicamentos} medicamentos, fonte {font_size}pt")
                
                # Definir quantidade de traços baseada no tamanho da fonte
                if num_medicamentos <= 2:  # Fonte maior (14pt)
                    tracos = "--------------------------------"  # 32 traços
                else:  # Fonte menor (12pt, 10pt, 8pt)
                    tracos = "---------------------------------------------"  # 45 traços
                
                # Gerar texto completo de medicamentos dinamicamente com espaçamento otimizado
                medicamentos_texto = ""
                for idx, med in enumerate(medicamentos_lista, 1):
                    # Nome e quantidade do medicamento (em negrito no template) - traços ajustados
                    medicamentos_texto += f"{idx}) {med['nome']} {tracos} {med['quantidade']} comprimidos\n"
                    
                    # Adicionar todas as instruções
                    for instrucao in med['instrucoes']:
                        medicamentos_texto += f"{instrucao}\n"
                    
                    # Espaçamento mínimo entre medicamentos (apenas se não for o último)
                    if idx < len(medicamentos_lista):
                        medicamentos_texto += "\n"
                
                # Se não há medicamentos, usar texto padrão
                if not medicamentos_texto:
                    medicamentos_texto = "1) MEDICAMENTO CONFORME ORIENTAÇÃO MÉDICA -------------------------------- 30 comprimidos\n\nConforme orientação médica"
                    font_size = 11
                
                # Contexto com medicamentos dinâmicos
                context = {
                    'nome_paciente': remove_acentos(paciente_dict['nome_paciente'].upper()),
                    'data_nascimento': paciente_dict['dt_nascimento'].strftime('%d/%m/%Y') if paciente_dict['dt_nascimento'] else "xx/xx/xxxx",
                    'idade': idade,
                    'sexo': paciente_dict.get('sexo', 'Não informado'),
                    'cns': paciente_dict['cartao_sus'] if paciente_dict['cartao_sus'] else "CNS não registrado no PEC",
                    'ultima_atualizacao': medicamentos[0]['updated_at'].strftime('%d/%m/%Y') if medicamentos[0]['updated_at'] else "Não disponível",
                    'medicamentos_texto': medicamentos_texto,
                    'font_size': font_size
                }
                
                print(f"DEBUG: Context for patient {i}: {context}")
                
                # Carregar template e gerar documento
                print(f"DEBUG: Loading template...")
                doc = DocxTemplate(template_path)
                print(f"DEBUG: Rendering context...")
                doc.render(context)
                print(f"DEBUG: Render successful")
                
                # Salvar documento temporário
                temp_docx = os.path.join(temp_dir, f'receituario_{i}.docx')
                temp_pdf = os.path.join(temp_dir, f'receituario_{i}.pdf')
                
                print(f"DEBUG: Saving to {temp_docx}")
                doc.save(temp_docx)
                
                # Aplicar formatação específica aos medicamentos após renderização
                print(f"DEBUG: Aplicando formatação de fonte {font_size}pt e negrito...")
                from docx import Document as DocDocument
                from docx.shared import Pt
                rendered_doc = DocDocument(temp_docx)
                
                for paragraph in rendered_doc.paragraphs:
                    text = paragraph.text.strip()
                    
                    # Se é uma linha de medicamento (contém ") nome -------- quantidade comprimidos")
                    if (') ' in text and ('--------' in text or '-----' in text) and 'comprimidos' in text.lower()):
                        # Aplicar negrito e tamanho de fonte à linha do medicamento
                        for run in paragraph.runs:
                            run.font.bold = True
                            run.font.size = Pt(font_size)
                        print(f"  -> Medicamento em negrito: {text[:50]}...")
                        
                    # Se é uma linha de instrução (começa com "Tomar")
                    elif text.startswith('Tomar '):
                        # Aplicar apenas tamanho de fonte (sem negrito) às instruções
                        for run in paragraph.runs:
                            run.font.bold = False
                            run.font.size = Pt(font_size)
                        
                # Duplicar o conteúdo para criar segunda página idêntica
                print(f"DEBUG: Duplicando receituário para segunda página...")
                
                # Coletar todos os parágrafos da primeira página ANTES de adicionar quebra
                original_paragraphs = []
                for paragraph in rendered_doc.paragraphs:
                    # Capturar o parágrafo completo
                    para_info = {
                        'text': paragraph.text,
                        'alignment': paragraph.alignment,
                        'runs': []
                    }
                    
                    # Capturar informações de formatação de cada run
                    for run in paragraph.runs:
                        run_info = {
                            'text': run.text,
                            'bold': run.font.bold,
                            'size': run.font.size,
                            'underline': run.font.underline,
                            'italic': run.font.italic
                        }
                        para_info['runs'].append(run_info)
                    
                    original_paragraphs.append(para_info)
                
                print(f"DEBUG: Capturados {len(original_paragraphs)} parágrafos da primeira página")
                
                # Adicionar quebra de página
                rendered_doc.add_page_break()
                
                # Recriar cada parágrafo da primeira página na segunda página
                for para_info in original_paragraphs:
                    new_p = rendered_doc.add_paragraph()
                    new_p.alignment = para_info['alignment']
                    
                    # Se não há runs, adicionar o texto simples
                    if not para_info['runs']:
                        if para_info['text']:
                            new_run = new_p.add_run(para_info['text'])
                            new_run.font.size = Pt(font_size)
                    else:
                        # Recriar cada run com sua formatação original
                        for run_info in para_info['runs']:
                            new_run = new_p.add_run(run_info['text'])
                            new_run.font.bold = run_info['bold']
                            new_run.font.size = run_info['size']
                            new_run.font.underline = run_info['underline']
                            new_run.font.italic = run_info['italic']
                
                # Salvar documento com receituário duplicado
                rendered_doc.save(temp_docx)
                print(f"DEBUG: Receituário duplicado criado - 2 páginas idênticas")
                
                # Verificar se arquivo foi criado
                if os.path.exists(temp_docx):
                    file_size = os.path.getsize(temp_docx)
                    print(f"DEBUG: File created successfully. Size: {file_size} bytes")
                    
                    # Testar se o arquivo pode ser reaberto
                    try:
                        from docx import Document
                        test_doc = Document(temp_docx)
                        print(f"DEBUG: File can be reopened. Paragraphs: {len(test_doc.paragraphs)}")
                    except Exception as e:
                        print(f"DEBUG: ERROR - File cannot be reopened: {e}")
                        continue
                else:
                    print(f"DEBUG: ERROR - File was not created!")
                    continue
                
                # Tentar conversão para PDF
                try:
                    print(f"DEBUG: Tentando conversão para PDF...")
                    
                    # Método 1: Usando docx2pdf com COM inicializado corretamente
                    import pythoncom
                    import threading
                    
                    # Inicializar COM de forma thread-safe
                    pythoncom.CoInitializeEx(pythoncom.COINIT_APARTMENTTHREADED)
                    
                    try:
                        from docx2pdf import convert
                        convert(temp_docx, temp_pdf)
                        
                        if os.path.exists(temp_pdf) and os.path.getsize(temp_pdf) > 0:
                            print(f"DEBUG: PDF criado com sucesso: {os.path.getsize(temp_pdf)} bytes")
                            output_files.append(temp_pdf)
                        else:
                            print(f"DEBUG: PDF não foi criado corretamente, usando DOCX")
                            output_files.append(temp_docx)
                            
                    finally:
                        pythoncom.CoUninitialize()
                        
                except Exception as e:
                    print(f"DEBUG: Erro na conversão PDF: {e}")
                    print(f"DEBUG: Tentando método alternativo...")
                    
                    # Método 2: Usar LibreOffice se disponível
                    try:
                        import subprocess
                        result = subprocess.run([
                            'soffice', '--headless', '--convert-to', 'pdf',
                            '--outdir', temp_dir, temp_docx
                        ], capture_output=True, text=True, timeout=30)
                        
                        if result.returncode == 0 and os.path.exists(temp_pdf):
                            print(f"DEBUG: PDF criado via LibreOffice: {os.path.getsize(temp_pdf)} bytes")
                            output_files.append(temp_pdf)
                        else:
                            print(f"DEBUG: LibreOffice falhou, usando DOCX")
                            output_files.append(temp_docx)
                            
                    except Exception as e2:
                        print(f"DEBUG: LibreOffice não disponível: {e2}")
                        print(f"DEBUG: Retornando DOCX como fallback")
                        output_files.append(temp_docx)
                
                print(f"DEBUG: Arquivo final adicionado: {output_files[-1]}")
            
            print(f"DEBUG: Total output files: {len(output_files)}")
            
            if not output_files:
                print("DEBUG: No files generated!")
                return jsonify({"erro": "Nenhum receituário foi gerado"}), 400
            
            # Se apenas um arquivo, retorna diretamente
            if len(output_files) == 1:
                file_path = output_files[0]
                print(f"DEBUG: Returning file: {file_path}")
                print(f"DEBUG: File size: {os.path.getsize(file_path)} bytes")
                
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                
                print(f"DEBUG: File data read: {len(file_data)} bytes")
                
                mimetype = 'application/pdf' if file_path.endswith('.pdf') else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                extension = 'pdf' if file_path.endswith('.pdf') else 'docx'
                
                print(f"DEBUG: Returning {extension} file with mimetype {mimetype}")
                
                return Response(
                    file_data,
                    mimetype=mimetype,
                    headers={
                        'Content-Disposition': f'attachment; filename=receituario_hipertensao_{datetime.now().strftime("%Y%m%d")}.{extension}'
                    }
                )
            
            # Se múltiplos arquivos, seria necessário criar um ZIP
            # Por simplicidade, retornamos apenas o primeiro por enquanto
            file_path = output_files[0]
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            return Response(
                file_data,
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                headers={
                    'Content-Disposition': f'attachment; filename=receituarios_hipertensao_{datetime.now().strftime("%Y%m%d")}.docx'
                }
            )
        
    except Exception as e:
        print(f"Erro ao gerar receituário: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/hiperdia/generate_prescription_pdf_individual', methods=['POST'])
def api_generate_prescription_pdf_individual():
    """Gera PDF individual para um único paciente"""
    import unicodedata
    import tempfile
    import os
    from datetime import datetime
    
    def remove_acentos(texto):
        """Remove acentos do texto"""
        return unicodedata.normalize('NFD', texto).encode('ascii', 'ignore').decode('ascii')
    
    data = request.get_json()
    patient = data.get('patient')
    
    if not patient:
        return jsonify({"erro": "Dados do paciente não fornecidos"}), 400
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Caminho para o template
        template_path = os.path.join(os.path.dirname(__file__), 'modelos', 'template_receituario_dynamic.docx')
        
        if not os.path.exists(template_path):
            return jsonify({"erro": "Template não encontrado"}), 500
        
        # Buscar dados do paciente
        sql_paciente = """
            SELECT 
                nome_paciente,
                cartao_sus,
                dt_nascimento,
                sexo
            FROM sistemaaps.mv_hiperdia_hipertensao
            WHERE cod_paciente = %(cod_paciente)s
        """
        
        cur.execute(sql_paciente, {'cod_paciente': patient['cod_paciente']})
        paciente_dados = cur.fetchone()
        
        if not paciente_dados:
            return jsonify({"erro": "Paciente não encontrado"}), 404
            
        paciente_dict = dict(paciente_dados)
        
        # Buscar medicamentos
        sql_medicamentos = """
            SELECT 
                nome_medicamento,
                dose,
                frequencia,
                data_inicio,
                observacao,
                updated_at
            FROM sistemaaps.tb_hiperdia_has_medicamentos
            WHERE codcidadao = %(cod_paciente)s
            AND (data_fim IS NULL OR data_fim > CURRENT_DATE)
            ORDER BY nome_medicamento
        """
        
        cur.execute(sql_medicamentos, {'cod_paciente': patient['cod_paciente']})
        medicamentos = cur.fetchall()
        
        if not medicamentos:
            return jsonify({"erro": "Nenhum medicamento ativo encontrado para este paciente"}), 404
        
        # Preparar dados para o template
        hoje = datetime.now()
        
        # Calcular idade
        if paciente_dict['dt_nascimento']:
            idade = hoje.year - paciente_dict['dt_nascimento'].year
            if hoje.month < paciente_dict['dt_nascimento'].month or \
               (hoje.month == paciente_dict['dt_nascimento'].month and hoje.day < paciente_dict['dt_nascimento'].day):
                idade -= 1
        else:
            idade = "?"
        
        # Preparar lista de medicamentos
        medicamentos_lista = []
        for idx, med in enumerate(medicamentos, 1):
            med_dict = dict(med)
            nome = med_dict['nome_medicamento'].upper()
            dose = med_dict['dose'] or 1
            freq = med_dict['frequencia'] or 1
            total_comprimidos = dose * freq * 30
            
            # Preparar instruções
            instrucoes = []
            if freq == 1:
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
            elif freq == 2:
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 18:00 horas")
            elif freq == 3:
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 14:00 horas")
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 22:00 horas")
            elif freq == 4:
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 06:00 horas")
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 12:00 horas")
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 18:00 horas")
                instrucoes.append(f"Tomar {dose:02d} comprimido{'s' if dose > 1 else ''} as 24:00 horas")
            
            medicamentos_lista.append({
                'numero': idx,
                'nome': nome,
                'quantidade': total_comprimidos,
                'instrucoes': instrucoes
            })
        
        # Calcular tamanho da fonte baseado na quantidade de medicamentos
        num_medicamentos = len(medicamentos_lista)
        if num_medicamentos <= 2:
            font_size = 14
        elif num_medicamentos == 3:
            font_size = 12
        elif num_medicamentos == 4:
            font_size = 10
        elif num_medicamentos == 5:
            font_size = 8
        else:
            font_size = 8
        
        # Definir quantidade de traços baseada no tamanho da fonte
        if num_medicamentos <= 2:  # Fonte maior (14pt)
            tracos = "--------------------------------"  # 32 traços
        else:  # Fonte menor (12pt, 10pt, 8pt)
            tracos = "---------------------------------------------"  # 45 traços
        
        # Gerar texto completo de medicamentos dinamicamente
        medicamentos_texto = ""
        for idx, med in enumerate(medicamentos_lista, 1):
            # Nome e quantidade do medicamento
            medicamentos_texto += f"{idx}) {med['nome']} {tracos} {med['quantidade']} comprimidos\n"
            
            # Adicionar todas as instruções
            for instrucao in med['instrucoes']:
                medicamentos_texto += f"{instrucao}\n"
            
            # Espaçamento entre medicamentos (se não for o último)
            if idx < len(medicamentos_lista):
                medicamentos_texto += "\n"
        
        # Se não há medicamentos, usar texto padrão
        if not medicamentos_texto:
            medicamentos_texto = "1) MEDICAMENTO CONFORME ORIENTAÇÃO MÉDICA -------------------------------- 30 comprimidos\n\nConforme orientação médica"
            font_size = 11
        
        # Contexto completo para o template
        context = {
            'nome_paciente': remove_acentos(paciente_dict['nome_paciente'].upper()),
            'data_nascimento': paciente_dict['dt_nascimento'].strftime('%d/%m/%Y') if paciente_dict['dt_nascimento'] else "xx/xx/xxxx",
            'idade': idade,
            'sexo': paciente_dict.get('sexo', 'Não informado'),
            'cns': paciente_dict['cartao_sus'] if paciente_dict['cartao_sus'] else "CNS não registrado no PEC",
            'ultima_atualizacao': medicamentos[0]['updated_at'].strftime('%d/%m/%Y') if medicamentos[0]['updated_at'] else "Não disponível",
            'medicamentos_texto': medicamentos_texto,
            'font_size': font_size
        }
        
        # Criar arquivo temporário
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_docx = os.path.join(temp_dir, f"receituario_{patient['cod_paciente']}.docx")
            temp_pdf = os.path.join(temp_dir, f"receituario_{patient['cod_paciente']}.pdf")
            
            # Processar template usando DocxTemplate (mesma lógica do endpoint principal)
            from docxtpl import DocxTemplate
            from docx import Document as DocDocument
            from docx.shared import Pt
            
            # Carregar e renderizar template
            doc = DocxTemplate(template_path)
            doc.render(context)
            
            # Salvar documento temporário
            doc.save(temp_docx)
            
            # Aplicar formatação específica aos medicamentos após renderização
            rendered_doc = DocDocument(temp_docx)
            
            for paragraph in rendered_doc.paragraphs:
                text = paragraph.text.strip()
                
                # Se é uma linha de medicamento (contém ") nome -------- quantidade comprimidos")
                if ') ' in text and ('--------' in text or '-----' in text) and 'comprimidos' in text.lower():
                    # Aplicar negrito e tamanho de fonte à linha do medicamento
                    for run in paragraph.runs:
                        run.font.bold = True
                        run.font.size = Pt(font_size)
                        
                # Se é uma linha de instrução (começa com "Tomar")
                elif text.startswith('Tomar '):
                    # Aplicar apenas tamanho de fonte (sem negrito) às instruções
                    for run in paragraph.runs:
                        run.font.bold = False
                        run.font.size = Pt(font_size)
            
            # Duplicar o conteúdo para criar segunda página idêntica
            print(f"DEBUG: Duplicando receituário individual para segunda página...")
            
            # Coletar todos os parágrafos da primeira página ANTES de adicionar quebra
            original_paragraphs = []
            for paragraph in rendered_doc.paragraphs:
                # Capturar o parágrafo completo
                para_info = {
                    'text': paragraph.text,
                    'alignment': paragraph.alignment,
                    'runs': []
                }
                
                # Capturar informações de formatação de cada run
                for run in paragraph.runs:
                    run_info = {
                        'text': run.text,
                        'bold': run.font.bold,
                        'size': run.font.size,
                        'underline': run.font.underline,
                        'italic': run.font.italic
                    }
                    para_info['runs'].append(run_info)
                
                original_paragraphs.append(para_info)
            
            print(f"DEBUG: Capturados {len(original_paragraphs)} parágrafos da primeira página")
            
            # Adicionar quebra de página
            rendered_doc.add_page_break()
            
            # Recriar cada parágrafo da primeira página na segunda página
            for para_info in original_paragraphs:
                new_p = rendered_doc.add_paragraph()
                new_p.alignment = para_info['alignment']
                
                # Se não há runs, adicionar o texto simples
                if not para_info['runs']:
                    if para_info['text']:
                        new_run = new_p.add_run(para_info['text'])
                        new_run.font.size = Pt(font_size)
                else:
                    # Recriar cada run com sua formatação original
                    for run_info in para_info['runs']:
                        new_run = new_p.add_run(run_info['text'])
                        new_run.font.bold = run_info['bold']
                        new_run.font.size = run_info['size']
                        new_run.font.underline = run_info['underline']
                        new_run.font.italic = run_info['italic']
            
            # Salvar documento final
            rendered_doc.save(temp_docx)
            print(f"DEBUG: Receituário individual duplicado criado - 2 páginas idênticas")
            
            # Tentar conversão para PDF
            try:
                import pythoncom
                pythoncom.CoInitializeEx(pythoncom.COINIT_APARTMENTTHREADED)
                
                try:
                    from docx2pdf import convert
                    convert(temp_docx, temp_pdf)
                    
                    if os.path.exists(temp_pdf) and os.path.getsize(temp_pdf) > 0:
                        file_path = temp_pdf
                        mimetype = 'application/pdf'
                        extension = 'pdf'
                    else:
                        file_path = temp_docx
                        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        extension = 'docx'
                finally:
                    pythoncom.CoUninitialize()
                    
            except Exception as e:
                print(f"Erro na conversão PDF: {e}")
                file_path = temp_docx
                mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                extension = 'docx'
            
            # Ler arquivo e retornar
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Nome do arquivo conforme solicitado
            current_date = datetime.now().strftime('%d-%m-%Y')
            patient_name = remove_acentos(paciente_dict['nome_paciente'].upper()).replace(' ', '_')
            filename = f"RECEITUARIO ({current_date}) - HIPERTENSAO - {patient_name}.{extension}"
            
            return Response(
                file_data,
                mimetype=mimetype,
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"'
                }
            )
        
    except Exception as e:
        print(f"Erro ao gerar receituário individual: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"erro": f"Erro no servidor: {e}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=3030, host='0.0.0.0')