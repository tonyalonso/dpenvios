#!/bin/bash
cd /home/z/my-project
END=$((SECONDS + 600))  # 10 minutos
while [ $SECONDS -lt $END ]; do
  # Verificar si el servidor responde
  if ! curl -s -o /dev/null --max-time 2 http://localhost:3000/ 2>/dev/null; then
    # No responde, (re)iniciar
    pkill -f "server.js" 2>/dev/null
    sleep 1
    NODE_ENV=production node --max-old-space-size=512 .next/standalone/server.js > server.log 2>&1 &
    SRV_PID=$!
    # Esperar a que esté listo
    for i in $(seq 1 10); do
      if curl -s -o /dev/null --max-time 1 http://localhost:3000/ 2>/dev/null; then
        break
      fi
      sleep 1
    done
  fi
  sleep 5  # Chequear cada 5 segundos
done
