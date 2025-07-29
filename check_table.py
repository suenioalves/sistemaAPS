import psycopg2
import psycopg2.extras

def check_and_create_table():
    conn = None
    cur = None
    try:
        # Conectar ao banco
        conn = psycopg2.connect(
            host="localhost",
            database="esus",
            user="postgres",
            password="EUC[x*x~Mc#S+H_Ui#xZBr0O~",
            port="5433"
        )
        cur = conn.cursor()
        
        # Verificar se a tabela existe
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'sistemaaps' 
                AND table_name = 'tb_hiperdia_has_medicamentos'
            )
        """)
        table_exists = cur.fetchone()[0]
        print(f"Tabela existe: {table_exists}")
        
        if not table_exists:
            print("Criando tabela tb_hiperdia_has_medicamentos...")
            # Criar tabela
            cur.execute("""
                CREATE TABLE sistemaaps.tb_hiperdia_has_medicamentos (
                    cod_seq_medicamentos SERIAL PRIMARY KEY,
                    codcidadao INTEGER NOT NULL,
                    nome_medicamento VARCHAR(200) NOT NULL,
                    dose INTEGER DEFAULT 1,
                    frequencia INTEGER DEFAULT 1,
                    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
                    data_fim DATE,
                    cod_acao INTEGER,
                    codmedicamento INTEGER,
                    observacao TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Criar índices
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_tb_hiperdia_has_medicamentos_codcidadao 
                ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao);
            """)
            
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_tb_hiperdia_has_medicamentos_ativo 
                ON sistemaaps.tb_hiperdia_has_medicamentos(codcidadao, data_fim) 
                WHERE data_fim IS NULL;
            """)
            
            conn.commit()
            print("Tabela criada com sucesso!")
        else:
            # Verificar se a coluna dose existe
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'sistemaaps' 
                AND table_name = 'tb_hiperdia_has_medicamentos'
                AND column_name = 'dose'
            """)
            has_dose = cur.fetchone() is not None
            print(f"Coluna dose existe: {has_dose}")
            
            if not has_dose:
                print("Adicionando coluna dose...")
                cur.execute("""
                    ALTER TABLE sistemaaps.tb_hiperdia_has_medicamentos 
                    ADD COLUMN dose INTEGER DEFAULT 1;
                """)
                conn.commit()
                print("Coluna dose adicionada com sucesso!")
        
        # Verificar estrutura final
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'sistemaaps' 
            AND table_name = 'tb_hiperdia_has_medicamentos'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        print("\nEstrutura da tabela:")
        for col in columns:
            print(f"  {col[0]} ({col[1]}) - Nullable: {col[2]} - Default: {col[3]}")
            
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    check_and_create_table()