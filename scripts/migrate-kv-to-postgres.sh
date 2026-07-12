#!/bin/bash
# ─────────────────────────────────────────────────────────
# Migración: Cloudflare KV → PostgreSQL (VPS)
# ─────────────────────────────────────────────────────────
# Este script se ejecuta cuando migres de Cloudflare al VPS.
# Exporta los datos de KV y los importa en PostgreSQL.
#
# Uso:
#   bash scripts/migrate-kv-to-postgres.sh
# ─────────────────────────────────────────────────────────

set -e

echo "=== Migración Cloudflare KV → PostgreSQL ==="
echo ""

# 1. Exportar datos de KV
echo "1. Exportando datos de Cloudflare KV..."
wrangler kv key list --binding DB > /tmp/kv-keys.json

# 2. Descargar cada colección
for key in categories products orders order-items admins siteconfig delivery-zones customers reviews variant-groups variant-options combinations product-extras wholesale-tiers; do
  echo "  Descargando: $key"
  wrangler kv key get "$key" --binding DB > "/tmp/migrate-$key.json" 2>/dev/null || echo "    (vacío o no existe)"
done

echo ""
echo "2. Datos exportados a /tmp/migrate-*.json"
echo ""

# 3. Importar en PostgreSQL
echo "3. Para importar en PostgreSQL, ejecuta en el VPS:"
echo "   bun run db:push  # crea las tablas"
echo "   # Luego usa el script de seed que lee los JSON"
echo ""
echo "=== Migración completa ==="
