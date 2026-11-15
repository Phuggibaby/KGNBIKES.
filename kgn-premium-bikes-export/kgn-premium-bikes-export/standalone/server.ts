// ─────────────────────────────────────────────────────────────────────────────
// KGN Premium Bikes — standalone server.
//
// Replaces the Muse/Hatch platform runtime for self-hosting:
//
//     bun run build      # build the client once
//     bun run start      # serve it (this file)
//
// What it does:
//   • Applies the Drizzle SQL migrations in ../drizzle/ to a local SQLite
//     file on first start (see local/space-sdk/runtime.ts)
//   • POST /actions  { action, args }  → validates args against the action's
//     Zod request schema, runs the handler from server/src/actions.ts with a
//     local Ctx (SQLite DB + local uploads), validates the response schema,
//     and replies { data } — or { error } with HTTP 400 on failure. This is
//     the same wire format the platform used.
//   • GET /uploads/<key> → owner-uploaded bike photos from the uploads dir
//   • GET /*             → the built client (client/dist), SPA fallback
//
// Configuration (environment variables):
//   PORT          default 3000
//   DATABASE_PATH default ./data/app.db     (relative to the project root)
//   UPLOADS_DIR   default ./data/uploads    (relative to the project root)
//
// Put this behind a reverse proxy (Caddy / Nginx) or a host that terminates
// HTTPS for your domain — see README.md, "Hosting online".
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync } from "node:fs";
import { join } from "node:path";
import { Actions } from "../server/src/actions";
import { createCtx } from "../local/space-sdk/runtime";

const root = join(import.meta.dir, "..");
const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DATABASE_PATH ?? join(root, "data", "app.db");
const uploadsDir = process.env.UPLOADS_DIR ?? join(root, "data", "uploads");
const clientDir = join(root, "client", "dist");

const ctx = createCtx({
  dbPath,
  uploadsDir,
  migrationsDir: join(root, "drizzle"),
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type ActionDef = {
  request: { parse: (value: unknown) => unknown };
  response: { parse: (value: unknown) => unknown };
  handler: (ctx: unknown, args: unknown) => Promise<unknown>;
};
const actions = Actions as unknown as Record<string, ActionDef>;

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/actions" && req.method === "POST") {
      let body: { action?: unknown; args?: unknown };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }
      const name = typeof body?.action === "string" ? body.action : "";
      const def = actions[name];
      if (!def) return json({ error: `Unknown action: ${name || "(missing)"}` }, 404);
      try {
        const args = def.request.parse(body.args ?? {});
        const result = await def.handler(ctx, args);
        const data = def.response.parse(result);
        return json({ data });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[actions] ${name} failed: ${message}`);
        return json({ error: message }, 400);
      }
    }

    if (url.pathname.startsWith("/uploads/")) {
      const key = decodeURIComponent(url.pathname.slice("/uploads/".length));
      const file = Bun.file(join(uploadsDir, key));
      if (await file.exists()) return new Response(file);
      return new Response("Not found", { status: 404 });
    }

    const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = Bun.file(join(clientDir, rel));
    if (await file.exists()) return new Response(file);
    const index = Bun.file(join(clientDir, "index.html"));
    if (await index.exists()) {
      return new Response(index, { headers: { "content-type": "text/html" } });
    }
    return new Response("Client not built yet. Run: bun run build", { status: 503 });
  },
});

console.log(`KGN Premium Bikes is running at http://localhost:${server.port}`);
console.log(`  database: ${dbPath}`);
console.log(`  uploads:  ${uploadsDir}`);
if (!existsSync(join(clientDir, "index.html"))) {
  console.warn("  warning: client/dist is missing — run `bun run build` first.");
}
