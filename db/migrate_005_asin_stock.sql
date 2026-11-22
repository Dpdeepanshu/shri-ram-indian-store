-- Round 5: har product ke description me ASIN + sabka stock 100.
-- Ek baar chalao (D1 Console me). Dobara chalane se ASIN dobara nahi judta.
UPDATE products SET description = description || ' ASIN: B0CM9HPFRZ.' WHERE name LIKE 'Organic Zing Coffee%'     AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B0BNB515G5.' WHERE name LIKE 'AVIMEE Herbal Shakuntala%' AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B00DJ53K00.' WHERE name LIKE 'Radico Colour Me%'          AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B0FQJXH17C.' WHERE name LIKE 'Vilvah Milk Face Combo%'    AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B0CXY55VHG.' WHERE name LIKE 'FACES CANADA Rose Glow%'    AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B077K2MYMK.' WHERE name LIKE 'HORNBULL Trifold Leather Wallet%' AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B09Q996C69.' WHERE name LIKE 'HORNBULL Steve%'            AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B09QPVPPJT.' WHERE name LIKE 'HORNBULL Trifold Genuine%'  AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B08P5ML6GK.' WHERE name LIKE 'WILDHORN%(Style 1)%'       AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B08P5M592H.' WHERE name LIKE 'WILDHORN%(Style 2)%'       AND description NOT LIKE '%ASIN:%';
UPDATE products SET description = description || ' ASIN: B0C2C2TRL8.' WHERE name LIKE 'URBAN FOREST Oliver%'       AND description NOT LIKE '%ASIN:%';
UPDATE products SET stock_qty = 100, in_stock = 1;
