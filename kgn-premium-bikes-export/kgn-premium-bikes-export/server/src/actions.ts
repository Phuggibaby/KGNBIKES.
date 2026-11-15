import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { asc, desc, eq } from "drizzle-orm";
import * as schema from "./schema";

type BikeRow = typeof schema.bikes.$inferSelect;

async function bikeOut(ctx: Ctx, b: BikeRow, allPhotos?: Array<typeof schema.bikePhotos.$inferSelect>) {
  const db = ctx.db<typeof schema>();
  let photoRows: Array<typeof schema.bikePhotos.$inferSelect> = [];
  if (allPhotos) {
    photoRows = allPhotos.filter((p) => p.bikeId === b.id).sort((a, c) => a.sortOrder - c.sortOrder);
  } else {
    try {
      const rows = await db.select().from(schema.bikePhotos).where(eq(schema.bikePhotos.bikeId, b.id)).orderBy(asc(schema.bikePhotos.sortOrder));
      photoRows = rows;
    } catch { photoRows = []; }
  }
  // Build ordered photos list. If gallery rows exist use them; otherwise
  // fall back to the legacy single uploaded photo (imageBlobKey).
  type PhotoOut = { blobKey: string; url: string; sortOrder: number };
  const photos: PhotoOut[] = [];
  if (photoRows.length > 0) {
    for (const p of photoRows) {
      let url = "";
      if (p.blobKey) { try { url = await ctx.blobs.getUrl(p.blobKey); } catch { url = ""; } }
      photos.push({ blobKey: p.blobKey, url, sortOrder: p.sortOrder });
    }
  } else if (b.imageBlobKey) {
    let url = "";
    try { url = await ctx.blobs.getUrl(b.imageBlobKey); } catch { url = ""; }
    photos.push({ blobKey: b.imageBlobKey, url, sortOrder: 0 });
  }
  const imageUrl = photos[0]?.url ?? "";
  const imageBlobKey = photos[0]?.blobKey ?? b.imageBlobKey ?? "";
  return {
    id: b.id,
    slug: b.slug,
    brand: b.brand,
    modelName: b.modelName,
    year: b.year,
    price: b.price,
    displacementCc: b.displacementCc,
    odometerKm: b.odometerKm,
    condition: b.condition,
    status: b.status,
    isFeatured: b.isFeatured === 1,
    color: b.color,
    fuelCapacityL: b.fuelCapacityL,
    transmission: b.transmission,
    mileageKmpl: b.mileageKmpl,
    engineType: b.engineType,
    registration: b.registration,
    description: b.description,
    imageKey: b.imageKey,
    imageBlobKey,
    imageUrl,
    photos,
    photoBlobKeys: photos.map((p) => p.blobKey),
    photoUrls: photos.map((p) => p.url),
    videoUrl: b.videoUrl,
    reelUrl: b.reelUrl,
    views: b.views,
    createdAt: b.createdAt.toISOString(),
  };
}

async function bikesOut(ctx: Ctx, rows: BikeRow[]) {
  const db = ctx.db<typeof schema>();
  let allPhotos: Array<typeof schema.bikePhotos.$inferSelect> = [];
  try { allPhotos = await db.select().from(schema.bikePhotos).orderBy(asc(schema.bikePhotos.sortOrder)); } catch { allPhotos = []; }
  const out = [];
  for (const r of rows) out.push(await bikeOut(ctx, r, allPhotos));
  return out;
}

/* Owner access: hidden from the customer side — no owner option is shown
   anywhere in the customer UI. Owners reach a separate dashboard through a
   hidden route and sign in with their Gmail + password. Each owner is a
   Gmail + password pair stored server-side in the owners table (password
   hashed with a per-owner salt, never returned to the client). Login issues
   a session token; every admin action verifies that token server-side.
   Repeated wrong passwords lock that email's login for 15 minutes.
   Customer pages need no owner login — owners use them like any customer. */
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
/* Owner sessions last 30 days and slide forward on every successful
   verify (see ownerVerifySession), so the owner dashboard does NOT
   disappear after a short idle period. It ends only when the owner
   taps Sign out, or after 30 days without opening the dashboard at
   all. The token is kept by the client in localStorage (not
   sessionStorage) so closing / backgrounding the app no longer
   discards it. */
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

async function getSetting(ctx: Ctx, key: string): Promise<string | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  return rows[0] ? rows[0].value : null;
}

async function setSetting(ctx: Ctx, key: string, value: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  if (existing[0]) await db.update(schema.settings).set({ value }).where(eq(schema.settings.key, key));
  else await db.insert(schema.settings).values({ key, value }).onConflictDoNothing();
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* Customer accounts: sign-up is username + mobile number OR Gmail +
   password (owner's updated rule, 2026-11-15 — replaces the earlier
   password-less mobile + username profile). The contact the customer
   gives is stored in exactly one of accounts.phone / accounts.email;
   the password is stored only as a salted SHA-256 hash (same scheme as
   owner passwords) and is never returned by any action. Sign-in accepts
   the username, the mobile number, or the Gmail — plus the password —
   from any device, so the account follows the customer anywhere. */
type AccountRow = typeof schema.accounts.$inferSelect;

function accountOut(a: AccountRow) {
  return {
    id: a.id,
    username: a.username,
    fullName: a.fullName,
    phone: a.phone ?? "",
    email: a.email ?? "",
    contact: a.email ?? a.phone ?? "",
  };
}

const accountOutSchema = z.object({
  id: z.number(), username: z.string(), fullName: z.string(),
  phone: z.string(), email: z.string(), contact: z.string(),
});

function normalizePhone(raw: string): string {
  const d = raw.replace(/[^0-9]/g, "");
  // Indian numbers are often typed with the 91 country code; store the
  // 10-digit form so sign-in matches however the customer types it.
  return d.length > 10 ? d.slice(-10) : d;
}

function parseContact(raw: string): { kind: "email"; value: string } | { kind: "phone"; value: string } | null {
  const v = raw.trim();
  if (v.includes("@")) {
    const email = normalizeEmail(v);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { kind: "email", value: email } : null;
  }
  const phone = normalizePhone(v);
  return phone.length >= 10 ? { kind: "phone", value: phone } : null;
}

async function findAccountByContact(ctx: Ctx, contact: { kind: "email" | "phone"; value: string }) {
  const db = ctx.db<typeof schema>();
  const rows = contact.kind === "email"
    ? await db.select().from(schema.accounts).where(eq(schema.accounts.email, contact.value)).limit(1)
    : await db.select().from(schema.accounts).where(eq(schema.accounts.phone, contact.value)).limit(1);
  return rows[0] ?? null;
}

async function findAccountByIdentifier(ctx: Ctx, identifier: string) {
  const db = ctx.db<typeof schema>();
  const v = identifier.trim();
  if (v.includes("@")) {
    const byEmail = await findAccountByContact(ctx, { kind: "email", value: normalizeEmail(v) });
    if (byEmail) return byEmail;
  } else {
    const phone = normalizePhone(v);
    if (phone.length >= 10) {
      const byPhone = await findAccountByContact(ctx, { kind: "phone", value: phone });
      if (byPhone) return byPhone;
    }
  }
  const byName = await db.select().from(schema.accounts).where(eq(schema.accounts.username, v.toLowerCase())).limit(1);
  return byName[0] ?? null;
}

/* Profile-change notes for the owners ("Our Family" in the owner
   dashboard): every customer profile change — sign-up, password set,
   password change, profile detail edit — is recorded here so owners
   can see who changed what and when. Password values are NEVER
   written here; only the fact of the change. Logging must never break
   the customer's own action, so failures are swallowed. */
async function logProfileChange(ctx: Ctx, account: AccountRow, changeType: string, detail: string): Promise<void> {
  try {
    const db = ctx.db<typeof schema>();
    await db.insert(schema.profileChanges).values({
      accountId: account.id, username: account.username, changeType, detail,
    });
  } catch { /* history table may not exist on very old DBs — the account action itself still succeeds */ }
}

async function verifyOwnerPassword(ctx: Ctx, email: string, password: string) {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.owners).where(eq(schema.owners.email, normalizeEmail(email))).limit(1);
  const owner = rows[0];
  if (!owner) return null;
  const hash = await hashPassword(password, owner.salt);
  return hash === owner.passwordHash ? owner : null;
}

async function getOwnerByToken(ctx: Ctx, token: string, opts?: { slide?: boolean }) {
  if (!token) return null;
  const db = ctx.db<typeof schema>();
  const sessions = await db.select().from(schema.ownerSessions).where(eq(schema.ownerSessions.token, token)).limit(1);
  const session = sessions[0];
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    await db.delete(schema.ownerSessions).where(eq(schema.ownerSessions.id, session.id));
    return null;
  }
  // Sliding renewal: verifying a live session pushes its expiry back to
  // a full 30 days, so active owners never hit a surprise sign-out.
  if (opts?.slide) {
    const fresh = Date.now() + SESSION_MS;
    if (session.expiresAt < fresh - 60 * 1000) {
      await db.update(schema.ownerSessions).set({ expiresAt: fresh }).where(eq(schema.ownerSessions.id, session.id));
    }
  }
  const owners = await db.select().from(schema.owners).where(eq(schema.owners.id, session.ownerId)).limit(1);
  return owners[0] ?? null;
}

async function requireOwner(ctx: Ctx, token: string) {
  const owner = await getOwnerByToken(ctx, token);
  if (!owner) {
    throw new Error("Owner access required — please sign in to the owner dashboard with your Gmail and password.");
  }
  return owner;
}

const bikeOutSchema = z.object({
  id: z.number(),
  slug: z.string(),
  brand: z.string(),
  modelName: z.string(),
  year: z.number(),
  price: z.number(),
  displacementCc: z.number(),
  odometerKm: z.number(),
  condition: z.string(),
  status: z.string(),
  isFeatured: z.boolean(),
  color: z.string(),
  fuelCapacityL: z.number(),
  transmission: z.string(),
  mileageKmpl: z.number(),
  engineType: z.string(),
  registration: z.string(),
  description: z.string(),
  imageKey: z.string(),
  imageBlobKey: z.string(),
  imageUrl: z.string(),
  photos: z.array(z.object({ blobKey: z.string(), url: z.string(), sortOrder: z.number() })),
  photoBlobKeys: z.array(z.string()),
  photoUrls: z.array(z.string()),
  videoUrl: z.string(),
  reelUrl: z.string(),
  views: z.number(),
  createdAt: z.string(),
});

/* Reel links taken from the shop's own Instagram page @kgn_premium_bikes
   (owner asked for reels from that page to be used in bike views;
   each URL below was verified live as authored by that account —
   see DATA-PLAN.md). GT reel shows a red Royal Enfield GT; the two
   Classic reels show Royal Enfield Classic bikes. */
const REEL_GT = "https://www.instagram.com/reel/DR_ROP5CYn1/";
const REEL_CLASSIC_1 = "https://www.instagram.com/reel/DTHpV6xCTw2/";
const REEL_CLASSIC_2 = "https://www.instagram.com/reel/DSrb5miCd1W/";
const REEL_SEEDS: Record<string, string> = {
  "continental-gt-650": REEL_GT,
  "classic-350": `${REEL_CLASSIC_1}, ${REEL_CLASSIC_2}`,
};

const CATALOG: Array<{
  slug: string; brand: string; modelName: string; year: number; price: number;
  displacementCc: number; odometerKm: number; condition: "NEW" | "PRE_OWNED";
  isFeatured: number; color: string; fuelCapacityL: number; transmission: string;
  mileageKmpl: number; engineType: string; registration: string; description: string; imageKey: string;
  reelUrl?: string;
}> = [
  { slug: "continental-gt-650", brand: "Royal Enfield", modelName: "Continental GT 650", year: 2022, price: 266000, displacementCc: 648, odometerKm: 22000, condition: "PRE_OWNED", isFeatured: 1, color: "Rocker Red", fuelCapacityL: 12.5, transmission: "6-speed manual", mileageKmpl: 27, engineType: "648cc parallel-twin, air-oil cooled", registration: "Registered", description: "The owner's first listing at KGN: a 2022 Continental GT 650 café racer, 22,000 km run, offered at ₹2,66,000. The 648cc parallel-twin with clip-on bars and that classic café-racer stance — inspected at the showroom in Proddatur. Call or WhatsApp for the best offer and a test ride.", imageKey: "continental-gt-650", reelUrl: REEL_GT },
  { slug: "classic-350", brand: "Royal Enfield", modelName: "Classic 350", year: 2025, price: 193000, displacementCc: 349, odometerKm: 0, condition: "NEW", isFeatured: 1, color: "Medallion Bronze", fuelCapacityL: 13, transmission: "5-speed manual", mileageKmpl: 35, engineType: "349cc single-cylinder, air-oil cooled (J-series)", registration: "New — registration at showroom", description: "The definitive retro roadster. Thumping J-series single, timeless teardrop tank and an easy, torquey ride that suits city and highway alike.", imageKey: "classic-350", reelUrl: `${REEL_CLASSIC_1}, ${REEL_CLASSIC_2}` },
  { slug: "interceptor-650", brand: "Royal Enfield", modelName: "Interceptor 650", year: 2025, price: 303000, displacementCc: 648, odometerKm: 0, condition: "NEW", isFeatured: 1, color: "Mark Three Black", fuelCapacityL: 13.7, transmission: "6-speed manual", mileageKmpl: 25, engineType: "648cc parallel-twin, air-oil cooled", registration: "New — registration at showroom", description: "Smooth 47 bhp parallel-twin in a classic British roadster frame. Effortless cruising, slipper clutch and that twin soundtrack.", imageKey: "interceptor-650" },
  { slug: "himalayan-450", brand: "Royal Enfield", modelName: "Himalayan 450", year: 2025, price: 285000, displacementCc: 452, odometerKm: 0, condition: "NEW", isFeatured: 1, color: "Slate Himalayan Salt", fuelCapacityL: 17, transmission: "6-speed manual", mileageKmpl: 30, engineType: "452cc single-cylinder, liquid-cooled (Sherpa 450)", registration: "New — registration at showroom", description: "Built for the mountains: liquid-cooled Sherpa engine, ride-by-wire, switchable ABS and long-travel suspension for real adventure touring.", imageKey: "himalayan-450" },
  { slug: "hunter-350", brand: "Royal Enfield", modelName: "Hunter 350", year: 2024, price: 150000, displacementCc: 349, odometerKm: 6200, condition: "PRE_OWNED", isFeatured: 0, color: "Rebel Red", fuelCapacityL: 13, transmission: "5-speed manual", mileageKmpl: 36, engineType: "349cc single-cylinder, air-oil cooled (J-series)", registration: "Registered — single owner", description: "Pre-owned, single owner, full service history at authorised centre. Nimble city roadster on the J-series platform — inspected and ready to ride.", imageKey: "hunter-350" },
  { slug: "ktm-390-duke", brand: "KTM", modelName: "390 Duke", year: 2025, price: 295000, displacementCc: 399, odometerKm: 0, condition: "NEW", isFeatured: 1, color: "Atlantic Blue", fuelCapacityL: 15, transmission: "6-speed manual, quickshifter-ready", mileageKmpl: 28, engineType: "399cc single-cylinder, liquid-cooled (LC4c)", registration: "New — registration at showroom", description: "The corner rocket: 46 PS, launch control, cornering ABS, 5-inch TFT and adjustable suspension. The sharpest naked in its class.", imageKey: "ktm-390-duke" },
  { slug: "ktm-250-duke", brand: "KTM", modelName: "250 Duke", year: 2025, price: 227000, displacementCc: 249, odometerKm: 0, condition: "NEW", isFeatured: 0, color: "Ceramic White", fuelCapacityL: 15, transmission: "6-speed manual", mileageKmpl: 32, engineType: "249cc single-cylinder, liquid-cooled", registration: "New — registration at showroom", description: "31 PS of lightweight aggression with a quickshifter, TFT dash and WP suspension — the everyday Duke with a serious edge.", imageKey: "ktm-250-duke" },
  { slug: "honda-cb350", brand: "Honda", modelName: "CB350", year: 2025, price: 210000, displacementCc: 348, odometerKm: 0, condition: "NEW", isFeatured: 0, color: "Pearl Igneous Black", fuelCapacityL: 15.2, transmission: "5-speed manual, assist & slipper clutch", mileageKmpl: 35, engineType: "348cc single-cylinder, air-cooled", registration: "New — registration at showroom", description: "Honda's refined retro: smooth air-cooled single, Honda Selectable Torque Control, emergency stop signal and premium fit and finish.", imageKey: "honda-cb350" },
  { slug: "pulsar-ns400z", brand: "Bajaj", modelName: "Pulsar NS400Z", year: 2025, price: 185000, displacementCc: 373, odometerKm: 0, condition: "NEW", isFeatured: 1, color: "Brooklyn Black", fuelCapacityL: 12, transmission: "6-speed manual, assist & slipper clutch", mileageKmpl: 30, engineType: "373cc single-cylinder, liquid-cooled", registration: "New — registration at showroom", description: "The biggest Pulsar ever: 40 PS, ride modes, USD forks and dual-channel ABS — flagship performance at a Pulsar price.", imageKey: "pulsar-ns400z" },
  { slug: "dominar-400", brand: "Bajaj", modelName: "Dominar 400", year: 2023, price: 165000, displacementCc: 373, odometerKm: 14800, condition: "PRE_OWNED", isFeatured: 0, color: "Aurora Green", fuelCapacityL: 13, transmission: "6-speed manual, slipper clutch", mileageKmpl: 27, engineType: "373cc single-cylinder, liquid-cooled, DOHC", registration: "Registered — second owner", description: "Pre-owned tourer, second owner, new tyres and recent major service. Hyperriding comfort with factory touring accessories fitted.", imageKey: "dominar-400" },
  { slug: "xpulse-200-4v", brand: "Hero", modelName: "Xpulse 200 4V", year: 2025, price: 140000, displacementCc: 200, odometerKm: 0, condition: "NEW", isFeatured: 0, color: "Blitz Blue", fuelCapacityL: 13, transmission: "5-speed manual", mileageKmpl: 42, engineType: "200cc single-cylinder, oil-cooled, 4-valve", registration: "New — registration at showroom", description: "India's favourite lightweight ADV: long-travel suspension, 21-inch front wheel, switchable ABS and go-anywhere toughness.", imageKey: "xpulse-200" },
  { slug: "yamaha-r15-v4", brand: "Yamaha", modelName: "YZF-R15 V4", year: 2025, price: 185000, displacementCc: 155, odometerKm: 0, condition: "NEW", isFeatured: 0, color: "Metallic Black", fuelCapacityL: 11, transmission: "6-speed manual, assist & slipper clutch", mileageKmpl: 45, engineType: "155cc single-cylinder, liquid-cooled with VVA", registration: "New — registration at showroom", description: "R1-inspired supersport with Variable Valve Actuation, USD forks, traction control and a quickshifter on select variants.", imageKey: "yamaha-r15" },
  { slug: "apache-rr310", brand: "TVS", modelName: "Apache RR 310", year: 2024, price: 242000, displacementCc: 312, odometerKm: 3900, condition: "PRE_OWNED", isFeatured: 0, color: "Racing Red", fuelCapacityL: 11, transmission: "6-speed manual", mileageKmpl: 33, engineType: "312cc single-cylinder, liquid-cooled, reverse-inclined", registration: "Registered — single owner", description: "Pre-owned, single owner, showroom maintained. Track-bred faired sportsbike with ride modes and a race-derived chassis.", imageKey: "apache-rr310" },
];

export const Actions = {
  listBikes: defineAction({
    description: "Lists all bikes (seeds the starter catalog of real models on first run), featured first.",
    request: z.object({}),
    response: z.object({ bikes: z.array(bikeOutSchema), brands: z.array(z.string()) }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      let rows = await db.select().from(schema.bikes);
      if (rows.length === 0) {
        for (const b of CATALOG) {
          await db.insert(schema.bikes).values({ ...b, status: "AVAILABLE" as const }).onConflictDoNothing();
        }
        rows = await db.select().from(schema.bikes);
      }
      // Ensure the owner's own first listing (Continental GT 650) is present
      // even on databases seeded before it was added; never duplicates.
      if (!rows.some((r) => r.slug === "continental-gt-650")) {
        const gt = CATALOG.find((b) => b.slug === "continental-gt-650");
        if (gt) {
          await db.insert(schema.bikes).values({ ...gt, status: "AVAILABLE" as const }).onConflictDoNothing();
          rows = await db.select().from(schema.bikes);
        }
      }
      // Fill in the Instagram-page reel links for the bikes they match,
      // only where the owner has not already set a reel — never overwrites
      // an owner's own reel link.
      let filledReel = false;
      for (const row of rows) {
        const seed = REEL_SEEDS[row.slug];
        if (seed && !row.reelUrl.trim()) {
          await db.update(schema.bikes).set({ reelUrl: seed }).where(eq(schema.bikes.id, row.id));
          filledReel = true;
        }
      }
      if (filledReel) rows = await db.select().from(schema.bikes);
      rows.sort((a, b) => (b.isFeatured - a.isFeatured) || (b.id - a.id));
      const brands = [...new Set(rows.map((r) => r.brand))].sort();
      return { bikes: await bikesOut(ctx, rows), brands };
    },
  }),

  getBike: defineAction({
    description: "Gets one bike by id and counts the view.",
    request: z.object({ id: z.number().int() }),
    response: z.object({ bike: bikeOutSchema.nullable() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.bikes).where(eq(schema.bikes.id, args.id)).limit(1);
      const row = rows[0];
      if (!row) return { bike: null };
      await db.update(schema.bikes).set({ views: row.views + 1 }).where(eq(schema.bikes.id, args.id));
      return { bike: await bikeOut(ctx, { ...row, views: row.views + 1 }) };
    },
  }),

  registerAccount: defineAction({
    description: "Signs a customer up with a username, a mobile number or Gmail, and a password (stored hashed server-side); an older password-less account with the same username and contact claims it by setting its password here.",
    request: z.object({
      username: z.string().min(3).max(40),
      fullName: z.string().min(2).max(80),
      contact: z.string().min(5).max(120),
      password: z.string().min(8).max(120),
    }),
    response: z.object({
      ok: z.boolean(),
      message: z.string(),
      account: accountOutSchema.nullable(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const username = args.username.trim().toLowerCase();
      if (!/^[a-z0-9_.-]+$/.test(username)) {
        return { ok: false, message: "Username can use letters, numbers, dots, dashes and underscores only.", account: null };
      }
      const contact = parseContact(args.contact);
      if (!contact) {
        return { ok: false, message: "Enter a valid 10-digit mobile number or a valid Gmail / email address.", account: null };
      }
      // DUPLICATE USERNAMES ARE NEVER TAKEN. Usernames are stored
      // lowercased, so this check is case-insensitive ("Rider_01",
      // "rider_01" and "RIDER_01" are the same username), and the
      // accounts.username column is UNIQUE at the database level as a
      // second guard. The username is checked FIRST — before the
      // contact — so a taken username always gets the clear
      // "username is taken" answer, whatever contact was typed.
      // The single exception is the pre-password claim below: the SAME
      // account (same username AND same contact) setting its first
      // password is not a duplicate — it is that account itself.
      const byNameRows = await db.select().from(schema.accounts).where(eq(schema.accounts.username, username)).limit(1);
      const byName = byNameRows[0] ?? null;
      const byContact = await findAccountByContact(ctx, contact);
      if (byName && (!byContact || byContact.id !== byName.id)) {
        return { ok: false, message: `The username "${username}" is already taken — usernames must be unique, please pick a different one. If this is your own account, use Sign in instead.`, account: null };
      }
      if (byContact) {
        if (byContact.passwordHash) {
          return { ok: false, message: "An account with this mobile number / Gmail already exists — please sign in with your password instead.", account: null };
        }
        // Account created before customer passwords existed: the owner of
        // the same username + contact claims it by setting a password now.
        if (byContact.username !== username) {
          return { ok: false, message: "This mobile number / Gmail is linked to a different username — sign up with the username you used before to set your password.", account: null };
        }
        const salt = randomHex(16);
        const passwordHash = await hashPassword(args.password, salt);
        const nameChanged = byContact.fullName !== args.fullName.trim();
        await db.update(schema.accounts).set({ passwordHash, salt, fullName: args.fullName.trim() }).where(eq(schema.accounts.id, byContact.id));
        const claimed = { ...byContact, passwordHash, salt, fullName: args.fullName.trim() };
        await logProfileChange(ctx, claimed, "PASSWORD_SET", nameChanged
          ? `Set a password for this existing account and updated the full name from "${byContact.fullName}" to "${args.fullName.trim()}". (Password value is never shown.)`
          : "Set a password for this existing account (created before passwords). (Password value is never shown.)");
        ctx.invalidateQueries();
        return { ok: true, message: "Password set — your existing account is now protected and you are signed in.", account: accountOut(claimed) };
      }
      const salt = randomHex(16);
      const passwordHash = await hashPassword(args.password, salt);
      let a: AccountRow | undefined;
      try {
        const inserted = await db.insert(schema.accounts).values({
          username, fullName: args.fullName.trim(),
          phone: contact.kind === "phone" ? contact.value : null,
          email: contact.kind === "email" ? contact.value : null,
          passwordHash, salt,
        }).returning();
        a = inserted[0];
      } catch {
        // Database UNIQUE guard fired (e.g. two sign-ups at the same
        // moment) — report it as the duplicate it is, never as a crash.
        return { ok: false, message: `The username "${username}" is already taken — usernames must be unique, please pick a different one.`, account: null };
      }
      if (!a) return { ok: false, message: "Could not create the account. Please try again.", account: null };
      await logProfileChange(ctx, a, "SIGNUP", `Joined KGN — signed up as @${a.username} with ${contact.kind === "email" ? `Gmail ${contact.value}` : `mobile number ${contact.value}`}.`);
      ctx.invalidateQueries();
      return { ok: true, message: "Account created — you are signed in. Next time, sign in from anywhere with your username, mobile number or Gmail, plus this password.", account: accountOut(a) };
    },
  }),

  signInAccount: defineAction({
    description: "Signs a customer back in from any device with their username, mobile number or Gmail, plus the password they signed up with.",
    request: z.object({
      identifier: z.string().min(3).max(120),
      password: z.string().min(1).max(120),
    }),
    response: z.object({
      ok: z.boolean(),
      message: z.string(),
      account: accountOutSchema.nullable(),
    }),
    async handler(ctx, args) {
      const a = await findAccountByIdentifier(ctx, args.identifier);
      if (!a) return { ok: false, message: "No account found for that username, mobile number or Gmail — please sign up first.", account: null };
      if (!a.passwordHash) {
        return { ok: false, message: "This account was created before passwords — please use Sign up with the same username and mobile number to set your password, then sign in.", account: null };
      }
      const hash = await hashPassword(args.password, a.salt);
      if (hash !== a.passwordHash) {
        return { ok: false, message: "That password isn't right for this account — check it and try again.", account: null };
      }
      return { ok: true, message: `Welcome back, ${a.fullName.split(" ")[0]} — you're signed in.`, account: accountOut(a) };
    },
  }),

  changeAccountPassword: defineAction({
    description: "Changes a signed-in customer's password after verifying their current password.",
    request: z.object({
      accountId: z.number().int(),
      currentPassword: z.string().min(1).max(120),
      newPassword: z.string().min(8).max(120),
    }),
    response: z.object({ ok: z.boolean(), message: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.accounts).where(eq(schema.accounts.id, args.accountId)).limit(1);
      const a = rows[0];
      if (!a || !a.passwordHash) return { ok: false, message: "Account not found — please sign in again." };
      const hash = await hashPassword(args.currentPassword, a.salt);
      if (hash !== a.passwordHash) return { ok: false, message: "Current password is incorrect — nothing was changed." };
      const salt = randomHex(16);
      const passwordHash = await hashPassword(args.newPassword, salt);
      await db.update(schema.accounts).set({ passwordHash, salt }).where(eq(schema.accounts.id, a.id));
      await logProfileChange(ctx, a, "PASSWORD_CHANGED", "Changed their sign-in password from My KGN → Profile. (Old and new password values are never shown.)");
      ctx.invalidateQueries();
      return { ok: true, message: "Password changed. Use the new password the next time you sign in." };
    },
  }),

  checkUsernameAvailable: defineAction({
    description: "Checks whether a customer username is free for sign-up (usernames are unique, case-insensitive) so the sign-up form can warn about a duplicate before submitting.",
    request: z.object({ username: z.string().min(1).max(40) }),
    response: z.object({ available: z.boolean(), message: z.string() }),
    async handler(ctx, args) {
      const username = args.username.trim().toLowerCase();
      if (username.length < 3) return { available: false, message: "Username needs at least 3 characters." };
      if (!/^[a-z0-9_.-]+$/.test(username)) return { available: false, message: "Letters, numbers, dots, dashes and underscores only." };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.accounts).where(eq(schema.accounts.username, username)).limit(1);
      if (rows[0]) return { available: false, message: `✗ "${username}" is already taken — please pick a different username.` };
      return { available: true, message: `✓ "${username}" is available.` };
    },
  }),

  updateAccountProfile: defineAction({
    description: "Updates a signed-in customer's profile details (full name and mobile number / Gmail contact); the username never changes, a contact already used by another account is refused, and every change is noted for the owners' Our Family history.",
    request: z.object({
      accountId: z.number().int(),
      fullName: z.string().min(2).max(80),
      contact: z.string().min(5).max(120),
    }),
    response: z.object({ ok: z.boolean(), message: z.string(), account: accountOutSchema.nullable() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.accounts).where(eq(schema.accounts.id, args.accountId)).limit(1);
      const a = rows[0];
      if (!a) return { ok: false, message: "Account not found — please sign in again.", account: null };
      const contact = parseContact(args.contact);
      if (!contact) return { ok: false, message: "Enter a valid 10-digit mobile number or a valid Gmail / email address.", account: null };
      const holder = await findAccountByContact(ctx, contact);
      if (holder && holder.id !== a.id) {
        return { ok: false, message: "That mobile number / Gmail is already used by another KGN account — please use a different one.", account: null };
      }
      const newName = args.fullName.trim();
      const oldContact = a.email ?? a.phone ?? "";
      const changes: string[] = [];
      if (newName !== a.fullName) changes.push(`Full name changed from "${a.fullName}" to "${newName}".`);
      if (contact.value !== oldContact) changes.push(`Contact changed from "${oldContact || "—"}" to "${contact.value}" (${contact.kind === "email" ? "Gmail" : "mobile number"}).`);
      if (changes.length === 0) return { ok: true, message: "No changes — your profile already has these details.", account: accountOut(a) };
      const updated: AccountRow = {
        ...a, fullName: newName,
        phone: contact.kind === "phone" ? contact.value : null,
        email: contact.kind === "email" ? contact.value : null,
      };
      try {
        await db.update(schema.accounts).set({
          fullName: newName,
          phone: updated.phone, email: updated.email,
        }).where(eq(schema.accounts.id, a.id));
      } catch {
        return { ok: false, message: "That mobile number / Gmail is already used by another KGN account — please use a different one.", account: null };
      }
      for (const detail of changes) {
        await logProfileChange(ctx, updated, "PROFILE_UPDATED", detail);
      }
      ctx.invalidateQueries();
      return { ok: true, message: "Profile updated — the change is saved to your account.", account: accountOut(updated) };
    },
  }),

  ownerListFamily: defineAction({
    description: "Lists every signed-up customer for the owner dashboard's Our Family section, with wishlist/enquiry counts and the full profile-change history notes (owner login required; passwords are never returned).",
    request: z.object({ ownerToken: z.string().max(200) }),
    response: z.object({
      users: z.array(z.object({
        id: z.number(), username: z.string(), fullName: z.string(), phone: z.string(), email: z.string(),
        contact: z.string(), createdAt: z.string(), wishlistCount: z.number(), enquiryCount: z.number(),
      })),
      changes: z.array(z.object({
        id: z.number(), accountId: z.number(), username: z.string(), fullName: z.string(),
        changeType: z.string(), detail: z.string(), createdAt: z.string(),
      })),
    }),
    async handler(ctx, args) {
      await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      const accs = await db.select().from(schema.accounts).orderBy(desc(schema.accounts.id));
      const wish = await db.select().from(schema.wishlist);
      const enqs = await db.select().from(schema.enquiries);
      let changeRows: Array<typeof schema.profileChanges.$inferSelect> = [];
      try {
        changeRows = await db.select().from(schema.profileChanges).orderBy(desc(schema.profileChanges.id)).limit(300);
      } catch { changeRows = []; }
      const nameById = new Map(accs.map((a) => [a.id, a.fullName]));
      return {
        users: accs.map((a) => ({
          id: a.id, username: a.username, fullName: a.fullName,
          phone: a.phone ?? "", email: a.email ?? "", contact: a.email ?? a.phone ?? "",
          createdAt: a.createdAt.toISOString(),
          wishlistCount: wish.filter((w) => w.accountId === a.id).length,
          enquiryCount: enqs.filter((e) => e.accountId === a.id).length,
        })),
        changes: changeRows.map((c) => ({
          id: c.id, accountId: c.accountId, username: c.username,
          fullName: nameById.get(c.accountId) ?? "",
          changeType: c.changeType, detail: c.detail, createdAt: c.createdAt.toISOString(),
        })),
      };
    },
  }),

  toggleWishlist: defineAction({
    description: "Adds or removes a bike from a customer's wishlist.",
    request: z.object({ accountId: z.number().int(), bikeId: z.number().int() }),
    response: z.object({ saved: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.wishlist).where(eq(schema.wishlist.accountId, args.accountId));
      const existing = rows.find((r) => r.bikeId === args.bikeId);
      if (existing) {
        await db.delete(schema.wishlist).where(eq(schema.wishlist.id, existing.id));
        ctx.invalidateQueries();
        return { saved: false };
      }
      await db.insert(schema.wishlist).values({ accountId: args.accountId, bikeId: args.bikeId });
      ctx.invalidateQueries();
      return { saved: true };
    },
  }),

  getMyData: defineAction({
    description: "Returns a customer's wishlist bike ids, enquiries and chat threads.",
    request: z.object({ accountId: z.number().int() }),
    response: z.object({
      wishlistBikeIds: z.array(z.number()),
      enquiries: z.array(z.object({
        id: z.number(), bikeId: z.number().nullable(), bikeLabel: z.string(), channel: z.string(),
        status: z.string(), createdAt: z.string(), unread: z.number(),
      })),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const wish = await db.select().from(schema.wishlist).where(eq(schema.wishlist.accountId, args.accountId));
      const enqs = await db.select().from(schema.enquiries).where(eq(schema.enquiries.accountId, args.accountId)).orderBy(desc(schema.enquiries.id));
      const bikes = await db.select().from(schema.bikes);
      const msgs = await db.select().from(schema.chatMessages);
      return {
        wishlistBikeIds: wish.map((w) => w.bikeId),
        enquiries: enqs.map((e) => {
          const bike = e.bikeId ? bikes.find((b) => b.id === e.bikeId) : undefined;
          return {
            id: e.id,
            bikeId: e.bikeId,
            bikeLabel: bike ? `${bike.year} ${bike.brand} ${bike.modelName}` : "General enquiry",
            channel: e.channel,
            status: e.status,
            createdAt: e.createdAt.toISOString(),
            unread: msgs.filter((m) => m.enquiryId === e.id && m.sender === "DEALER" && m.isRead === 0).length,
          };
        }),
      };
    },
  }),

  listReviews: defineAction({
    description: "Lists all public customer reviews, newest first, with the average rating — shown in the Customer reviews section for every visitor.",
    request: z.object({}),
    response: z.object({
      reviews: z.array(z.object({
        id: z.number(), reviewerName: z.string(), username: z.string(),
        rating: z.number(), title: z.string(), reviewText: z.string(),
        bikeId: z.number().nullable(), bikeLabel: z.string(), createdAt: z.string(),
      })),
      averageRating: z.number(),
      count: z.number(),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      let rows: Array<typeof schema.reviews.$inferSelect> = [];
      try {
        rows = await db.select().from(schema.reviews).orderBy(desc(schema.reviews.id)).limit(100);
      } catch { rows = []; }
      const count = rows.length;
      const averageRating = count > 0 ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
      return {
        reviews: rows.map((r) => ({
          id: r.id, reviewerName: r.reviewerName, username: r.username,
          rating: r.rating, title: r.title, reviewText: r.reviewText,
          bikeId: r.bikeId, bikeLabel: r.bikeLabel, createdAt: r.createdAt.toISOString(),
        })),
        averageRating,
        count,
      };
    },
  }),

  createReview: defineAction({
    description: "Submits a customer review — only for a signed-in customer (the account must exist server-side); the review is then shown publicly in the Customer reviews section.",
    request: z.object({
      accountId: z.number().int(),
      rating: z.number().int().min(1).max(5),
      title: z.string().max(120).default(""),
      reviewText: z.string().min(3).max(1000),
      bikeId: z.number().int().nullable().default(null),
    }),
    response: z.object({ ok: z.boolean(), message: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const accRows = await db.select().from(schema.accounts).where(eq(schema.accounts.id, args.accountId)).limit(1);
      const acc = accRows[0];
      if (!acc) {
        return { ok: false, message: "Only signed-in customers can give a review — please sign in first, then try again." };
      }
      const text = args.reviewText.trim();
      if (text.length < 3) return { ok: false, message: "Please write a few words about your experience." };
      let bikeLabel = "";
      if (args.bikeId) {
        const bikeRows = await db.select().from(schema.bikes).where(eq(schema.bikes.id, args.bikeId)).limit(1);
        const b = bikeRows[0];
        if (b) bikeLabel = `${b.year} ${b.brand} ${b.modelName}`;
      }
      await db.insert(schema.reviews).values({
        accountId: acc.id,
        reviewerName: acc.fullName,
        username: acc.username,
        rating: args.rating,
        title: args.title.trim(),
        reviewText: text,
        bikeId: args.bikeId,
        bikeLabel,
      });
      ctx.invalidateQueries();
      return { ok: true, message: "Thank you! Your review is now shown in Customer reviews below." };
    },
  }),

  createEnquiry: defineAction({
    description: "Creates an enquiry (form, WhatsApp tap, or call tap) and optionally opens a chat thread with a first message.",
    request: z.object({
      bikeId: z.number().int().nullable(),
      accountId: z.number().int().nullable(),
      customerName: z.string().min(1).max(80),
      customerPhone: z.string().min(7).max(20),
      channel: z.enum(["CHAT", "WHATSAPP", "CALL", "FORM"]),
      message: z.string().max(2000).default(""),
    }),
    response: z.object({ enquiryId: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.enquiries).values({
        bikeId: args.bikeId, accountId: args.accountId,
        customerName: args.customerName.trim(), customerPhone: args.customerPhone.trim(),
        channel: args.channel, status: "NEW", temperature: "WARM",
      }).returning({ id: schema.enquiries.id });
      const row = inserted[0];
      if (!row) throw new Error("createEnquiry failed");
      if (args.message.trim()) {
        await db.insert(schema.chatMessages).values({ enquiryId: row.id, sender: "CUSTOMER", text: args.message.trim(), isRead: 0 });
      }
      ctx.invalidateQueries();
      return { enquiryId: row.id };
    },
  }),

  listMessages: defineAction({
    description: "Lists chat messages for one enquiry thread, oldest first.",
    request: z.object({ enquiryId: z.number().int() }),
    response: z.object({
      messages: z.array(z.object({ id: z.number(), sender: z.string(), text: z.string(), isRead: z.boolean(), sentAt: z.string() })),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.chatMessages).where(eq(schema.chatMessages.enquiryId, args.enquiryId)).orderBy(asc(schema.chatMessages.id));
      return { messages: rows.map((m) => ({ id: m.id, sender: m.sender, text: m.text, isRead: m.isRead === 1, sentAt: m.sentAt.toISOString() })) };
    },
  }),

  sendMessage: defineAction({
    description: "Sends a chat message in an enquiry thread as customer or dealer.",
    request: z.object({ enquiryId: z.number().int(), sender: z.enum(["CUSTOMER", "DEALER"]), text: z.string().min(1).max(2000), ownerToken: z.string().max(200).default("") }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      if (args.sender === "DEALER") await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.chatMessages).values({ enquiryId: args.enquiryId, sender: args.sender, text: args.text.trim(), isRead: 0 }).returning({ id: schema.chatMessages.id });
      const row = inserted[0];
      if (!row) throw new Error("sendMessage failed");
      const enq = await db.select().from(schema.enquiries).where(eq(schema.enquiries.id, args.enquiryId)).limit(1);
      if (enq[0] && enq[0].status === "NEW" && args.sender === "DEALER") {
        await db.update(schema.enquiries).set({ status: "IN_PROGRESS" }).where(eq(schema.enquiries.id, args.enquiryId));
      }
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  markRead: defineAction({
    description: "Marks the other party's messages in a thread as read.",
    request: z.object({ enquiryId: z.number().int(), reader: z.enum(["CUSTOMER", "DEALER"]) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const other = args.reader === "CUSTOMER" ? "DEALER" : "CUSTOMER";
      const rows = await db.select().from(schema.chatMessages).where(eq(schema.chatMessages.enquiryId, args.enquiryId));
      for (const m of rows) {
        if (m.sender === other && m.isRead === 0) {
          await db.update(schema.chatMessages).set({ isRead: 1 }).where(eq(schema.chatMessages.id, m.id));
        }
      }
      return { ok: true };
    },
  }),

  getSettings: defineAction({
    description: "Returns dealer contact settings (WhatsApp numbers, call number, address, city, hours), seeded with the owner's real details on first run.",
    request: z.object({}),
    response: z.object({ whatsappNumber: z.string(), whatsappNumber2: z.string(), callNumber: z.string(), showroomCity: z.string(), address: z.string(), hours: z.string(), instagramHandle: z.string(), instagramFollowers: z.string() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      // Owner-supplied details (provided 2026-11-15); seeded once when a key
      // is absent, editable thereafter in Owner → Settings, never overwritten.
      const defaults: Array<[string, string]> = [
        ["whatsapp_number", "9133091389"],
        ["whatsapp_number_2", "8106900126"],
        ["call_number", "8106900126"],
        ["showroom_city", "Proddatur, Andhra Pradesh"],
        ["address", "Opposite Panduranga Temple, Mydukur Road, Proddatur - 516360, Andhra Pradesh"],
        ["instagram_handle", "kgn_premium_bikes"],
        ["instagram_followers", "69K"],
      ];
      let rows = await db.select().from(schema.settings);
      let seeded = false;
      for (const [key, value] of defaults) {
        if (!rows.some((r) => r.key === key)) {
          await db.insert(schema.settings).values({ key, value }).onConflictDoNothing();
          seeded = true;
        }
      }
      if (seeded) rows = await db.select().from(schema.settings);
      const get = (k: string) => rows.find((r) => r.key === k)?.value ?? "";
      return { whatsappNumber: get("whatsapp_number"), whatsappNumber2: get("whatsapp_number_2"), callNumber: get("call_number"), showroomCity: get("showroom_city"), address: get("address"), hours: get("hours"), instagramHandle: get("instagram_handle"), instagramFollowers: get("instagram_followers") };
    },
  }),

  setupOwnerAccount: defineAction({
    description: "One-time owner setup: creates the first owner (Gmail + password, hashed server-side) only when that email does not already exist; never overwrites an existing owner's password.",
    request: z.object({ email: z.string().min(5).max(120), password: z.string().min(8).max(120) }),
    response: z.object({ ok: z.boolean(), seeded: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const email = normalizeEmail(args.email);
      const existing = await db.select().from(schema.owners).where(eq(schema.owners.email, email)).limit(1);
      if (existing[0]) return { ok: true, seeded: false };
      const salt = randomHex(16);
      const passwordHash = await hashPassword(args.password, salt);
      await db.insert(schema.owners).values({ email, passwordHash, salt }).onConflictDoNothing();
      ctx.invalidateQueries();
      return { ok: true, seeded: true };
    },
  }),

  ownerLogin: defineAction({
    description: "Signs an owner in to the hidden owner dashboard with their Gmail and password; returns a session token on success and locks that email after repeated wrong passwords.",
    request: z.object({ email: z.string().min(5).max(120), password: z.string().min(1).max(120) }),
    response: z.object({ ok: z.boolean(), token: z.string(), email: z.string(), locked: z.boolean(), message: z.string() }),
    async handler(ctx, args) {
      const email = normalizeEmail(args.email);
      const lockKey = `owner_login_locked_until_${email}`;
      const attemptsKey = `owner_login_attempts_${email}`;
      const lockedUntil = Number((await getSetting(ctx, lockKey)) ?? "0") || 0;
      if (lockedUntil > Date.now()) {
        return { ok: false, token: "", email: "", locked: true, message: "Too many wrong attempts — owner login for this email is locked for 15 minutes. Please try again later." };
      }
      const owner = await verifyOwnerPassword(ctx, email, args.password);
      if (!owner) {
        const attempts = (Number((await getSetting(ctx, attemptsKey)) ?? "0") || 0) + 1;
        if (attempts >= LOGIN_MAX_ATTEMPTS) {
          await setSetting(ctx, lockKey, String(Date.now() + LOGIN_LOCK_MS));
          await setSetting(ctx, attemptsKey, "0");
          return { ok: false, token: "", email: "", locked: true, message: "Too many wrong attempts — owner login for this email is locked for 15 minutes. Please try again later." };
        }
        await setSetting(ctx, attemptsKey, String(attempts));
        return { ok: false, token: "", email: "", locked: false, message: "That Gmail or password isn't right for an owner account. Check both and try again." };
      }
      await setSetting(ctx, attemptsKey, "0");
      const db = ctx.db<typeof schema>();
      const token = `${randomHex(32)}.${randomHex(16)}`;
      await db.insert(schema.ownerSessions).values({ token, ownerId: owner.id, expiresAt: Date.now() + SESSION_MS });
      ctx.invalidateQueries();
      return { ok: true, token, email: owner.email, locked: false, message: `Welcome back — signed in as owner ${owner.email}.` };
    },
  }),

  ownerVerifySession: defineAction({
    description: "Checks an owner session token and returns the signed-in owner's email, without exposing any password; a live session slides forward to a fresh 30 days so the dashboard does not vanish after idle time.",
    request: z.object({ token: z.string().max(200) }),
    response: z.object({ ok: z.boolean(), email: z.string() }),
    async handler(ctx, args) {
      const owner = await getOwnerByToken(ctx, args.token, { slide: true });
      return { ok: !!owner, email: owner?.email ?? "" };
    },
  }),

  uploadBikePhoto: defineAction({
    description: "Uploads a bike photo picked by the owner from their device gallery or local disk (owner login required); stores the bytes as an owned blob and returns its key and display URL.",
    request: z.object({
      ownerToken: z.string().max(200),
      dataBase64: z.string().min(1).max(14_000_000),
      mimeType: z.string().min(3).max(60),
    }),
    response: z.object({ ok: z.boolean(), blobKey: z.string(), url: z.string(), message: z.string() }),
    async handler(ctx, args) {
      await requireOwner(ctx, args.ownerToken);
      const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
      const ext = allowed[args.mimeType];
      if (!ext) return { ok: false, blobKey: "", url: "", message: "Please pick a JPG, PNG, WebP or GIF photo from your gallery." };
      let bytes: Uint8Array;
      try {
        const bin = atob(args.dataBase64);
        bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      } catch {
        return { ok: false, blobKey: "", url: "", message: "That photo could not be read — please pick it again." };
      }
      if (bytes.length === 0) return { ok: false, blobKey: "", url: "", message: "That photo file looks empty — please pick another one." };
      if (bytes.length > 10 * 1024 * 1024) return { ok: false, blobKey: "", url: "", message: "That photo is over 10 MB — please pick a smaller one." };
      const key = `bike-photos/${Date.now().toString(36)}-${randomHex(8)}.${ext}`;
      await ctx.blobs.put(key, bytes, { contentType: args.mimeType });
      const url = await ctx.blobs.getUrl(key);
      ctx.invalidateQueries();
      return { ok: true, blobKey: key, url, message: "Photo uploaded — it will be this bike's photo when you save the listing." };
    },
  }),

  ownerLogout: defineAction({
    description: "Signs an owner out by deleting their dashboard session token.",
    request: z.object({ token: z.string().max(200) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.ownerSessions).where(eq(schema.ownerSessions.token, args.token));
      for (const r of rows) await db.delete(schema.ownerSessions).where(eq(schema.ownerSessions.id, r.id));
      return { ok: true };
    },
  }),

  ownerListOwners: defineAction({
    description: "Lists all owner emails for the owner dashboard (owner login required); passwords are never returned.",
    request: z.object({ ownerToken: z.string().max(200) }),
    response: z.object({ owners: z.array(z.object({ id: z.number(), email: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.owners).orderBy(asc(schema.owners.id));
      return { owners: rows.map((o) => ({ id: o.id, email: o.email, createdAt: o.createdAt.toISOString() })) };
    },
  }),

  ownerAddOwner: defineAction({
    description: "Adds another owner (Gmail + password) from the owner dashboard (owner login required); each owner is one Gmail + password pair.",
    request: z.object({ ownerToken: z.string().max(200), email: z.string().min(5).max(120), password: z.string().min(8).max(120) }),
    response: z.object({ ok: z.boolean(), message: z.string() }),
    async handler(ctx, args) {
      await requireOwner(ctx, args.ownerToken);
      const email = normalizeEmail(args.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "That doesn't look like a valid Gmail / email address." };
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.owners).where(eq(schema.owners.email, email)).limit(1);
      if (existing[0]) return { ok: false, message: "An owner with that Gmail already exists." };
      const salt = randomHex(16);
      const passwordHash = await hashPassword(args.password, salt);
      await db.insert(schema.owners).values({ email, passwordHash, salt });
      ctx.invalidateQueries();
      return { ok: true, message: `Owner added — ${email} can now sign in to the owner dashboard with their password.` };
    },
  }),

  ownerRemoveOwner: defineAction({
    description: "Removes an owner from the owner dashboard (owner login required); the last remaining owner and your own account cannot be removed here.",
    request: z.object({ ownerToken: z.string().max(200), email: z.string().min(5).max(120) }),
    response: z.object({ ok: z.boolean(), message: z.string() }),
    async handler(ctx, args) {
      const me = await requireOwner(ctx, args.ownerToken);
      const email = normalizeEmail(args.email);
      if (email === me.email) return { ok: false, message: "You can't remove your own owner account while signed in with it — sign in as another owner to do that." };
      const db = ctx.db<typeof schema>();
      const all = await db.select().from(schema.owners);
      if (all.length <= 1) return { ok: false, message: "The last owner can't be removed — the showroom must always have at least one owner." };
      const target = all.find((o) => o.email === email);
      if (!target) return { ok: false, message: "No owner with that Gmail was found." };
      await db.delete(schema.ownerSessions).where(eq(schema.ownerSessions.ownerId, target.id));
      await db.delete(schema.owners).where(eq(schema.owners.id, target.id));
      ctx.invalidateQueries();
      return { ok: true, message: `Owner ${email} removed — they can no longer sign in to the owner dashboard.` };
    },
  }),

  ownerChangePassword: defineAction({
    description: "Changes the signed-in owner's dashboard password after verifying their current password (owner login required).",
    request: z.object({ ownerToken: z.string().max(200), currentPassword: z.string().min(1).max(120), newPassword: z.string().min(8).max(120) }),
    response: z.object({ ok: z.boolean(), message: z.string() }),
    async handler(ctx, args) {
      const me = await requireOwner(ctx, args.ownerToken);
      const verified = await verifyOwnerPassword(ctx, me.email, args.currentPassword);
      if (!verified) return { ok: false, message: "Current password is incorrect — nothing was changed." };
      const db = ctx.db<typeof schema>();
      const salt = randomHex(16);
      const passwordHash = await hashPassword(args.newPassword, salt);
      await db.update(schema.owners).set({ passwordHash, salt }).where(eq(schema.owners.id, me.id));
      ctx.invalidateQueries();
      return { ok: true, message: "Password changed. Use the new password the next time you sign in to the owner dashboard." };
    },
  }),

  saveSettings: defineAction({
    description: "Saves dealer contact settings from the owner portal (owner login required).",
    request: z.object({ whatsappNumber: z.string().max(20), whatsappNumber2: z.string().max(20), callNumber: z.string().max(20), showroomCity: z.string().max(80), address: z.string().max(200), hours: z.string().max(120), instagramHandle: z.string().max(60), instagramFollowers: z.string().max(20), ownerToken: z.string().max(200) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      const pairs: Array<[string, string]> = [
        ["whatsapp_number", args.whatsappNumber.trim()],
        ["whatsapp_number_2", args.whatsappNumber2.trim()],
        ["call_number", args.callNumber.trim()],
        ["showroom_city", args.showroomCity.trim()],
        ["address", args.address.trim()],
        ["hours", args.hours.trim()],
        ["instagram_handle", args.instagramHandle.trim().replace(/^@/, "")],
        ["instagram_followers", args.instagramFollowers.trim()],
      ];
      for (const [key, value] of pairs) {
        const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
        if (existing[0]) await db.update(schema.settings).set({ value }).where(eq(schema.settings.key, key));
        else await db.insert(schema.settings).values({ key, value });
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminUpsertBike: defineAction({
    description: "Creates or updates a bike listing from the owner portal (inventory CRUD, owner login required). Accepts an ordered list of photo blob keys (photoBlobKeys) for the multi-photo gallery — order is the display order 1,2,3… — and the Instagram reel link(s).",
    request: z.object({
      ownerToken: z.string().max(200),
      id: z.number().int().nullable(),
      brand: z.string().min(1).max(60),
      modelName: z.string().min(1).max(80),
      year: z.number().int().min(1990).max(2030),
      price: z.number().int().min(0),
      displacementCc: z.number().int().min(0),
      odometerKm: z.number().int().min(0),
      condition: z.enum(["NEW", "PRE_OWNED"]),
      status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
      isFeatured: z.boolean(),
      color: z.string().max(60),
      fuelCapacityL: z.number().min(0),
      transmission: z.string().max(80),
      mileageKmpl: z.number().min(0),
      engineType: z.string().max(120),
      registration: z.string().max(80),
      description: z.string().max(2000),
      imageKey: z.string().max(60),
      imageBlobKey: z.string().max(200).default(""),
      photoBlobKeys: z.array(z.string().max(300)).max(20).default([]),
      videoUrl: z.string().max(600),
      reelUrl: z.string().max(1200),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      // Ordered gallery: photoBlobKeys is authoritative when supplied.
      // Fall back to the legacy single imageBlobKey for older clients.
      const orderedKeys = (args.photoBlobKeys && args.photoBlobKeys.length > 0)
        ? args.photoBlobKeys.map((k) => k.trim()).filter(Boolean)
        : ((args.imageBlobKey ?? "").trim() ? [(args.imageBlobKey ?? "").trim()] : []);
      const values = {
        brand: args.brand.trim(), modelName: args.modelName.trim(), year: args.year, price: args.price,
        displacementCc: args.displacementCc, odometerKm: args.odometerKm, condition: args.condition,
        status: args.status, isFeatured: args.isFeatured ? 1 : 0, color: args.color.trim(),
        fuelCapacityL: args.fuelCapacityL, transmission: args.transmission.trim(), mileageKmpl: args.mileageKmpl,
        engineType: args.engineType.trim(), registration: args.registration.trim(), description: args.description.trim(),
        imageKey: args.imageKey.trim(), imageBlobKey: orderedKeys[0] ?? "", videoUrl: args.videoUrl.trim(), reelUrl: args.reelUrl.trim(),
      };
      let bikeId: number;
      if (args.id) {
        await db.update(schema.bikes).set(values).where(eq(schema.bikes.id, args.id));
        bikeId = args.id;
      } else {
        const slugBase = `${values.brand}-${values.modelName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const slug = `${slugBase}-${Date.now().toString(36)}`;
        const inserted = await db.insert(schema.bikes).values({ ...values, slug }).returning({ id: schema.bikes.id });
        const row = inserted[0];
        if (!row) throw new Error("adminUpsertBike failed");
        bikeId = row.id;
      }
      // Replace the gallery rows with the new ordered list (1,2,3…).
      try {
        const existing = await db.select().from(schema.bikePhotos).where(eq(schema.bikePhotos.bikeId, bikeId));
        for (const p of existing) await db.delete(schema.bikePhotos).where(eq(schema.bikePhotos.id, p.id));
        for (let i = 0; i < orderedKeys.length; i++) {
          const key = orderedKeys[i];
          if (!key) continue;
          await db.insert(schema.bikePhotos).values({ bikeId, blobKey: key, sortOrder: i });
        }
      } catch { /* gallery table may not exist on very old DBs — single photo still saved above */ }
      ctx.invalidateQueries();
      return { id: bikeId };
    },
  }),

  adminDeleteBike: defineAction({
    description: "Archives (deletes) a bike listing from the owner portal (owner login required).",
    request: z.object({ id: z.number().int(), ownerToken: z.string().max(200) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      try {
        const photos = await db.select().from(schema.bikePhotos).where(eq(schema.bikePhotos.bikeId, args.id));
        for (const p of photos) await db.delete(schema.bikePhotos).where(eq(schema.bikePhotos.id, p.id));
      } catch { /* ignore */ }
      await db.delete(schema.bikes).where(eq(schema.bikes.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminListEnquiries: defineAction({
    description: "Lists all enquiries with bike labels and unread counts for the owner pipeline (owner login required).",
    request: z.object({ ownerToken: z.string().max(200) }),
    response: z.object({
      enquiries: z.array(z.object({
        id: z.number(), bikeId: z.number().nullable(), bikeLabel: z.string(), customerName: z.string(),
        customerPhone: z.string(), channel: z.string(), status: z.string(), temperature: z.string(),
        note: z.string(), followUpAt: z.string(), createdAt: z.string(), unread: z.number(), lastMessage: z.string(),
      })),
      metrics: z.object({
        totalListings: z.number(), available: z.number(), sold: z.number(), totalViews: z.number(),
        activeLeads: z.number(), newLeads: z.number(), closedLeads: z.number(), conversionPct: z.number(),
      }),
    }),
    async handler(ctx, args) {
      await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      const enqs = await db.select().from(schema.enquiries).orderBy(desc(schema.enquiries.id));
      const bikes = await db.select().from(schema.bikes);
      const msgs = await db.select().from(schema.chatMessages).orderBy(asc(schema.chatMessages.id));
      const closed = enqs.filter((e) => e.status === "CLOSED").length;
      return {
        enquiries: enqs.map((e) => {
          const bike = e.bikeId ? bikes.find((b) => b.id === e.bikeId) : undefined;
          const thread = msgs.filter((m) => m.enquiryId === e.id);
          const last = thread[thread.length - 1];
          return {
            id: e.id, bikeId: e.bikeId,
            bikeLabel: bike ? `${bike.year} ${bike.brand} ${bike.modelName}` : "General enquiry",
            customerName: e.customerName, customerPhone: e.customerPhone, channel: e.channel,
            status: e.status, temperature: e.temperature, note: e.note, followUpAt: e.followUpAt,
            createdAt: e.createdAt.toISOString(),
            unread: thread.filter((m) => m.sender === "CUSTOMER" && m.isRead === 0).length,
            lastMessage: last ? last.text : "",
          };
        }),
        metrics: {
          totalListings: bikes.length,
          available: bikes.filter((b) => b.status === "AVAILABLE").length,
          sold: bikes.filter((b) => b.status === "SOLD").length,
          totalViews: bikes.reduce((s, b) => s + b.views, 0),
          activeLeads: enqs.filter((e) => e.status !== "CLOSED").length,
          newLeads: enqs.filter((e) => e.status === "NEW").length,
          closedLeads: closed,
          conversionPct: enqs.length > 0 ? Math.round((closed / enqs.length) * 100) : 0,
        },
      };
    },
  }),

  adminUpdateEnquiry: defineAction({
    description: "Updates an enquiry's pipeline status, lead temperature, note and follow-up date (owner login required).",
    request: z.object({
      id: z.number().int(),
      status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]),
      temperature: z.enum(["HOT", "WARM", "COLD"]),
      note: z.string().max(1000),
      followUpAt: z.string().max(20),
      ownerToken: z.string().max(200),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireOwner(ctx, args.ownerToken);
      const db = ctx.db<typeof schema>();
      await db.update(schema.enquiries).set({ status: args.status, temperature: args.temperature, note: args.note.trim(), followUpAt: args.followUpAt }).where(eq(schema.enquiries.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),
} satisfies ActionsModule;
