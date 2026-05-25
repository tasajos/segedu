@echo off
setlocal

echo.
echo ================================================
echo   SEGEDU - Deploy Script (Windows)
echo ================================================
echo.

REM 1. Build frontend
echo [1/4] Construyendo frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo el build del frontend.
    pause
    exit /b 1
)
cd ..

REM 2. Limpiar backend/public y copiar el nuevo build
echo [2/4] Copiando build a backend/public...
if exist "backend\public" (
    rmdir /s /q "backend\public"
)
mkdir "backend\public"
xcopy /e /i /q "frontend\dist\*" "backend\public\" >nul
if errorlevel 1 (
    echo ERROR: Fallo la copia de archivos.
    pause
    exit /b 1
)
echo     OK - frontend\dist copiado a backend\public

REM 3. Commit del build
echo [3/4] Commiteando cambios...
git add backend/public
git add -u
git status --short

set /p MSG="Mensaje del commit (Enter para usar 'deploy: update'): "
if "%MSG%"=="" set MSG=deploy: update

git commit -m "%MSG%"
if errorlevel 1 (
    echo     (Sin cambios nuevos para commitear)
)

REM 4. Push a GitHub
echo [4/4] Enviando a GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: Fallo el push. Verifica tu conexion y credenciales.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Deploy local completo. Ahora en el servidor:
echo   ejecuta deploy.sh  o  git pull + pm2 restart
echo ================================================
echo.
pause
