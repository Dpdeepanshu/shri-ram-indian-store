-- Tables banata hai. Dobara chalane se data delete NAHI hota (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  price       INTEGER NOT NULL,          -- rupees me
  mrp         INTEGER,                   -- cut price (optional)
  image       TEXT,
  description TEXT,
  in_stock    INTEGER NOT NULL DEFAULT 1,
  featured    INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  images      TEXT,                      -- JSON list of photo links (1 se 5)
  stock_qty   INTEGER DEFAULT 100,           -- NULL = stock track nahi hota (naye products ka default 100)
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no   TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  address    TEXT NOT NULL,
  city       TEXT,
  state      TEXT,
  pincode    TEXT NOT NULL,
  payment    TEXT,
  notes      TEXT,
  items      TEXT NOT NULL,              -- JSON: [{id,name,price,qty}]
  subtotal   INTEGER NOT NULL,
  shipping   INTEGER NOT NULL DEFAULT 0,
  total      INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new',
  invoice_no TEXT,
  customer_type TEXT,                    -- retail / business
  biz_name   TEXT,
  gstin      TEXT,
  user_id    INTEGER,                    -- customer account (users.id)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- Customer accounts, login sessions, email OTP, rate limit, product photos
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
  data       TEXT NOT NULL,              -- base64
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Invoice ke jaari options (verify link par wahi invoice dikhane ke liye). Function apne aap bhi bana leta hai.
CREATE TABLE IF NOT EXISTS invoice_opts (order_no TEXT PRIMARY KEY, opts TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')));
