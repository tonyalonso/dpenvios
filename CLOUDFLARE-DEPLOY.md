# ─────────────────────────────────────────────────────────
# Deploy en Cloudflare Pages con Git (Automático)
# Díaz Premium Envíos
# ─────────────────────────────────────────────────────────

## ¿Por qué Git + Cloudflare?

- **Deploy automático**: cada push a GitHub despliega la tienda sola
- **Sin comandos manuales**: no necesitas wrangler ni terminal
- **Rollback fácil**: si algo falla, vuelves a la versión anterior con 1 click
- **Future changes**: cuando el agente haga cambios, solo hacemos push y se actualiza solo

---

## PASO 1: Crear repositorio en GitHub (lo hace tu amigo)

1. Ir a https://github.com/new
2. Nombre: `diaz-premium-envios`
3. **Private** (importante: repositorio privado)
4. Click **Create repository**
5. No añadir README ni .gitignore (ya vienen en el código)

---

## PASO 2: Subir el código a GitHub

### Opción A: Desde la terminal de tu amigo

```bash
# Descargar el .zip desde la tienda:
# https://preview-web-5c1a1512-727d-4da9-84ed-aaa1f06f7099.space-z.ai/api/download

# Descomprimir
unzip diaz-premium-envios-*.zip -d diaz-premium-envios
cd diaz-premium-envios

# Inicializar Git y subir
git init
git add .
git commit -m "Deploy inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/diaz-premium-envios.git
git push -u origin main
```

### Opción B: Arrastrar archivos en GitHub

1. Descomprimir el .zip
2. En GitHub, click **uploading an existing file**
3. Arrastrar todos los archivos
4. Commit

---

## PASO 3: Conectar GitHub a Cloudflare

1. Ir a https://dash.cloudflare.com
2. **Workers & Pages → Create application → Pages → Connect to Git**
3. Autorizar Cloudflare a acceder a GitHub
4. Seleccionar el repositorio `diaz-premium-envios`
5. Click **Begin setup**

---

## PASO 4: Configurar el Build

En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Project name** | `diaz-premium-envios` |
| **Production branch** | `main` |
| **Framework preset** | `Next.js` |
| **Build command** | `bun run build` |
| **Build output directory** | `.next/standalone` |

### Environment variables (Settings → Environment variables):

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `ADMIN_TOKEN_KEY` | `diaz-admin-token` |
| `BUN_VERSION` | `latest` |

6. Click **Save and Deploy**

Cloudflare empieza a construir. Tarda 3-5 minutos la primera vez.

---

## PASO 5: Crear y conectar KV (base de datos)

1. En Cloudflare dashboard: **Workers & Pages → KV → Create namespace**
2. Nombre: `DIAZ_PREMIUM_DB`
3. Click **Add**

4. Volver a **Workers & Pages → diaz-premium-envios → Settings → Functions**
5. **KV namespace bindings**:
   - Variable name: `DB`
   - KV namespace: `DIAZ_PREMIUM_DB`
6. Click **Save**

7. **Importante**: hacer un nuevo push o redesploy para que el binding tome efecto.
   En el dashboard: **Deployments → ... → Retry deployment**

---

## PASO 6: Inicializar los datos

Visitar:
```
https://diaz-premium-envios.pages.dev/api/seed
```

Debe responder:
```json
{
  "status": "ok",
  "counts": {
    "products": 41,
    "categories": 9,
    "admins": 1,
    "siteConfig": "configured"
  }
}
```

---

## PASO 7: ¡Listo!

- **Tienda**: `https://diaz-premium-envios.pages.dev`
- **Admin**: `https://diaz-premium-envios.pages.dev/admin`
  - Usuario: `admin`
  - Contraseña: `diaz2024`

---

## Cómo hacer cambios futuros (lo más importante)

Cuando el agente haga cambios en el código:

1. El agente hace los cambios en el sandbox
2. Descargar el código actualizado: visitar `/api/download`
3. Tu amigo copia los archivos cambiados al repositorio de GitHub
4. `git add . && git commit -m "Cambios" && git push`
5. **Cloudflare despliega automáticamente en 2-3 minutos**
6. ¡La tienda se actualiza sola!

### Opción aún más fácil: conectar el sandbox a GitHub directamente

Si tu amigo le da acceso al sandbox al repositorio, el agente puede hacer push directo:

```bash
git add . && git commit -m "Update" && git push origin main
```

Y Cloudflare se encarga del resto.

---

## Migración al VPS definitivo (después)

Cuando el dueño quiera su propio dominio + VPS:

1. Comprar VPS (Hostinger, Contabo, etc.)
2. Clonar el mismo repositorio de GitHub
3. `bun install && bun run build`
4. Configurar PostgreSQL
5. PM2 + Nginx
6. Apuntar el dominio al VPS

El código es el mismo — solo cambia dónde corre.

---

## Notas

- **Plan gratis de Cloudflare**: 100,000 requests/día, 1GB KV. Suficiente para probar.
- **Acceso desde Cuba**: Cloudflare NO está bloqueado para usuarios.
- **Deploys automáticos**: cada push a `main` despliega automáticamente.
- **Preview deploys**: cada pull request genera una URL de preview para probar antes de fusionar.
- **Datos persistentes**: KV guarda los datos permanentemente. No se pierden entre deploys.
- **Custom domain**: puedes añadir `diazpremiumenvios.com` desde el dashboard de Cloudflare.
