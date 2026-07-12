#!/bin/bash
cd /home/z/my-project
while true; do
  # Verificar si el servidor responde
  if ! curl -s -o /dev/null --max-time 3 http://localhost:3000/ 2>/dev/null; then
    # No responde, matar y reiniciar
    pkill -9 -f "node.*server" 2>/dev/null
    sleep 1
    PORT=3000 node .next/standalone/server.js > server.log 2>&1 &
    # Esperar a que arranque
    for i in $(seq 1 10); do
      if curl -s -o /dev/null --max-time 2 http://localhost:3000/ 2>/dev/null; then
        break
      fi
      sleep 1
    done
  fi
  sleep 5
done
