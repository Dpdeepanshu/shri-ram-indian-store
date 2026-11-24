# Changes (audit round)

Checkout: phone paste (+91/spaces) fix, qty cap 20, out-of-stock auto-remove, order confirmation page keeps payment details (UPI link with order no.), double-submit guard, field-focus validation.
CSS: [hidden] now always hides (empty cart showed the form), @import order.
Admin: image paths like images/products/x.jpg now accepted (edit was failing), banner if useDatabase=false, safer edit/save errors.
API /api/orders: phone normalise, city + payment validation, out-of-stock check, merges duplicate lines, optional FREE_SHIPPING_ABOVE / SHIPPING_CHARGE env vars.
Typo: "INDIA STORE" -> "INDIAN STORE" (header, logo alt).

# Round 2

- Invoice in SHRI RAM INDIAN STORE tax-invoice format after order (invoice.html + js/invoice.js): HSN, CGST/SGST or IGST by state, amount in words, print / Save as PDF; admin can reprint any order.
- Order without WhatsApp: with useDatabase=true "Place order" saves to DB; WhatsApp is optional. State field added (place of supply).
- DB: orders.state + orders.invoice_no (db/migrate_002_invoice_state.sql for old DBs), server-side invoice numbers, spam limit (5 orders/hour/phone), honeypot.
- Audit: product JSON-LD, cache headers, noindex for invoice/checkout, policy pages updated, menu aria-expanded, select change handler.

# Round 3 (invoice redesign + logo)

- Logo: new "SHRI RAM INDIAN STORE" logo (circle, transparent corners) in logo.png / logo-sm.png / favicon / apple-touch-icon / logo-original.png.
- Invoice redesigned (navy + gold, A4 single page): header with logo, meta strip, Bill To / Ship To, GST item table, totals, amount in words.
- Invoice page controls: Retail / Business (GST) customer, invoice date (today back to 365 days), signature + stamp on/off.
- Business customer: business name, GSTIN (format + check-digit validated, state auto from GSTIN), PAN, state, address, mobile. IGST when state differs, else CGST + SGST. HSN summary + Reverse Charge shown. Print is disabled until the GSTIN is valid.
- Retail invoice: UPI Scan & Pay QR (images/upi-qr.png). Business invoice: bank details for NEFT / RTGS / IMPS.
- Authorised signatory block with signature (images/signature.png) and stamp (images/stamp.png).
- config.js: invoiceUpiId, invoiceUpiQr, invoiceBank, invoiceSignature, invoiceStamp, signatoryName, invoiceBackdateDays.

# Round 3b (QR, business checkout, clickable links)

- UPI QR: only the QR itself (rebuilt crisp from the bank PDF, decodes to Pos.11412817@indus) on both invoices. Business invoice shows bank details + QR.
- Checkout: Retail / Business (GST) option. Business asks business name + GSTIN (validated), labels change to contact person / delivery address. Invoice opens already set to Business with these details.
- Orders API stores customer_type, biz_name, gstin (db/migrate_003_business_customer.sql). If the migration has not been run, details are kept in the order note as "[B2B] name | GSTIN" so orders never fail; admin and invoice read both.
- WhatsApp order message and admin order card show business details.
- Invoice website link, email and phone are real links, so they stay clickable in the saved PDF.

# Round 4 (accounts, order history, admin panel)

- Logo: same logo on every page (favicon, apple-touch-icon, share image) including the new login, account and admin pages.
- Invoice: website link at the bottom is a real, underlined link (also clickable in the saved PDF). Customers can open any past invoice from Order history.
- Customer accounts: sign up / login / logout with free email OTP verification (Brevo), forgot + reset password, profile and password change. Passwords are PBKDF2 hashed, sessions are HttpOnly cookies, OTP and login attempts are rate limited.
- Login is required before placing an order (checkout shows Login / Sign up, cart is kept).
- My Account > Order history tab with status bar and invoice link.
- Admin panel at /admin with username + password (admin / ADMIN_TOKEN, or ADMIN_USERNAME / ADMIN_PASSWORD): dashboard, products (add, edit, delete, inline price + stock update, 1 to 5 photos), orders (search, filter, add, edit quantity / price, delete, status, invoice, CSV), customers.
- Product page photo gallery, stock quantity (auto decrease on order, restore on cancel / delete, "Only N left").
- DB: db/migrate_004_accounts_admin.sql (users, sessions, otps, rate_limits, product_images; orders.user_id; products.images, stock_qty).

# Round 5 (invoice fixes + ASIN + quantity)

- Products: har product ke description me "ASIN: B0..." jod diya (products.json, db/seed.sql). Naya field "asin" bhi hai. Sabka stock 100 (products.json + seed + schema default). Purane database ke liye db/migrate_005_asin_stock.sql chalao (ASIN judta hai + stock 100).
- Invoice: item name ke neeche "ASIN: ..." chhapta hai (order me ho ya na ho; purane orders me product list se naam match karke aata hai). Admin / customer orders ki lines me ab asin save hota hai.
- Quantity: checkout me quantity keyboard se likh sakte ho (sirf + / - nahi). Retail max 20 per item, Business (GST) customer max 100 per item (config.js: maxQtyRetail / maxQtyBusiness; server /api/orders par bhi wahi limit). Product page par bhi number likh sakte ho.
- Invoice payment block wapas: config.js me invoiceUpiId, invoiceUpiQr, invoiceBank, invoiceSignature, invoiceStamp, signatoryName, invoiceBackdateDays missing the, isliye QR, bank details, sign aur stamp gayab ho gaye the. Retail (COD / UPI): sirf cropped QR + UPI ID. Business: bank details + UPI ID + "Pay via UPI" link + QR.
- Signature: aapki handwriting ki photo se saaf transparent signature (images/signature.png). Stamp: naya professional round stamp (images/stamp.png).
- Footer link: pura https://shri-ram-indian-store.pages.dev link ab lowercase aur clickable (PDF me bhi). Pehle uppercase ban jaata tha.
- Address: customer ne address me hi city / state / PIN likha ho to invoice me repeat nahi hota (joinAddr).
- Naam: lamba naam ab poora aur wrap hokar dikhta hai. Name fields par maxlength 80.
- Look: body text pure black ki jagah naram dark slate, weights 500/600 (koi letter zyada black nahi), CSS class "ph" ka takraav theek kiya (Bank Details heading), table aur boxes polished.

# Round 6 (footer invoice link + code audit)

- Footer (Help column): "My Invoices" link (account.html, order history me har invoice ka button) aur login hone par "Latest invoice: SRIS/WEB/..." clickable link jo seedha us invoice ko naye tab me kholta hai. Naya order place hote hi link update ho jaata hai.
- Invoice page: login na ho to ab "Login" button aata hai (login ke baad wapas usi invoice par). Order confirmation ka invoice link ab rel="noopener".
- Invoice date: 365 din se purane order ki date ab galat clamp nahi hoti.
- Stock race fix: /api/orders me stock atomically reserve hota hai (do customers ek saath last piece nahi le sakte); order save fail ho to stock wapas jud jaata hai.
- Login: email maujood hai ya nahi, iska timing se pata nahi chalta. Kharab cookie se 500 error nahi aata.
- robots.txt: /admin, /account.html, /login.html bhi disallow.

# Round 6b (invoice PDF verify link)

- Invoice ke neeche footer me us invoice ka apna link: "Verify this invoice online: https://.../invoice.html?no=ORDERNO&k=KEY". PDF me bhi clickable. Customer ya koi bhi PDF se link khol kar bina login ke wahi invoice online dekh sakta hai.
- Link me secret key (HMAC) hai, isliye order number guess karke koi dusra invoice nahi khol sakta. Key ADMIN_TOKEN se banti hai (ya optional INVOICE_SECRET Cloudflare variable; use badalne par purane links band ho jaate hain). Naya endpoint: functions/api/invoice.js (rate limited).
- Naya Cloudflare setting zaroori nahi; ADMIN_TOKEN pehle se set hai. Pehle se download ki hui purani PDF me ye link nahi hoga, naya download karna hoga.

# Round 6c (ASIN fix, QR, read-only verify page)

- ASIN: database ke products me description me ASIN nahi tha (migrate_005 live DB par nahi chala), isliye invoice par nahi aata tha. Ab config.js ke `asinMap` se product ke naam se ASIN apne aap milta hai (11 products ke ASIN daale hain). Migration chalane ki zaroorat nahi. Naya product jodo to asinMap me ek line badhao.
- PDF link: "Microsoft Print to PDF" links hata deta hai. Chrome / Edge me Destination "Save as PDF" chuno, tab link clickable rehta hai. Isliye invoice me verify link ka QR code bhi hai (scan karne par chalta hai, kisi bhi PDF printer se).
- Verify link (invoice.html?no=...&k=...): sirf issued invoice dikhta hai, koi edit option nahi (customer type, date, GSTIN, signature controls hidden). Sirf Print / Save as PDF.
- Print / Save dabate hi invoice ke options (retail/business, GSTIN, date, signature) server par save hote hain (table invoice_opts apne aap ban jaati hai), taaki verify link par wahi invoice dikhe jo PDF me hai.

# Round 6d
- Order ID ab date ke bina banta hai (SRIS-K7M2QX9A). Pehle SRIS-YYMMDD-XXXXX me order wali date thi, jo invoice date (badli hui) se match nahi karti thi. Purane orders ki ID wahi rehti hai.

# Round 7 (full audit)
- Password badalne par baaki devices ke login band ho jaate hain (is device ka chalta rahega).
- Admin ka naya order: mobile se customer account tabhi jodta hai jab us number ka ek hi verified account ho (koi profile me dusre ka number likh kar uske orders nahi dekh sakta).
- Customer ki invoice date server par bhi check hoti hai (aaj se aage nahi, 365 din se peeche nahi).
- Order delete karne par uski saved invoice options bhi hat jaati hain.
- Invoice number update fail ho to bhi order save rehta hai (error nahi aata).
- Product photo link sirf https:// (http se browser me mixed-content block hota hai).
- Logout par pichle customer ka last-order / address / invoice cache is device se hat jaata hai.
- HSTS header joda. Saare pages ka browser smoke test aur checkout flow test: koi JS error nahi.

# Round 7b (search)
- Shop search ab naam, brand, description, category, ASIN (description me na ho to bhi), model (WH1173 / WH 1173) aur price me dhundhta hai. Shabd kisi bhi order me ho sakte hain ("wallet black", "hornbull zip"); best match pehle aata hai.
- Har page ke header me search box (shop page ko chhodkar) jo shop.html?q=... kholta hai.
- Admin ki product list ki search me bhi wahi search.

# Round 8 (merge + final audit)
- "main" aur "updated" zip ko merge kiya: updated me main ki har cheez thi plus Round 6d / 7 / 7b, isliye koi conflict nahi tha. Koi code change nahi.
- Final audit: sabhi 38 JS files ka syntax check pass, saare pages ka browser smoke test (koi JS error nahi), links / sitemap / products.json sahi, search (wallet black, hornbull zip, WH 1173) sahi chala, naya Order ID server ke check se match karta hai.
