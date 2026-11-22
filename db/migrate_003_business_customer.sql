-- Business (GST) customer ke liye: ek baar chalao (purane database me).
-- Naya database banaya hai (schema.sql abhi chalaya) to ye file chalane ki zaroorat NAHI.
-- Agar "duplicate column name" error aaye to matlab columns pehle se hain, aage badho.
-- (Ye file chalaye bina bhi orders fail nahi hote: business details order note me save ho jaati hain.)
ALTER TABLE orders ADD COLUMN customer_type TEXT;
ALTER TABLE orders ADD COLUMN biz_name TEXT;
ALTER TABLE orders ADD COLUMN gstin TEXT;
