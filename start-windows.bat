@echo off
REM ===== Chaukas AI - ek click start (Windows) =====
REM Pehli baar 3-5 minute lagte hain (packages install). Uske baad 10 second.
setlocal
set ROOT=%~dp0

where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 ( echo [ERROR] Python install nahi hai. https://www.python.org/downloads/ se install karo ^(Add to PATH tick karna^). & pause & exit /b 1 )
  set PY=py
) else ( set PY=python )

where node >nul 2>nul
if errorlevel 1 ( echo [ERROR] Node.js install nahi hai. https://nodejs.org se LTS install karo. & pause & exit /b 1 )

if not exist "%ROOT%backend\.env" ( if exist "%ROOT%backend\env.ready" ( copy "%ROOT%backend\env.ready" "%ROOT%backend\.env" >nul ) else ( copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul & echo [INFO] backend\.env bana diya - usme KODEKEY_API_KEY daalo. ) )
if not exist "%ROOT%frontend\.env" ( copy "%ROOT%frontend\env.ready" "%ROOT%frontend\.env" >nul )

cd /d "%ROOT%backend"
if not exist venv ( echo Creating Python environment... & %PY% -m venv venv )
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if errorlevel 1 ( echo [ERROR] pip install fail hua. Internet check karo. & pause & exit /b 1 )
pip install -q -r requirements-optional.txt >nul 2>nul

cd /d "%ROOT%frontend"
if not exist node_modules ( echo Installing frontend packages... & call npm install )

start "Chaukas BACKEND (port 8000)" "%ROOT%backend\run-backend.bat"
timeout /t 4 >nul
start "Chaukas FRONTEND (port 5173)" "%ROOT%frontend\run-frontend.bat"
timeout /t 5 >nul
start http://localhost:5173
echo.
echo  Frontend : http://localhost:5173
echo  Backend  : http://localhost:8000/docs   ^(health: /api/health^)
echo  Admin    : http://localhost:5173/admin
endlocal
