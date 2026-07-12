#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Servidor con auto-restart para Díaz Premium Envíos
# Solución definitiva para el problema de caídas del servidor.
#
# Usa Node.js (no Bun) con límite de memoria de 1GB para evitar
# que el cgroup OOM killer mate el proceso. Si se cae, se reinicia
# automáticamente después de 2 segundos.
# ─────────────────────────────────────────────────────────────

cd /home/z/my-project

MAX_RESTARTS=50
RESTART_COUNT=0
SERVER_FILE=".next/standalone/server.js"

echo "=== Servidor Díaz Premium Envíos (auto-restart) ==="
echo "Usando: node con --max-old-space-size=1024"
echo ""

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
  RESTART_COUNT=$((RESTART_COUNT + 1))
  echo "[$(date '+%H:%M:%S')] Iniciando servidor (intento $RESTART_COUNT)..."

  # Usar node (no bun) con límite de memoria de 1GB
  NODE_ENV=production node --max-old-space-size=1024 "$SERVER_FILE" > server.log 2>&1
  EXIT_CODE=$?

  echo "[$(date '+%H:%M:%S')] Servidor terminó con código $EXIT_CODE"

  # Si terminó limpiamente (0), no reiniciar
  if [ $EXIT_CODE -eq 0 ]; then
    echo "Servidor cerrado normalmente."
    break
  fi

  # Si fue killed (137 = SIGKILL del OOM killer), reinistrar después de 2s
  echo "[$(date '+%H:%M:%S')] Reiniciando en 2 segundos..."
  sleep 2
done

echo "=== Servidor detenido después de $RESTART_COUNT intentos ==="
