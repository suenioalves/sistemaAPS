# Guia de Deploy - Sistema APS

## 📋 Visão Geral

Este guia fornece instruções completas para instalação, configuração e deploy do Sistema APS em diferentes ambientes.

## 🔧 Pré-requisitos

### Software Necessário

#### Para Desenvolvimento
- **Python 3.8+** - Linguagem principal do backend
- **PostgreSQL 12+** - Banco de dados
- **Node.js 16+** - Para ferramentas de frontend (opcional)
- **Git** - Controle de versão

#### Para Produção
- **Python 3.8+**
- **PostgreSQL 12+** 
- **Nginx** - Servidor web reverso (recomendado)
- **Gunicorn** - WSGI server para Python
- **Supervisor** - Gerenciamento de processos (opcional)

### Extensões PostgreSQL

```sql
-- Necessária para busca sem acentos
CREATE EXTENSION IF NOT EXISTS unaccent;
```

## 🏗️ Instalação Local (Desenvolvimento)

### 1. Clone do Repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd sistemaAPS
```

### 2. Configuração do Python

#### Criando Ambiente Virtual
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS  
python3 -m venv venv
source venv/bin/activate
```

#### Instalando Dependências
```bash
pip install -r requirements.txt
```

**requirements.txt** (criar se não existir):
```txt
Flask==2.3.3
psycopg2-binary==2.9.7
python-dotenv==1.0.0
gunicorn==21.2.0
```

### 3. Configuração do Banco de Dados

#### Instalação PostgreSQL

**Windows:**
1. Download do [PostgreSQL](https://www.postgresql.org/download/windows/)
2. Instalar com configurações padrão
3. Definir senha para usuário `postgres`
4. Configurar para rodar na porta 5433

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar senha do postgres
sudo -u postgres psql
\password postgres
\q

# Configurar porta 5433 (opcional)
sudo nano /etc/postgresql/[VERSION]/main/postgresql.conf
# Alterar: port = 5433
sudo systemctl restart postgresql
```

#### Criação do Banco

```sql
-- Conectar como postgres
psql -U postgres -h localhost -p 5433

-- Criar database
CREATE DATABASE esus;

-- Conectar ao database
\c esus

-- Criar extensão necessária
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criar schema principal
CREATE SCHEMA IF NOT EXISTS sistemaaps;

-- Sair
\q
```

### 4. Configuração da Aplicação

#### Arquivo de Configuração (app.py)

Editar as credenciais do banco de dados em `app.py`:

```python
# Configuração do banco - EDITAR ESTAS LINHAS
DB_CONFIG = {
    'host': 'localhost',
    'database': 'esus',
    'user': 'postgres',
    'password': 'SUA_SENHA_AQUI',  # ← ALTERAR
    'port': '5433'
}
```

#### Variáveis de Ambiente (Recomendado)

Criar arquivo `.env`:
```env
DB_HOST=localhost
DB_NAME=esus
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_PORT=5433
FLASK_ENV=development
FLASK_DEBUG=True
```

Modificar `app.py` para usar variáveis de ambiente:
```python
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'esus'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD'),
    'port': os.getenv('DB_PORT', '5433')
}
```

### 5. Importação dos Dados

#### Scripts SQL
```bash
# Executar scripts SQL do sistema
psql -U postgres -h localhost -p 5433 -d esus -f bd_sistema_aps/Scripts/[arquivo].sql
```

#### Dados de Teste (Opcional)
```sql
-- Inserir dados básicos para teste
INSERT INTO sistemaaps.tb_equipes (nome_equipe, tipo_equipe) VALUES
('ESF Vila Nova', 'ESF'),
('ESF Centro', 'ESF'),
('ESF Jardim', 'ESF');

-- Inserir pacientes de teste
INSERT INTO sistemaaps.tb_pacientes (nome_paciente, data_nascimento, tem_hipertensao, equipe_nome) VALUES
('João Silva Santos', '1980-05-15', true, 'ESF Vila Nova'),
('Maria Oliveira Costa', '1975-08-20', true, 'ESF Centro');
```

### 6. Primeira Execução

```bash
# Ativar ambiente virtual
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/macOS

# Executar aplicação
python app.py
```

Acessar: `http://localhost:3030`

## 🚀 Deploy em Produção

### 1. Preparação do Servidor

#### Servidor Ubuntu 20.04/22.04

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx supervisor git

# Criar usuário para aplicação
sudo adduser sistemaaps
sudo usermod -aG sudo sistemaaps
```

### 2. Configuração do Banco de Dados

```bash
# Configurar PostgreSQL
sudo -u postgres createdb esus
sudo -u postgres psql esus -c "CREATE EXTENSION unaccent;"
sudo -u postgres psql esus -c "CREATE SCHEMA sistemaaps;"

# Criar usuário específico para aplicação
sudo -u postgres psql
CREATE USER app_sistemaaps WITH PASSWORD 'senha_super_segura';
GRANT CONNECT ON DATABASE esus TO app_sistemaaps;
GRANT USAGE ON SCHEMA sistemaaps TO app_sistemaaps;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sistemaaps TO app_sistemaaps;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sistemaaps TO app_sistemaaps;
\q
```

### 3. Deploy da Aplicação

```bash
# Mudar para usuário da aplicação
sudo su - sistemaaps

# Clone do código
git clone [URL_DO_REPOSITORIO] /home/sistemaaps/sistemaaps
cd /home/sistemaaps/sistemaaps

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
```

**Arquivo .env para produção:**
```env
DB_HOST=localhost
DB_NAME=esus
DB_USER=app_sistemaaps
DB_PASSWORD=senha_super_segura
DB_PORT=5432
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=sua_chave_secreta_super_longa_e_segura
```

### 4. Configuração do Gunicorn

**Arquivo gunicorn.conf.py:**
```python
# /home/sistemaaps/sistemaaps/gunicorn.conf.py
bind = "127.0.0.1:3030"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 5
preload_app = True
user = "sistemaaps"
group = "sistemaaps"
```

**Script de inicialização:**
```bash
# /home/sistemaaps/sistemaaps/start.sh
#!/bin/bash
cd /home/sistemaaps/sistemaaps
source venv/bin/activate
exec gunicorn -c gunicorn.conf.py app:app
```

```bash
chmod +x start.sh
```

### 5. Configuração do Supervisor

**Arquivo de configuração:**
```ini
# /etc/supervisor/conf.d/sistemaaps.conf
[program:sistemaaps]
command=/home/sistemaaps/sistemaaps/start.sh
directory=/home/sistemaaps/sistemaaps
user=sistemaaps
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/sistemaaps.log
environment=PATH="/home/sistemaaps/sistemaaps/venv/bin"
```

```bash
# Recarregar supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start sistemaaps
sudo supervisorctl status
```

### 6. Configuração do Nginx

**Arquivo de configuração:**
```nginx
# /etc/nginx/sites-available/sistemaaps
server {
    listen 80;
    server_name seu_dominio.com.br;
    
    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    location /static/ {
        alias /home/sistemaaps/sistemaaps/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs
    access_log /var/log/nginx/sistemaaps_access.log;
    error_log /var/log/nginx/sistemaaps_error.log;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/sistemaaps /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL/HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu_dominio.com.br

# Teste de renovação automática
sudo certbot renew --dry-run
```

## 🐳 Deploy com Docker

### 1. Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar usuário não-root
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expor porta
EXPOSE 3030

# Comando padrão
CMD ["gunicorn", "--bind", "0.0.0.0:3030", "--workers", "3", "app:app"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: esus
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: senha_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./bd_sistema_aps/Scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    
  app:
    build: .
    environment:
      DB_HOST: db
      DB_NAME: esus
      DB_USER: postgres
      DB_PASSWORD: senha_segura
      DB_PORT: 5432
      FLASK_ENV: production
    ports:
      - "3030:3030"
    depends_on:
      - db
    volumes:
      - ./static:/app/static
      - ./templates:/app/templates

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app

volumes:
  postgres_data:
```

### 3. Executar com Docker

```bash
# Build e execução
docker-compose up -d

# Verificar logs
docker-compose logs -f app

# Parar serviços
docker-compose down
```

## ☁️ Deploy Firebase Hosting (Frontend apenas)

### 1. Configuração

Arquivo `firebase.json` já existe no projeto:
```json
{
  "hosting": {
    "public": "static",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

### 2. Deploy

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init hosting

# Deploy
firebase deploy
```

**Nota:** Firebase Hosting é apenas para arquivos estáticos. O backend Flask precisa ser hospedado separadamente.

## 🔧 Manutenção e Monitoramento

### Logs

#### Aplicação
```bash
# Ver logs em tempo real
sudo tail -f /var/log/sistemaaps.log

# Logs do supervisor
sudo tail -f /var/log/supervisor/supervisord.log

# Logs do nginx
sudo tail -f /var/log/nginx/sistemaaps_access.log
sudo tail -f /var/log/nginx/sistemaaps_error.log
```

#### Banco de Dados
```bash
# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Backup

#### Backup Automático do Banco

```bash
# Script de backup
#!/bin/bash
# /home/sistemaaps/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/sistemaaps/backups"
DB_NAME="esus"

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U app_sistemaaps -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup realizado: backup_$DATE.sql"
```

#### Crontab para Backup Automático
```bash
# Editar crontab
crontab -e

# Backup diário às 02:00
0 2 * * * /home/sistemaaps/backup.sh
```

### Monitoramento de Performance

#### Script de Monitoramento
```bash
#!/bin/bash
# /home/sistemaaps/monitor.sh

# Verificar se aplicação está rodando
if ! pgrep -f "gunicorn.*app:app" > /dev/null; then
    echo "$(date): Aplicação não está rodando!" >> /var/log/sistemaaps_monitor.log
    sudo supervisorctl restart sistemaaps
fi

# Verificar uso de memória
MEMORY_USAGE=$(ps aux | grep "gunicorn.*app:app" | grep -v grep | awk '{sum+=$4} END {print sum}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "$(date): Alto uso de memória: $MEMORY_USAGE%" >> /var/log/sistemaaps_monitor.log
fi

# Verificar conexões com banco
CONNECTIONS=$(psql -U app_sistemaaps -d esus -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='esus';")
if [ "$CONNECTIONS" -gt 50 ]; then
    echo "$(date): Muitas conexões com banco: $CONNECTIONS" >> /var/log/sistemaaps_monitor.log
fi
```

### Atualizações

#### Processo de Atualização
```bash
#!/bin/bash
# /home/sistemaaps/update.sh

cd /home/sistemaaps/sistemaaps

# Backup do banco antes da atualização
/home/sistemaaps/backup.sh

# Pull das mudanças
git pull origin main

# Ativar ambiente virtual
source venv/bin/activate

# Atualizar dependências se necessário
pip install -r requirements.txt

# Reiniciar aplicação
sudo supervisorctl restart sistemaaps

# Verificar se está rodando
sleep 5
curl -f http://localhost:3030 || echo "Erro: Aplicação não está respondendo"

echo "Atualização concluída: $(date)"
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar logs de conexão
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# Testar conexão manual
psql -U app_sistemaaps -h localhost -d esus -c "SELECT 1;"
```

#### 2. Aplicação Não Inicia
```bash
# Verificar logs da aplicação
sudo tail -f /var/log/sistemaaps.log

# Verificar status no supervisor
sudo supervisorctl status sistemaaps

# Verificar porta em uso
sudo netstat -tlnp | grep :3030
```

#### 3. Nginx Não Consegue Conectar
```bash
# Verificar configuração do nginx
sudo nginx -t

# Verificar logs do nginx
sudo tail -f /var/log/nginx/error.log

# Verificar se aplicação está ouvindo na porta correta
curl http://127.0.0.1:3030
```

#### 4. Alto Uso de Memória
```bash
# Verificar processos
ps aux | grep gunicorn

# Reduzir número de workers no gunicorn.conf.py
# workers = 2  # em vez de 3

# Reiniciar aplicação
sudo supervisorctl restart sistemaaps
```

### Comandos Úteis

```bash
# Reiniciar todos os serviços
sudo systemctl restart postgresql
sudo supervisorctl restart sistemaaps
sudo systemctl reload nginx

# Verificar status geral
sudo systemctl status postgresql
sudo supervisorctl status
sudo systemctl status nginx

# Verificar uso de recursos
htop
df -h
free -m

# Verificar conexões de rede
sudo netstat -tlnp
```

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Código testado localmente
- [ ] Backup do banco de dados atual
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências atualizadas
- [ ] Scripts SQL revisados

### Deploy
- [ ] Código deployado
- [ ] Banco de dados atualizado
- [ ] Serviços reiniciados
- [ ] SSL configurado (produção)
- [ ] Monitoramento ativo

### Pós-Deploy
- [ ] Aplicação respondendo
- [ ] Funcionalidades principais testadas
- [ ] Logs verificados
- [ ] Performance monitorada
- [ ] Backup pós-deploy realizado

## 🔐 Segurança

### Configurações de Segurança

#### Firewall
```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3030  # Aplicação não deve ser acessível diretamente
```

#### PostgreSQL
```bash
# Configurar pg_hba.conf para maior segurança
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Permitir apenas conexões locais
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

#### Nginx
```nginx
# Adicionar headers de segurança
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### Monitoramento de Segurança

```bash
# Verificar tentativas de login suspeitas
sudo grep "Failed password" /var/log/auth.log

# Monitorar logs da aplicação
sudo grep -i "error\|exception\|fail" /var/log/sistemaaps.log

# Verificar conexões ativas
sudo netstat -an | grep :80
sudo netstat -an | grep :443
```

Este guia de deploy fornece uma base sólida para diferentes cenários de implantação do Sistema APS. Adapte as configurações conforme suas necessidades específicas de infraestrutura e segurança.