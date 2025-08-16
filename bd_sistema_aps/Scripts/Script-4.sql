CREATE TABLE IF NOT EXISTS sistemaaps.tb_comunicacao (
    id SERIAL PRIMARY KEY,
    telefone VARCHAR(20) NOT NULL,
    nome_paciente VARCHAR(255),
    status_enviar BOOLEAN DEFAULT true,
    mensagem_recebida VARCHAR(10),
    data_envio TIMESTAMP,
    data_resposta TIMESTAMP,
    status_envio_realizado BOOLEAN DEFAULT false,
    status_respondido BOOLEAN DEFAULT false,
    erro_envio TEXT,
    data_erro TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_status_enviar ON sistemaaps.tb_comunicacao(status_enviar);
CREATE INDEX IF NOT EXISTS idx_telefone ON sistemaaps.tb_comunicacao(telefone);
CREATE INDEX IF NOT EXISTS idx_mensagem_recebida ON sistemaaps.tb_comunicacao(mensagem_recebida);

-- Inserir alguns dados de teste (opcional)
INSERT INTO sistemaaps.tb_comunicacao (telefone, nome_paciente, status_enviar) 
VALUES 
    ('97984176747', 'Suenio Alves', true),
    ('97984176747', 'João Santos', true),
    ('97984176747', 'Ana Costa', true);