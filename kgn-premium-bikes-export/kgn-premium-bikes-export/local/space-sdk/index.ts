// ─────────────────────────────────────────────────────────────────────────────
// Local standalone replacement for `@hatch/space-sdk` (server entry).
//
// The live KGN app was built on the Muse/Hatch platform, whose SDK provided:
//   • defineAction(...) + the `z` re-export used by server/src/actions.ts
//   • the `Ctx` object handed to every action handler:
//       ctx.db<TSchema>()  – a Drizzle database handle
//       ctx.blobs          – blob (file) storage: put / getUrl / delete / head / list
//       ctx.invalidateQueries() – a platform live-refresh hint
//
// This module reproduces exactly that surface for self-hosting. The runtime
// implementation (local SQLite file + local uploads folder) lives in
// ./runtime.ts and is wired up by standalone/server.ts. The app's own code
// (server/src/actions.ts, server/src/schema.ts) is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

export { z };

/** Drizzle database handle, same pick of methods the platform exposed. */
export type SpaceDb<TSchema extends Record<string, unknown> = Record<string, never>> = Pick<
  LibSQLDatabase<TSchema>,
  "select" | "insert" | "update" | "delete" | "run" | "all" | "get" | "batch"
>;

export type SpaceDbAccessor = <
  TSchema extends Record<string, unknown> = Record<string, never>,
>() => SpaceDb<TSchema>;

export interface BlobMetadata {
  key: string;
  size: number;
  contentType?: string;
}

export interface BlobPutOptions {
  contentType?: string;
}

export interface BlobClient {
  put(
    key: string,
    data: Uint8Array | ArrayBuffer | Blob | string,
    options?: BlobPutOptions,
  ): Promise<void>;
  getUrl(key: string, options?: unknown): Promise<string>;
  delete(key: string): Promise<void>;
  head(key: string): Promise<BlobMetadata | null>;
  list(prefix?: string): Promise<BlobMetadata[]>;
}

/** The context object every action handler receives as its first argument. */
export interface Ctx {
  readonly slug: string;
  readonly invocationId: string;
  readonly spaceDir: string;
  readonly db: SpaceDbAccessor;
  readonly blobs: BlobClient;
  /**
   * On the platform this nudged connected clients to refetch. Standalone it
   * is a no-op: the web client already invalidates its React Query caches
   * after every mutation (see client/src/App.tsx).
   */
  invalidateQueries(invalidation?: unknown): void;
}

export const ACTION_BRAND = "@hatch/space-sdk/action/v1" as const;

export interface ActionDefinition<
  Req extends z.ZodType = z.ZodType,
  Res extends z.ZodType = z.ZodType,
> {
  readonly __brand: typeof ACTION_BRAND;
  readonly request: Req;
  readonly response: Res;
  readonly description?: string;
  readonly handler: (ctx: Ctx, args: z.infer<Req>) => Promise<z.infer<Res>>;
}

export function defineAction<Req extends z.ZodType, Res extends z.ZodType>(spec: {
  request: Req;
  response: Res;
  description?: string;
  handler: (ctx: Ctx, args: z.infer<Req>) => Promise<z.infer<Res>>;
}): ActionDefinition<Req, Res> {
  return { __brand: ACTION_BRAND, ...spec };
}

export type ActionsModule = Record<
  string,
  Omit<ActionDefinition, "handler"> & {
    handler: (ctx: Ctx, args: any) => Promise<any>;
  }
>;

export type ActionRequest<A extends { request: z.ZodType }> = z.infer<A["request"]>;
export type ActionResponse<A extends { response: z.ZodType }> = z.infer<A["response"]>;
