// ─────────────────────────────────────────────────────────────────────────────
// Standalone runtime for the local `@hatch/space-sdk` replacement.
//
//   ctx.db     → Drizzle ORM over a local SQLite file (Bun's built-in sqlite)
//   ctx.blobs  → plain files under a local uploads directory, served by the
//                standalone server at /uploads/<key>
//
// Database migrations: the SQL files in ../../drizzle/ are applied in file
// order on first start and recorded in a `__export_migrations` table, so
// restarts never re-apply them.
// ─────────────────────────────────────────────────────────────────────────────

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import type { BlobClient, BlobMetadata, Ctx } from "./index";

export interface StandaloneConfig {
  /** Path of the SQLite database file (created if missing). */
  dbPath: string;
  /** Directory that stores uploaded files (bike photos). */
  uploadsDir: string;
  /** Directory containing the Drizzle SQL migration files. */
  migrationsDir: string;
  /** URL prefix the server serves uploads under. Default "/uploads". */
  uploadsUrlPrefix?: string;
  slug?: string;
}

export function runMigrations(sqlite: Database, migrationsDir: string): string[] {
  sqlite.exec(
    "CREATE TABLE IF NOT EXISTS __export_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
  );
  const appliedRows = sqlite
    .query("SELECT name FROM __export_migrations")
    .all() as Array<{ name: string }>;
  const applied = new Set(appliedRows.map((r) => r.name));
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const newlyApplied: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    // Drizzle migration files separate statements with this marker.
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    sqlite.transaction(() => {
      for (const statement of statements) sqlite.exec(statement);
      sqlite
        .query("INSERT INTO __export_migrations (name, applied_at) VALUES (?, ?)")
        .run(file, Date.now());
    })();
    newlyApplied.push(file);
  }
  return newlyApplied;
}

function blobPath(root: string, key: string): string {
  const path = join(root, key);
  if (!path.startsWith(root)) throw new Error(`Invalid blob key: ${key}`);
  return path;
}

export function createBlobClient(uploadsDir: string, urlPrefix = "/uploads"): BlobClient {
  return {
    async put(key, data, options) {
      const path = blobPath(uploadsDir, key);
      mkdirSync(dirname(path), { recursive: true });
      const bytes =
        data instanceof Uint8Array
          ? data
          : data instanceof ArrayBuffer
            ? new Uint8Array(data)
            : typeof data === "string"
              ? new TextEncoder().encode(data)
              : new Uint8Array(await data.arrayBuffer());
      writeFileSync(path, bytes);
      if (options?.contentType) {
        writeFileSync(`${path}.meta.json`, JSON.stringify({ contentType: options.contentType }));
      }
    },
    async getUrl(key) {
      // Served by standalone/server.ts from the uploads directory.
      return `${urlPrefix}/${key.split("/").map(encodeURIComponent).join("/")}`;
    },
    async delete(key) {
      rmSync(blobPath(uploadsDir, key), { force: true });
      rmSync(`${blobPath(uploadsDir, key)}.meta.json`, { force: true });
    },
    async head(key) {
      const path = blobPath(uploadsDir, key);
      if (!existsSync(path)) return null;
      return { key, size: statSync(path).size };
    },
    async list(prefix = "") {
      const out: BlobMetadata[] = [];
      const walk = (dir: string) => {
        if (!existsSync(dir)) return;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (!entry.name.endsWith(".meta.json")) {
            const key = full.slice(uploadsDir.length + 1).split("\\").join("/");
            if (key.startsWith(prefix)) out.push({ key, size: statSync(full).size });
          }
        }
      };
      walk(uploadsDir);
      return out;
    },
  };
}

/** Build the Ctx handed to every action handler. Opens (and migrates) the DB. */
export function createCtx(config: StandaloneConfig): Ctx {
  mkdirSync(dirname(config.dbPath), { recursive: true });
  mkdirSync(config.uploadsDir, { recursive: true });
  const sqlite = new Database(config.dbPath);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  const applied = runMigrations(sqlite, config.migrationsDir);
  if (applied.length > 0) {
    console.log(`[db] applied migrations: ${applied.join(", ")}`);
  }
  const db = drizzle(sqlite);
  const accessor = (() => db) as unknown as Ctx["db"];
  return {
    slug: config.slug ?? "kgn-premium-bikes-2",
    invocationId: "standalone",
    spaceDir: process.cwd(),
    db: accessor,
    blobs: createBlobClient(config.uploadsDir, config.uploadsUrlPrefix ?? "/uploads"),
    invalidateQueries() {
      // No-op standalone — see the note on Ctx.invalidateQueries in ./index.ts.
    },
  };
}
