-- Purane database ke liye (jisme orders table pehle se bani hui hai): ek baar chalao.
-- Naya database banaya hai (schema.sql abhi chalaya) to ye file chalane ki zaroorat NAHI.
-- Agar "duplicate column name" error aaye to matlab columns pehle se hain, aage badho.
ALTER TABLE orders ADD COLUMN state TEXT;
ALTER TABLE orders ADD COLUMN invoice_no TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
