#!/usr/bin/env bash
# Script de build para o Render
set -o errexit

echo "==> 1. Compilando o Frontend React..."
npm --prefix frontend install
npm --prefix frontend run build

echo "==> 2. Instalando dependências Python..."
pip install -r requirements.txt

echo "==> 3. Instalando Chromium para geração de PDFs no servidor..."
playwright install chromium

echo "==> Build concluído com sucesso!"
