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
