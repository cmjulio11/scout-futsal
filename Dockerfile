# Estágio 1: Build do Frontend React (Vite + TypeScript)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Estágio 2: Ambiente Python com Chromium para PDF Generator
FROM python:3.12-slim
WORKDIR /app

# Instala Chromium e fontes no Linux para o gerador de PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copia o código do backend
COPY backend ./backend

# Copia o frontend compilado e assets públicos
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY frontend/public ./frontend/public

ENV PORT=8000
EXPOSE 8000

WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
