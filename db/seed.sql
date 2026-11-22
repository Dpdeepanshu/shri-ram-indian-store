-- Run only ONCE (sample products). Later delete them from the admin panel and add your own.
INSERT INTO products (name, category, price, mrp, image, description, featured) VALUES
  ('Cotton Kurti (Printed)', 'clothing', 499, 799, 'images/placeholder.svg', 'Soft, breathable cotton kurti for everyday wear.', 1),
  ('Printed Saree', 'clothing', 899, 1299, 'images/placeholder.svg', 'Lightweight printed saree.', 1),
  ('Face Wash 100ml', 'beauty', 149, 199, 'images/placeholder.svg', 'Gentle daily-use face wash, 100 ml.', 1),
  ('Herbal Hair Oil 200ml', 'beauty', 199, 249, 'images/placeholder.svg', 'Herbal hair oil, 200 ml.', 0),
  ('Steel Tiffin Set (3 Containers)', 'kitchenwear', 349, 499, 'images/placeholder.svg', 'Stainless steel tiffin, leak resistant.', 1),
  ('Non-stick Tawa 28cm', 'kitchenwear', 429, 599, 'images/placeholder.svg', 'Non-stick tawa, suitable for gas and induction.', 0),
  ('Oxidised Jhumka', 'jewellery', 249, 399, 'images/placeholder.svg', 'Oxidised jhumka earrings that go with most outfits.', 1),
  ('Kundan Necklace Set', 'jewellery', 699, 999, 'images/placeholder.svg', 'Kundan necklace with matching earrings.', 1);

INSERT INTO products (name, category, price, mrp, image, description, featured) VALUES
  ('Organic Zing Coffee (Coffea) Oil, 30 ml', 'beauty', 499, NULL, 'images/products/organic-zing-coffee-oil.jpg', 'Pure, natural coffee (Coffea) oil for skincare, hair care and massage. 30 ml bottle. Dilute with a carrier oil before applying and do a patch test first.', 1),
  ('AVIMEE Herbal Shakuntala Hair Cleanser, 200 ml', 'beauty', 399, NULL, 'images/products/avimee-shakuntala-hair-cleanser.jpg', 'Herbal daily-use hair cleanser for silky, soft-feeling hair. Suitable for men and women. 200 ml.', 0),
  ('Radico Colour Me Organic Hair Colour Powder, Soft Black, 100 g', 'beauty', 349, NULL, 'images/products/radico-colour-me-organic-soft-black.jpg', 'Organic hair colour powder in Soft Black, 100 g. Do a patch test before use and follow the directions on the pack.', 0),
  ('HORNBULL Trifold Leather Wallet for Men, Black', 'accessories', 549, NULL, 'images/products/hornbull-trifold-black.jpg', 'Premium top-grain genuine leather trifold wallet in a casual black style. Two compartments and five card slots in a compact, small size.', 1),
  ('HORNBULL Steve RFID Blocking Zip-Around Leather Wallet, Brown', 'accessories', 649, NULL, 'images/products/hornbull-steve-zip-brown.jpg', 'Brown leather zip-around wallet for men with RFID-blocking protection for your cards. Vertical card-holder layout, medium size.', 1),
  ('HORNBULL Trifold Genuine Leather Wallet, Green', 'accessories', 549, NULL, 'images/products/hornbull-trifold-green.jpg', 'Genuine leather three-fold wallet in green, a different look for everyday use.', 0);
