#!/bin/bash
# ==========================================================
#   SEGEDU - Deploy Script (Servidor Linux)
#   Uso: bash deploy.sh
#   Requiere: git, node, npm, pm2 (o node directo)
# ==========================================================

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/backend"
APP_NAME="segedu"   # nombre del proceso en PM2

echo ""
echo "================================================"
echo "  SEGEDU - Deploy en servidor"
echo "  Directorio: $APP_DIR"
echo "================================================"
echo ""

# 1. Pull desde GitHub
echo "[1/3] Actualizando código desde GitHub..."
git pull origin main
echo "    OK"

# 2. Instalar dependencias del backend (solo producción)
echo "[2/3] Instalando dependencias del backend..."
cd "$BACKEND_DIR"
npm install --omit=dev
echo "    OK"

# 3. Reiniciar la aplicación
echo "[3/3] Reiniciando la aplicación..."

if command -v pm2 &> /dev/null; then
    # Si PM2 existe: reiniciar o iniciar
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 restart "$APP_NAME"
        echo "    OK - PM2: proceso '$APP_NAME' reiniciado"
    else
        pm2 start src/index.js --name "$APP_NAME" --interpreter node
        pm2 save
        echo "    OK - PM2: proceso '$APP_NAME' iniciado y guardado"
    fi
else
    echo "    AVISO: PM2 no encontrado."
    echo "    Reinicia el proceso Node.js manualmente desde cPanel"
    echo "    o ejecuta: node $BACKEND_DIR/src/index.js"
fi

echo ""
echo "================================================"
echo "  Deploy completado en el servidor"
echo "================================================"
echo ""
