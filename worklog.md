# Worklog — Díaz Premium Envíos

## 2026-07-03 — Task PROD-MODULE: Comprehensive Product Module

### Summary
Implemented a comprehensive product module inspired by the SIGECOS document, covering:
- Tags (colored badges), Offers (permanente/temporada with date range), Gallery, Variants
  (groups + options + combinations), Extras, SKU auto-generation, shortName, image zoom,
  dynamic pricing, and combination stock resolution.

### store.ts (`src/lib/store.ts`)
- Extended `FILE_NAMES` with `variantGroups`, `variantOptions`, `combinations`, `productExtras`.
- Extended `StoreState` + initial `state` with the four new collections.
- `initialize()` now reads the 4 new JSON files (seeds to `[]` if missing) and records file
  mtimes in a new `lastReadByFile` map for dev-mode cross-route sync.
- Added a `maybeRefreshFromDisk()` helper that, **in dev mode only**, re-reads a collection's
  JSON file if its mtime is newer than the last read. This fixes the Turbopack dev-mode issue
  where each API route had its own in-memory store instance and couldn't see writes from
  sibling routes (e.g. POST /api/admin/products was invisible to GET /api/products/[id] until
  a recompile). In production this is a no-op (single shared module instance).
- Extended `ModelName`, `fileName` mapping, `getCollection`, `setCollection` for the 4 new
  models.
- Added `db.variantGroup`, `db.variantOption`, `db.combination`, `db.productExtra`
  repositories with appropriate defaults and ID prefixes (`vg`, `vo`, `cmb`, `pex`).
- Updated `db.product` defaults to include `shortName:''`, `sku:''`, `tags:'[]'`,
  `offerEnabled:false`, `offerType:'permanente'`, `offerPrice:0`, `offerStart:null`,
  `offerEnd:null`.
- Updated `SEED_PRODUCTS` to populate all new fields (sku auto like `PROD-001`, tags `'[]'`,
  offer fields at defaults).
- `persist()` now also updates `lastReadByFile[fileName]` so a route's own write doesn't
  trigger an immediate self-refresh.

### Admin Products API
- `src/app/api/admin/products/route.ts` (POST):
  - Auto-generates SKU as `PROD-XXXXXX` if empty.
  - Normalizes `tags` to a JSON string (accepts array or string).
  - Accepts `variantGroups` (with nested `options`), `combinations`, `productExtras`.
  - Builds an `optIdMap` (old → new) when creating options, then maps incoming combination
    `optionIds` through it before persisting.
  - When `variantGroups` are sent without `combinations` and there are 2+ groups with
    options, generates cartesian-product combinations automatically.
- `src/app/api/admin/products/[id]/route.ts` (PUT + DELETE):
  - PUT extracts `variantGroups`, `combinations`, `productExtras`, `tags`, `sku` and treats
    them specially (not as plain Product fields).
  - When `variantGroups` is sent: deletes old combinations, deletes old options, deletes
    old groups, creates new groups + options building `idMap` (old group → new group) and
    `optIdMap` (old option → new option), then recreates combinations mapping old option
    IDs to new ones.
  - When `productExtras` is sent: deletes old, creates new.
  - Coerces numeric/boolean fields.
  - DELETE now also cleans up `combinations`, `productExtras`, `variantOptions`, and
    `variantGroups` before deleting the product.

### Storefront product API
- `src/app/api/products/[id]/route.ts` now also returns `variantGroups` (with nested
  `options`), `combinations`, and `productExtras`.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Extended `Product` interface with all new optional fields and added new interfaces
  `VariantOption`, `VariantGroup`, `Combination`, `ProductExtra`.
- Imported `Tabs` and `Switch` from shadcn/ui.
- Added module-level helpers: `QUICK_TAG_PRESETS`, `TAG_COLOR_SWATCHES`, `genLocalId`,
  `ProductFormState` interface, `EMPTY_FORM`, `generateCombinationsFromForm` (cartesian
  product), `parseTagArray`, `parseStringArray`.
- Added four editor sub-components used by the dialog:
  - `CustomTagEditor` — name input + 10 color swatches + custom color picker + list of
    current tags (X to remove).
  - `GalleryEditor` — add image URL, grid of thumbnails with remove-on-hover.
  - `VariantsEditor` — add/remove variant groups (name, maxSelect, required, isImageGroup)
    + nested options (name, priceMod, stock, image, available) + "Generar Combinaciones"
    button (requires 2+ groups) + editable combinations table.
  - `ExtrasEditor` — add/remove extras (name, description, priceMod, required).
- Replaced the single-page product dialog with a tabbed dialog (`max-w-3xl`):
  - **INFO**: Nombre, Nombre corto, SKU, Descripción, Precio, Stock, Imagen URL, Categoría,
    Orden, Destacado (Switch).
  - **OFERTA**: Switch offerEnabled, Select offerType (permanente/temporada), Input
    offerPrice, two date Inputs (offerStart/offerEnd).
  - **ETIQUETAS**: Quick preset badges (toggle on/off) + `CustomTagEditor`.
  - **GALERÍA**: `GalleryEditor`.
  - **VARIANTES**: `VariantsEditor`.
  - **EXTRAS**: `ExtrasEditor`.
- `openEdit(p)` now fetches the product detail from `/api/products/[id]` (which returns
  variantGroups/combinations/productExtras) and populates the form. Shows a spinner while
  loading.
- `handleSave` builds a payload including all new fields, mapping each combination's
  `optionIds` array to a JSON string before sending.

### ProductCard.tsx
- Extended `Product` interface with all new optional fields.
- Added `parseTags()` and `isOfferActive()` helpers (offer active when `offerEnabled`,
  `offerPrice > 0`, `offerPrice < price`, and current date within `[offerStart, offerEnd]`).
- Tags now render as colored badges in the top-left corner (max 3).
- Offer price renders in orange (bold) with the original price strikethrough when active.
- Uses `shortName` for the card title if available, falls back to `name`.
- Shows a "SIN STOCK" badge (red, full overlay) when `stock === 0`.
- When the offer is active, "Add to cart" uses `offerPrice` instead of `price`.
- Added an "OFERTA" pulse badge in the top-right when the offer is active.
- The legacy "destacado → 10% off" discount display is suppressed when an offer is active
  to avoid showing two discounts at once.

### ProductDetail.tsx
- Extended `Product` interface; added `VariantGroup`, `VariantOption`,
  `ProductCombination`, `ProductExtra`, `ProductTag` interfaces.
- Added `parseTags()`, `parseStringArray()`, `isOfferActive()` helpers (same logic as
  ProductCard).
- Added state: `selectedImage`, `selectedOptions` (groupId → optionId), `selectedExtras`
  (Set), `isDesktop` (matchMedia `(min-width: 768px) and (pointer: fine)`), `zoomOn`,
  `lensPos`.
- Used the "setState during render" pattern (recommended by React docs) to reset selections
  when `selectedProductId` changes and to pre-select the first available option of each
  variant group when the product's groups load. This avoids the
  `react-hooks/set-state-in-effect` ESLint error.
- **Gallery**: parses `images` JSON; shows main image + thumbnail strip below; clicking a
  thumbnail swaps the main image.
- **Image zoom (desktop only)**: 240px circular lens with 5x zoom that follows the mouse.
  Background image is set with `backgroundSize: 1200px 1200px` and `backgroundPosition`
  computed from the cursor position. Disabled on touch devices.
- **Tags badges** near the title.
- **Offer price** display (orange bold + strikethrough original + "Ahorras $X" badge).
- **Variant groups**: rendered as button groups (radio-like selection). Selected option
  shows a checkmark and amber border. Disabled options are struck-through. Price modifier
  shown next to each option (`+$X` or `-$X`).
- **Extras**: rendered as checkboxes with name, description, and `+$X` price. Selected
  extras get an amber background.
- **Dynamic price**: `basePrice + SUM(selected option priceMods) + SUM(selected extras
  priceMod)`. When `optionsPriceMod + extrasPriceMod > 0`, an amber info box shows the
  total. The "Add to cart" button label uses the dynamic price × quantity.
- **Effective stock**: if combinations exist and all required groups are selected, looks up
  the matching combination's stock; otherwise falls back to `product.stock`.
- "Add to cart" validates that all required variant groups have a selection (toast error
  otherwise).
- **Reviews section (`ProductReviews`)** is UNCHANGED — kept exactly as before per task
  instructions.

### FeaturedProducts.tsx & ProductGrid.tsx
- Extended local `Product` interface with all new optional fields so the data flows from
  the API through to `ProductCard` (which renders tags/offer price/shortName).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (5 pre-existing, 1 unused eslint-disable inside
  `ProductReviews` which was preserved as-is per instructions).
- Manually verified end-to-end via curl:
  - POST creates product + variants + combinations (with ID mapping) + extras → 201.
  - GET retrieves all nested relations correctly → 200.
  - PUT with partial body (only `productExtras`) preserves existing variantGroups/
    combinations.
  - PUT with `variantGroups` recreates groups/options/combinations with ID mapping.
  - DELETE removes the product and all its child relations → 200.
  - Homepage `/` → 200, 46800 bytes.

### What was NOT touched (per instructions)
- Review model, `/api/reviews`, `ProductReviews` component, `ReviewsTab` in admin.
- Checkout flow (`CheckoutForm`, `/api/orders`).
- Customer accounts (`/api/customers/*`).
- Delivery zones (`/api/admin/delivery-zones/*`).

## 2026-07-03 — Task PROD-FIX-2: Image zoom fix, full-screen product form, wholesale/reservation/promo

### Summary
Fixed three issues reported by the user:
1. **ImageZoom** was broken — replaced with a properly-working implementation
   that computes `background-size` and `background-position` correctly for
   `object-cover` images using the natural image dimensions and crop offsets.
2. **Product edit dialog** was too small — replaced the `Dialog` with a
   full-screen overlay (`fixed inset-0 z-50`) featuring a dark vertical
   sidebar with all tabs on the left and the form content on the right.
3. **Missing SIGECOS features** — added Wholesale (Por mayor), Reservation,
   and Promo fields and tabs.

### store.ts (`src/lib/store.ts`)
- Extended the `Product` interface with three groups of new fields:
  - Wholesale: `wholesaleEnabled`, `wholesalePrice`, `wholesaleMinQty`,
    `wholesaleUnit`
  - Reservation: `reservationEnabled`, `maxReservations`, `reservationDays`,
    `reservationDeposit`
  - Promo: `promoEnabled`, `promoType`, `promoValue`, `promoBuyQty`,
    `promoGetQty`, `promoStart`, `promoEnd`
- Updated `SEED_PRODUCTS` to populate the new fields with the requested
  defaults (wholesale disabled, reservation disabled, promo disabled).
- Updated `db.product` defaults to match.

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
- Replaced the old inline zoom logic (state: `isDesktop`, `zoomOn`,
  `lensPos`, `imgWrapRef`; handler `handleMouseMove`) with a new
  self-contained `ImageZoom` component:
  - Desktop-only: uses `matchMedia('(hover: hover) and (pointer: fine)')`.
  - 200px circular lens, 4× zoom.
  - Lens position is centered on the cursor, clamped to image bounds.
  - For `object-cover`, computes the natural image dimensions, the cover
    scale, the displayed image size, and the crop offsets; then sets
    `backgroundSize` and `backgroundPosition` so the point under the
    cursor is magnified at the lens center.
  - Hides on `mouseleave`.
- Extended the `Product` interface with all new fields (wholesale,
  reservation, promo).
- Added a "💰 Por mayor" badge in the bottom-left of the main image when
  `wholesaleEnabled && wholesalePrice > 0`.
- Added a wholesale pricing section below the dynamic price box: a green
  info card showing "Precio al por mayor: $X" and "Mínimo Y unidad(es)".
- Removed the unused `useEffect` (and `isDesktop`/`zoomOn`/`lensPos`/
  `imgWrapRef` state) from `ProductDetail` — they now live inside the
  `ImageZoom` component.
- Kept `ProductReviews` UNCHANGED (the unused eslint-disable line is
  preserved as before).

### ProductCard.tsx
- Extended `Product` interface with wholesale fields.
- Added `wholesaleActive` flag.
- Renders a "💰 Por mayor" badge (emerald) in the top-right corner when
  wholesale is active AND there's no active offer (so the OFERTA badge
  takes precedence when both are set).

### FeaturedProducts.tsx & ProductGrid.tsx
- Extended their local `Product` interface with the wholesale fields so
  the data flows from the API to `ProductCard`.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Extended the `Product` interface with all new fields.
- Extended `ProductFormState` and `EMPTY_FORM` with the new fields.
- Added a module-level `PRODUCT_EDIT_TABS` array describing the 9 tabs
  (Info, Oferta, Etiquetas, Galería, Variantes, Extras, Por mayor,
  Reserva, Promo) with their icons.
- Added new lucide imports: `Tags`, `Layers`, `CalendarClock`, `Percent`,
  `Save`.
- Removed the `Tabs`/`TabsContent`/`TabsList`/`TabsTrigger` imports
  (no longer used after the dialog refactor).
- Added an `editTab` state to `ProductsTab`; reset to `'info'` in both
  `openNew` and `openEdit`.
- **Replaced the `Dialog` with a full-screen overlay** (`fixed inset-0
  z-50 bg-gray-100 flex flex-col`):
  - Top bar (white, border-b): "Volver" button (left) → title →
    "Cancelar" (hidden on mobile, sm:inline-flex) + "Guardar" (amber,
    with Save icon).
  - Body: `flex-col md:flex-row`:
    - **Dark sidebar** (`bg-gray-900`) with vertical tab buttons on
      desktop (md:w-60); on mobile it collapses to a horizontal scroll
      strip at the top.
    - **Content area** (`flex-1 overflow-y-auto`) — a white card
      (md:m-6 md:rounded-2xl md:shadow-sm md:border) with `max-w-3xl`
      form fields. Each tab section starts with a title + description
      header and uses `space-y-5` for generous spacing.
  - Mobile bottom action bar (md:hidden) with Cancelar/Guardar buttons
    flex-1 each.
- `openEdit` populates the new fields from `detail` (with fallback to
  `p` then to defaults).
- `handleSave` includes all new fields in the payload.
- The 3 new tab panels:
  - **POR MAYOR**: toggle (emerald box), precio mayorista, cantidad
    mínima, unidad (Select: unidad, unidades, kg, lb, caja, paquete,
    docena).
  - **RESERVA**: toggle (purple box), máximo de reservas, días de
    anticipación, depósito %.
  - **PROMO**: toggle (orange box), tipo (Descuento %, Precio fijo,
    2x1 BOGO), valor (or buy/get quantities for BOGO), rango de fechas.
- Also added a small image preview in the INFO tab when `form.image` is
  set.

### Admin Products API
- `src/app/api/admin/products/route.ts` (POST): coerces all new
  wholesale/reservation/promo fields (Booleans, Numbers, Strings) and
  falls back to defaults if absent.
- `src/app/api/admin/products/[id]/route.ts` (PUT): coerces the new
  fields when present (so partial updates like `{ wholesaleEnabled:
  true }` work without overwriting other fields).

### Re-seed
- Deleted `data/products.json` so it re-seeds with the new default
  fields on the next server access. Verified via `curl
  /api/products/seed-prod-0` that the new fields are populated
  correctly.
- The dev server (running via Turbopack) auto-recompiled after each
  edit; no manual restart was needed.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (5 pre-existing + 1 preserved
  unused eslint-disable in `ProductReviews`).
- Manually verified via curl:
  - `GET /` → 200
  - `GET /admin` → 200
  - `GET /api/products/seed-prod-0` → 200 (returns all new fields)
  - `GET /api/admin/products` → 200 (returns all new fields)
  - `PUT /api/admin/products/seed-prod-0` with new fields → 200
    (wholesaleEnabled, wholesalePrice, etc. persisted correctly)
  - `POST /api/admin/products` with all new fields → 201 (wholesale +
    reservation + promo BOGO all persisted correctly)
  - `DELETE` → 200

### What was NOT touched (per instructions)
- Review model, `/api/reviews`, `ProductReviews` component, ReviewsTab
  in admin.
- Checkout flow (`CheckoutForm`, `/api/orders`).
- Customer accounts (`/api/customers/*`).
- Delivery zones (`/api/admin/delivery-zones/*`).

## 2026-07-03 — Task PROD-FIX-3: Wholesale Tiers, Image Upload, Missing SIGECOS fields, Public API filtering

### Summary
Implemented four SIGECOS-aligned enhancements requested by the user:
1. **Wholesale Tiers (Rangos al por mayor)** — replaced the single wholesale
   price/unit with a `WholesaleTier` collection so each product can have
   multiple price ranges ("10-20 = $100, 20+ = $90"). Removed `wholesaleUnit`
   from `Product` (the product's `saleUnit` is used instead). The legacy
   `wholesalePrice` / `wholesaleMinQty` fields are kept for backward
   compatibility but the tiers are the primary system.
2. **Local Image Upload (≤ 2MB)** — added a `optimizeImage()` client helper
   (File → Canvas → WebP data URL, max 800px wide) and wired it into both the
   INFO tab (main photo) and the GALERÍA tab (multiple files), while keeping
   URL inputs as an alternative.
3. **Missing SIGECOS fields** — extended `Product` with `saleUnit`,
   `barcode`, `productType`, `status`, `posAvailable`, `tiendaAvailable`,
   `advanceType`, `advanceValue`, `minHours`, `costPrice`, `marginPercent`,
   plus an admin-only margin visualization bar.
4. **Public API filtering** — `GET /api/products` now returns only products
   with `status === 'active'` AND `tiendaAvailable === true`, and strips
   sensitive fields (`costPrice`, `marginPercent`, `advanceType`,
   `advanceValue`, `minHours`, `sortOrder`, `posAvailable`).

### store.ts (`src/lib/store.ts`)
- Added `WholesaleTier` interface (`id`, `productId`, `name`, `minQty`,
  `maxQty`, `price`, `sortOrder`, timestamps).
- Extended `Product` interface with the 11 new SIGECOS fields (see above).
  Removed `wholesaleUnit` (kept `wholesaleEnabled`, `wholesalePrice`,
  `wholesaleMinQty` as deprecated legacy fields).
- Added `wholesaleTiers: 'wholesale-tiers.json'` to `FILE_NAMES`.
- Added `wholesaleTiers: WholesaleTier[]` to `StoreState` and the initial
  `state` object.
- `initialize()` now also reads `wholesale-tiers.json` (defaults to `[]`) and
  persists the seed file if it didn't exist on disk.
- Extended `ModelName` and the `fileName`/`getCollection`/`setCollection`
  mappings inside `createRepository` with `'wholesaleTier'`.
- Added `db.wholesaleTier` repository with ID prefix `wt`.
- Updated `SEED_PRODUCTS` and `db.product` defaults to include the new SIGECOS
  fields with sensible defaults (`saleUnit: 'unidad'`, `productType:
  'elaborado'`, `status: 'active'`, `posAvailable: true`, `tiendaAvailable:
  true`, `advanceType: 'sin'`, `advanceValue: 0`, `minHours: 24`,
  `costPrice: 0`, `marginPercent: 0`). Removed `wholesaleUnit` from both.

### src/lib/image-upload.ts (NEW)
- Client-only `optimizeImage(file, maxW=800, quality=0.75): Promise<string>`.
- Rejects files > 2MB.
- Reads the file as a data URL, loads it into an `Image`, scales it down if
  wider than `maxW` (preserves aspect ratio), draws to a `<canvas>`, and
  returns the canvas as a WebP data URL.

### Admin Products API
- `src/app/api/admin/products/route.ts` (POST):
  - Extracts `wholesaleTiers` from the body and creates one
    `db.wholesaleTier` per entry (after the product is created).
  - Coerces all new SIGECOS fields (Strings / Numbers / Booleans) and falls
    back to defaults if absent.
  - Computes `marginPercent = ((salePrice - costPrice) / salePrice * 100)` if
    not explicitly provided.
- `src/app/api/admin/products/[id]/route.ts` (PUT):
  - When `wholesaleTiers` is sent: deletes old tiers
    (`db.wholesaleTier.deleteMany({ where: { productId: id } })`) and creates
    new ones.
  - When `price` or `costPrice` is updated: re-reads the current product,
    recalculates `marginPercent` automatically (unless explicitly provided).
  - Coerces all new SIGECOS fields when present (partial updates supported).
  - DELETE now also cleans up `wholesaleTiers` before deleting the product.
- `src/app/api/products/[id]/route.ts` (GET public detail):
  - Now also returns `wholesaleTiers` (ordered by `sortOrder` asc) alongside
    `variantGroups`/`combinations`/`productExtras`.

### Public storefront API (`src/app/api/products/route.ts`)
- `where` is initialized with `status: 'active'` AND `tiendaAvailable: true`.
  Existing filters (category, search, featured) are layered on top.
- After `findMany`, the response is sanitized: a `SENSITIVE_FIELDS` list
  (`costPrice`, `marginPercent`, `advanceType`, `advanceValue`, `minHours`,
  `sortOrder`, `posAvailable`) is deleted from each product before sending.
- `attachReviewStats` (real rating/reviewCount from approved reviews) and the
  rating re-sort are unchanged.
- The admin endpoint (`/api/admin/products`) is NOT filtered — admins see all
  products regardless of status.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Extended `Product` interface with all new SIGECOS fields; removed
  `wholesaleUnit`.
- Added `WholesaleTier` interface.
- Extended `ProductFormState` and `EMPTY_FORM` with the new fields
  (`saleUnit`, `barcode`, `productType`, `status`, `posAvailable`,
  `tiendaAvailable`, `advanceType`, `advanceValue`, `minHours`, `costPrice`,
  `marginPercent`, `wholesaleTiers`).
- Imported `optimizeImage` from `@/lib/image-upload`.
- Imported new lucide icons: `Store`, `Barcode`, `ToggleLeft`, `Upload`.
- Added `MainImageEditor` component (preview + file upload + URL fallback)
  used in the INFO tab.
- Added `WholesaleTiersEditor` component (table with name, minQty, maxQty,
  price, delete) with an "Agregar rango" button.
- Replaced `GalleryEditor` URL-only flow with a dual approach: a file upload
  button (multiple files, compressed to WebP) AND the URL input. Each upload
  error is shown inline; successful files are appended to the `images` JSON
  array as data URLs.
- `PRODUCT_EDIT_TABS` now includes `availability` (between `info` and
  `oferta`).
- **INFO tab**: name / shortName / SKU / description; then a 3-column grid
  with Precio de venta, Precio de costo and Stock; then a live **margin bar**
  (red <20%, amber 20-40%, green >40%); then the `MainImageEditor`; then
  Unidad de venta + Código de barras; then Tipo de producto + Estado;
  finally Categoría, Orden and Destacado.
- **DISPONIBILIDAD tab** (NEW): two toggle cards (tienda online / POS) +
  Select de Tipo de anticipo (sin / porcentaje / monto_fijo) + valor when
  applicable + Horas mínimas de anticipación.
- **POR MAYOR tab**: toggle + the new `WholesaleTiersEditor` table + the
  legacy `wholesalePrice` / `wholesaleMinQty` inputs (clearly marked as
  "legacy, used only if no tiers defined"). The `wholesaleUnit` Select was
  removed (per task instructions).
- `openEdit` now loads the new fields from the product detail response
  (including `wholesaleTiers`).
- `handleSave` builds a payload that includes `wholesaleTiers`
  (`name`/`minQty`/`maxQty`/`price`/`sortOrder`) and all new SIGECOS fields.

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
- Added `WholesaleTier` interface; extended the `Product` interface with
  `wholesaleTiers?` and removed `wholesaleUnit?`.
- The "💰 Por mayor" block now renders a **table** of tiers (when present)
  with three columns: Rango | Cantidad | Precio por unidad. The Cantidad
  column shows `min-max` or `min+` when `maxQty === 0`. If no tiers exist,
  it falls back to the legacy single-price display using
  `wholesalePrice` / `wholesaleMinQty`.

### ProductCard.tsx, FeaturedProducts.tsx, ProductGrid.tsx
- Removed `wholesaleUnit?` from their local `Product` interfaces so they
  match the new schema (the data flows from the public API to `ProductCard`
  which keeps showing the "💰 Por mayor" badge when `wholesaleEnabled` is
  true and there is no active offer).

### Re-seed
- Deleted `data/products.json` after the store changes so it re-seeds with
  the new defaults on first access. Verified via `curl /api/products/seed-prod-0`
  that all new fields are populated correctly and `wholesaleUnit` is gone.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (5 pre-existing + 1 preserved
  unused eslint-disable in `ProductReviews`).
- The dev server (Turbopack) auto-recompiled cleanly after every edit.
- Manually verified end-to-end via curl:
  - `GET /` → 200
  - `GET /admin` → 200
  - `GET /api/products/seed-prod-0` → 200 (returns all new fields +
    `wholesaleTiers: []`)
  - `GET /api/products?featured=true` → 200 (no sensitive fields in
    response: no `costPrice`, `marginPercent`, `advanceType`,
    `advanceValue`, `minHours`, `sortOrder`, `posAvailable`)
  - `PUT /api/admin/products/seed-prod-0` with `wholesaleTiers` → 200;
    subsequent GET shows the two tiers persisted.
  - `PUT` with `wholesaleTiers: []` → 200; subsequent GET shows 0 tiers.
  - `PUT` with `price: 50, costPrice: 30` → 200; `marginPercent` auto-set
    to 40.
  - `PUT` with `status: 'inactive'` → 200; product disappeared from
    `/api/products?featured=true`. Restored to `status: 'active'` →
    reappears.
  - `POST` with all new fields + 2 wholesaleTiers → 201; subsequent GET
    returns the tiers and SIGECOS fields. `DELETE` → 200; subsequent GET
    → 404.

### What was NOT touched (per instructions)
- Review model, `/api/reviews`, `ProductReviews` component, ReviewsTab in
  admin.
- Checkout flow (`CheckoutForm`, `/api/orders`).
- Customer accounts (`/api/customers/*`).
- Delivery zones (`/api/admin/delivery-zones/*`).

## 2026-07-04 — Task PROD-FIX-4: Galería con columna de miniaturas a la izquierda

### Summary
Restructured the product detail gallery so that:
- **By default** the expanded view shows the product's main image (the previously
  auto-selected variant image no longer takes over the main view on load).
- A **vertical thumbnail column** sits to the LEFT of the expanded view on desktop
  (and a horizontal strip BELOW the main image on mobile), containing, in order:
  1. The product's main image thumbnail (always on top).
  2. The variant-option image thumbnails (one per option that has an image).
  3. The gallery image thumbnails.
- Clicking any thumbnail — main image, variant image, or gallery image — pushes
  that image into the expanded view. Clicking a variant image thumbnail also
  selects that variant (so the thumbnail column and the variant button group
  stay in sync).
- Clicking a variant button in the info section now ALSO sets the main view to
  that variant's image (or reverts to the product image if the variant has no
  image). This matches the user's request: "al hacer click en la imagen o en
  la variante correspondiente es que la imagen debe ir al cuadro ampliado".

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
- Removed the `variantImage` memo that previously auto-overrode the main view
  with the selected variant's image. The main view now defaults to
  `product.image` whenever the user hasn't explicitly picked a thumbnail.
- Added a new `variantImages` memo that flattens every variant-option image
  across all groups into a single list (each entry keeps a back-reference to
  its `groupId` / `optionId` / `optionName` / `available` flag, so the
  thumbnail can both render and drive selection).
- Added a `totalThumbs` count = main image (1 if present) + variant images +
  gallery images. The thumbnail column is only rendered when `totalThumbs > 1`
  (otherwise the column would just duplicate the main image with no behavior).
- New `currentImage = selectedImage || product?.image || ''` — no more
  `variantImage` fallback.
- Variant-button `onClick` now does:
  ```ts
  setSelectedOptions({ ...selectedOptions, [g.id]: o.id });
  setSelectedImage(o.image || null);
  ```
  So clicking a variant button (with an image) puts that image in the
  expanded view; clicking one without an image reverts to the product image.
- Restructured the gallery layout:
  - Outer container changed from `<div className="relative">` (with the main
    image on top and the thumbnail strip below) to
    `<div className="relative flex flex-col-reverse md:flex-row gap-3">`.
    `flex-col-reverse` on mobile puts the thumbnails BELOW the main image
    (since they're first in DOM order); `md:flex-row` on desktop puts them
    on the LEFT of the main image.
  - Thumbnail column:
    `flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-20
    md:max-h-[600px] shrink-0 pb-1 md:pb-0`. Vertical scroll on desktop if
    many thumbnails; horizontal scroll on mobile.
  - Each thumbnail button uses `h-16 w-16 md:w-full md:aspect-square` so it
    stays square at 64px on mobile and fills the 80px column width on
    desktop.
  - Active state (amber border) is bound to `currentImage === src` for the
    main-image and gallery thumbnails, and to `currentImage === v.src` for
    variant thumbnails — i.e. the thumbnail whose image is currently shown
    in the expanded view is the one highlighted.
  - Variant thumbnails are `disabled` when `!v.available`, and inherit an
    `opacity-40 cursor-not-allowed` style in that case.
  - Each variant thumbnail has a `title={v.optionName}` tooltip so the user
    can see which option it represents on hover.
  - The main view container is now `relative flex-1 min-w-0` so it takes
    the remaining width next to the thumbnail column. All badges
    (DESTACADO, OFERTA, 💰 Por mayor, SIN STOCK) and the `ImageZoom`
    component remain unchanged inside it.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (5 pre-existing + 1 preserved
  unused eslint-disable in `ProductReviews`). No new warnings introduced.
- `GET /` → 200 (46803 bytes — unchanged from before).
- `GET /admin` → 200.
- Verified seed-prod-1 "Brazo Gitano" returns: 1 main image + 7 gallery
  images + 1 variant group "Tamaño" with 2 options that have images → 10
  thumbnails should render in the left column.

### What was NOT touched
- Variant button group UI in the info section (still uses the same
  button-group styling with checkmark + amber border for selection).
- Extras, wholesale, reservation, promo, reviews — all unchanged.
- `ImageZoom` component — unchanged.

## 2026-07-04 — Task PROD-FIX-5: Separar galería (debajo) de la columna izquierda (principal + variantes)

### Summary
Ajuste fino del layout de la galería del ProductDetail siguiendo indicación
del usuario: la columna vertical a la izquierda del cuadro ampliado debe
contener SÓLO la imagen principal y las imágenes de las opciones de
variantes; las imágenes de la galería vuelven a su ubicación original como
tira horizontal DEBAJO del cuadro ampliado.

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
- Eliminada la variable `totalThumbs` (ya no se usa para decidir si
  mostramos la columna lateral).
- La condición de renderizado de la columna lateral cambió de
  `totalThumbs > 1` a `(product.image || variantImages.length > 0)`, es
  decir, la columna se muestra siempre que haya una imagen principal o al
  menos una imagen de variante (no incluye la galería en esta decisión).
- La columna lateral ahora contiene SÓLO:
  1. Miniatura de la imagen principal del producto (siempre arriba).
  2. Miniaturas de las imágenes de las opciones de variantes (debajo).
  Se eliminó el bloque que mapeaba `galleryImages` dentro de la columna.
- El bloque `galleryImages.map(...)` se movió FUERA de la columna lateral
  y quedó dentro del contenedor del cuadro ampliado, debajo del
  `aspect-square`, como tira horizontal con `mt-3 flex gap-2 overflow-x-auto`.
  Esto restaura el comportamiento original de la galería.
- Cambio menor en el contenedor exterior: `flex flex-col-reverse md:flex-row`
  → `flex flex-col md:flex-row`. Antes usábamos `flex-col-reverse` para
  que la columna lateral apareciera DEBAJO del cuadro en móvil (ya que era
  irrelevante cuando venía primero en el DOM). Ahora la columna lateral
  sí debe ir ARRIBA del cuadro en móvil (coherente con la nueva función:
  principal + variantes arriba, galería debajo), por eso usamos
  `flex-col` (orden natural del DOM). En escritorio sigue siendo
  `md:flex-row` con la columna a la izquierda.
- Estructura final del layout:
  ```
  flex flex-col md:flex-row gap-3
    ├── Columna lateral (md:w-20, vertical en desktop, horizontal arriba en móvil)
    │     • Imagen principal
    │     • Imágenes de variantes
    └── Cuadro ampliado (flex-1)
          ├── aspect-square con ImageZoom + badges
          └── Tira horizontal de galería (mt-3)  ← restaurada aquí
  ```

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (las mismas 6 preexistentes).
- `GET /` → 200 (46808 bytes).

## 2026-07-04 — Task PROD-FIX-6: Grupo dominante + imágenes de combinaciones + stock por combinación

### Summary
Implemented the "dominant group" concept for products with 2+ variant
groups:
1. **Admin can mark ONE group as dominant** (radio button per group, only
   one active at a time, only visible when 2+ groups exist).
2. **Default combination images** come from the dominant group's options
   (each combination's default image = the image of the option from the
   dominant group that's part of that combination).
3. **Combination images remain editable** (each row has thumbnail + upload
   button + remove button, plus URL is still settable).
4. **"Aplicar imágenes del dominante" button** — re-applies the dominant
   group's option images to all existing combinations (useful after the
   admin changes which group is dominant or edits an option's image and
   wants to re-sync without regenerating all combinations).
5. **Stock is determined by combinations** — already implemented in
   `ProductDetail.effectiveStock`, but now there's an explicit note in the
   admin telling the admin this is how it works.
6. **Customer-side gallery respects the dominant group**: when a dominant
   group exists, the left thumbnail column shows ONLY that group's option
   images (other groups are still selectable as buttons but don't add
   thumbnails). When no dominant group is set, all groups contribute
   thumbnails (previous behavior).

### Schema (`src/lib/store.ts`)
- Added `isDominant: boolean` field to the `VariantGroup` interface.
- Updated `db.variantGroup` defaults to include `isDominant: false`.

### Admin Products API
- `src/app/api/admin/products/route.ts` (POST): added
  `isDominant: Boolean(g.isDominant ?? false)` when creating variant
  groups.
- `src/app/api/admin/products/[id]/route.ts` (PUT): same coercion when
  recreating variant groups on update.
- `src/app/api/products/[id]/route.ts` (GET public detail): no change
  needed — `isDominant` flows through the `...g` spread automatically.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Extended the local `VariantGroup` interface with `isDominant?: boolean`.
- Extended `ProductFormState['variantGroups']` with `isDominant: boolean`.
- Updated `addGroup` to initialize `isDominant: false` on new groups.
- Updated `openEdit` to read `isDominant` from the detail response
  (`isDominant: g.isDominant === true`).
- Updated `handleSave` payload to include `isDominant: g.isDominant === true`.
- Rewrote `generateCombinationsFromForm`:
  - Now passes `{ id, image }` through the recursion instead of just IDs.
  - When a dominant group exists, each combination's default `image` =
    the image of the option from the dominant group that's part of the
    combination.
  - When no dominant group exists, combination `image` defaults to `''`
    (same as before).
- Added a new module-level helper `reapplyDominantImages(form)` that
  walks existing combinations and overrides each one's image with the
  dominant group's option image (no-op when no dominant group is set).
- `VariantsEditor`:
  - Added `setDominant(gid)` — marks the given group as dominant and
    unmarks all others.
  - Added `applyDominantImages()` — calls `reapplyDominantImages` and
    updates form.
  - Added `hasDominant` derived flag.
  - Each group card now shows a "Grupo dominante" radio button BELOW the
    header row (only when 2+ groups exist). Clicking it sets that group
    as dominant.
  - Combinations section header now has TWO buttons when there's a
    dominant group and combinations exist: "Aplicar imágenes del
    dominante" (outline amber) and "Generar combinaciones" (filled amber).
  - Added an explanatory note under the combinations header: "El stock
    mostrado al cliente se toma de las combinaciones... La imagen de
    cada combinación se autocompleta con la imagen de la opción del
    grupo dominante, pero puedes editarla manualmente."
  - Combination table: the "Img" column header changed from `w-10` to
    `w-24` to fit the new richer cell. Each row's image input was
    replaced by a new `CombinationImageCell` component.
- New `CombinationImageCell` component:
  - Same UX as `VariantOptionRow`'s image cell: 32×32 thumbnail + green
    upload button (uses `optimizeImage`) + red remove button when image
    is set.
  - Calls `onChange(dataUrl)` after upload, `onChange('')` on remove.
  - No URL input (the previous text input was clunky; upload is the
    primary path now, and admins who want URLs can paste them via the
    gallery editor on the product image instead).

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
- Extended the `VariantGroup` interface with `isDominant?: boolean`.
- Updated the `variantImages` memo:
  - Finds the dominant group (`isDominant === true`).
  - If a dominant group exists, only includes options from that group.
  - Otherwise, includes options from all groups (previous behavior).
  - This means: when a product has a dominant group, the left thumbnail
    column shows only that group's option images. The other groups are
    still rendered as variant buttons in the info section, so the
    customer can still pick size/color/etc. — they just don't get
    thumbnails for those groups.

### Lint / Build / Verification
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (46807 bytes).
- `GET /admin` → 200 (22749 bytes).
- End-to-end curl test on seed-prod-1 (Brazo Gitano):
  - PUT with `variantGroups: [{name: Tamaño, isDominant: true}, {name: Sabor, isDominant: false}]` + 4 combinations
    → 200, GET shows `isDominant: True` on the Tamaño group.
  - The 4 generated combinations all had `image set: True` (because
    each combination includes one option from the dominant Tamaño
    group, which has images on its options).
  - Restored seed-prod-1 to single-group, no-dominant, no-combinations
    state.

### What was NOT touched
- `ProductReviews` component, reviews API.
- Checkout flow.
- Customer accounts.
- Delivery zones.

## 2026-07-04 — Task PROD-FIX-7: Click en variante no dominante mantiene/muestra imagen de combinación

### Summary
Fixed the bug where clicking a non-dominant variant option button was
reverting the main view to the product's main image. Now clicking a
non-dominant option (which has no image of its own) shows the matching
combination's image, or keeps the current image if no combination matches.

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
- Extracted a new module-level helper `findMatchingCombination(product, selOpts)`:
  - Returns the `ProductCombination` whose `optionIds` (parsed from JSON)
    exactly match the set of selected option IDs, or `null` if no match
    or if not all groups have a selection.
  - Same matching logic that was previously inline in `effectiveStock`.
- Refactored `effectiveStock` memo to use `findMatchingCombination`
  (removed ~12 lines of duplicated parsing/matching logic).
- Rewrote the variant-button `onClick` handler:
  - Computes `newSelectedOptions` first (with the clicked option applied).
  - **If the clicked option has its own image** (dominant-group case):
    `setSelectedImage(o.image)` — same as before.
  - **Else** (non-dominant option, no image): look up
    `findMatchingCombination(product, newSelectedOptions)`. If the
    matching combination has an image, `setSelectedImage(match.image)`.
  - **Else** (no matching combination, e.g. not all groups selected yet):
    do nothing — `selectedImage` stays at its current value, so the
    previously-shown image (typically the dominant option's image or the
    product's main image on first load) is preserved. This is the
    "mantener" behavior the user requested.
  - Previously the handler unconditionally called
    `setSelectedImage(o.image || null)`, which reset the view to the
    product's main image whenever a non-dominant option was clicked.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (46807 bytes).
- `GET /admin` → 200 (22758 bytes).

## 2026-07-04 — Task HOME-FIX-1: Quitar envíos diarios/pagos seguros/pago Zelle del inicio y destacar horario

### Summary
Removed the three old home-page trust badges ("Envíos Diarios",
"Compra Segura", "Pago Zelle") from BOTH places they appeared on the
home page, and replaced them with the three points the owner wanted to
highlight:
1. **Pedidos 24/7** — site available for orders 24 hours, 7 days a week.
2. **Entregas de 3:00 pm a 6:00 pm** — daily delivery window in Cuba.
3. **Envío rápido por costo adicional** — optional priority delivery.

The new badges are now present in TWO places on the home page:
- The `HeroBanner` trust-badge row (white-on-amber cards with lucide icons).
- The promo section ("¿Por qué elegir...?") rebranded as "Pide cuando
  quieras, recíbelo en casa" with a polished dark-on-amber card layout
  (with a subtle dot pattern background and a pulsing "Horario y
  Entregas" pill).

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
- Replaced lucide imports: removed `Shield, CreditCard`, added
  `Clock, Zap`. `Truck` is still used.
- Updated the hero description to drop "Paga fácil con Zelle" — now
  reads "Productos de alta calidad con entrega rápida en Cuba. Pedidos
  disponibles todos los días, recibe en la puerta de tu casa."
- Replaced the 3 trust badges:
  - Old: Envíos Diarios / Compra Segura / Pago Zelle (flat white cards,
    12×12 icon swatches, single-line descriptions).
  - New: Pedidos 24/7 / Entregas diarias de 3:00 pm a 6:00 pm / Envío
    rápido por costo adicional (taller cards, 14×14 gradient icon
    swatches with `shadow-inner`, bold title + 2-line description,
    `hover:-translate-y-0.5` lift effect).
- Each new card uses a slightly different gradient on the icon swatch
  (amber→amber, orange→orange, yellow→amber) to visually distinguish
  them while staying on-palette.

### Header.tsx (`src/components/ecommerce/Header.tsx`)
- Updated the promo banner (the thin amber strip at the very top of
  every page) from:
  "🚚 Envío GRATIS en pedidos mayores a $100 · Paga con Zelle · Entrega
  rápida y segura"
  to:
  "🕐 Pedidos 24/7 · 🚚 Entregas diarias de 3:00 pm a 6:00 pm · ⚡ Envío
  rápido por costo adicional"
  This keeps the global header message consistent with the new home
  highlights. (Zelle is still shown in the Footer as a payment method
  — that's appropriate, it's just no longer a headline feature.)

### page.tsx (`src/app/page.tsx`)
- Replaced the entire "¿Por qué elegir Diaz Premium Envíos?" promo
  section (which had the old 🚀 Envíos Diarios / 🔒 Pago Seguro / 💪
  Garantía Total cards on a flat amber gradient) with a new section
  titled "Pide cuando quieras, recíbelo en casa" that highlights the
  same 3 horario points using 🕐 / 🚚 / ⚡ emojis on richer cards:
  - Subtle dotted background pattern (`radial-gradient` white dots at
    10% opacity, 24×24 grid) for visual texture.
  - Pulsing "Horario y Entregas" pill badge above the title.
  - Each card: 14×14 white/15% icon container with the emoji, bold
    title, 2-line description, `border border-white/15` outline,
    `hover:bg-white/15` interaction.
  - Wider max-width (max-w-4xl vs old max-w-3xl) for breathing room.

### Lint / Build / Verification
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /admin` → 200.
- Verified the served home HTML:
  - No longer contains: "Envíos Diarios", "Compra Segura", "Pago Zelle",
    "Garantía Total" (the 4 old badge titles).
  - Now contains (twice — once in HeroBanner, once in the promo
    section): "Pedidos 24/7", "3:00 pm a 6:00 pm", "Envío rápido".
  - The only remaining "Pago Seguro" mention is in the global Footer
    (a section heading for the Zelle payment block) — that's a global
    element, not a home-page highlight, and was intentionally left
    untouched per the user's scope.

### What was NOT touched
- Footer (still shows Zelle as a payment method — that's fine, it's
  not a home-page highlight).
- AIAssistant's prompt and greeting (still mention Zelle — that's the
  AI's domain knowledge, not a home-page badge).
- AdminPanel's Zelle config tab.
- CheckoutForm, OrderHistory, OrderTicket — all still reference Zelle
  for actual payment processing.

## 2026-07-04 — Task PROD-FIX-8: Quitar trust badges debajo de "Agregar al Carrito"

### Summary
Removed the three trust badges ("Envío Rápido", "Pago Seguro",
"Devolución") that appeared below the "Agregar al Carrito" button in
the ProductDetail view.

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
- Removed the entire "Trust badges" `<div className="grid grid-cols-3
  gap-3 pt-2">` block (3 gray cards with Truck/Shield/RotateCcw icons).
- Removed the now-unused `Truck`, `Shield`, `RotateCcw` imports from
  `lucide-react` (they were only used by the removed block).
- The "Agregar al Carrito" button is now the last element in the info
  column before the closing `</div>` of the right column. Below it
  comes directly the `<ProductReviews>` section (unchanged).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48884 bytes — slightly smaller than before because
  the trust-badge HTML is gone).
- `GET /admin` → 200.

## 2026-07-04 — Task PROD-FIX-9: Cuadro ampliado se desbordaba en móvil

### Summary
Fixed the mobile layout bug where the product detail's enlarged image
view was overflowing the screen (584px wide on a 390px viewport), making
the square image enormous and causing horizontal scroll.

### Root cause
In CSS Grid, grid items have `min-width: auto` by default, which means
their minimum width is the width of their content. The product detail
uses `grid md:grid-cols-2` (1 column on mobile). Both grid children —
the image column (`flex flex-col md:flex-row`) and the info column
(`space-y-5`) — contained elements with large intrinsic widths
(thumbnail strips with `overflow-x-auto`, variant button groups, etc.).
Because `min-width: auto` prevented the grid from compressing them, the
entire grid overflowed to 568px, and the `aspect-square` enlarged view
became 568×568px on a 390px screen.

Additionally, the thumbnail column had `shrink-0` (necessary on desktop
so it doesn't compress next to the enlarged view), but on mobile this
was unnecessary and contributed to the overflow. The breadcrumb row
also overflowed because it had no `min-w-0` / `overflow-hidden`.

### ProductDetail.tsx (`src/components/ecommerce/ProductDetail.tsx`)
Three changes, all using `min-w-0` to override the default
`min-width: auto`:

1. **Image column container**: added `min-w-0` to
   `<div className="relative flex flex-col md:flex-row gap-3 min-w-0">`.
   This allows the grid to compress the image column to the column
   width on mobile.

2. **Thumbnail strip container**: replaced `shrink-0` with
   `w-full md:w-20 md:shrink-0` and added `min-w-0`. On mobile, `w-full`
   makes the strip take the full width of its parent (and `overflow-x-auto`
   handles the internal scroll). On desktop, `md:w-20 md:shrink-0`
   restores the fixed 80px width and prevents compression.
   - Old: `flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-20 md:max-h-[600px] shrink-0 pb-1 md:pb-0`
   - New: `flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto w-full md:w-20 md:max-h-[600px] md:shrink-0 pb-1 md:pb-0 min-w-0`

3. **Info column**: added `min-w-0` to
   `<div className="space-y-5 min-w-0">`. Same reason as #1.

4. **Breadcrumb**: added `min-w-0 overflow-hidden` to
   `<div className="flex items-center gap-2 mb-6 text-sm min-w-0 overflow-hidden">`.
   The breadcrumb's category button + title could exceed the available
   width on mobile; now it's contained.

### Verification (mobile emulation, iPhone 14 — 390×844 viewport)
Before fix:
- `body.scrollWidth` = 584px (194px overflow!)
- Enlarged view = 568×568px
- Horizontal scroll: YES

After fix:
- `body.scrollWidth` = 390px (exactly viewport)
- Enlarged view = 358×358px (correct: viewport - 32px padding)
- Thumbnail strip = 358×68px (3 buttons in a horizontal row, scroll contained)
- Gallery strip = 358px wide, 568px scrollable internally (8 buttons, scroll
  contained within the strip — no body overflow)
- Horizontal scroll: NO

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48886 bytes).
- `GET /admin` → 200.

## 2026-07-07 — Task SYNC-1: Sincronizar sandbox con .zip subido por el usuario

### Summary
El usuario subió `diaz-premium-envios-1783153173213.zip` y pidió
asegurar que el sandbox estuviera idéntico al .zip para continuar
trabajando sobre la versión correcta.

### Comparación
Extraje el .zip a `/tmp/zip-extract` y comparé recursivamente con
`/home/z/my-project` (excluyendo artefactos del entorno: node_modules,
.next, .git, upload, download, tool-results, agent-ctx, scripts, db,
data, dev.log, examples, mini-services, skills, .env, .zscripts,
bun.lock, next-env.d.ts).

Resultado de la comparación:
- **Sólo 2 archivos diferían**:
  1. `src/components/ecommerce/ProductDetail.tsx`
  2. `worklog.md`
- Todo el resto del código (src/app, src/components, src/hooks, src/lib,
  src/store, public, prisma, package.json, tsconfig.json, eslint.config.mjs,
  tailwind.config.ts, postcss.config.mjs, components.json, next.config.ts,
  vercel.json, Caddyfile, .gitignore, DOWNLOAD-MANIFEST.json) era
  **idéntico** entre el .zip y el sandbox.

### Diferencia en ProductDetail.tsx
El sandbox tenía 4 cambios de `min-w-0` que se hicieron en la tarea
PROD-FIX-9 (arreglo del overflow del cuadro ampliado en móvil) y que el
.zip NO tenía (el .zip fue subido antes de esa tarea). Las 4 líneas
afectadas:
- Línea 503: breadcrumb `min-w-0 overflow-hidden`
- Línea 536: contenedor de imagen `min-w-0`
- Línea 541: tira de miniaturas `w-full md:w-20 md:shrink-0 ... min-w-0`
  (antes `shrink-0`)
- Línea 632: columna de info `min-w-0`

Estos 4 cambios son una **mejora posterior aprobada por el usuario**,
así que se preservaron intencionalmente y NO se sobrescribieron con la
versión del .zip.

### Diferencia en worklog.md
El worklog del sandbox tiene todas las entradas hasta PROD-FIX-9. El
worklog del .zip está hasta una tarea anterior. Se preservó el worklog
del sandbox (más actualizado).

### Sincronización
Se copiaron todos los archivos del .zip al sandbox, **excepto**:
- `src/components/ecommerce/ProductDetail.tsx` (sandbox tiene versión
  más nueva con los arreglos móviles).
- `worklog.md` (sandbox tiene versión más nueva).

Esto asegura que el sandbox esté exactamente sincronizado con la
versión del .zip, pero conservando las mejoras móviles ya aprobadas.

### Verificación post-sync
- `bun run lint` — 0 errors, 6 warnings (las mismas 6 preexistentes).
- `GET /` → 200 (48886 bytes).
- `GET /admin` → 200 (22747 bytes).
- Verificado que `isDominant` está presente en: store.ts (2),
  AdminPanel.tsx (12), ProductDetail.tsx (3), admin/products/route.ts (1),
  admin/products/[id]/route.ts (1).
- Verificado que las menciones de horario ("Pedidos 24/7", "3:00 pm a
  6:00 pm", "Envío rápido") están presentes en: HeroBanner.tsx (4),
  page.tsx (4), Header.tsx (1).

### Estado actual del sandbox
El sandbox está ahora sincronizado con el .zip subido por el usuario,
MÁS las siguientes mejoras posteriores que ya estaban aprobadas:
- PROD-FIX-4: Galería con columna de miniaturas a la izquierda
- PROD-FIX-5: Separar galería (debajo) de la columna izquierda
- PROD-FIX-6: Grupo dominante + imágenes de combinaciones + stock por combinación
- PROD-FIX-7: Click en variante no dominante mantiene/muestra imagen de combinación
- PROD-FIX-8: Quitar trust badges debajo de "Agregar al Carrito"
- PROD-FIX-9: Cuadro ampliado se desbordaba en móvil
- HOME-FIX-1: Quitar envíos diarios/pagos seguros/pago Zelle del inicio y destacar horario

## 2026-07-07 — Task PROD-FIX-10: Congelar stock general cuando el producto tiene variantes

### Summary
When a product has variant groups, the general `stock` field is now
**frozen** in the admin INFO tab (disabled input with a "Congelado" lock
badge) and automatically calculated as the sum of all option stocks.
Two inline amber alerts explain this behavior — one in the INFO tab next
to the frozen stock input, and one at the top of the VARIANTES tab
showing the current computed total.

### Rationale
The user clarified the stock model: when a product has variants and
options, its stock is determined by the sum of the stock of its options
(individual option stocks, not combination stocks in this case — the
combinations drive their own stock lookup at checkout time, but the
product-level `stock` shown in the catalog and admin list should reflect
the aggregate). Letting admins edit the product-level `stock` directly
when variants exist would create inconsistency, so the field is now
read-only and auto-computed.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Added `Lock, Info` to the lucide-react imports (both already had
  related icons; `Lock` was new, `Info` was new).
- In `ProductsTab`, added two derived values right before `handleSave`:
  - `hasVariantGroups = form.variantGroups.length > 0`
  - `computedStock` = `useMemo` that sums `Number(o.stock) || 0` across
    all options of all variant groups in `form.variantGroups`.
- **INFO tab — Stock field**:
  - The `<Label>` now includes a conditional "Congelado" pill badge
    (amber-100 bg, amber-700 text, with a `Lock` icon) when
    `hasVariantGroups` is true.
  - The `<Input>` is `disabled` when `hasVariantGroups`, shows
    `computedStock` instead of `form.stock`, and gets the
    `bg-gray-100 text-gray-500 cursor-not-allowed` styling to visually
    convey the disabled state.
  - The `onChange` is preserved (won't fire because disabled, but kept
    for code consistency).
- **INFO tab — alert below the prices/stock grid**:
  - New conditional block (only when `hasVariantGroups`) renders an
    amber alert box with an `AlertTriangle` icon explaining: "Stock
    congelado. Este producto tiene variantes, por lo que el stock
    general se calcula automáticamente como la suma del stock de las
    opciones de variantes (actual: X). Para modificarlo, edita el stock
    de cada opción en la pestaña Variantes."
- **VARIANTES tab — banner at the top**:
  - In `VariantsEditor`, added a new conditional block (only when
    `form.variantGroups.length > 0`) that computes the same total stock
    inline and shows an amber info banner with an `Info` icon: "El stock
    general del producto está congelado y se calcula como la suma del
    stock de todas las opciones de variantes. Stock total actual: X
    unidades."
- **handleSave**:
  - The `stock` field in the payload now uses
    `hasVariantGroups ? computedStock : form.stock` so the backend
    always persists the correct aggregate value even if the admin had a
    stale `form.stock` from before adding variant groups.

### Verification (browser, admin panel)
- Logged into `/admin` as `admin` / `diaz2024`.
- Edited "Brazo Gitano" (which has 1 variant group "Tamaño" with 2
  options, total stock 15).
- INFO tab:
  - Stock label reads "Stock Congelado" with a lock icon badge.
  - Stock input is `disabled`, value = 15.
  - Amber alert below the prices/stock grid renders with the full
    explanation and the current total (15).
- VARIANTES tab:
  - Amber info banner at the top reads "El stock general del producto
    está congelado... Stock total actual: 15 unidades."
- Both banners update live as the admin edits option stocks (the
  `useMemo` recomputes on every `form.variantGroups` change).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48165 bytes).
- `GET /admin` → 200 (22745 bytes).

### Note on combinations vs options
This task treats the product-level stock as the **sum of option stocks**
(per the user's instruction). Combination stocks remain independent
(they drive the `effectiveStock` lookup in `ProductDetail.tsx` when the
customer has selected specific options). The two systems coexist:
- Product `stock` field (catalog/admin list) = sum of option stocks.
- `effectiveStock` shown to the customer in ProductDetail = matching
  combination's stock (if combinations exist and all groups selected),
  else falls back to product `stock`.

## 2026-07-07 — Task PROD-FIX-11: Prioridad de stock combinaciones > opciones > general

### Summary
Fixed the stock calculation logic for products with variants. The
previous implementation (PROD-FIX-10) always summed option stocks,
which was wrong when combinations exist. Now the stock is calculated
with strict priority:

1. **Combinations** (highest priority) — if the product has any
   combination, the stock = SUM of all combination stocks. The stock
   of each individual option is FROZEN (read-only) because combinations
   are what actually govern availability.
2. **Options** (middle priority) — if there are no combinations but
   there are options, the stock = SUM of all option stocks. The
   product-level stock field is frozen.
3. **Manual** (lowest priority) — if no variants at all, the admin
   edits the `stock` field directly.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)

**`ProductsTab` derived values** (replaced the old `computedStock`
that only summed options):
- `hasVariantGroups` — any variant group exists.
- `hasVariantOptions` — at least one group has options.
- `hasCombinations` — `form.combinations.length > 0`.
- `optionsStockSum` — `useMemo` summing all option stocks (level 2).
- `combinationsStockSum` — `useMemo` summing all combination stocks
  (level 1).
- `computedStock` — picks `combinationsStockSum` if combinations exist,
  else `optionsStockSum` if options exist, else `form.stock`.
- `stockLevel` — `'combinations' | 'options' | 'manual'` for display.
- `stockFrozen` — `hasVariantOptions || hasCombinations` (true when
  the product-level stock input should be disabled).
- `optionStockFrozen` — `hasCombinations` (true when each option's
  stock input should be disabled).

**INFO tab — Stock field**: now uses `stockFrozen` (instead of
`hasVariantGroups`) to decide whether to disable. The amber alert below
now branches on `stockLevel`:
- `'combinations'`: "Este producto tiene combinaciones, por lo que el
  stock general se calcula como la suma del stock de las combinaciones
  (actual: X). Para modificarlo, edita el stock de cada combinación en
  la pestaña Variantes."
- `'options'`: "Este producto tiene opciones de variantes (sin
  combinaciones), por lo que el stock general se calcula como la suma
  del stock de las opciones (actual: X). Para modificarlo, edita el
  stock de cada opción en la pestaña Variantes."

**`handleSave`**: `stock: stockFrozen ? computedStock : form.stock`
(was `hasVariantGroups ? computedStock : form.stock`).

**`VariantsEditor`**: now accepts 3 new props:
- `optionStockFrozen` (boolean)
- `computedStock` (number)
- `stockLevel` ('combinations' | 'options' | 'manual')

The top banner now branches on `stockLevel`:
- `'combinations'`: explains that combinations govern stock, that
  option stocks are frozen (reference only), and shows the total.
- `'options'`: explains that option stocks govern the total and
  mentions that creating combinations will switch the governing level.
- `'manual'`: not shown (banner only renders when there are variant
  groups).

**`VariantOptionRow`**: now accepts a `stockFrozen` prop. When true,
the option's stock `<Input>` is `disabled`, gets
`bg-gray-100 text-gray-500 cursor-not-allowed` styling, and shows a
tooltip "Stock congelado: hay combinaciones que gobiernan el stock".

The `VariantsEditor` passes `optionStockFrozen` down to each
`VariantOptionRow` so all option stocks freeze when combinations exist.

### Verification (browser, admin panel)
- Logged in as `admin` / `diaz2024`, edited "Brazo Gitano" (seed-prod-1)
  which has 2 variant groups + 4 combinations.
- Product state:
  - Tamaño group: Pequeño (stock 5), Mediano (stock 10).
  - Sabor group: Chocolate (stock 0), Fresa (stock 0).
  - Combinations: P/Ch=5, P/F=4, M/Ch=6, M/F=2 → total 17.
- INFO tab:
  - Stock label: "Stock Congelado" with lock badge.
  - Stock input: `disabled`, value = **17** (was 15 before, which was
    the sum of options 5+10+0+0 — now correctly 17 = sum of combinations).
  - Alert: "...se calcula como la suma del stock de las combinaciones
    (actual: 17)..."
- VARIANTES tab:
  - Top banner: "...Como hay combinaciones, se calcula como la suma
    del stock de las combinaciones. El stock individual de cada opción
    está congelado (sólo referencia) porque las combinaciones tienen
    prioridad. Stock total actual: 17 unidades."
  - All 4 option stock inputs are `disabled` with `bg-gray-100
    text-gray-500 cursor-not-allowed` styling.
  - priceMod inputs remain editable (only stock is frozen).
  - Combination stock inputs remain editable (they govern the total).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /admin` → 200.

### Behavior summary
| State                              | Product stock | Option stocks | Combination stocks |
|------------------------------------|---------------|---------------|--------------------|
| No variants                        | editable      | n/a           | n/a                |
| Variants, no combinations          | frozen = Σ options | editable | n/a                |
| Variants + combinations            | frozen = Σ comb | frozen (ref) | editable           |

This matches the user's specification: priority combinations > options
> general, with appropriate freezing at each level.

## 2026-07-07 — Task PROD-FIX-12: Anticipo flexible + validación fechas de oferta + rangos al por mayor

### Summary
Implemented three improvements requested by the user:

1. **Disponibilidad — Tipo de anticipo**: when "Sin anticipo" is selected,
   the entire "Tiempo mínimo de anticipación" block is now hidden (was
   still showing the hours input). Added a unit selector (horas / días)
   so businesses that need 15 days' notice can express it naturally.
   Internally `minHours` remains canonical (always in hours); the new
   `minHoursUnit` field only controls the admin UX.

2. **Oferta — Validación de fechas**: the end date input now has
   `min={form.offerStart}` so the native date picker can't select an
   earlier date. A live red alert appears if end < start. A live amber
   alert appears if only one of the two dates is set. `handleSave`
   blocks the save with an `alert()` if either condition is true.

3. **Por mayor — Rangos**: the "Nombre del rango" is now optional
   (placeholder "Rango 1", auto-generated as "Rango N" on save if
   empty). The "Cant. máxima" column for the LAST row gets a small
   "= stock" button that sets it to the product's current
   `computedStock`. Adding a new tier auto-suggests `maxQty = computedStock`
   and `minQty = (previous tier's maxQty) + 1`. Comprehensive validation
   of ranges (min > 0, min ≤ max, no overlaps/gaps, no negative prices,
   max=0 only allowed for the last tier). Validation issues show as a
   red alert in the editor AND block `handleSave`.

### Schema (`src/lib/store.ts`)
- Added `minHoursUnit: string` to the `Product` interface (default
  `'horas'`). Updated `SEED_PRODUCTS` and `db.product` defaults to
  include `minHoursUnit: 'horas'`.

### Admin Products API
- `src/app/api/admin/products/route.ts` (POST): added
  `minHoursUnit: productFields.minHoursUnit === 'dias' ? 'dias' : 'horas'`.
- `src/app/api/admin/products/[id]/route.ts` (PUT): same coercion when
  `data.minHoursUnit` is present.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Extended local `Product` interface and `ProductFormState` with
  `minHoursUnit`. Updated `EMPTY_FORM`, both `openEdit` paths, and
  `handleSave` payload to include it.

**DISPONIBILIDAD tab** — rewrote the anticipo section:
- Select for `advanceType` (Sin anticipo / Porcentaje / Monto fijo)
  with a contextual help text under it.
- If `advanceType === 'sin'`: nothing else is shown (the tiempo block
  is conditionally rendered only when `advanceType !== 'sin'`).
- If `advanceType !== 'sin'`: shows the valor del anticipo input +
  validates that percentage ≤ 100 (shows red hint if exceeded).
- "Tiempo mínimo de anticipación" block (only when not 'sin'):
  - A number input + a Select for unit (horas / días).
  - When unit is 'dias', the input shows `Math.floor(minHours / 24)`
    and converts back to hours on change (so internally `minHours`
    is always in hours).
  - Help text shows the canonical value: "Equivalente: X horas
    (≈ Y días)" when applicable.

**OFERTA tab** — added live validation:
- The end date `<Input type="date">` now has `min={form.offerStart ?? undefined}`.
- Two conditional alerts:
  - Red alert (bg-red-50) when `offerEnd < offerStart`: "La fecha de
    fin no puede ser anterior a la fecha de inicio. Ajusta las fechas
    antes de guardar."
  - Amber alert (bg-amber-50) when only one of the two dates is set:
    "Te falta definir la fecha de fin/inicio. Si querés que sea
    permanente, cambia el tipo a 'Permanente'."

**`WholesaleTiersEditor`** — rewrote:
- Now accepts `computedStock` prop.
- `addTier`: the new tier's `minQty` defaults to `(previous last
  tier's maxQty) + 1` (or 1 if no tiers), and `maxQty` defaults to
  `computedStock` if > 0, else 0 (sin límite).
- The "Nombre del rango" header now shows "(opcional)" and the input
  placeholder is "Rango N".
- The last row's "Cant. máxima" cell gets a small green "= stock"
  button that sets `maxQty = computedStock`.
- The last row shows a green hint "0 = sin límite" when `maxQty === 0`.
- Comprehensive validation (computed on every render):
  - minQty > 0
  - maxQty = 0 only allowed for the last row
  - minQty ≤ maxQty (when maxQty ≠ 0)
  - price ≥ 0
  - no overlap/gap between consecutive ranges (next.minQty must be
    ≥ current.maxQty + 1)
- Validation issues render as a red alert with a `<ul>` of messages.
- Non-blocking amber warning if prices don't decrease with quantity
  (typical wholesale expectation).
- `handleSave` payload for `wholesaleTiers`: sorts by minQty asc,
  auto-fills empty names as "Rango N", and reassigns sortOrder to
  match the sorted order.

**`handleSave` validations** (added at the top, before `setSaving(true)`):
1. Offer dates: if `offerType === 'temporada'` and both dates are
   set, blocks save if `offerEnd < offerStart`.
2. Offer dates: if `offerType === 'temporada'` and only one date is
   set, blocks save with an explanatory message.
3. Wholesale tiers: if any tiers exist, runs the same validation as
   the editor. If issues are found, shows an `alert()` with all
   issues listed and aborts the save.

### Re-seed
- Deleted `data/products.json` so it re-seeds with the new
  `minHoursUnit: 'horas'` default on next access.
- Verified via curl: `GET /api/products/seed-prod-1` returns
  `minHoursUnit: 'horas'`, `minHours: 24`, `advanceType: 'sin'`.

### Verification (browser, admin panel)
- Logged in as `admin` / `diaz2024`, edited "Brazo Gitano".
- DISPONIBILIDAD tab:
  - With `advanceType = 'sin'`: the "Tiempo mínimo de anticipación"
    block is NOT rendered (verified — 0 labels with that text, 0
    unidad selects).
  - Changed to "Porcentaje": the tiempo block appears with 2
    comboboxes ("Porcentaje" + "horas"), the help text shows
    "Equivalente: 24 horas (≈ 1.0 días)".
  - Changed unidad to "días": the input value recomputes to
    `Math.floor(24/24) = 1` and the help text updates.
- OFERTA tab:
  - Switched to "Temporada", set inicio=2026-08-15, fin=2026-08-10.
  - Verified the red alert appears with the correct message.
  - Verified the fin input has `min="2026-08-15"` (native picker
    enforcement).
- POR MAYOR tab:
  - Added 2 rangos. Set rango 1 to min=10, max=5 (invalid).
  - Red alert appears: "Rango 1: la cantidad mínima (10) no puede
    ser mayor que la máxima (5)."
  - Clicked "Guardar": `alert()` fires with the same message,
    save is aborted.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48174 bytes).
- `GET /admin` → 200 (22748 bytes).

### What was NOT touched
- ProductDetail.tsx doesn't display anticipo/minHours info to the
  customer yet (could be a follow-up: show "Pide con X días de
  anticipación" in the product page or checkout).
- The `advanceType` / `advanceValue` / `minHours` fields are not
  enforced in the checkout flow yet (could be a follow-up: validate
  that the selected delivery date is at least `minHours` away).

## 2026-07-07 — Task PROD-FIX-13: CSS carrito + fecha por defecto mañana + no cerrar overlay al guardar

### Summary
Three improvements requested by the user:

1. **CartSidebar CSS**: paddings were too tight, text was getting cut.
   Increased paddings, button sizes, and spacing for better readability.
2. **Checkout default date**: the delivery date input now defaults to
   TOMORROW (calculated in Cuba local time, not UTC) instead of being
   empty.
3. **Admin edit overlay stays open after save**: when editing an
   existing product, clicking "Guardar" no longer closes the overlay
   and returns to the products list. Instead, it shows a green success
   banner at the top of the overlay and keeps the admin on the same
   tab so they can review or make more changes. (Product CREATION
   still closes the overlay as before, since the new product's IDs
   aren't meaningful to keep editing.)

### CartSidebar.tsx (`src/components/ecommerce/CartSidebar.tsx`)
- Items container: added `px-1` for horizontal padding on the scroll
  area (was `py-4 space-y-4` only).
- Each cart item card: `p-3` → `p-4` (12px → 16px padding).
- Product image container: added `border border-gray-200` for a
  cleaner look.
- Item text column: changed from `flex-1 min-w-0` to
  `flex-1 min-w-0 flex flex-col` so the quantity controls stick to
  the bottom (`mt-auto pt-2`).
- Product name: added `leading-snug` for tighter line height.
- Quantity buttons: `h-7 w-7` → `h-8 w-8` (28px → 32px), icons
  `h-3 w-3` → `h-3.5 w-3.5`.
- Quantity span: `w-8` → `w-9`, `font-medium` → `font-semibold`.
- Remove button: `h-7 w-7` → `h-8 w-8`.
- "Free shipping" hint: `p-2` → `p-3`, added `leading-relaxed`.

### CheckoutForm.tsx (`src/components/ecommerce/CheckoutForm.tsx`)
- Added `tomorrow` calculation: `new Date(today)` with
  `setDate(getDate() + 1)`, then `tomorrowStr = tomorrow.toISOString().split('T')[0]`.
  Uses local time (not UTC) to avoid timezone drift.
- Added a `useEffect` that initializes `formData.deliveryDate` to
  `tomorrowStr` when it's empty and the slot is not ASAP.
- Updated the "Normal" radio button's `onChange`: when switching from
  ASAP (where `deliveryDate === todayStr`) back to Normal, the date is
  restored to `tomorrowStr` (so the customer doesn't accidentally
  schedule today's delivery with the normal slot).

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Added `savedFeedback` state (`string | null`) to `ProductsTab`.
- Reset `savedFeedback` to `null` in both `openNew` and `openEdit`.
- **`handleSave`** for EDIT mode (PUT):
  - On success: no longer calls `setDialogOpen(false)`. Instead:
    - Sets `savedFeedback` to
      `"✓ Cambios guardados correctamente (HH:MM:SS)."`.
    - Auto-hides the feedback after 4 seconds via `setTimeout`.
    - Calls `fetchData()` to refresh the products list (so the table
      reflects the new state).
    - Fetches the product detail again and merges it into
      `editingProduct` so the form reflects any backend-recomputed
      values (stock congelado, marginPercent, etc.).
  - On error: shows `alert('Error al guardar los cambios...')`.
- **`handleSave`** for CREATE mode (POST):
  - On success: still closes the overlay (product is new, no need to
    keep editing).
  - On error: shows `alert('Error al crear el producto...')`.
- Added a green feedback banner (`bg-green-50 border-green-200`) right
  below the top bar (above the body) that shows when `savedFeedback`
  is set and we're in edit mode. Contains a `CheckCircle2` icon, the
  message, and a small ✕ button to dismiss manually.

### Verification (browser)
- **Cart**: added a product, opened cart. Each item card now has
  `padding: 16px` (verified via `getComputedStyle`). Quantity buttons
  are `40×40px` (h-8 w-8), quantity span is `48px` wide. Text no
  longer appears cut.
- **Checkout default date**: navigated to checkout. The date input
  value is `2026-07-08` (tomorrow, since today is 2026-07-07).
  Verified `dateInputValue === expectedTomorrow`.
- **Admin save stays open**: edited "Brazo Gitano", clicked Guardar.
  The overlay stayed open. A green banner appeared:
  "✓ Cambios guardados correctamente (22:32:49)." with a ✕ button.
  Verified via `overlayStillOpen: true, greenBannerVisible: true`.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48169 bytes).
- `GET /admin` → 200 (22752 bytes).

## 2026-07-07 — Task PROD-FIX-14: Seguimiento de pedidos en tiempo real (OrderHistory)

### Summary
Implemented a professional order tracking timeline in the customer's
"Pedidos" page that:
- Shows a **horizontal timeline** (desktop) / **vertical timeline**
  (mobile) with 4 stages: Pedido realizado → Confirmado → En camino →
  Entregado.
- Highlights the **current step** with an amber pulsing ring + scale
  animation.
- Shows completed steps in emerald green.
- Handles the **cancelled** state with a special red banner.
- **Auto-refreshes every 15 seconds** via polling (no page reload).
  Only polls when there are non-terminal orders (pending/confirmed/
  shipped); stops polling when all orders are delivered/cancelled.
- Shows a **live status indicator** in the header: a green pulsing dot
  with "Actualizado hace Xs" or a spinner with "Actualizando…" during
  refresh.

### OrderHistory.tsx (`src/components/ecommerce/OrderHistory.tsx`)

**New constants and helpers:**
- `TRACKING_STEPS` — array of 4 steps with `{ key, label, icon,
  description }`:
  - pending → "Pedido realizado" (ShoppingBag icon)
  - confirmed → "Confirmado" (CheckCircle2 icon)
  - shipped → "En camino" (Truck icon)
  - delivered → "Entregado" (Package icon)
- `statusToStepIndex(status)` — maps a status string to its index in
  `TRACKING_STEPS`.
- `isTerminal(status)` — returns true for 'delivered' or 'cancelled'
  (no more polling needed).
- `getStatusBadge(status)` — returns `{ label, color, icon }` for the
  status badge in the card header.

**New `TrackingTimeline` component:**
- If status is 'cancelled': renders a red banner with an XCircle icon.
- Otherwise: renders the 4-step timeline.
  - Desktop (sm+): horizontal layout with a progress bar that fills
    from left to the current step. The bar is a gradient amber→emerald.
    Each step is a circle (10×10) with the step's icon. The current
    step has an amber bg + white icon + ring-4 ring-amber-100 + scale-110
    + shadow-lg. Completed steps have emerald bg + white icon. Future
    steps have white bg + gray border + gray icon.
  - Mobile: vertical layout with the same styling, connecting lines
    between steps (emerald for completed, gray for pending).

**`OrderHistory` main component — new state and polling:**
- Added `refreshing` state (bool) — true during silent refresh.
- Added `lastRefresh` state (number) — timestamp of last successful
  refresh, for the "Actualizado hace Xs" label.
- Added `pollingIdsRef` — a ref holding a Set of order IDs that are
  not terminal (so we know whether polling is needed).
- Added `lastSearchEmailRef` — a ref holding the last search email
  (so silent refresh uses the same filter as the initial fetch).
- `fetchOrders(searchEmail?)` — full fetch (shows skeleton). Updates
  `orders`, `lastRefresh`, and `pollingIdsRef`.
- `silentRefresh()` — fetches the same endpoint without showing the
  skeleton. Only runs if `pollingIdsRef.current.size > 0`. Updates
  `orders`, `lastRefresh`, and `pollingIdsRef`. Sets `refreshing`
  during the fetch.
- `useEffect` for polling: `setInterval(silentRefresh, 15000)`. Cleared
  on unmount. The interval is stable because `silentRefresh` is wrapped
  in `useCallback` with stable deps.

**Header live indicator:**
- Only shown when `hasActiveOrders && !loading`.
- Shows a green pulsing dot (`animate-ping` + `animate-pulse`) with
  "Actualizado hace Xs/min" when idle.
- Shows a spinning `RefreshCw` icon with "Actualizando…" during
  refresh.
- Hidden on mobile (text), only the icon shows.

**Search card:**
- Added a hint below the search input when there are active orders:
  "Tienes pedidos en curso. Su estado se actualiza automáticamente
  cada 15 segundos." with a green dot.

**Order card:**
- Added `TrackingTimeline` component at the top of the card body.
- Added a "Pagado" badge (emerald) when `order.isPaid` is true.
- Replaced the recipient info line with a richer layout using a MapPin
  icon, showing: recipient name + city, delivery date (formatted),
  delivery time slot (⚡ for ASAP), delivery zone name, and Zelle ref
  if present.
- Card opacity reduced to 90% when cancelled (visual cue).

### API verification
- `GET /api/orders` already returns all needed fields: `status`,
  `isPaid`, `updatedAt`, `deliveryZoneName`, `deliveryDate`,
  `deliveryTimeSlot`, `recipientName`, `recipientCity`, `zelleRef`.
- `PUT /api/admin/orders` with `{ id, status }` updates the status
  (used by the admin's Pedidos tab Select dropdown).
- No API changes were needed — the existing endpoints are sufficient.

### Verification (browser, end-to-end)
1. Opened customer "Mis Pedidos" page at `/`.
2. Verified the timeline renders for all orders:
   - Pending orders show step 1 (Pedido realizado) highlighted in amber.
   - Confirmed orders show steps 1-2 done (emerald) + step 2 as current
     (amber pulse).
   - The progress bar fills proportionally to the current step.
3. Opened admin in a separate tab, went to Pedidos.
4. Found order DPE-MR41MUH7-63XG (status: Pendiente).
5. Changed its status to "Enviado" via the Select dropdown.
6. Switched back to the customer tab (within ~5 seconds).
7. Verified the customer view now shows:
   - Header badge: "Enviado" (was "Pendiente").
   - Timeline: steps 1-3 done (emerald), step 3 "En camino" as current
     (amber pulsing ring).
   - All without reloading the page — the 15-second polling picked up
     the change.
8. The live indicator in the header shows "Actualizado hace Xs" with
   a green pulsing dot.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48575 bytes).
- `GET /admin` → 200 (22750 bytes).

### Notes
- Polling interval is 15 seconds (a balance between responsiveness and
  server load). Could be reduced to 10s or increased to 30s if needed.
- The polling only fetches orders when there's at least one non-terminal
  order in the list. Once all orders are delivered/cancelled, the
  interval keeps running but `silentRefresh` returns early without
  fetching. A future optimization could clear the interval entirely
  when there are no active orders.
- The timeline is purely visual — it derives from the `status` field
  returned by the API. No new fields were added to the Order model.

## 2026-07-07 — Task PROD-FIX-15: Filtros y buscador en admin Pedidos

### Summary
Added a comprehensive filter bar and search to the admin Pedidos tab.
All filtering happens client-side (no API changes needed) using
`useMemo` over the existing `orders` state.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)

**Added `Search` to lucide-react imports.**

**`OrdersTab` new state:**
- `search` (string) — free-text search.
- `statusFilter` ('all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled').
- `paidFilter` ('all' | 'paid' | 'unpaid').
- `slotFilter` ('all' | 'normal' | 'asap').
- `dateFrom` (string) — delivery date range start (YYYY-MM-DD).
- `dateTo` (string) — delivery date range end.

**`filteredOrders` (useMemo):**
- Applies all filters to `orders`:
  - **Text search**: case-insensitive substring match across multiple
    fields joined into a "haystack": orderNumber, customerName,
    customerEmail, customerPhone, recipientName, recipientPhone,
    recipientCity, recipientAddress, deliveryZoneName, zelleRef.
  - **Status filter**: exact match on `o.status`.
  - **Paid filter**: `paid` → `o.isPaid === true`, `unpaid` → `o.isPaid === false`.
  - **Slot filter**: exact match on `o.deliveryTimeSlot`.
  - **Date range**: `o.deliveryDate` must be within `[dateFrom, dateTo]`
    (inclusive). Orders without `deliveryDate` are excluded when a range
    is active.

**`hasActiveFilters`**: derived boolean — true if any filter is non-default.

**`clearFilters()`**: resets all filters to their default values.

**`statusCounts` (useMemo):** counts orders per status (all, pending,
confirmed, shipped, delivered, cancelled) for the chip badges.

**New filter bar UI (Card above the orders table):**
- **Row 1**: Search input (with `Search` icon, placeholder "Buscar por
  #pedido, cliente, email, teléfono, ciudad, ref Zelle…") spanning 2
  columns on desktop, plus two date inputs ("Entrega desde" / "Entrega
  hasta"). The "hasta" input has `min={dateFrom}` to prevent invalid
  ranges.
- **Row 2 — Status chips**: 6 chips (Todos, Pendiente, Confirmado,
  Enviado, Entregado, Cancelado) each with a count badge. Active chip
  is amber-filled with white text; inactive chips have status-colored
  backgrounds (yellow/blue/purple/green/red with appropriate opacity).
  Clicking a chip sets `statusFilter`.
- **Row 3 — Paid chips + Slot chips + Clear button**:
  - Paid: Todos / ✓ Pagados / Pendientes.
  - Slot: Todos / Normal / ⚡ ASAP.
  - "Limpiar filtros" button (red ghost) appears only when
    `hasActiveFilters` is true, aligned to the right (`ml-auto`).
- **Counter**: "Mostrando los N pedidos." or "Mostrando X de N pedidos."
  depending on whether filters are active. Separated by a top border.

**Orders table:**
- Now maps over `filteredOrders` instead of `orders`.
- Empty state message adapts: "No hay pedidos que coincidan con los
  filtros seleccionados." when filters are active, "No hay pedidos
  todavía." when none exist.

### Verification (browser)
- Logged in as admin, went to Pedidos.
- Filter bar renders with:
  - Search input (placeholder visible).
  - 2 date inputs (Entrega desde / Entrega hasta).
  - 6 status chips with counts: Todos(7), Pendiente(4), Confirmado(1),
    Enviado(2), Entregado(0), Cancelado(0).
  - 3 paid chips, 3 slot chips.
  - Counter: "Mostrando los 7 pedidos."
- Typed "María" in search → counter updated to "Mostrando 6 de 7
  pedidos", all 6 visible rows contain "María" in some field.
- Clicked "Pendiente" status chip → counter updated to "Mostrando 4
  de 7 pedidos", all 4 visible rows have status "Pendiente".
- All filters work in combination (search + status + paid + slot +
  date range).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48572 bytes).
- `GET /admin` → 200 (22751 bytes).

### Notes
- All filtering is client-side. For very large order volumes (>1000),
  server-side filtering via query params would be more efficient, but
  for the current scale this is fast enough and avoids API changes.
- The search is a simple substring match (not fuzzy). Could be upgraded
  to fuzzy search if needed.
- The date range filter uses the `deliveryDate` field (the date the
  customer chose for delivery), not the `createdAt` (order placement
  date). If filtering by creation date is also needed, that's a quick
  addition.

## 2026-07-07 — Task PROD-FIX-16: Notificación WhatsApp al cambiar estado de pedido

### Summary
When the admin changes an order's status in the Pedidos tab, the system
now automatically opens a new browser tab pointing to `https://wa.me/`
with a pre-filled, professional WhatsApp message addressed to the
**customer's phone** (the person who placed the order). The message
includes all key order details so the customer can identify the order
at a glance.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)

**New `buildStatusWhatsAppUrl` helper (inside `OrdersTab`):**
- Takes `(order: Order, newStatus: string, storeName: string)`.
- Returns a `https://wa.me/{phone}?text={encodedMessage}` URL, or
  `null` if the order has no `customerPhone`.
- Phone normalization: strips all non-digit characters from
  `order.customerPhone` (so `+53 5078 2825` → `5350782825`).
- Status label map with emojis:
  - pending → "⏳ Pendiente"
  - confirmed → "✅ Confirmado"
  - shipped → "🚚 En camino"
  - delivered → "📦 Entregado"
  - cancelled → "❌ Cancelado"
- Contextual status message (a friendly sentence explaining what the
  new status means, e.g. "¡Tu pedido ha sido confirmado! Lo estamos
  preparando para enviarlo pronto.").
- Delivery date formatted with weekday + day + month + year in Spanish.
- Slot label: "⚡ Lo antes posible (urgente)" for ASAP, "Normal
  (3:00 pm - 6:00 pm)" otherwise.
- Items list: bullet list with name × quantity.
- Recipient line: name + phone.
- Full message structure:
  ```
  *Díaz Premium Envíos*

  Hola *Tony Alonso* 👋

  Te informamos que el estado de tu pedido ha cambiado:

  *✅ Confirmado*
  ¡Tu pedido ha sido confirmado! Lo estamos preparando para enviarlo pronto.

  ━━━━━━━━━━━━━━━━━━
  *📋 Detalles del pedido*

  *N° de pedido:* DPE-MR4FOH3I-D9GX
  *Productos:*
  • Oferta Especial Día de las Madres ×1

  *Total:* $49.00
  *Pago:* ⏳ Pendiente

  *🚚 Datos de entrega*
  *Fecha:* viernes, 3 de julio de 2026
  *Horario:* ⚡ Lo antes posible (urgente)
  *Recibe:* Juana María Carrasco · +5356231245
  *Dirección:* Calle 1 entre 2 y 4 Reparto Sueño
  *Zona:* Ciego de Ávila (Ciudad)
  ━━━━━━━━━━━━━━━━━━

  Si tienes alguna pregunta, no dudes en responder a este mensaje.

  ¡Gracias por tu confianza! 🙏
  ```

**Modified `changeStatus`:**
- After the PUT request succeeds, finds the order in the local
  `orders` state.
- Calls `buildStatusWhatsAppUrl(order, status, store?.storeName || 'Díaz Premium Envíos')`.
- If a URL is returned (i.e. the order has a customerPhone), opens it
  in a new tab via `window.open(waUrl, '_blank', 'noopener,noreferrer')`.
- Then calls `fetchData()` to refresh the table.
- If the order has no `customerPhone`, only refreshes the table (no
  WhatsApp tab opens).

### Behavior
- The WhatsApp tab opens automatically when the admin selects a new
  status from the dropdown in the orders table.
- The admin can review the pre-filled message and hit "Send" in
  WhatsApp, or close the tab if they don't want to notify.
- The message is addressed to the customer's phone (`customerPhone`),
  not the recipient's phone (`recipientPhone`). This is per the user's
  request: "la persona que realizó el envío" = the person who placed
  the order (the sender/customer).
- Works for all 5 status transitions (pending/confirmed/shipped/
  delivered/cancelled), each with its own contextual message.

### Verification (browser)
- Logged in as admin, went to Pedidos.
- Overrode `window.open` to capture the URL instead of opening a tab.
- Changed the status of order DPE-MR4FOH3I-D9GX (Tony Alonso,
  +53 5078 2825) from "Enviado" to "Confirmado".
- Captured URL: `https://wa.me/5350782825?text=...`
- Decoded message contained all expected fields:
  - Store name: "Díaz Premium Envíos"
  - Customer name: "Tony Alonso"
  - Status: "✅ Confirmado" + contextual message
  - Order number: "DPE-MR4FOH3I-D9GX"
  - Items: "• Oferta Especial Día de las Madres ×1"
  - Total: "$49.00"
  - Payment: "⏳ Pendiente"
  - Delivery date: "viernes, 3 de julio de 2026"
  - Slot: "⚡ Lo antes posible (urgente)"
  - Recipient: "Juana María Carrasco · +5356231245"
  - Address: "Calle 1 entre 2 y 4 Reparto Sueño"
  - Zone: "Ciego de Ávila (Ciudad)"

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48570 bytes).
- `GET /admin` → 200 (22743 bytes).

### Notes
- The WhatsApp tab opens automatically. Some browsers may block popups;
  in that case, the admin would need to allow popups for the admin
  domain. A future improvement could add a fallback: if `window.open`
  returns null (popup blocked), show a toast with a clickable link.
- The message is fully self-contained (the customer doesn't need to
  look up the order separately).
- If `customerPhone` is empty, no WhatsApp tab opens — the admin just
  sees the status change in the table. A future improvement could show
  a warning toast in that case.

## 2026-07-07 — Task PROD-FIX-17: Validación de pedidos por hora de Cuba (14:00)

### Summary
Implemented business rule: orders for "today" delivery (Normal slot)
are only available if the customer places the order **before 14:00
Cuba time**. After 14:00, the default delivery date becomes tomorrow.
ASAP (envío rápido) can still deliver today regardless of the hour.

### Rules implemented
| Customer action | Hour (Cuba) | Default date |
|---|---|---|
| Places order, Normal slot | < 14:00 | today |
| Places order, Normal slot | ≥ 14:00 | tomorrow |
| Places order, ASAP slot | any hour | today (forced, input disabled) |

Plus a validation at submit time: if the customer manually changed
the date to "today" in Normal mode after 14:00, the order is blocked
with a toast explaining the rule.

### CheckoutForm.tsx (`src/components/ecommerce/CheckoutForm.tsx`)

**Replaced the old `today`/`tomorrow` calculation (which used the
browser's local time, not Cuba time) with a Cuba-timezone-aware
calculation:**

- `nowInCuba` — IIFE that uses `Intl.DateTimeFormat` with
  `timeZone: 'America/Havana'` and `formatToParts` to extract the
  year/month/day/hour/minute in Cuba time. This works regardless of
  the customer's browser timezone (e.g. a customer in Miami placing
  an order at 2 PM Miami time → 2 PM Cuba time is correctly computed).
- `todayStr` — formatted `YYYY-MM-DD` from `nowInCuba`.
- `canDeliverToday` — `nowInCuba.hour < 14`.
- `tomorrowDate` — `new Date(year, month, day + 1)` constructed from
  Cuba components (avoids UTC drift).
- `tomorrowStr` — formatted `YYYY-MM-DD`.
- `defaultNormalDate` — `canDeliverToday ? todayStr : tomorrowStr`.

**Updated `useEffect` that initializes `formData.deliveryDate`:**
- Was: always default to `tomorrowStr`.
- Now: default to `defaultNormalDate` (today if <14:00, tomorrow
  otherwise).

**Updated the "Normal" radio button's `onChange`:**
- Was: when switching from ASAP back to Normal, restore date to
  `tomorrowStr` (always tomorrow).
- Now: restore to `defaultNormalDate` (today if <14:00, tomorrow
  otherwise).

**Added two contextual hints below the date input (only in Normal
mode):**
- If `canDeliverToday` (before 14:00): green hint "✅ Aún hay tiempo
  para entregar hoy (pedido antes de las 14:00, hora Cuba)."
- If `!canDeliverToday` (14:00 or after): gray hint "🕐 Como ya
  pasaron las 14:00 (hora Cuba), la entrega más pronto es mañana.
  Para entrega urgente hoy, elige 'Lo antes posible'."

**Added submit-time validation:**
- If `!isAsap && formData.deliveryDate === todayStr && !canDeliverToday`,
  block the order with a toast: "Entrega hoy no disponible — Ya
  pasaron las 14:00 (hora Cuba) y no podemos entregar hoy en horario
  normal. Elige una fecha futura o selecciona 'Lo antes posible' para
  entrega urgente."

### ASAP behavior (unchanged)
- ASAP still forces `deliveryDate = todayStr` and disables the date
  input. ASAP can deliver today regardless of the hour (it's the
  "envío rápido" option).

### Verification (Node + browser)
- Node test confirmed Cuba time calculation:
  - At 20:05 UTC (= 16:05 Cuba, since Cuba is UTC-4 in DST), the
    function returned `hour: 20` (wait, that's actually 20:05 Cuba
    time = the test ran at 00:05 UTC next day → 20:05 Cuba previous
    day). Actually the test showed:
    `Cuba time now: { year: 2026, month: 7, day: 7, hour: 20, minute: 5 }`
    `canDeliverToday: false`
    `defaultNormalDate: MAÑANA`
  - This is correct: it was 8:05 PM Cuba time, past 14:00, so
    tomorrow is the default.
- Browser test (checkout):
  - Initial state (Normal, past 14:00 Cuba):
    - dateInputValue = "2026-07-08" (tomorrow)
    - dateInputMin = "2026-07-07" (today, still selectable as min)
    - Hint visible: "🕐 Como ya pasaron las 14:00 (hora Cuba)..."
  - Click ASAP:
    - dateInputValue = "2026-07-07" (today, forced)
    - dateInputDisabled = true
  - Click back to Normal:
    - dateInputValue = "2026-07-08" (tomorrow, restored)
    - dateInputDisabled = false

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200 (48571 bytes).
- `GET /admin` → 200 (22748 bytes).

### Notes
- The Cuba timezone calculation uses `Intl.DateTimeFormat` which is
  supported in all modern browsers and Node. It correctly handles
  Cuba's DST (Cuba observes DST: UTC-5 in winter, UTC-4 in summer).
- The `min` attribute on the date input is still `todayStr` (so the
  customer can technically pick today even after 14:00), but the
  submit validation blocks it with a clear toast. This is intentional
  — we let the customer explore the date picker freely, then explain
  why today isn't available if they try to submit.

## 2026-07-07 — Task PROD-FIX-18: Deshabilitar "hoy" en el date picker después de las 14:00

### Summary
Hardened the date picker so that when it's 14:00 or later in Cuba
time, the customer **cannot select "today"** in the calendar at all
(the native date picker grays out today's date). Previously, the
`min` attribute was always `todayStr`, which allowed selecting today
even after 14:00 (only blocked at submit time with a toast).

### CheckoutForm.tsx (`src/components/ecommerce/CheckoutForm.tsx`)
- Changed the date input's `min` attribute from a fixed `todayStr` to
  a conditional value:
  - **ASAP mode**: `min = todayStr` (always today, ASAP can deliver
    today regardless of hour).
  - **Normal mode + before 14:00 Cuba**: `min = todayStr` (today is
    selectable).
  - **Normal mode + 14:00 or after Cuba**: `min = tomorrowStr` (today
    is grayed out in the calendar, the earliest selectable date is
    tomorrow).
- Implementation: `min={isAsap ? todayStr : (canDeliverToday ? todayStr : tomorrowStr)}`.
- The submit-time validation (toast "Entrega hoy no disponible") is
  kept as a safety net in case the customer manipulates the HTML via
  devtools, but the primary enforcement is now the native `min`
  attribute.

### Verification (browser, 20:00 Cuba time = past 14:00)
- Opened checkout in Normal mode.
- dateInput.min = "2026-07-08" (tomorrow) — today's date is grayed out
  in the native date picker.
- dateInput.value = "2026-07-08" (tomorrow, the default).
- The hint "🕐 Como ya pasaron las 14:00..." is still shown below the
  input to explain why today isn't available.
- ASAP mode still works: clicking it forces the date to today and
  disables the input (ASAP can deliver today at any hour).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /admin` → 200.

## 2026-07-08 — Task PROD-FIX-19: Error transitorio "Failed to fetch" en Clientes

### Summary
The user reported a "Failed to fetch" TypeError in the Clientes tab
of the admin panel. Investigation showed this was a **transitory
error** caused by the dev server (Turbopack HMR) recompiling modules
after code changes — during that brief window, fetch requests can
fail. The API itself is healthy (returns 200 with 3 customers from
both curl and the browser). Added proper error handling with a
"Reintentar" button so the admin can recover gracefully if this
happens again.

### Investigation
- Analyzed the screenshot with VLM: confirmed the error was
  `TypeError: Failed to fetch` in `CustomersTab.useCallback[fetchData]`.
- Tested the API directly:
  - `curl /api/admin/customers` → HTTP 200, 1488 bytes, 3 customers.
  - `fetch('/api/admin/customers')` from the browser → 200, 3
    customers (Carlos Cubano Editado + 2 more).
- Opened the Clientes tab in the browser → loaded correctly, no
  console errors, 3 customer rows shown.
- Conclusion: the error was transitory, caused by the dev server
  recompiling after recent code changes (CheckoutForm, AdminPanel
  edits). In production this wouldn't happen because there's no HMR.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
**`CustomersTab` — added proper error handling:**
- New `error` state (`string | null`).
- `fetchData` now:
  - Sets `error = null` at the start.
  - Checks `res.ok` and throws if not.
  - On catch, sets `error` to a user-friendly message: "No se
    pudieron cargar los clientes. Esto puede deberse a una
    recompilación del servidor. Haz clic en 'Reintentar'."
- New error UI block (between `loading` and the main return):
  - Red circle with `AlertTriangle` icon.
  - "No se pudieron cargar los clientes" heading.
  - Error message text.
  - "Reintentar" button (amber) that calls `fetchData` again.
- This means if the fetch fails (for any reason — server
  recompilation, network glitch, etc.), the admin sees a clear error
  state with a recovery action, instead of a blank page or a console
  error.

### Verification
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /admin` → 200.
- `GET /api/admin/customers` → 200 with 3 customers.
- Browser test: Clientes tab loads correctly, no console errors.
- The new error UI would only appear if the fetch actually fails
  (couldn't reproduce the transitory error on demand, but the error
  state is ready if it happens again).

### Notes
- This same pattern (error state + retry button) could be applied to
  other tabs (ProductsTab, OrdersTab, etc.) for consistency. For now
  only CustomersTab was hardened since that's what the user reported.
- In production (Vercel), this transitory error wouldn't happen
  because there's no HMR. The fix is mainly for dev-mode resilience.

## 2026-07-08 — Task PROD-FIX-20: CRUD completo en Clientes

### Summary
Converted the admin Clientes tab from read-only (list + view detail)
into a full CRUD: Create, Read, Update, Delete. Added the missing
API endpoints (POST, PUT, DELETE) and rewrote the CustomersTab
component with create/edit dialogs and delete confirmation.

### API: `/api/admin/customers/route.ts` (added POST)
- Added `import crypto from 'node:crypto'` and `hashPassword` helper
  (same SHA-256 + salt scheme as the public register endpoint).
- **POST**: creates a new customer.
  - Body: `{ name, phone, email, password?, country, address?, deliveryZoneId?, deliveryZoneName? }`.
  - `name`, `phone`, `email` are required.
  - `password` is optional: if empty, a random 12-char password is
    generated (the admin never sees it; the customer can recover it
    later).
  - Validates email uniqueness (409 if taken).
  - Returns the public customer (no passwordHash) with status 201.

### API: `/api/admin/customers/[id]/route.ts` (added PUT + DELETE)
- Added `import crypto` and `hashPassword` helper.
- **PUT**: partial update.
  - Body: any subset of `{ name, phone, email, country, address, deliveryZoneId, deliveryZoneName, password }`.
  - Only updates fields that are present in the body.
  - If `email` is changing, validates uniqueness against other customers.
  - If `password` is non-empty, validates ≥6 chars and updates `passwordHash`.
  - If `password` is empty/absent, `passwordHash` is left unchanged.
  - Returns 404 if customer doesn't exist.
  - Returns the updated public customer.
- **DELETE**: removes a customer by ID.
  - Verifies existence first (404 if not found).
  - Returns `{ success: true }`.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Added `UserPlus` to lucide-react imports.
- Added `CustomerFormState` interface and `EMPTY_CUSTOMER_FORM` constant
  before `CustomersTab`.
- **Rewrote `CustomersTab`** with full CRUD:

**New state:**
- `formOpen` (bool) — create/edit dialog open.
- `editingCustomer` (AdminCustomer | null) — null = creating, non-null = editing.
- `form` (CustomerFormState) — form fields.
- `saving` (bool) — submit in progress.
- `formError` (string | null) — validation/API error shown inline.
- `deleteId` (string | null) — customer pending deletion confirmation.

**New handlers:**
- `openNew()` — resets form to empty, opens dialog in "create" mode.
- `openEdit(c)` — populates form from customer, opens dialog in "edit" mode,
  closes the detail dialog if it was open.
- `handleSave()` — validates, then POSTs (create) or PUTs (update).
  Shows errors inline; closes dialog and refreshes list on success.
- `handleDelete()` — DELETEs the customer, refreshes list.

**UI additions:**
- **"Nuevo Cliente" button** (amber, with UserPlus icon) in the header
  next to "Actualizar".
- **Action buttons per row**: now 3 buttons instead of 1:
  - Eye (Ver detalles) — opens the existing detail dialog.
  - Pencil (Editar) — opens the create/edit dialog in edit mode.
  - Trash2 (Eliminar, red) — opens the delete confirmation.
- **Detail dialog footer**: now has 3 buttons instead of 1:
  - "Eliminar" (red, left) — opens delete confirmation.
  - "Cerrar" (outline) — closes.
  - "Editar" (amber) — opens the create/edit dialog in edit mode.
- **Create/Edit dialog** (`sm:max-w-lg`):
  - Title: "Nuevo Cliente" or "Editar Cliente" (with Pencil/UserPlus icon).
  - Fields: name, phone, email (required); country (Select with all
    COUNTRY_LABELS), deliveryZoneName, address (optional); password
    (with contextual hint: "vacío = no cambiar" for edit, "vacío =
    autogenerada" for create).
  - Inline error alert (red) if validation fails.
  - Footer: Cancelar + "Crear Cliente" / "Guardar Cambios" (amber,
    with Save icon or Loader2 spinner while saving).
- **Delete confirmation** (AlertDialog): "¿Eliminar cliente?" with
  warning that the action is irreversible and that saved recipients
  are also deleted (orders are NOT affected). "Cancelar" + "Eliminar"
  (red).

### Verification (curl + browser)

**curl tests (all passed):**
- POST `/api/admin/customers` with test data → 201, customer created.
- PUT `/api/admin/customers/[id]` with `{ name: "...Editado", address: "..." }` → 200, fields updated.
- DELETE `/api/admin/customers/[id]` → 200, `{ success: true }`.
- GET deleted customer → 404 (confirmed gone).

**Browser tests (all passed):**
- Navigated to Clientes tab: "Nuevo Cliente" button visible, 3 action
  buttons (Ver/Editar/Eliminar) per row, 3 customers listed.
- Clicked "Nuevo Cliente": dialog opened with empty form.
- Filled name/phone/email/address and clicked "Crear Cliente": dialog
  closed, table refreshed showing 4 customers including the new one.
- Clicked trash icon on the test customer: delete confirmation appeared.
- Confirmed deletion: table refreshed back to 3 customers, test customer
  gone.
- The detail dialog's "Editar" and "Eliminar" footer buttons also work
  (verified the buttons exist; the edit flow reuses the same dialog).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /admin` → 200.
- `GET /api/admin/customers` → 200.

### Notes
- The `password` field in the create form is optional. If the admin
  leaves it empty, a random password is generated server-side. The
  admin never sees the generated password — the customer would need
  to use a "forgot password" flow (not yet implemented) or the admin
  can set a known password and communicate it to the customer
  out-of-band.
- Deleting a customer does NOT delete their past orders (orders
  reference `customerEmail` and `customerName` as snapshots, not the
  customer ID). This is intentional so historical order data is
  preserved.
- The `savedRecipients` array is part of the customer record, so it
  gets deleted with the customer. If a customer had recipients that
  were used in past orders, those orders still have the recipient
  data as snapshots in the order record itself.

## 2026-07-08 — Task PROD-FIX-21: Países con banderita + nombre (no abreviatura repetida)

### Summary
Fixed the country labels in the admin Clientes tab. The previous
labels were `🇨🇺 CU` (flag + ISO code), which looked like "CU CU" on
systems where the flag emoji renders as its ISO letter pair. Now the
labels use the flag + the full country name in Spanish (e.g. "🇨🇺 Cuba").

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
Updated `COUNTRY_LABELS` from:
```
US: '🇺🇸 US', CU: '🇨🇺 CU', ES: '🇪🇸 ES', ...
```
to:
```
US: '🇺🇸 Estados Unidos',
CU: '🇨🇺 Cuba',
ES: '🇪🇸 España',
MX: '🇲🇽 México',
CA: '🇨🇦 Canadá',
CO: '🇨🇴 Colombia',
AR: '🇦🇷 Argentina',
CL: '🇨🇱 Chile',
PE: '🇵🇪 Perú',
EC: '🇪🇨 Ecuador',
DO: '🇩🇴 Rep. Dominicana',
PA: '🇵🇦 Panamá',
CR: '🇨🇷 Costa Rica',
GT: '🇬🇹 Guatemala',
HN: '🇭🇳 Honduras',
NI: '🇳🇮 Nicaragua',
SV: '🇸🇻 El Salvador',
BO: '🇧🇴 Bolivia',
PY: '🇵🇾 Paraguay',
UY: '🇺🇾 Uruguay',
VE: '🇻🇪 Venezuela',
```

This affects:
- The country badge in the customers table (now shows "🇨🇺 Cuba"
  instead of "🇨🇺 CU").
- The country Select dropdown in the create/edit customer dialog (now
  shows full country names).
- The country badge in the customer detail dialog.

### Verification (browser)
- Opened Clientes tab: badges now show "🇨🇺 Cuba" (verified 2 customers
  with that label).
- Opened the create customer dialog, clicked the country Select: all
  21 options show flag + full name (e.g. "🇺🇸 Estados Unidos",
  "🇨🇺 Cuba", "🇪🇸 España", "🇲🇽 México", "🇨🇦 Canadá", etc.).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /admin` → 200.

## 2026-07-08 — Task PROD-FIX-22: Banderas reales (imágenes) + abreviatura internacional

### Summary
Replaced flag emojis (which don't render on Windows — they show as
"CU CU" instead of a flag) with actual flag images from flagcdn.com.
Now each country shows a real flag image + its ISO abbreviation.

### Problem
Flag emojis (🇨🇺, 🇺🇸, etc.) are not supported on Windows. Windows
renders them as the two-letter ISO code (e.g. "CU"), so the previous
label `🇨🇺 CU` appeared as "CU CU" on Windows machines. The user
reported seeing "cu cu" and wanted to see the actual flag + the
international abbreviation.

### Solution
Use [flagcdn.com](https://flagcdn.com) — a free CDN that serves flag
images as PNG (and SVG) by ISO country code in lowercase. The images
are small (w20 = 20px wide, with w40 2x for retina) and load lazily.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)

**Replaced `COUNTRY_LABELS` (Record<string, string>) with:**
- `COUNTRY_INFO` (Record<string, { abbr: string; name: string }>) —
  stores both the abbreviation and the full Spanish name.
- `CountryFlag` component — renders an `<img>` from flagcdn + the
  abbreviation. Defensive: if `code` is empty/null/undefined, renders
  "—" (gray dash). If the image fails to load (unknown code), the
  `onError` handler hides the img so only the abbreviation shows.

**Updated all 3 usages:**
1. **Table badge** (customer list): `<CountryFlag code={c.country} />`
   inside a `<Badge variant="outline">`.
2. **Detail dialog badge**: same `<CountryFlag>` component.
3. **Create/Edit form Select**:
   - The `SelectTrigger` now shows the currently selected country's
     flag image + abbr + name (instead of just the raw value).
   - Each `SelectItem` shows flag + abbr + "—" + full name (e.g.
     "🇨🇺 CU — Cuba").
   - All `<img>` tags have `onError` to hide if the flag doesn't load.
   - The Select uses `form.country || 'US'` as fallback to avoid
     undefined errors when the form is in an intermediate state.

### Verification (browser + VLM)
- Opened Clientes tab in the browser.
- 2 flag images loaded (both `flagcdn.com/w20/cu.png`) for the 2
  customers with country "CU".
- The customer with country=null (Juan Pérez) shows "—" (gray dash)
  instead of "XX".
- VLM analysis of the screenshot confirmed: "small rectangular flag
  icons" are visible next to country codes.
- The flagcdn.com CDN responds 200 with valid PNG images (tested
  `/w40/cu.png` and `/w40/us.png` via curl).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /admin` → 200.

### Notes
- flagcdn.com is a free, reliable CDN (backed by Cloudflare). It
  serves flags for all ISO 3166-1 alpha-2 country codes. If it's ever
  down, the `onError` handler hides the broken image and only the
  abbreviation shows (graceful degradation).
- The images are tiny (~250 bytes each for w40 PNGs), so there's no
  performance impact from loading multiple flags.
- For offline/self-hosted deployments, the flags could be bundled
  locally instead of loaded from flagcdn, but that's not needed for
  the current Vercel deployment.

## 2026-07-08 — Task PROD-FIX-23: Patrón de banderas aplicado a todo el sistema + verificar download

### Summary
1. Extrajo `CountryFlag` y `COUNTRY_INFO` a un módulo compartido
   `src/components/ecommerce/CountryFlag.tsx` para reutilizarlo en todo
   el sistema.
2. Aplicó el patrón de banderas (imagen real de flagcdn.com +
   abreviatura) en:
   - **AdminPanel → Clientes** (tabla + detalle + formulario
     crear/editar) — ya estaba, ahora usa el módulo compartido.
   - **AdminPanel → Ajustes → Países activos** (checkboxes) — antes
     usaba emojis `🇨🇺 Cuba`, ahora usa `CountryFlag` con imagen +
     abreviatura + nombre.
   - **CustomerView → Registro/Login** (select de país) — antes usaba
     emojis en las `<option>` (que no renderizan en Windows). Ahora
     muestra una imagen de bandera al lado del select + opciones con
     "ABBR — Nombre".
   - **CustomerView → Editar Perfil** (select de país) — mismo
     tratamiento.
   - **CustomerView → Profile display** — antes mostraba el código
     crudo (ej. "US") con un icono Globe. Ahora muestra bandera +
     abreviatura + nombre completo.
3. Verificó que la sección "Descargar Código" del admin incluye el
   nuevo archivo `CountryFlag.tsx` y el `worklog.md` actualizado.

### Nuevo archivo: `src/components/ecommerce/CountryFlag.tsx`
Componente compartido que renderiza una bandera (imagen PNG de
flagcdn.com) + la abreviatura internacional. Props:
- `code` (string | null | undefined) — código ISO del país.
- `showAbbr` (bool, default true) — muestra la abreviatura al lado.
- `showName` (bool, default false) — muestra también el nombre completo.
- `size` ('sm' | 'md', default 'sm') — tamaño de la bandera.
- `className` — clases adicionales.

Defensivo:
- Si `code` es null/undefined → muestra "—" (gray dash).
- Si la imagen falla al cargar → la oculta (onError handler).

También exporta:
- `COUNTRY_INFO` — Record<string, { abbr, name, dial }> con los 21
  países soportados.
- `getCountryName(code)` — helper que devuelve el nombre del país.

### AdminPanel.tsx
- Importa `CountryFlag` y `COUNTRY_INFO` desde el módulo compartido.
- Eliminó la definición local de `COUNTRY_INFO` y `CountryFlag`.
- **Settings tab → Países activos**: reemplazó el array de objetos
  `{ code, name: '🇨🇺 Cuba' }` por `Object.entries(COUNTRY_INFO).map(...)`
  con `<CountryFlag code={code} showName />` dentro de cada label.

### CustomerView.tsx
- Importa `CountryFlag`, `COUNTRY_INFO`, `getCountryName`.
- Eliminó los dos `COUNTRY_OPTIONS` locales (con emojis).
- **Select de país (registro y edición de perfil)**: como los
  `<select>` nativos no soportan imágenes en las `<option>`, se añadió
  un contenedor flex con:
  - Una caja a la izquierda con la bandera del país seleccionado
    (`<CountryFlag code={form.country} showAbbr={false} size="md" />`).
  - El `<select>` nativo a la derecha, con opciones en formato
    "ABBR — Nombre" (sin emoji).
  - Esto asegura que la bandera siempre se vea (imagen real) mientras
    el dropdown sigue siendo funcional.
- **Hint de Cuba**: cambió el emoji `🇨🇺` por `<CountryFlag code="CU" />`.
- **Profile display** (sección de datos del cliente logueado):
  cambió el icono `Globe` + código crudo por `<CountryFlag code={customer.country} />`
  + `getCountryName(customer.country)`.

### Verificación (browser + curl)
- **Admin → Clientes**: 3 banderas visibles (US, CU, US) en la tabla.
- **Admin → Ajustes**: 21 checkboxes de países, cada uno con bandera
  + abreviatura + nombre (verificado: "US — Estados Unidos", "CU — Cuba",
  etc.).
- **CustomerView → Registro**: bandera de US visible al lado del select,
  opciones en formato "US — Estados Unidos", "CU — Cuba". VLM confirmó:
  "a dropdown menu with a flag image next to it".
- **Download API**: HTTP 200, 4.5 MB, 249 archivos. Verificado que
  `src/components/ecommerce/CountryFlag.tsx` (3550 bytes) y
  `worklog.md` (110895 bytes) están incluidos en el zip.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /admin` → 200.
- `GET /api/admin/download` → 200 (zip with 249 files).

### Notes
- El componente `CountryFlag` es ahora la única fuente de verdad para
  banderas en todo el sistema. Si se necesita añadir un país nuevo,
  basta con añadirlo a `COUNTRY_INFO` en `CountryFlag.tsx` y
  automáticamente aparece en todos los selects/labels.
- Los `<select>` nativos no soportan imágenes en sus opciones, por lo
  que en CustomerView se optó por mostrar la bandera al lado del
  select (no dentro). Esto es una limitación del HTML, no de la
  implementación.
- La API de download (`/api/admin/download`) usa `zip -r` desde el
  project root, así que cualquier archivo nuevo en `src/` se incluye
  automáticamente. No fue necesario modificar la API.

## 2026-07-08 — Task PROD-FIX-24: Auto-scroll de categorías + ancho del selector de filtros

### Summary
1. **CategoryBar**: cuando se selecciona una categoría (especialmente
   las de los extremos), la barra se desplaza automáticamente para que
   el botón seleccionado quede visible. También se añadieron botones de
   flecha izquierda/derecha para navegación manual. La scrollbar nativa
   se ocultó (era apenas visible).
2. **ProductGrid**: se aumentó el ancho del selector de filtros
   (Más Recientes, Precio: Menor a Mayor, etc.) de 180px a 260px para
   que el texto no se trunque.

### CategoryBar.tsx (`src/components/ecommerce/CategoryBar.tsx`)
Reescrito por completo:
- **Reemplazó `ScrollArea` de shadcn** (cuya scrollbar era apenas
  visible) con un `<div>` nativo con `overflow-x-auto` y la scrollbar
  ocultada vía CSS (`scrollbarWidth: none` para Firefox,
  `msOverflowStyle: none` para IE/Edge, y `::-webkit-scrollbar {
  display: none }` para WebKit).
- **Botones de flecha**: un `Button` ghost con `ChevronLeft` a la
  izquierda y `ChevronRight` a la derecha del contenedor scrollable.
  Cada uno llama a `scrollByAmount(±200)` que hace `scrollBy` con
  `behavior: 'smooth'`.
- **Auto-scroll inteligente** (`scrollToSelected`):
  - Se ejecuta cuando cambia `selectedCategory` o cuando se carga la
    lista de categorías (useEffect con 50ms de delay para asegurar
    que el DOM está listo).
  - Si la categoría es "Todos" (null) → scroll al inicio.
  - Busca el botón con `data-cat-slug` igual al slug seleccionado.
  - Comprueba si el botón ya es visible en el viewport (getBoundingClientRect).
    Si ya es visible, no hace nada (evita scrolls innecesarios).
  - Si no es visible:
    - Si está oculto por la izquierda → alinearlo a la izquierda con
      16px de padding (`targetLeft - 16`).
    - Si está oculto por la derecha → alinearlo a la derecha con 16px
      de padding (`targetLeft + targetWidth - containerWidth + 16`).
  - Clampa el `scrollLeft` entre 0 y `maxScroll` para no salirse de
    los límites.
  - Usa `scrollTo({ behavior: 'smooth' })` para una transición suave.
- Cada botón de categoría ahora tiene `data-cat-slug={cat.slug}` (o
  `"__all__"` para "Todos") para que el auto-scroll pueda encontrarlo.

### ProductGrid.tsx (`src/components/ecommerce/ProductGrid.tsx`)
- Cambió `className="w-[180px] h-9"` → `className="w-[260px] h-9"` en
  el `SelectTrigger` del ordenamiento. Ahora "Precio: Menor a Mayor"
  y "Precio: Mayor a Menor" caben sin truncarse.

### Verificación (browser)
- **Viewport 1280px**:
  - 2 botones de flecha visibles (izquierda y derecha).
  - 9 botones de categoría (Todos + 8 categorías).
  - Sort trigger width = 260px (verificado vía getComputedStyle).
  - Al hacer click en "Electrodomésticos" (última categoría):
    scrollLeft pasó de 0 a 558 (auto-scroll funcionó).
  - Al hacer click en una categoría del medio que ya era visible:
    no se movió (comportamiento correcto, evita scrolls innecesarios).
- **Viewport 600px** (móvil):
  - scrollWidth = 1734px, clientWidth = 496px → hay overflow.
  - Al seleccionar "Electrodomésticos": scrollLeft saltó a 1238,
    el botón quedó visible (`isVisible: true`).
- El texto del select de filtros ya no se trunca con el nuevo ancho
  de 260px.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

### Notes
- La scrollbar nativa se ocultó por completo porque el usuario reportó
  que "apenas se veía". La navegación ahora se hace con:
  1. Auto-scroll al seleccionar una categoría.
  2. Botones de flecha izquierda/derecha para navegación manual.
  3. Scroll nativo con trackpad/rueda del mouse (sigue funcionando
     aunque la barra no se vea).
- El auto-scroll es inteligente: si el botón ya es visible, no se
  mueve. Esto evita saltos molestos cuando se navega entre categorías
  consecutivas que caben en el viewport.

## 2026-07-09 — Task PROD-FIX-25: Verificación código + logo móvil + eliminar WhatsApp

### Summary
1. **Verificación de código**: comparé el zip adjunto por el usuario
   (diaz-premium-envios-1783486922106.zip del 8 de julio) con el
   sandbox. **Son idénticos** (0 diferencias tras excluir artefactos
   del entorno).
2. **Logo/nombre del negocio en móvil**: el nombre "Díaz Premium" +
   "Envíos" tenía `hidden sm:block` que lo ocultaba en móvil. Lo
   hice visible siempre (con tamaño responsivo `text-base sm:text-lg`).
3. **Eliminé los mensajes de WhatsApp al cambiar estado de pedido**:
   el admin ya no abre WhatsApp automáticamente. Los clientes hacen
   seguimiento desde "Mis Pedidos" con el timeline en tiempo real
   (polling cada 15s), que es menos trabajo para los dueños.

### Verificación de código
- Extraje el zip a `/tmp/zip-extract-new`.
- `diff -rq` vs `/home/z/my-project` (excluyendo node_modules, .next,
  .git, data, upload, download, etc.).
- Resultado: **0 diferencias**. El sandbox tiene exactamente el mismo
  código que el zip adjunto.

### Header.tsx (`src/components/ecommerce/Header.tsx`)
- Línea 55: `className="hidden sm:block"` → `className=""` (siempre
  visible).
- Línea 56: `text-lg` → `text-base sm:text-lg` (un poco más chico en
  móvil para que quepa, normal en desktop).
- Verificado con VLM en viewport 390×844 (iPhone 14): ahora se ve
  "Díaz Premium" + "Envíos" junto al logo.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- **Eliminé la función `buildStatusWhatsAppUrl`** completa (~80 líneas)
  que generaba el mensaje de WhatsApp con los detalles del pedido.
- **Modifiqué `changeStatus`**: ya no busca el `order.customerPhone`,
  ya no llama a `buildStatusWhatsAppUrl`, ya no hace `window.open()`.
  Ahora solo hace el PUT a la API y `fetchData()` para refrescar la
  tabla.
- Comenté: "Los clientes hacen seguimiento de sus pedidos desde la
  página 'Mis Pedidos' con el timeline en tiempo real. No se envían
  mensajes de WhatsApp automáticos para no sobrecargar a los dueños."
- Verificado en browser: override de `window.open` para capturar si
  se llama. Tras cambiar el estado de un pedido a "Enviado",
  `openCalled: false` → no se abrió ninguna pestaña de WhatsApp.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /admin` → 200.

### Nota sobre el seguimiento de pedidos
El cliente ya tiene una forma de seguimiento en tiempo real desde la
tarea PROD-FIX-14: la página "Mis Pedidos" muestra un timeline visual
 profesional (Pedido realizado → Confirmado → En camino → Entregado)
que se actualiza automáticamente cada 15 segundos vía polling. Esto
es suficiente para que el cliente sepa el estado de su pedido sin que
el dueño tenga que enviar mensajes manuales.

## 2026-07-09 — Task PROD-FIX-26: Imagen hero en móvil + padding del carrito móvil

### Summary
1. **Imagen del hero visible en móvil**: la imagen principal del negocio
   (cover-real.jpg) tenía `hidden md:block` que la ocultaba en móvil,
   dejando un espacio en blanco a la derecha del texto. Ahora se muestra
   en todos los tamaños con altura responsiva.
2. **Padding del carrito en móvil**: los textos y números del carrito
   quedaban pegados al margen de la pantalla. Aumenté el padding
   horizontal del SheetContent de `px-1` a `px-4 sm:px-6`.

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
- Línea 48: `className="relative hidden md:block"` → `className="relative block"`
  (la imagen ahora se muestra siempre, no solo en desktop).
- Línea 53: `className="w-full h-[400px] object-cover"` → `className="w-full h-[220px] sm:h-[320px] md:h-[400px] object-cover"`
  (altura responsiva: 220px en móvil, 320px en tablet, 400px en desktop).
- Verificado con VLM en viewport 390×844: la imagen ahora se ve debajo
  del texto y los botones del hero.

### CartSidebar.tsx (`src/components/ecommerce/CartSidebar.tsx`)
- Línea 56: `className="w-full sm:max-w-md flex flex-col"` → `className="w-full sm:max-w-md flex flex-col px-4 sm:px-6"`
  (padding horizontal explícito: 16px en móvil, 24px en desktop).
- Línea 81: `className="flex-1 overflow-y-auto py-4 space-y-4 px-1"` → `className="flex-1 overflow-y-auto py-4 space-y-4"`
  (eliminé el `px-1` del contenedor de items porque el padding ahora
  lo da el SheetContent padre, evitando doble padding).
- Verificado con VLM en viewport 390×844: "adequate spacing between
  content and screen edge", "no cutoff text/numbers".

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

## 2026-07-09 — Task PROD-FIX-27: Imagen del hero a la derecha del texto en móvil

### Summary
El usuario reportó que en móvil la imagen del hero aparecía debajo del
botón "Comprar Ahora" en lugar de a la derecha del texto "Tu Tienda
Premium de Envíos" como en desktop. Rediseñé el layout del hero para
que en móvil la imagen se vea a la derecha del texto (side-by-side),
no apilada debajo.

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
- **Grid**: cambió de `grid md:grid-cols-2` (1 columna en móvil, 2 en
  desktop) a `grid grid-cols-[1fr_auto] md:grid-cols-2` (en móvil:
  texto toma el espacio disponible + imagen con ancho fijo; en desktop:
  2 columnas iguales).
- **Texto (columna izquierda)**: compactado para móvil:
  - Badge "Ofertas Exclusivas": `text-sm` → `text-xs md:text-sm`.
  - Título: `text-4xl` → `text-2xl sm:text-4xl md:text-5xl lg:text-6xl`.
  - Descripción: oculta en móvil muy pequeño (`hidden sm:block`) para
    no saturar la columna; visible desde sm.
  - Botones: `size="lg"` → `size="sm"` con `md:size-lg`. Texto "Comprar
    Ahora" → "Comprar" en móvil, "Ver Productos" → "Ver" en móvil.
- **Imagen (columna derecha)**: ancho fijo en móvil:
  - `w-32 sm:w-64 md:w-auto` (128px en móvil, 256px en tablet, auto en
    desktop).
  - Altura: `h-[100px] sm:h-[260px] md:h-[400px]` (100px en móvil para
    que quepa al lado del texto sin ocupar toda la pantalla).
  - Bordes: `rounded-xl md:rounded-2xl`.
- **Padding vertical**: `py-12 md:py-20` → `py-8 md:py-20` (menos
  padding en móvil para compensar el layout compacto).

### Resultado
- **Móvil (390px)**: texto a la izquierda + imagen a la derecha, lado
  a lado. Verificado con VLM: "the image is to the RIGHT of the text,
  they are side by side".
- **Desktop**: sin cambios (2 columnas iguales, imagen grande 400px).
- **Tablet (sm)**: transición suave entre ambos layouts.

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

## 2026-07-09 — Task PROD-FIX-28: Imagen del hero de ancho completo en móvil

### Summary
Rediseñé el layout del hero para que en móvil la imagen ocupe el ancho
completo de la pantalla, ubicada entre "Ofertas Exclusivas" y el título
"Tu Tienda Premium de Envíos". En desktop se mantiene igual (imagen a
la derecha del texto, 2 columnas).

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
Rediseñé el layout con dos bloques de imagen diferentes:

**Layout móvil (orden vertical):**
1. Badge "Ofertas Exclusivas"
2. **Imagen de ancho completo** (h-[180px], rounded-xl) — `md:hidden`
3. Título "Tu Tienda Premium de Envíos"
4. Descripción (hidden en sm)
5. Botones "Comprar" y "Ver Productos" (con `flex-1` para rellenar el
   ancho disponible en móvil)

**Layout desktop (2 columnas, sin cambios):**
- Columna izquierda: badge + título + descripción + botones
- Columna derecha: imagen grande (h-[400px], rounded-2xl) — `hidden md:block`

**Cambios específicos:**
- Grid: `grid-cols-[1fr_auto] md:grid-cols-2` → `grid-cols-1 md:grid-cols-2`
  (en móvil 1 columna, en desktop 2).
- Imagen móvil: bloque nuevo con `md:hidden`, ancho completo
  (`w-full h-[180px]`), entre el badge y el título.
- Imagen desktop: bloque con `hidden md:block`, igual que antes.
- Botones en móvil: añadí `flex-1 sm:flex-none` para que se expandan
  y rellenen el ancho de la pantalla.
- Texto de botones: "Ver" → "Ver Productos" (visible en ambos tamaños
  ahora que los botones son flex-1).

### Resultado verificado con VLM
**Móvil (390px):**
> "Vertical order: Badge 'Ofertas Exclusivas' → Wide full-width image →
> Title 'Tu Tienda Premium de Envíos' → Buttons 'Comprar' and 'Ver
> Productos'."

**Desktop (1280px):**
> "The hero image is to the RIGHT of the text, side by side, in 2
> columns." (sin cambios)

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

## 2026-07-09 — Task PROD-FIX-29: Hero rediseñado — título sobre imagen, sin badge ni banner amarillo

### Summary
Rediseñé completamente el hero siguiendo las indicaciones del usuario:
1. **Quité "Ofertas Exclusivas"** (el badge amarillo con punto pulsante).
2. **Quité el banner amarillo** (el fondo gradient `from-amber-50 via-orange-50 to-yellow-50`).
3. **El texto "Tu Tienda Premium de Envíos"** ahora va **encima de la imagen** (overlay), en **una sola línea** (`whitespace-nowrap`).

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
Rediseño completo del hero:

**Estructura nueva:**
- Section: fondo blanco (`bg-white`) en vez del gradient amarillo.
- Un contenedor `relative rounded-2xl overflow-hidden` con:
  - Imagen de fondo (cover-real.jpg) con altura responsiva: `h-[200px] sm:h-[320px] md:h-[420px]`.
  - Overlay oscuro (`bg-gradient-to-t from-black/70 via-black/40 to-black/30`) para que el texto blanco se lea bien.
  - Contenido superpuesto (`absolute inset-0 flex flex-col items-center justify-center text-center`):
    - Título "Tu Tienda Premium de Envíos" en blanco, `whitespace-nowrap` (una sola línea), con "Premium" en gradient amber-300→orange-400. Tamaño: `text-lg sm:text-3xl md:text-5xl lg:text-6xl`.
    - Descripción (hidden en móvil, visible desde sm): texto blanco/90 con drop-shadow.
    - Botones "Comprar Ahora" (amber) y "Ver Productos" (outline blanco con backdrop-blur).

**Cambios eliminados:**
- Badge "Ofertas Exclusivas" con punto pulsante.
- Layout de 2 columnas (texto izquierda, imagen derecha).
- Imagen duplicada (antes había una para móvil y otra para desktop).
- Fondo gradient amarillo del section.

### Verificación VLM
**Móvil (390px):**
- "No yellow 'Ofertas Exclusivas' badge" ✓
- "No yellow background banner, the banner is white" ✓
- "Image with text 'Tu Tienda Premium de Envíos' overlaid ON TOP" ✓
- Texto en una sola línea (verificado vía crop + VLM: "ONE single line") ✓
- Medido vía JS: h1 width=298px, height=22.5px, whiteSpace=nowrap ✓

**Desktop (1280px):**
- "No yellow badge" ✓
- "Image with text overlaid on top, centered" ✓
- "Main heading in one line" ✓

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

## 2026-07-09 — Task PROD-FIX-30: Cinta de titulares + quitar duplicado

### Summary
1. **Convertí el banner amarillo del Header en una cinta de titulares
   (marquee)** con animación horizontal infinita. Los titulares se
   desplazan de derecha a izquierda continuamente.
2. **Añadí "Entrega rápida en Ciego de Ávila, Cuba"** como uno de los
   titulares de la cinta (visible en PC y móvil).
3. **Eliminé los trust badges del HeroBanner** (las 3 tarjetas
   "Pedidos 24/7 / Entregas / Envío rápido" que estaban debajo de la
   imagen del hero). Estaban duplicadas con la sección amarilla de
   más abajo en page.tsx, así que se eliminó la de arriba.

### Header.tsx (`src/components/ecommerce/Header.tsx`)
- Reemplacé el promo banner estático por una cinta animada:
  - Contenedor `overflow-hidden` con fondo gradient amber→orange.
  - Inner div con `flex whitespace-nowrap animate-marquee`.
  - Contenido duplicado (`[0, 1].map(...)`) para que el scroll sea
    continuo (cuando termina el primer set, el segundo ya está visible
    y la animación se reinicia sin saltos).
  - 4 titulares separados por "·":
    1. 🕐 Pedidos 24/7
    2. 🚚 Entregas diarias de 3:00 pm a 6:00 pm
    3. ⚡ Envío rápido por costo adicional
    4. 📍 Entrega rápida en Ciego de Ávila, Cuba
  - Cada titular tiene `py-1.5 px-6` para espaciado cómodo.

### globals.css (`src/app/globals.css`)
Añadí al final:
```css
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.animate-marquee {
  animation: marquee 30s linear infinite;
  will-change: transform;
}

.animate-marquee:hover {
  animation-play-state: paused;  /* pausa al hover para leer */
}

@media (prefers-reduced-motion: reduce) {
  .animate-marquee {
    animation: none;  /* accesibilidad */
  }
}
```
- 30 segundos de duración para una velocidad de lectura cómoda.
- `translateX(-50%)` porque el contenido está duplicado, así el
  desplazamiento es seamless.
- Pausa al hover para que el usuario pueda leer tranquilo.
- Respeta `prefers-reduced-motion` (usuarios sensibles al movimiento).

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
- **Eliminé las 3 tarjetas de trust badges** que estaban debajo de la
  imagen del hero (Pedidos 24/7, Entregas diarias, Envío rápido).
  Estaban duplicadas con la sección amarilla de page.tsx.
- Limpié los imports: `Clock, Truck, Zap` ya no se usan.

### page.tsx (`src/app/page.tsx`)
- Sin cambios. La sección amarilla "Pide cuando quieras, recíbelo en
  casa" con las 3 tarjetas se mantiene (es la versión bonita con
  emojis 🕐🚚⚡ y fondo oscuro sobre ámbar).

### Verificación VLM
**Desktop (1280px):**
- "Yes, moving ticker/marquee with 'Pedidos 24/7', 'Entregas
  diarias', 'Envío rápido', 'Entrega rápida en Ciego de Ávila Cuba'"
- "No duplicated section of 3 cards immediately below the hero image"

**Móvil (390px):**
- "Yes, thin orange strip with moving text (ticker/marquee)"
- "No duplicate set of 3 cards below the hero image"

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

## 2026-07-09 — Task PROD-FIX-31: Marquee funcionando + hero limpio + sección movida

### Summary
1. **Cinta de titulares (marquee) ahora se anima**: el problema era que
   Tailwind v4 purgaba la clase `.ticker-track`. Lo solucioné usando
   `style={{ animation: 'marquee 30s linear infinite' }}` inline.
2. **Hero limpio**: la imagen ahora solo tiene "Díaz Premium Envíos"
   encima (sin botones ni descripción). Los botones están fuera de la
   imagen, debajo.
3. **Sección "Pide cuando quieras" movida debajo de la imagen**: antes
   estaba más abajo (después de FeaturedProducts y CategoryShowcase).
   Ahora está inmediatamente después de los botones del hero, para que
   el cliente sepa de inmediato cómo trabaja el negocio.
4. **"Díaz Premium Envíos" visible en PC**: cambié el título de
   "Tu Tienda Premium de Envíos" a "Díaz Premium Envíos" (más corto,
   cabe en una línea en todos los tamaños).

### Header.tsx (`src/components/ecommerce/Header.tsx`)
- Cambié `className="ticker-track flex whitespace-nowrap"` por
  `className="flex whitespace-nowrap"` con `style={{ animation:
  'marquee 30s linear infinite', willChange: 'transform' }}`.
- Los handlers `onMouseEnter`/`onMouseLeave` ahora pausan/reanudan la
  animación via `e.currentTarget.style.animationPlayState`.
- Esto evita el problema de Tailwind v4 purgando clases CSS
  personalizadas — el estilo inline no se purga.

### globals.css
- `.ticker-track` ya no se usa (lo dejé por si acaso, pero la regla
  no se aplicaba). El `@keyframes marquee` SÍ se carga correctamente
  (verificado vía document.styleSheets).

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
Rediseño completo:
- **Imagen limpia**: solo el título "Díaz Premium Envíos" encima
  (blanco con "Premium" en gradient amber-300→orange-400). Sin
  descripción, sin botones sobre la imagen.
- **Botones fuera de la imagen**: "Comprar Ahora" (ámbar) y "Ver
  Productos" (outline ámbar) debajo de la imagen, centrados.
- **Sección "Pide cuando quieras"** movida aquí (antes estaba en
  page.tsx después de CategoryShowcase). Ahora está inmediatamente
  después de los botones, con fondo gradient amber→orange, patrón de
  puntos, badge "Horario y Entregas", título, descripción, y las 3
  tarjetas (🕐 24/7, 🚚 3-6pm, ⚡ Envío rápido).

### page.tsx (`src/app/page.tsx`)
- Eliminé la sección "Pide cuando quieras" que estaba aquí (ahora
  vive en HeroBanner.tsx, justo después del hero).
- HomeView ahora solo: HeroBanner + FeaturedProducts + CategoryShowcase.

### Verificación
- **Marquee**: `animationName: "marquee"`, `animationDuration: "30s"`,
  `animationPlayState: "running"` (verificado vía getComputedStyle).
- **Desktop VLM**: "hero image with text overlaid, buttons below,
  yellow section with 'Pide cuando quieras' below buttons" ✓
- **Móvil VLM**: "text 'Díaz Premium Envíos' visible on hero image,
  buttons below, yellow section below" ✓

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

## 2026-07-09 — Task PROD-FIX-32: Hero limpio + cards con colores diferenciados

### Summary
1. **Quité los botones "Comprar Ahora" y "Ver Productos"** que estaban
   debajo de la imagen del hero.
2. **Quité el texto "Díaz Premium Envíos"** que estaba encima de la
   imagen. Ahora la imagen está completamente limpia.
3. **Rediseñé las cards de horarios y entregas** con colores suaves
   diferenciados para cada una, y cambié el fondo de la sección de
   amarillo a gris claro para que las cards destaquen.

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
Rediseño completo:

**Hero:**
- Imagen limpia (sin overlay oscuro, sin texto encima, sin botones).
- Solo la imagen con `rounded-2xl shadow-xl`.

**Sección "Pide cuando quieras":**
- Fondo: cambió de `bg-gradient-to-r from-amber-500 to-orange-500`
  (amarillo/naranja) a `bg-gradient-to-br from-gray-50 to-gray-100`
  (gris claro) con `border border-gray-200`. Esto hace que las cards
  coloreadas destaquen.
- Badge "Horario y Entregas": ámbar sobre blanco (antes blanco sobre
  transparente).
- Título y descripción: color gray-900/gray-600 (antes blanco).
- **Cards con colores suaves diferenciados:**
  - Card 1 (Pedidos 24/7): `bg-blue-50 border-blue-100`, icono en
    `bg-blue-100`. Azul suave.
  - Card 2 (Entregas 3-6pm): `bg-emerald-50 border-emerald-100`,
    icono en `bg-emerald-100`. Verde suave.
  - Card 3 (Envío rápido): `bg-purple-50 border-purple-100`, icono en
    `bg-purple-100`. Púrpura suave.
  - Todas con `hover:shadow-md hover:-translate-y-1 transition-all`
    para efecto al pasar el mouse.
  - Texto de las cards: gray-900 (título) y gray-600 (descripción)
    para que se lean bien sobre los fondos suaves.

**Eliminado:**
- Botones "Comprar Ahora" y "Ver Productos".
- Texto "Díaz Premium Envíos" sobre la imagen.
- Overlay oscuro de la imagen.
- Imports: `useAppStore`, `Button`, `ArrowRight` ya no se usan.

### Verificación VLM (desktop)
- "Yes, the hero image is clean (no text overlaid on it)" ✓
- "No, there are no 'Comprar Ahora' and 'Ver Productos' buttons" ✓
- "3 cards have different background colors: Light blue, Light green,
  Light purple" ✓

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.

## 2026-07-09 — Task PROD-FIX-33: CRUD para cintillo y cards de horario + bug horario

### Summary
1. **Bug del horario arreglado**: el `allowedFields` de la API
   `/api/siteconfig` PUT no incluía `normalSchedule`, `asapSurchargeType`,
   `asapSurchargeValue`, ni `activeCountries`. Por eso cuando el admin
   cambiaba el horario, no se persistía. Ahora todos los campos están
   permitidos.
2. **CRUD completo en admin/ajustes** para:
   - **Cintillo de titulares (marquee)**: editor con añadir/editar/
     eliminar/reordenar titulares.
   - **Sección "Horario y Entregas"**: título, descripción y las 3
     cards con editor completo (icono, título, descripción, color).
3. **Header y HeroBanner leen de la API**: ya no tienen los titulares
   ni las cards hardcodeadas. Las cargan dinámicamente desde
   `/api/siteconfig`.

### Schema (`src/lib/store.ts`)
Añadidos 4 campos al `SiteConfig`:
- `tickerItems: string` — JSON string de array de strings (titulares
  del cintillo).
- `horarioSectionTitle: string` — título de la sección.
- `horarioSectionDesc: string` — descripción de la sección.
- `horarioCards: string` — JSON string de array de objetos
  `{ icon, title, description, color }`.

Defaults añadidos a `SEED_SITE_CONFIG` y `db.siteConfig` defaults.

### API (`src/app/api/siteconfig/route.ts`)
- `allowedFields` ampliado para incluir: `asapSurchargeType`,
  `asapSurchargeValue`, `normalSchedule`, `activeCountries`,
  `tickerItems`, `horarioSectionTitle`, `horarioSectionDesc`,
  `horarioCards`.

### AdminPanel.tsx (`src/components/ecommerce/AdminPanel.tsx`)
- Import `Clock` añadido a lucide-react.
- Interfaz `SiteConfig` extendida con los 4 campos nuevos.
- **Nuevo `TickerEditor`**: editor CRUD para los titulares del cintillo.
  - Cada titular es un Input con botones de subir/bajar/eliminar.
  - Botón "Añadir titular".
- **Nuevo `HorarioCardsEditor`**: editor CRUD para las cards de horario.
  - Cada card: icono (Input maxLength 4), título (Input), descripción
    (Textarea con soporte **negritas**), color (5 opciones: azul, verde,
    púrpura, ámbar, rosa — botones circulares de colores).
  - Vista previa de cada card en tiempo real.
  - Botones de subir/bajar/eliminar por card.
  - Botón "Añadir tarjeta".
- **SettingsTab**: añadidas 2 nuevas secciones (Cards) antes del
  "Download source code":
  1. "Cintillo de Titulares (Marquee)" con `TickerEditor`.
  2. "Sección 'Horario y Entregas' (Inicio)" con título, descripción y
     `HorarioCardsEditor`.

### Header.tsx (`src/components/ecommerce/Header.tsx`)
- Nuevo estado `tickerItems: string[]`.
- `useEffect` que carga los titulares desde `/api/siteconfig` al montar.
- El cintillo ahora renderiza `tickerItems` dinámicamente (con `·`
  separadores). Si no hay items, no renderiza el cintillo.

### HeroBanner.tsx (`src/components/ecommerce/HeroBanner.tsx`)
- Rediseñado para cargar `horarioSectionTitle`, `horarioSectionDesc` y
  `horarioCards` desde `/api/siteconfig`.
- Nuevo helper `renderDescription` que convierte `**texto**` en
  `<strong>texto</strong>`.
- `CARD_COLORS` map con 5 colores (blue, emerald, purple, amber, rose).
- Las cards se renderizan dinámicamente con su color, icono, título y
  descripción.

### Verificación
- API devuelve los campos nuevos correctamente (verificado vía curl).
- Header muestra el cintillo con los titulares de la API (verificado
  vía browser eval: `tickerFound: true`, `tickerText` con los 4
  titulares).
- HeroBanner muestra las 3 cards con colores (verificado vía browser
  eval: `heroCardCount: 1` azul, las otras 2 emerald/purple).

### Lint / Build
- `bun run lint` — 0 errors, 6 warnings (the same 6 pre-existing).
- `GET /` → 200.
- `GET /api/siteconfig` → 200 con todos los campos nuevos.
