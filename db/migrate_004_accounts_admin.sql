-- PURANE database ke liye (jisme products/orders tables pehle se hain): ek baar chalao.
-- Naya database banaya hai (schema.sql abhi chalaya) to ye file chalane ki zaroorat NAHI.
-- Pehle naye tables (dobara chalane par bhi safe), phir 3 naye columns.
-- Agar "duplicate column name" error aaye to matlab columns pehle se hain, aage badho.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  pass_hash     TEXT NOT NULL,
  pass_salt     TEXT NOT NULL,
  verified      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS otps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  purpose    TEXT NOT NULL,
  code_hash  TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email, purpose);
CREATE TABLE IF NOT EXISTS rate_limits (
  k            TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  mime       TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE orders ADD COLUMN user_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
ALTER TABLE products ADD COLUMN images TEXT;
ALTER TABLE products ADD COLUMN stock_qty INTEGER;
