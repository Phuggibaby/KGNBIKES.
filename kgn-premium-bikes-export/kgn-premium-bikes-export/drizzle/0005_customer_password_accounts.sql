CREATE TABLE accounts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  salt TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO accounts_new (id, username, full_name, phone, email, password_hash, salt, created_at)
SELECT id, username, full_name, phone, NULL, '', '', created_at FROM accounts;
--> statement-breakpoint
DROP TABLE accounts;
--> statement-breakpoint
ALTER TABLE accounts_new RENAME TO accounts;
