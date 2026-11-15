// ─────────────────────────────────────────────────────────────────────────────
// Create the first owner account for the standalone site.
//
//     OWNER_PASSWORD='choose-a-strong-password' bun run setup:owner <owner-email>
//
// or run it without OWNER_PASSWORD and you will be prompted for the password.
// This calls the app's own `setupOwnerAccount` action, so the password is
// stored exactly the way the app stores it (salted SHA-256 hash, never in
// plain text). It only creates the account when that email does not already
// exist — it never overwrites an existing owner's password.
// ─────────────────────────────────────────────────────────────────────────────

import { join } from "node:path";
import { Actions } from "../server/src/actions";
import { createCtx } from "../local/space-sdk/runtime";

const email = process.argv[2];
if (!email) {
  console.error("Usage: OWNER_PASSWORD='…' bun run setup:owner <owner-email>");
  process.exit(1);
}
const password = process.env.OWNER_PASSWORD ?? prompt("Owner password (min 8 characters): ");
if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const root = join(import.meta.dir, "..");
const ctx = createCtx({
  dbPath: process.env.DATABASE_PATH ?? join(root, "data", "app.db"),
  uploadsDir: process.env.UPLOADS_DIR ?? join(root, "data", "uploads"),
  migrationsDir: join(root, "drizzle"),
});

const result = await Actions.setupOwnerAccount.handler(ctx, { email, password });
if (result.seeded) {
  console.log(`Owner account created for ${email}. You can now sign in on the site:`);
  console.log("tap the “KGN PREMIUM BIKES” logo at the top of the site 5 times quickly");
  console.log("to open the hidden Owner sign-in, then use this email + password.");
} else {
  console.log(`An owner account for ${email} already exists — nothing was changed.`);
}
process.exit(0);
