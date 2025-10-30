#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Script para adicionar endpoints MRPA ao app.py"""

# Ler o arquivo
with open('app.py', 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Endpoints MRPA
endpoints_mrpa = '''
# ============================================================================
# MRPA ENDPOINTS
# ============================================================================

@app.route('/api/rastreamento/mrpa/<int:cod_cidadao>', methods=['GET'])
def get_mrpa_data(cod_cidadao):
    """
    Carrega dados MRPA existentes para um cidadão
    Retorna as medições dos 5 dias (manhã e noite)
    """
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Buscar o cod_rastreamento_cidadao
        cur.execute("""
            SELECT cod_seq_rastreamento_cidadao
            FROM sistemaaps.tb_rastreamento_cidadaos
            WHERE cod_seq_rastreamento_cidadao = %s
        """, [cod_cidadao])

        cidadao = cur.fetchone()
        if not cidadao:
            return jsonify({'success': False, 'message': 'Cidadão não encontrado'}), 404

        cod_rastreamento_cidadao = cidadao['cod_seq_rastreamento_cidadao']

        # Buscar todas as aferições MRPA
        cur.execute("""
            SELECT
                dia_medicao,
                periodo,
                numero_afericao,
                pressao_arterial_sistolica as pas,
                pressao_arterial_diastolica as pad
            FROM sistemaaps.tb_rastreamento_afericoes_mrpa
            WHERE cod_rastreamento_cidadao = %s
            ORDER BY dia_medicao, periodo DESC, numero_afericao
        """, [cod_rastreamento_cidadao])

        afericoes = cur.fetchall()

        # Organizar as medições por dia
        medicoes = {}
        for afericao in afericoes:
            dia = afericao['dia_medicao']
            periodo = afericao['periodo']
            numero = afericao['numero_afericao']
            pas = afericao['pas']
            pad = afericao['pad']

            if dia not in medicoes:
                medicoes[dia] = {}

            if periodo not in medicoes[dia]:
                medicoes[dia][periodo] = {}

            medicoes[dia][periodo][numero] = f"{pas}/{pad}"

        return jsonify({
            'success': True,
            'cod_rastreamento_cidadao': cod_rastreamento_cidadao,
            'medicoes': medicoes
        })

    except Exception as e:
        print(f"Erro ao carregar dados MRPA: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/rastreamento/mrpa/salvar', methods=['POST'])
def salvar_mrpa():
    """
    Salva as medições MRPA completas (5 dias, 6 medições/dia)
    Calcula a média e atualiza o status do cidadão se necessário
    """
    conn = None
    cur = None

    try:
        data = request.get_json()
        cod_cidadao = data.get('cod_cidadao')
        medicoes = data.get('medicoes', {})

        if not cod_cidadao or not medicoes:
            return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Buscar o cod_rastreamento_cidadao
        cur.execute("""
            SELECT cod_seq_rastreamento_cidadao
            FROM sistemaaps.tb_rastreamento_cidadaos
            WHERE cod_seq_rastreamento_cidadao = %s
        """, [cod_cidadao])

        cidadao = cur.fetchone()
        if not cidadao:
            return jsonify({'success': False, 'message': 'Cidadão não encontrado'}), 404

        cod_rastreamento_cidadao = cidadao['cod_seq_rastreamento_cidadao']

        # Deletar medições existentes
        cur.execute("""
            DELETE FROM sistemaaps.tb_rastreamento_afericoes_mrpa
            WHERE cod_rastreamento_cidadao = %s
        """, [cod_rastreamento_cidadao])

        # Inserir novas medições e calcular médias
        total_pas = 0
        total_pad = 0
        total_medicoes = 0

        for dia_str, periodos in medicoes.items():
            dia = int(dia_str)

            for periodo, numeros in periodos.items():
                for numero_str, valor in numeros.items():
                    numero = int(numero_str)

                    # Parse "PAS/PAD"
                    if '/' in valor and valor.strip():
                        try:
                            pas, pad = valor.split('/')
                            pas = int(pas.strip())
                            pad = int(pad.strip())

                            # Inserir medição
                            cur.execute("""
                                INSERT INTO sistemaaps.tb_rastreamento_afericoes_mrpa
                                (cod_rastreamento_cidadao, dia_medicao, periodo, numero_afericao,
                                 pressao_arterial_sistolica, pressao_arterial_diastolica)
                                VALUES (%s, %s, %s, %s, %s, %s)
                            """, [cod_rastreamento_cidadao, dia, periodo, numero, pas, pad])

                            # Acumular para média
                            total_pas += pas
                            total_pad += pad
                            total_medicoes += 1

                        except (ValueError, AttributeError):
                            continue

        # Calcular médias
        if total_medicoes > 0:
            media_pas = round(total_pas / total_medicoes)
            media_pad = round(total_pad / total_medicoes)

            # Salvar média na tabela de resultados
            # Primeiro deletar média existente se houver
            cur.execute("""
                DELETE FROM sistemaaps.tb_rastreamento_resultado_media_pa
                WHERE cod_rastreamento_cidadao = %s
                  AND tipo_medicao = 'MRPA'
            """, [cod_rastreamento_cidadao])

            # Inserir nova média
            cur.execute("""
                INSERT INTO sistemaaps.tb_rastreamento_resultado_media_pa
                (cod_rastreamento_cidadao, tipo_medicao, media_pas, media_pad, numero_afericoes)
                VALUES (%s, 'MRPA', %s, %s, %s)
            """, [cod_rastreamento_cidadao, media_pas, media_pad, total_medicoes])

            # Verificar se é hipertenso: PAS >= 130 OU PAD >= 80
            is_hipertenso = media_pas >= 130 or media_pad >= 80

            if is_hipertenso:
                # Atualizar status do cidadão para HIPERTENSO
                cur.execute("""
                    UPDATE sistemaaps.tb_rastreamento_cidadaos
                    SET resultado_rastreamento = 'HIPERTENSO'
                    WHERE cod_seq_rastreamento_cidadao = %s
                """, [cod_rastreamento_cidadao])

                novo_status = 'HIPERTENSO'
            else:
                # Manter como NAO_HIPERTENSO
                cur.execute("""
                    UPDATE sistemaaps.tb_rastreamento_cidadaos
                    SET resultado_rastreamento = 'NAO_HIPERTENSO'
                    WHERE cod_seq_rastreamento_cidadao = %s
                """, [cod_rastreamento_cidadao])

                novo_status = 'NAO_HIPERTENSO'

            conn.commit()

            return jsonify({
                'success': True,
                'message': 'MRPA salvo com sucesso',
                'media_pas': media_pas,
                'media_pad': media_pad,
                'total_medicoes': total_medicoes,
                'novo_status': novo_status,
                'is_hipertenso': is_hipertenso
            })
        else:
            return jsonify({'success': False, 'message': 'Nenhuma medição válida encontrada'}), 400

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao salvar MRPA: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


'''

# Localizar a posição para inserir (antes do if __name__)
posicao_insert = conteudo.find('\n# ============================================================================\n\nif __name__')

if posicao_insert == -1:
    print("ERRO: Não foi possível localizar a seção if __name__")
    exit(1)

# Inserir os endpoints
novo_conteudo = conteudo[:posicao_insert] + endpoints_mrpa + conteudo[posicao_insert:]

# Escrever o arquivo
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(novo_conteudo)

print("Endpoints MRPA adicionados com sucesso!")
print("  - GET /api/rastreamento/mrpa/<cod_cidadao>")
print("  - POST /api/rastreamento/mrpa/salvar")
