# Usar uma imagem oficial do Python como base
FROM python:3.11-slim

# Instalar ferramentas de build para dependências nativas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

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

# Comando para iniciar o servidor
# ... (mantenha o resto igual)

# Comando para iniciar o servidor
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "0", "server:app"]