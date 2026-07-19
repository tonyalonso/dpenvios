#!/bin/bash
# Script de inicio del servidor que mantiene el proceso vivo.
# El sandbox ejecuta `bun run dev` que llama a `next dev -p 3000`.
# Este script es el punto de entrada que usa el sandbox.

cd /home/z/my-project

# Función para iniciar el servidor
start_server() {
  # Usar exec para reemplazar el shell con el proceso de Next.js
  # Esto hace que Next.js sea el proceso principal (PID 1 del subshell)
  # y el sandbox no lo mate como proceso "background"
  exec npx next dev -p 3000
}

start_server
