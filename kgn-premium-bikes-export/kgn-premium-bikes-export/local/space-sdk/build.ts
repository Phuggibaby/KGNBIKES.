// ─────────────────────────────────────────────────────────────────────────────
// Local standalone replacement for `@hatch/space-sdk/build`.
//
// The platform's buildClient() bundled client/index.html → client/dist with
// Bun.build + the Tailwind plugin, production React, and hashed asset names.
// This does the same thing with no platform involvement:
//
//     bun ./client/build.mjs        (from the project root)
//
// Output: client/dist/ — served by standalone/server.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { rm } from "node:fs/promises";
import tailwindPlugin from "bun-plugin-tailwind";

export interface BuildClientOptions {}

export async function buildClient(_options: BuildClientOptions = {}): Promise<void> {
  if (typeof Bun === "undefined" || typeof Bun.build !== "function") {
    throw new Error("buildClient() must run under Bun");
  }
  const outdir = "./client/dist";
  await rm(outdir, { force: true, recursive: true });
  const result = await Bun.build({
    entrypoints: ["./client/index.html"],
    outdir,
    minify: true,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    naming: {
      asset: "assets/[name]-[hash].[ext]",
      chunk: "assets/[name]-[hash].[ext]",
      entry: "[name].[ext]",
    },
    plugins: [tailwindPlugin],
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("buildClient() failed; see logged diagnostics");
  }
  console.log(`Client built → ${outdir}`);
}
