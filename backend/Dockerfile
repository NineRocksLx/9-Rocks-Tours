# ============================================================================
# Estágio 1: Build - Instalar dependências de forma segura
# ============================================================================
FROM python:3.11-slim as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copia apenas o ficheiro de requisitos para aproveitar o cache do Docker
COPY requirements.txt .

# Instala as dependências de forma segura
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


# ============================================================================
# Estágio 2: Final - Construir a imagem de produção final
# ============================================================================
FROM python:3.11-slim

WORKDIR /app

# Copia as dependências pré-compiladas do estágio anterior
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Instala as dependências a partir dos ficheiros locais, sem aceder à internet
RUN pip install --no-cache /wheels/*

# Copia todo o código da aplicação
COPY . .

# Expõe a porta que o Google Cloud Run irá usar
EXPOSE 8080

# Comando final para iniciar o servidor de produção Gunicorn
# Ele irá procurar a variável de ambiente PORT (fornecida pelo Cloud Run) ou usar 8080 como padrão.
CMD sh -c "gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:${PORT:-8080}"