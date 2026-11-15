// ─────────────────────────────────────────────────────────────────────────────
// Local standalone replacement for `@hatch/space-sdk/client`.
//
// Reproduces the exact surface the KGN client uses:
//   • createActionClient<typeof Actions>() – a typed proxy; every property
//     access becomes an action call: POST ./actions with { action, args },
//     expecting a { data } / { error } JSON envelope (see standalone/server.ts)
//   • spaceQueryClient – the shared TanStack Query client used in main.tsx
//   • fileToBase64 / bytesToBase64 – chunked base64 encoding for photo uploads
//     (the same algorithm the platform SDK used; safe for multi-MB photos)
//   • ApiRequest / ApiResponse helper types
// ─────────────────────────────────────────────────────────────────────────────

import { QueryClient } from "@tanstack/react-query";
import type { input as ZodInput, ZodType } from "zod";

export const spaceQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export type ApiRequest<
  C extends Record<string, (args: never) => Promise<unknown>>,
  K extends keyof C,
> = Parameters<C[K]>[0];

export type ApiResponse<
  C extends Record<string, (args: never) => Promise<unknown>>,
  K extends keyof C,
> = Awaited<ReturnType<C[K]>>;

type ClientActionShape = {
  request: ZodType;
  response: ZodType;
};

export type ActionClient<A extends Record<string, ClientActionShape>> = {
  [K in keyof A]: (
    args: ZodInput<A[K]["request"]>,
  ) => Promise<import("zod").infer<A[K]["response"]>>;
};

export interface ClientOptions {
  /** Override the action endpoint (defaults to `./actions`). */
  endpoint?: string;
  /** Inject a custom fetch (mostly for tests). */
  fetch?: typeof globalThis.fetch;
}

export function createActionClient<A extends Record<string, ClientActionShape>>(
  options: ClientOptions = {},
): ActionClient<A> {
  const endpoint = options.endpoint ?? "./actions";
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  return new Proxy(
    {},
    {
      get(_target, name) {
        // Promise-protocol and symbol keys must not become phantom actions.
        if (typeof name !== "string") return undefined;
        if (name === "then" || name === "catch" || name === "finally") return undefined;
        return async (args: unknown) => {
          const response = await fetchImpl(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: name, args: args ?? {} }),
          });
          const body = (await response.json().catch(() => null)) as {
            data?: unknown;
            error?: string;
          } | null;
          if (!response.ok || (body && body.error)) {
            throw new Error(
              body?.error
                ? `action ${name} error: ${body.error}`
                : `action ${name} failed: HTTP ${response.status}`,
            );
          }
          return body?.data;
        };
      },
    },
  ) as ActionClient<A>;
}

/**
 * Base64-encode raw bytes in bounded 32 KB chunks so multi-megabyte phone
 * photos never hit the call-argument limit of the naive one-liner.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const native = bytes as Uint8Array & { toBase64?: () => string };
  if (typeof native.toBase64 === "function") return native.toBase64();
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/** Read a browser File/Blob into the { dataBase64, mimeType } upload shape. */
export async function fileToBase64(
  file: Blob,
): Promise<{ dataBase64: string; mimeType: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    dataBase64: bytesToBase64(bytes),
    mimeType: file.type || "application/octet-stream",
  };
}
