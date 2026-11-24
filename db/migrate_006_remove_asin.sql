-- Round 7: products ke description se " ASIN: B0XXXXXXXX." hatao (live database me migrate_005 chala ho to).
-- Ek baar D1 Console me chalao. Dobara chalane se kuch nahi bigadta.
UPDATE products SET description = TRIM(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(description,
    ' ASIN: B0CM9HPFRZ.', ''), ' ASIN: B0BNB515G5.', ''), ' ASIN: B00DJ53K00.', ''), ' ASIN: B0FQJXH17C.', ''),
    ' ASIN: B0CXY55VHG.', ''), ' ASIN: B077K2MYMK.', ''), ' ASIN: B09Q996C69.', ''), ' ASIN: B09QPVPPJT.', ''),
    ' ASIN: B08P5ML6GK.', ''), ' ASIN: B08P5M592H.', ''), ' ASIN: B0C2C2TRL8.', ''), '  ', ' '))
WHERE description LIKE '%ASIN:%';
