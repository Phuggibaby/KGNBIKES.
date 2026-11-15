DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE bikes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  price INTEGER NOT NULL,
  displacement_cc INTEGER NOT NULL,
  odometer_km INTEGER NOT NULL DEFAULT 0,
  condition TEXT NOT NULL DEFAULT 'NEW',
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  is_featured INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '',
  fuel_capacity_l REAL NOT NULL DEFAULT 0,
  transmission TEXT NOT NULL DEFAULT '',
  mileage_kmpl REAL NOT NULL DEFAULT 0,
  engine_type TEXT NOT NULL DEFAULT '',
  registration TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_key TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE wishlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  bike_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bike_id INTEGER,
  account_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'FORM',
  status TEXT NOT NULL DEFAULT 'NEW',
  temperature TEXT NOT NULL DEFAULT 'WARM',
  note TEXT NOT NULL DEFAULT '',
  follow_up_at TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
