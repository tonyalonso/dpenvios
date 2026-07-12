# ─────────────────────────────────────────────────────────
# Deploy en Cloudflare Pages con Git (Automático)
# Díaz Premium Envíos
# ─────────────────────────────────────────────────────────

## IMPORTANTE: Configuración del Build en Cloudflare

En el dashboard de Cloudflare Pages, cuando configures el build,
usa EXACTAMENTE estos valores:

| Campo | Valor |
|-------|-------|
| **Framework preset** | `Next.js (Static HTML Export)` |
| **Build command** | `npx @cloudflare/next-on-pages@1` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | `/` |

### Environment variables:

| Variable | Valor |
|----------|-------|
| `NODE_VERSION` | `22` |
| `NEXT_ON_PAGES_ACK_VPS` | `1` |

### KV Binding (después del primer deploy):

En **Settings → Functions → KV namespace bindings**:
- Variable name: `DB`
- KV namespace: `DIAZ_PREMIUM_DB`

---

## Solución de problemas

### Si el build falla con "Missing entry-point":

El error significa que wrangler.toml está siendo interpretado como
configuración de Workers en vez de Pages. Solución:

1. **Eliminar `wrangler.toml`** del repositorio (Pages no lo necesita)
2. La configuración se hace toda desde el dashboard de Cloudflare

### Si el build falla con errores de `sharp`:

Añadir esta variable de entorno:
- `NEXT_SHARP_PATH` = `/tmp/node_modules/sharp`

---

## Pasos completos

### 1. Descargar el código
```
https://preview-web-5c1a1512-727d-4da9-84ed-aaa1f06f7099.space-z.ai/api/download
```

### 2. Subir a GitHub
```bash
git init
git add .
git commit -m "Deploy inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/diaz-premium-envios.git
git push -u origin main
```

### 3. Conectar GitHub a Cloudflare
- Ir a dash.cloudflare.com
- **Workers & Pages → Create → Pages → Connect to Git**
- Seleccionar el repositorio `diaz-premium-envios`

### 4. Configurar el Build (IMPORTANTE)
- **Framework preset**: `Next.js (Static HTML Export)`
- **Build command**: `npx @cloudflare/next-on-pages@1`
- **Build output directory**: `.vercel/output/static`
- **Environment variables**:
  - `NODE_VERSION` = `22`
  - `NEXT_ON_PAGES_ACK_VPS` = `1`

### 5. Crear KV namespace
- **Workers & Pages → KV → Create namespace**
- Nombre: `DIAZ_PREMIUM_DB`

### 6. Conectar KV a la app
- **Workers & Pages → diaz-premium-envios → Settings → Functions**
- **KV namespace bindings**:
  - Variable name: `DB`
  - KV namespace: `DIAZ_PREMIUM_DB`
- Guardar y hacer **Retry deployment**

### 7. Inicializar datos
```
https://diaz-premium-envios.pages.dev/api/seed
```

### 8. ¡Listo!
- **Tienda**: `https://diaz-premium-envios.pages.dev`
- **Admin**: `https://diaz-premium-envios.pages.dev/admin`
  - Usuario: `admin`
  - Contraseña: `diaz2024`
