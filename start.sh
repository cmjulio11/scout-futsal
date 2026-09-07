#!/usr/bin/env bash
# Script de inicialização para o Render
cd backend
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
