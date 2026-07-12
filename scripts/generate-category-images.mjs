/**
 * Genera imágenes IA para las 9 categorías de Diaz Premium Envíos.
 * Usa z-ai-web-dev-sdk (modelo GLM de generación de imágenes).
 *
 * Las imágenes se guardan en /public/categories/{slug}.png
 * con tamaño 1024x1024 (cuadradas, ideales para tiles y pills).
 *
 * Ejecutar con: `node /home/z/my-project/scripts/generate-category-images.mjs`
 * (usa .mjs para ESM nativo de Node, sin necesidad de bun/tsx)
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'categories');

// Definición de las 9 categorías con prompts específicos para cada una.
// Estilo consistente: fotografía cenital sobre fondo claro, alto ángulo,
// productos típicos de la categoría en Cuba, estilo mercado premium.
const CATEGORIES = [
  {
    slug: 'oferta-especial',
    name: 'Oferta Especial',
    prompt: 'A premium gift basket arrangement seen from above on a soft cream background, containing assorted gourmet food products, ribbons, and a small gift card. Elegant warm lighting, professional product photography, high quality, square composition.',
  },
  {
    slug: 'alimentos-reposteria',
    name: 'Alimentos Elaborados y Repostería',
    prompt: 'Top-down flat lay of freshly baked goods: a Swiss roll cake (brazo gitano), sliced bread, cookies, flan, and pastries arranged on a wooden board over a cream linen background. Warm natural light, professional food photography, high quality, square composition.',
  },
  {
    slug: 'confituras',
    name: 'Confituras',
    prompt: 'Top-down flat lay of assorted cookies and confections: chocolate cookies, butter cookies, chocolate frog candies, arranged in small piles on parchment paper over a soft beige background. Warm natural light, professional food photography, high quality, square composition.',
  },
  {
    slug: 'lacteos-bebidas',
    name: 'Productos Lácteos y Bebidas',
    prompt: 'Top-down flat lay of dairy products and beverages: a carton of milk powder, a wheel of Gouda cheese, a tub of ice cream, a bottle of yogurt, and a pack of juice boxes, arranged on a clean cream background. Soft natural light, professional product photography, high quality, square composition.',
  },
  {
    slug: 'platos-fuertes',
    name: 'Platos Fuertes y Cárnicos',
    prompt: 'Top-down flat lay of meat products and main-dish ingredients: a pack of sausages, a tray of ground chicken, sliced pork loin, a carton of fresh eggs, and sliced mortadella, arranged on a wooden board over a neutral background. Cool natural light, professional food photography, high quality, square composition.',
  },
  {
    slug: 'granos-pastas',
    name: 'Granos y Pastas',
    prompt: 'Top-down flat lay of dry grains and pasta: a bag of white rice, a bag of black beans, a pack of spaghetti, a pack of macaroni, a small jar of coffee, and a pack of sugar, arranged neatly on a cream linen background. Warm natural light, professional product photography, high quality, square composition.',
  },
  {
    slug: 'enlatados',
    name: 'Enlatados y Conservas',
    prompt: 'Top-down flat lay of canned goods and preserves: a can of corned beef, a can of sardines in tomato sauce, a can of condensed milk, a large can of tomato paste, a bottle of cooking oil, and a box of malt beverage, arranged on a cream background. Soft natural light, professional product photography, high quality, square composition.',
  },
  {
    slug: 'aseo-personal',
    name: 'Aseo Personal',
    prompt: 'Top-down flat lay of personal hygiene products: a tube of toothpaste, a pack of toilet paper rolls, a bar of soap, a bottle of shampoo, and a small towel, arranged neatly on a clean cream background. Soft natural light, professional product photography, high quality, square composition.',
  },
  {
    slug: 'electrodomesticos',
    name: 'Electrodomésticos',
    prompt: 'Top-down flat lay of a small household appliance: a rechargeable portable fan with LED light, white and modern design, on a clean cream background with a subtle shadow. Soft natural light, professional product photography, high quality, square composition.',
  },
];

async function ensureOutputDir() {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
}

async function generateOne(zai, category) {
  const outputPath = path.join(OUTPUT_DIR, `${category.slug}.png`);

  // Si ya existe, no regenerar (idempotente)
  try {
    await fs.promises.access(outputPath);
    console.log(`  ✓ ${category.slug}.png ya existe, saltando`);
    return { ok: true, slug: category.slug, path: outputPath, cached: true };
  } catch {
    // no existe, continuar
  }

  try {
    console.log(`  → Generando ${category.slug}.png …`);
    const response = await zai.images.generations.create({
      prompt: category.prompt,
      size: '1024x1024',
    });

    const base64 = response?.data?.[0]?.base64;
    if (!base64) throw new Error('Respuesta sin base64');

    const buffer = Buffer.from(base64, 'base64');
    await fs.promises.writeFile(outputPath, buffer);

    console.log(`  ✓ ${category.slug}.png (${(buffer.length / 1024).toFixed(0)} KB)`);
    return { ok: true, slug: category.slug, path: outputPath, size: buffer.length };
  } catch (err) {
    console.error(`  ✗ ${category.slug}: ${err.message}`);
    return { ok: false, slug: category.slug, error: err.message };
  }
}

async function main() {
  console.log('=== Generando imágenes IA para categorías ===\n');
  await ensureOutputDir();

  let zai;
  try {
    zai = await ZAI.create();
  } catch (err) {
    console.error('No se pudo inicializar ZAI:', err.message);
    process.exit(1);
  }

  // Procesar en lotes de 3 en paralelo para no saturar la API
  const BATCH_SIZE = 3;
  const results = [];

  for (let i = 0; i < CATEGORIES.length; i += BATCH_SIZE) {
    const batch = CATEGORIES.slice(i, i + BATCH_SIZE);
    console.log(`\nLote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(CATEGORIES.length / BATCH_SIZE)}`);
    const batchResults = await Promise.all(batch.map((c) => generateOne(zai, c)));
    results.push(...batchResults);
  }

  console.log('\n=== Resumen ===');
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  console.log(`✓ Exitosos: ${ok.length}/${results.length}`);
  if (fail.length) {
    console.log(`✗ Fallidos: ${fail.length}`);
    fail.forEach((r) => console.log(`  - ${r.slug}: ${r.error}`));
    process.exit(1);
  }

  console.log('\nImágenes guardadas en:', OUTPUT_DIR);
  console.log('URLs públicas:');
  ok.forEach((r) => console.log(`  /categories/${r.slug}.png`));
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
