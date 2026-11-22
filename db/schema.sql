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
  pincode    TEXT NOT NULL,
  payment    TEXT,
  notes      TEXT,
  items      TEXT NOT NULL,              -- JSON: [{id,name,price,qty}]
  subtotal   INTEGER NOT NULL,
  shipping   INTEGER NOT NULL DEFAULT 0,
  total      INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
