#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Consulta ao Banco de Dados e-SUS PEC
Exemplos práticos de uso das queries SQL
"""

import psycopg2
from datetime import datetime


# Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'port': '5433',
    'database': 'esus',
    'user': 'postgres',
    'password': 'EUC[x*x~Mc#S+H_Ui#xZBr0O~'
}


class ConsultaBancoESUS:
    """Classe para consultas ao banco e-SUS PEC"""

    def __init__(self):
        self.connection = None
        self.cursor = None

    def conectar(self):
        """Estabelece conexão com o banco"""
        try:
            self.connection = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.connection.cursor()
            print("✓ Conexão estabelecida com sucesso!")
            return True
        except Exception as e:
            print(f"✗ Erro ao conectar: {e}")
            return False

    def desconectar(self):
        """Fecha conexão com o banco"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            print("✓ Conexão encerrada")

    def listar_domicilios(self, limite=10):
        """Lista domicílios ativos"""
        print(f"\n{'=' * 80}")
        print("DOMICÍLIOS CADASTRADOS")
        print('=' * 80)

        query = """
            SELECT
                d.co_seq_cds_cad_domiciliar AS id,
                COALESCE(tl.no_tipo_logradouro, '') AS tipo_logr,
                d.no_logradouro,
                d.nu_domicilio AS numero,
                d.no_bairro AS bairro,
                d.nu_cep AS cep,
                TO_CHAR(d.dt_cad_domiciliar, 'DD/MM/YYYY') AS data_cadastro
            FROM tb_cds_cad_domiciliar d
            LEFT JOIN tb_tipo_logradouro tl ON tl.co_tipo_logradouro = d.tp_logradouro
            WHERE d.st_versao_atual = 1
            ORDER BY d.dt_cad_domiciliar DESC
            LIMIT %s;
        """

        self.cursor.execute(query, (limite,))
        domicilios = self.cursor.fetchall()

        for dom in domicilios:
            endereco = f"{dom[1]} {dom[2]}, {dom[3]}"
            print(f"\nID: {dom[0]}")
            print(f"  Endereço: {endereco}")
            print(f"  Bairro: {dom[4]} - CEP: {dom[5]}")
            print(f"  Cadastrado em: {dom[6]}")

        print(f"\nTotal de domicílios listados: {len(domicilios)}")
        return domicilios

    def listar_familias_domicilio(self, id_domicilio):
        """Lista famílias de um domicílio específico"""
        print(f"\n{'=' * 80}")
        print(f"FAMÍLIAS DO DOMICÍLIO ID: {id_domicilio}")
        print('=' * 80)

        query = """
            SELECT
                df.co_seq_cds_domicilio_familia AS id_familia,
                df.nu_cpf_cidadao AS cpf_responsavel,
                df.qt_membros_familia AS qtd_membros,
                rf.no_renda_familiar AS renda
            FROM tb_cds_domicilio_familia df
            LEFT JOIN tb_renda_familiar rf ON rf.co_renda_familiar = df.co_renda_familiar
            WHERE df.co_cds_cad_domiciliar = %s
              AND df.st_mudanca = 0
            ORDER BY df.co_seq_cds_domicilio_familia;
        """

        self.cursor.execute(query, (id_domicilio,))
        familias = self.cursor.fetchall()

        for fam in familias:
            print(f"\nFamília ID: {fam[0]}")
            print(f"  CPF Responsável: {fam[1] if fam[1] else 'Não informado'}")
            print(f"  Quantidade de Membros: {fam[2]}")
            print(f"  Renda Familiar: {fam[3] if fam[3] else 'Não informada'}")

        print(f"\nTotal de famílias: {len(familias)}")
        return familias

    def buscar_cidadao(self, cpf=None, cns=None, nome=None):
        """Busca cidadão por CPF, CNS ou nome"""
        print(f"\n{'=' * 80}")
        print("BUSCA DE CIDADÃO")
        print('=' * 80)

        if not any([cpf, cns, nome]):
            print("✗ Informe ao menos um parâmetro de busca!")
            return None

        query = """
            SELECT
                c.co_seq_cidadao AS id,
                c.no_cidadao AS nome,
                c.nu_cpf AS cpf,
                c.nu_cns AS cns,
                TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
                c.no_sexo AS sexo,
                c.no_mae AS mae,
                c.nu_micro_area AS microarea,
                e.no_equipe AS equipe,
                c.ds_logradouro AS endereco,
                c.nu_numero AS numero,
                c.no_bairro AS bairro,
                c.nu_telefone_celular AS celular
            FROM tb_cidadao c
            LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
            LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
            WHERE (
                (%s IS NOT NULL AND c.nu_cpf = %s) OR
                (%s IS NOT NULL AND c.nu_cns = %s) OR
                (%s IS NOT NULL AND LOWER(c.no_cidadao) LIKE LOWER(%s))
            )
              AND c.st_ativo = 1
            ORDER BY c.dt_atualizado DESC
            LIMIT 1;
        """

        # Preparar parâmetros
        cpf_param = cpf.replace('.', '').replace('-', '') if cpf else None
        nome_param = f'%{nome}%' if nome else None

        self.cursor.execute(query, (
            cpf_param, cpf_param,
            cns, cns,
            nome_param, nome_param
        ))

        cidadao = self.cursor.fetchone()

        if cidadao:
            print(f"\nCidadão Encontrado:")
            print(f"  ID: {cidadao[0]}")
            print(f"  Nome: {cidadao[1]}")
            print(f"  CPF: {cidadao[2] if cidadao[2] else 'Não informado'}")
            print(f"  CNS: {cidadao[3] if cidadao[3] else 'Não informado'}")
            print(f"  Data Nascimento: {cidadao[4]}")
            print(f"  Sexo: {cidadao[5] if cidadao[5] else 'Não informado'}")
            print(f"  Nome da Mãe: {cidadao[6] if cidadao[6] else 'Não informado'}")
            print(f"  Microárea: {cidadao[7] if cidadao[7] else 'Não informado'}")
            print(f"  Equipe: {cidadao[8] if cidadao[8] else 'Não vinculado'}")
            print(f"  Endereço: {cidadao[9] if cidadao[9] else 'Não informado'}, {cidadao[10] if cidadao[10] else 'S/N'}")
            print(f"  Bairro: {cidadao[11] if cidadao[11] else 'Não informado'}")
            print(f"  Celular: {cidadao[12] if cidadao[12] else 'Não informado'}")
        else:
            print("\n✗ Nenhum cidadão encontrado com os critérios informados")

        return cidadao

    def listar_cidadaos_microarea(self, microarea, limite=20):
        """Lista cidadãos de uma microárea específica"""
        print(f"\n{'=' * 80}")
        print(f"CIDADÃOS DA MICROÁREA: {microarea}")
        print('=' * 80)

        query = """
            SELECT
                ci.no_cidadao AS nome,
                ci.nu_cpf_cidadao AS cpf,
                TO_CHAR(ci.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
                s.no_sexo AS sexo,
                ci.st_responsavel_familiar AS eh_responsavel,
                e.no_equipe AS equipe
            FROM tb_cds_cad_individual ci
            LEFT JOIN tb_sexo s ON s.co_sexo = ci.co_sexo
            LEFT JOIN tb_cidadao c ON c.nu_cpf = ci.nu_cpf_cidadao OR c.nu_cns = ci.nu_cns_cidadao
            LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
            LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
            WHERE ci.nu_micro_area = %s
              AND ci.st_versao_atual = 1
              AND ci.st_ficha_inativa = 0
            ORDER BY ci.no_cidadao
            LIMIT %s;
        """

        self.cursor.execute(query, (microarea, limite))
        cidadaos = self.cursor.fetchall()

        for cid in cidadaos:
            resp = "*** RESPONSÁVEL ***" if cid[4] == 1 else ""
            print(f"\nNome: {cid[0]} {resp}")
            print(f"  CPF: {cid[1] if cid[1] else 'Não informado'}")
            print(f"  Nascimento: {cid[2]} | Sexo: {cid[3] if cid[3] else 'N/I'}")
            print(f"  Equipe: {cid[5] if cid[5] else 'Não vinculado'}")

        print(f"\nTotal de cidadãos listados: {len(cidadaos)}")
        return cidadaos

    def estatisticas_microareas(self):
        """Exibe estatísticas por microárea"""
        print(f"\n{'=' * 80}")
        print("ESTATÍSTICAS POR MICROÁREA")
        print('=' * 80)

        query = """
            SELECT
                ci.nu_micro_area AS microarea,
                COUNT(DISTINCT ci.co_seq_cds_cad_individual) AS total_cidadaos,
                COUNT(DISTINCT CASE WHEN ci.st_responsavel_familiar = 1
                      THEN ci.co_seq_cds_cad_individual END) AS total_responsaveis,
                COUNT(DISTINCT CASE WHEN s.no_sexo = 'MASCULINO'
                      THEN ci.co_seq_cds_cad_individual END) AS total_masculino,
                COUNT(DISTINCT CASE WHEN s.no_sexo = 'FEMININO'
                      THEN ci.co_seq_cds_cad_individual END) AS total_feminino
            FROM tb_cds_cad_individual ci
            LEFT JOIN tb_sexo s ON s.co_sexo = ci.co_sexo
            WHERE ci.st_versao_atual = 1
              AND ci.st_ficha_inativa = 0
            GROUP BY ci.nu_micro_area
            ORDER BY ci.nu_micro_area;
        """

        self.cursor.execute(query)
        stats = self.cursor.fetchall()

        print(f"\n{'Microárea':12} | {'Total':8} | {'Responsáveis':14} | {'Masculino':10} | {'Feminino':10}")
        print('-' * 80)

        for stat in stats:
            print(f"{stat[0]:12} | {stat[1]:8} | {stat[2]:14} | {stat[3]:10} | {stat[4]:10}")

        print(f"\nTotal de microáreas: {len(stats)}")
        return stats

    def identificar_responsaveis_familiares(self, limite=10):
        """Lista responsáveis familiares"""
        print(f"\n{'=' * 80}")
        print("RESPONSÁVEIS FAMILIARES")
        print('=' * 80)

        query = """
            SELECT
                c.no_cidadao AS nome,
                c.nu_cpf AS cpf,
                c.nu_cns AS cns,
                TO_CHAR(c.dt_nascimento, 'DD/MM/YYYY') AS data_nascimento,
                c.nu_micro_area AS microarea,
                e.no_equipe AS equipe
            FROM tb_cidadao c
            INNER JOIN tb_cds_cad_individual ci ON (ci.nu_cpf_cidadao = c.nu_cpf OR ci.nu_cns_cidadao = c.nu_cns)
            LEFT JOIN tb_cidadao_vinculacao_equipe ve ON ve.co_cidadao = c.co_seq_cidadao
            LEFT JOIN tb_equipe e ON e.nu_ine = ve.nu_ine
            WHERE ci.st_responsavel_familiar = 1
              AND ci.st_versao_atual = 1
              AND c.st_ativo = 1
            ORDER BY c.no_cidadao
            LIMIT %s;
        """

        self.cursor.execute(query, (limite,))
        responsaveis = self.cursor.fetchall()

        for resp in responsaveis:
            print(f"\n*** RESPONSÁVEL FAMILIAR ***")
            print(f"  Nome: {resp[0]}")
            print(f"  CPF: {resp[1] if resp[1] else 'Não informado'}")
            print(f"  CNS: {resp[2] if resp[2] else 'Não informado'}")
            print(f"  Nascimento: {resp[3]}")
            print(f"  Microárea: {resp[4] if resp[4] else 'Não informado'}")
            print(f"  Equipe: {resp[5] if resp[5] else 'Não vinculado'}")

        print(f"\nTotal de responsáveis listados: {len(responsaveis)}")
        return responsaveis


def menu_principal():
    """Menu interativo para testes"""
    consulta = ConsultaBancoESUS()

    if not consulta.conectar():
        return

    while True:
        print(f"\n{'=' * 80}")
        print("MENU PRINCIPAL - CONSULTA BANCO E-SUS PEC")
        print('=' * 80)
        print("1. Listar Domicílios")
        print("2. Listar Famílias de um Domicílio")
        print("3. Buscar Cidadão (CPF/CNS/Nome)")
        print("4. Listar Cidadãos por Microárea")
        print("5. Estatísticas por Microárea")
        print("6. Listar Responsáveis Familiares")
        print("0. Sair")
        print('=' * 80)

        opcao = input("\nEscolha uma opção: ").strip()

        if opcao == '1':
            limite = input("Quantos domicílios listar? (padrão: 10): ").strip()
            limite = int(limite) if limite else 10
            consulta.listar_domicilios(limite)

        elif opcao == '2':
            id_dom = input("Informe o ID do domicílio: ").strip()
            if id_dom.isdigit():
                consulta.listar_familias_domicilio(int(id_dom))
            else:
                print("✗ ID inválido!")

        elif opcao == '3':
            print("\nInforme ao menos um dos critérios:")
            cpf = input("CPF (ou Enter para pular): ").strip() or None
            cns = input("CNS (ou Enter para pular): ").strip() or None
            nome = input("Nome (ou Enter para pular): ").strip() or None
            consulta.buscar_cidadao(cpf, cns, nome)

        elif opcao == '4':
            microarea = input("Informe a microárea (ex: 01, 02, 03): ").strip()
            limite = input("Quantos cidadãos listar? (padrão: 20): ").strip()
            limite = int(limite) if limite else 20
            consulta.listar_cidadaos_microarea(microarea, limite)

        elif opcao == '5':
            consulta.estatisticas_microareas()

        elif opcao == '6':
            limite = input("Quantos responsáveis listar? (padrão: 10): ").strip()
            limite = int(limite) if limite else 10
            consulta.identificar_responsaveis_familiares(limite)

        elif opcao == '0':
            print("\nEncerrando...")
            break

        else:
            print("\n✗ Opção inválida!")

        input("\nPressione Enter para continuar...")

    consulta.desconectar()


if __name__ == "__main__":
    print("=" * 80)
    print("SISTEMA DE CONSULTA AO BANCO DE DADOS E-SUS PEC")
    print("Versao 1.0 - Script de Exemplos")
    print("=" * 80)
    print()

    menu_principal()
