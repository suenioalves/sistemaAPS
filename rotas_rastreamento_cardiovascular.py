# ============================================================================
# ROTAS DO MÓDULO DE RASTREAMENTO CARDIOVASCULAR
# Adicionar estas rotas ao app.py antes do if __name__ == '__main__'
# ============================================================================

# -------------------------------------------------------------------------
# ROTA: Renderizar painel de rastreamento cardiovascular
# -------------------------------------------------------------------------
@app.route('/painel-rastreamento-cardiovascular')
def painel_rastreamento_cardiovascular():
    return render_template(
        'painel-rastreamento-cardiovascular.html',
        data_atual=datetime.now().strftime('%d/%m/%Y')
    )


# -------------------------------------------------------------------------
# API: Buscar integrantes elegíveis de um domicílio para rastreamento
# -------------------------------------------------------------------------
@app.route('/api/rastreamento/integrantes-domicilio/<int:id_domicilio>')
def api_rastreamento_integrantes_domicilio(id_domicilio):
    """
    Retorna integrantes do domicílio elegíveis para rastreamento:
    - Idade >= 20 anos
    - Não diagnosticados com hipertensão
    """
    conn = None
    cur = None

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        query = """
            SELECT
                ci.co_seq_cds_cad_individual,
                ci.no_cidadao AS nome_cidadao,
                ci.dt_nascimento AS data_nascimento,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, ci.dt_nascimento)) AS idade,
                s.no_sexo AS sexo,
                ci.nu_cpf_cidadao,
                ci.nu_cns_cidadao,

                -- Verificar se já tem diagnóstico de hipertensão ou diabetes
                COALESCE(
                    (SELECT TRUE FROM sistemaaps.tb_hiperdia_has_acompanhamento
                     WHERE cod_cidadao = c.co_seq_cidadao
                     LIMIT 1),
                    FALSE
                ) AS tem_diagnostico_hipertensao,

                COALESCE(
                    (SELECT TRUE FROM sistemaaps.tb_hiperdia_dm_acompanhamento
                     WHERE cod_cidadao = c.co_seq_cidadao
                     LIMIT 1),
                    FALSE
                ) AS tem_diagnostico_diabetes

            FROM tb_cds_cad_domiciliar d
            INNER JOIN tb_cds_domicilio_familia df ON df.co_cds_cad_domiciliar = d.co_seq_cds_cad_domiciliar
            INNER JOIN tb_cds_cad_individual ci ON (
                ci.nu_cpf_responsavel = df.nu_cpf_cidadao
                OR ci.nu_cpf_cidadao = df.nu_cpf_cidadao
                OR ci.nu_cartao_sus_responsavel = df.nu_cartao_sus
                OR ci.nu_cns_cidadao = df.nu_cartao_sus
            )
            LEFT JOIN tb_sexo s ON s.co_sexo = ci.co_sexo
            LEFT JOIN tb_cidadao c ON c.co_unico_ultima_ficha = ci.co_unico_ficha AND c.st_ativo = 1

            WHERE d.co_seq_cds_cad_domiciliar = %s
              AND d.st_versao_atual = 1
              AND df.st_mudanca = 0
              AND ci.st_versao_atual = 1
              AND ci.st_ficha_inativa = 0
              AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, ci.dt_nascimento)) >= 20

            ORDER BY ci.no_cidadao
        """

        cur.execute(query, (id_domicilio,))
        integrantes = cur.fetchall()

        # Converter para formato adequado
        resultado = []
        for integrante in integrantes:
            resultado.append({
                'co_seq_cds_cad_individual': integrante['co_seq_cds_cad_individual'],
                'nome_cidadao': integrante['nome_cidadao'],
                'data_nascimento': integrante['data_nascimento'].isoformat() if integrante['data_nascimento'] else None,
                'idade': int(integrante['idade']) if integrante['idade'] else 0,
                'sexo': integrante['sexo'] or 'Não informado',
                'tem_diagnostico_hipertensao': integrante['tem_diagnostico_hipertensao'],
                'tem_diagnostico_diabetes': integrante['tem_diagnostico_diabetes'],
                'elegivel_rastreamento': not integrante['tem_diagnostico_hipertensao']
            })

        return jsonify({
            'success': True,
            'total': len(resultado),
            'integrantes': resultado
        })

    except Exception as e:
        print(f"Erro ao buscar integrantes: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


# -------------------------------------------------------------------------
# API: Iniciar rastreamento de uma família
# -------------------------------------------------------------------------
@app.route('/api/rastreamento/iniciar-familia', methods=['POST'])
def api_rastreamento_iniciar_familia():
    """
    Inicia rastreamento para uma família específica
    """
    conn = None
    cur = None

    try:
        data = request.get_json()

        co_seq_cds_domicilio_familia = data.get('co_seq_cds_domicilio_familia')
        co_seq_cds_cad_domiciliar = data.get('co_seq_cds_cad_domiciliar')
        equipe = data.get('equipe')
        microarea = data.get('microarea')
        responsavel = data.get('responsavel_rastreamento', 'Sistema')
        cidadaos_selecionados = data.get('cidadaos_selecionados', [])

        if not co_seq_cds_cad_domiciliar or not cidadaos_selecionados:
            return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Inserir registro de rastreamento da família
        insert_familia = """
            INSERT INTO sistemaaps.tb_rastreamento_familias
            (co_seq_cds_domicilio_familia, co_seq_cds_cad_domiciliar, equipe, microarea,
             data_inicio_rastreamento, status_rastreamento, responsavel_rastreamento)
            VALUES (%s, %s, %s, %s, CURRENT_DATE, 'INICIADO', %s)
            RETURNING cod_seq_rastreamento_familia
        """

        cur.execute(insert_familia, (
            co_seq_cds_domicilio_familia,
            co_seq_cds_cad_domiciliar,
            equipe,
            microarea,
            responsavel
        ))

        cod_rastreamento_familia = cur.fetchone()['cod_seq_rastreamento_familia']

        # Inserir cidadãos selecionados
        insert_cidadao = """
            INSERT INTO sistemaaps.tb_rastreamento_cidadaos
            (cod_rastreamento_familia, co_seq_cds_cad_individual, nome_cidadao,
             data_nascimento, idade_no_rastreamento, sexo, tem_diagnostico_hipertensao,
             elegivel_rastreamento, fase_rastreamento)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'MRPA_INICIAL')
        """

        for cidadao in cidadaos_selecionados:
            cur.execute(insert_cidadao, (
                cod_rastreamento_familia,
                cidadao['co_seq_cds_cad_individual'],
                cidadao['nome_cidadao'],
                cidadao['data_nascimento'],
                cidadao['idade'],
                cidadao['sexo'],
                cidadao.get('tem_diagnostico_hipertensao', False),
                cidadao.get('elegivel_rastreamento', True)
            ))

        conn.commit()

        return jsonify({
            'success': True,
            'cod_rastreamento_familia': cod_rastreamento_familia,
            'message': 'Rastreamento iniciado com sucesso'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao iniciar rastreamento: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


# -------------------------------------------------------------------------
# API: Registrar aferição MRPA
# -------------------------------------------------------------------------
@app.route('/api/rastreamento/registrar-afericao-mrpa', methods=['POST'])
def api_rastreamento_registrar_afericao_mrpa():
    """
    Registra uma aferição da fase MRPA (1x por dia por 3-5 dias)
    """
    conn = None
    cur = None

    try:
        data = request.get_json()

        cod_rastreamento_cidadao = data.get('cod_rastreamento_cidadao')
        dia_medicao = data.get('dia_medicao')
        pressao_sistolica = data.get('pressao_sistolica')
        pressao_diastolica = data.get('pressao_diastolica')
        data_afericao = data.get('data_afericao')
        hora_afericao = data.get('hora_afericao')
        frequencia_cardiaca = data.get('frequencia_cardiaca')
        observacoes = data.get('observacoes')

        if not all([cod_rastreamento_cidadao, dia_medicao, pressao_sistolica, pressao_diastolica]):
            return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        insert_afericao = """
            INSERT INTO sistemaaps.tb_rastreamento_afericoes_mrpa
            (cod_rastreamento_cidadao, dia_medicao, data_afericao, hora_afericao,
             pressao_sistolica, pressao_diastolica, frequencia_cardiaca, observacoes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        cur.execute(insert_afericao, (
            cod_rastreamento_cidadao,
            dia_medicao,
            data_afericao or datetime.now().date(),
            hora_afericao,
            pressao_sistolica,
            pressao_diastolica,
            frequencia_cardiaca,
            observacoes
        ))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Aferição MRPA registrada com sucesso'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao registrar aferição MRPA: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


# -------------------------------------------------------------------------
# API: Calcular média MRPA e análise
# -------------------------------------------------------------------------
@app.route('/api/rastreamento/calcular-media-mrpa/<int:cod_rastreamento_cidadao>')
def api_rastreamento_calcular_media_mrpa(cod_rastreamento_cidadao):
    """
    Calcula a média das aferições MRPA e determina se é suspeito
    Critério: MRPA >= 130x80 = SUSPEITO
    """
    conn = None
    cur = None

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        query = """
            SELECT
                ROUND(AVG(pressao_sistolica)) AS media_pas,
                ROUND(AVG(pressao_diastolica)) AS media_pad,
                COUNT(*) AS total_afericoes,
                ARRAY_AGG(
                    json_build_object(
                        'dia', dia_medicao,
                        'data', data_afericao,
                        'pas', pressao_sistolica,
                        'pad', pressao_diastolica
                    ) ORDER BY dia_medicao
                ) AS afericoes
            FROM sistemaaps.tb_rastreamento_afericoes_mrpa
            WHERE cod_rastreamento_cidadao = %s
        """

        cur.execute(query, (cod_rastreamento_cidadao,))
        resultado = cur.fetchone()

        if not resultado or resultado['total_afericoes'] == 0:
            return jsonify({
                'success': False,
                'message': 'Nenhuma aferição encontrada'
            }), 404

        media_pas = int(resultado['media_pas']) if resultado['media_pas'] else 0
        media_pad = int(resultado['media_pad']) if resultado['media_pad'] else 0

        # Classificação automática
        classificacao = 'NORMAL'
        proxima_fase = 'FINALIZADO'

        if media_pas >= 130 or media_pad >= 80:
            classificacao = 'SUSPEITO'
            proxima_fase = 'MAPA'

        return jsonify({
            'success': True,
            'media_pas': media_pas,
            'media_pad': media_pad,
            'total_afericoes': resultado['total_afericoes'],
            'afericoes': resultado['afericoes'],
            'classificacao': classificacao,
            'proxima_fase': proxima_fase,
            'mensagem': f'Média: {media_pas}/{media_pad} mmHg - {classificacao}'
        })

    except Exception as e:
        print(f"Erro ao calcular média MRPA: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


# -------------------------------------------------------------------------
# API: Registrar aferição MAPA
# -------------------------------------------------------------------------
@app.route('/api/rastreamento/registrar-afericao-mapa', methods=['POST'])
def api_rastreamento_registrar_afericao_mapa():
    """
    Registra aferição MAPA: 3x manhã + 3x noite por 5 dias
    Dia 1 é marcado para exclusão do cálculo
    """
    conn = None
    cur = None

    try:
        data = request.get_json()

        cod_rastreamento_cidadao = data.get('cod_rastreamento_cidadao')
        dia_medicao = data.get('dia_medicao')
        periodo = data.get('periodo')  # 'MANHA' ou 'NOITE'
        numero_afericao = data.get('numero_afericao')  # 1, 2 ou 3
        pressao_sistolica = data.get('pressao_sistolica')
        pressao_diastolica = data.get('pressao_diastolica')
        data_afericao = data.get('data_afericao')
        hora_afericao = data.get('hora_afericao')

        if not all([cod_rastreamento_cidadao, dia_medicao, periodo, numero_afericao, pressao_sistolica, pressao_diastolica]):
            return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Definir se deve excluir do cálculo (dia 1)
        excluir_calculo = (dia_medicao == 1)

        insert_afericao = """
            INSERT INTO sistemaaps.tb_rastreamento_afericoes_mapa
            (cod_rastreamento_cidadao, dia_medicao, periodo, numero_afericao,
             data_afericao, hora_afericao, pressao_sistolica, pressao_diastolica,
             frequencia_cardiaca, excluir_calculo, observacoes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cur.execute(insert_afericao, (
            cod_rastreamento_cidadao,
            dia_medicao,
            periodo,
            numero_afericao,
            data_afericao or datetime.now().date(),
            hora_afericao,
            pressao_sistolica,
            pressao_diastolica,
            data.get('frequencia_cardiaca'),
            excluir_calculo,
            data.get('observacoes')
        ))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'Aferição MAPA registrada (Dia {dia_medicao}, {periodo}, {numero_afericao}ª medida)'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao registrar aferição MAPA: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


# -------------------------------------------------------------------------
# API: Calcular média MAPA e diagnóstico final
# -------------------------------------------------------------------------
@app.route('/api/rastreamento/calcular-media-mapa/<int:cod_rastreamento_cidadao>')
def api_rastreamento_calcular_media_mapa(cod_rastreamento_cidadao):
    """
    Calcula média MAPA (excluindo dia 1) e define diagnóstico
    Critério: PAS >= 130 ou PAD >= 80 = HIPERTENSO
    """
    conn = None
    cur = None

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        query = """
            SELECT
                ROUND(AVG(pressao_sistolica)) AS media_pas,
                ROUND(AVG(pressao_diastolica)) AS media_pad,
                COUNT(*) AS total_afericoes_validas
            FROM sistemaaps.tb_rastreamento_afericoes_mapa
            WHERE cod_rastreamento_cidadao = %s
              AND excluir_calculo = FALSE
        """

        cur.execute(query, (cod_rastreamento_cidadao,))
        resultado = cur.fetchone()

        if not resultado or resultado['total_afericoes_validas'] == 0:
            return jsonify({
                'success': False,
                'message': 'Nenhuma aferição válida encontrada'
            }), 404

        media_pas = int(resultado['media_pas']) if resultado['media_pas'] else 0
        media_pad = int(resultado['media_pad']) if resultado['media_pad'] else 0

        # Diagnóstico automático
        if media_pas >= 130 or media_pad >= 80:
            diagnostico = 'HIPERTENSO'
            mensagem = 'Paciente deve ser classificado como HIPERTENSO'
        else:
            diagnostico = 'NAO_HIPERTENSO'
            mensagem = 'Paciente pode ser classificado como NÃO HIPERTENSO. Reavaliar em 1 ano.'

        return jsonify({
            'success': True,
            'media_pas': media_pas,
            'media_pad': media_pad,
            'total_afericoes_validas': resultado['total_afericoes_validas'],
            'diagnostico_sugerido': diagnostico,
            'mensagem': mensagem
        })

    except Exception as e:
        print(f"Erro ao calcular média MAPA: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


# -------------------------------------------------------------------------
# API: Finalizar rastreamento com decisão do profissional
# -------------------------------------------------------------------------
@app.route('/api/rastreamento/finalizar', methods=['POST'])
def api_rastreamento_finalizar():
    """
    Finaliza o rastreamento com a decisão final do profissional
    """
    conn = None
    cur = None

    try:
        data = request.get_json()

        cod_rastreamento_cidadao = data.get('cod_rastreamento_cidadao')
        resultado_rastreamento = data.get('resultado_rastreamento')  # HIPERTENSO ou NAO_HIPERTENSO
        decisao_profissional = data.get('decisao_profissional')  # CONCORDO ou NAO_CONCORDO
        justificativa = data.get('justificativa_decisao')

        if not all([cod_rastreamento_cidadao, resultado_rastreamento, decisao_profissional]):
            return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Calcular data do próximo rastreamento (1 ano) se não hipertenso
        data_proximo = None
        if resultado_rastreamento == 'NAO_HIPERTENSO':
            data_proximo = (datetime.now() + timedelta(days=365)).date()

        update_cidadao = """
            UPDATE sistemaaps.tb_rastreamento_cidadaos
            SET fase_rastreamento = 'FINALIZADO',
                resultado_rastreamento = %s,
                data_resultado = CURRENT_DATE,
                decisao_profissional = %s,
                justificativa_decisao = %s,
                data_proximo_rastreamento = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE cod_seq_rastreamento_cidadao = %s
        """

        cur.execute(update_cidadao, (
            resultado_rastreamento,
            decisao_profissional,
            justificativa,
            data_proximo,
            cod_rastreamento_cidadao
        ))

        conn.commit()

        mensagem = f'Rastreamento finalizado. Resultado: {resultado_rastreamento}'
        if data_proximo:
            mensagem += f'. Próximo rastreamento em {data_proximo.strftime("%d/%m/%Y")}'

        return jsonify({
            'success': True,
            'message': mensagem
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao finalizar rastreamento: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()
