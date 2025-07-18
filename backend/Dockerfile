# Usar uma imagem oficial do Python como base
FROM python:3.11-slim

# Definir variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Definir a pasta de trabalho dentro do container
WORKDIR /app

# Copiar o ficheiro de dependências
COPY requirements.txt .

# Instalar as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo o resto do código do backend para a pasta de trabalho
COPY . .

# Comando para iniciar o servidor quando o container arrancar
# Ele vai usar o Gunicorn para correr o seu ficheiro principal (server.py)
# Certifique-se que o nome do ficheiro e da app estão corretos
# Ex: se o seu ficheiro é server.py e a app se chama "app", use "server:app"
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "8", "--timeout", "0", "server:app"]