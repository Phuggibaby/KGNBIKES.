import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const bikes = sqliteTable("bikes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  brand: text("brand").notNull(),
  modelName: text("model_name").notNull(),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  displacementCc: integer("displacement_cc").notNull(),
  odometerKm: integer("odometer_km").notNull().default(0),
  condition: text("condition", { enum: ["NEW", "PRE_OWNED"] }).notNull().default("NEW"),
  status: text("status", { enum: ["AVAILABLE", "RESERVED", "SOLD"] }).notNull().default("AVAILABLE"),
  isFeatured: integer("is_featured").notNull().default(0),
  color: text("color").notNull().default(""),
  fuelCapacityL: real("fuel_capacity_l").notNull().default(0),
  transmission: text("transmission").notNull().default(""),
  mileageKmpl: real("mileage_kmpl").notNull().default(0),
  engineType: text("engine_type").notNull().default(""),
  registration: text("registration").notNull().default(""),
  description: text("description").notNull().default(""),
  imageKey: text("image_key").notNull().default(""),
  imageBlobKey: text("image_blob_key").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  reelUrl: text("reel_url").notNull().default(""),
  views: integer("views").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  // A customer signs up with ONE contact: a mobile number OR a Gmail
  // address. Whichever they gave is stored here; the other stays null
  // (SQLite unique allows multiple nulls). Passwords are stored only as
  // a salted SHA-256 hash, never in plain text and never returned.
  phone: text("phone").unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull().default(""),
  salt: text("salt").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const wishlist = sqliteTable("wishlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  bikeId: integer("bike_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const enquiries = sqliteTable("enquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bikeId: integer("bike_id"),
  accountId: integer("account_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  channel: text("channel", { enum: ["CHAT", "WHATSAPP", "CALL", "FORM"] }).notNull().default("FORM"),
  status: text("status", { enum: ["NEW", "IN_PROGRESS", "CLOSED"] }).notNull().default("NEW"),
  temperature: text("temperature", { enum: ["HOT", "WARM", "COLD"] }).notNull().default("WARM"),
  note: text("note").notNull().default(""),
  followUpAt: text("follow_up_at").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  enquiryId: integer("enquiry_id").notNull(),
  sender: text("sender", { enum: ["CUSTOMER", "DEALER"] }).notNull(),
  text: text("text").notNull(),
  isRead: integer("is_read").notNull().default(0),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const owners = sqliteTable("owners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const bikePhotos = sqliteTable("bike_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bikeId: integer("bike_id").notNull(),
  blobKey: text("blob_key").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

/* One row per customer profile change, kept as a note for the owners
   (Our Family in the owner dashboard): sign-up, password set/change,
   and profile detail edits. Password VALUES are never stored here —
   only the fact that a password was set or changed. */
export const profileChanges = sqliteTable("profile_changes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  username: text("username").notNull().default(""),
  changeType: text("change_type").notNull().default(""),
  detail: text("detail").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

/* Customer reviews — written only by signed-in customers (createReview
   verifies the account server-side). Shown publicly on the home page.
   reviewer_name / username are snapshots from the account at submit
   time so a review stays attributed even if the profile is edited. */
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  reviewerName: text("reviewer_name").notNull().default(""),
  username: text("username").notNull().default(""),
  rating: integer("rating").notNull().default(5),
  title: text("title").notNull().default(""),
  reviewText: text("review_text").notNull().default(""),
  bikeId: integer("bike_id"),
  bikeLabel: text("bike_label").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const ownerSessions = sqliteTable("owner_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  ownerId: integer("owner_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});
