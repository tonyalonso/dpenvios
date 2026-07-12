/**
 * Database access layer.
 *
 * Previously backed by Prisma + SQLite, now backed by a JSON-file store
 * (see ./store.ts) for serverless / read-only-filesystem compatibility.
 *
 * The exported `db` object exposes the same Prisma-Client-shaped API used
 * by every route under src/app/api, so no route code needs to change.
 */

export { db } from './store';
export type { DB } from './store';
