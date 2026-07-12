#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Servidor con auto-restart infinito para Díaz Premium Envíos
# ═══════════════════════════════════════════════════════════════
# Si el servidor se cae, se reinicia automáticamente en 1 segundo.
# Usa Node.js con límite de 512MB de memoria para evitar OOM kills.
# ═══════════════════════════════════════════════════════════════

cd /home/z/my-project

# Verificar que el build existe, si no, reconstruir
if [ ! -f .next/standalone/server.js ]; then
  echo "[$(date '+%H:%M:%S')] Build no encontrado. Reconstruyendo..."
  NODE_OPTIONS="--max-old-space-size=1536" bun run build 2>&1 | tail -5
fi

# Asegurar que data/ está en el standalone
cp -r data .next/standalone/ 2>/dev/null

echo "[$(date '+%H:%M:%S')] === Servidor Díaz Premium Envíos (auto-restart infinito) ==="

while true; do
  # Matar cualquier proceso previo en el puerto 3000
  fuser -k 3000/tcp 2>/dev/null
  sleep 1

  echo "[$(date '+%H:%M:%S')] Iniciando servidor..."
  NODE_ENV=production node --max-old-space-size=512 .next/standalone/server.js >> server.log 2>&1
  EXIT_CODE=$?

  echo "[$(date '+%H:%M:%S')] Servidor terminó (código $EXIT_CODE). Reiniciando en 1s..."
  sleep 1
done
