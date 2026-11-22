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
