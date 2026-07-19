#!/bin/bash
# Servidor robusto con auto-restart infinito
cd /home/z/my-project
while true; do
  fuser -k 3000/tcp 2>/dev/null
  sleep 1
  nohup npx next start -p 3000 < /dev/null > server.log 2>&1 &
  SRV_PID=$!
  # Esperar a que arranque
  for i in $(seq 1 15); do
    if curl -s -o /dev/null --max-time 2 http://localhost:3000/ 2>/dev/null; then
      break
    fi
    sleep 1
  done
  # Esperar a que se caa
  wait $SRV_PID 2>/dev/null
  sleep 1
done
