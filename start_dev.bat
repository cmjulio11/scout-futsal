@echo off
echo ===== Intelligent Futsal Scout - Dev =====
echo.
echo Iniciando Backend FastAPI...
start "BACKEND" cmd /k "cd /d %~dp0backend && py -3.12 -m uvicorn app.main:app --reload --port 8000"
echo Aguardando 3 segundos...
timeout /t 3 /nobreak > nul
echo Iniciando Frontend React...
start "FRONTEND" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo ========================================
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  API Docs: http://localhost:8000/docs
echo.
echo  Login inicial:
echo  Email: julio@futsalscout.com
echo  Senha: Admin@123
echo ========================================
pause
