# SHRI RAM INDIAN STORE: Website

Plain HTML/CSS/JS ecommerce site. Hosting, HTTPS aur database sab free (GitHub + Cloudflare Pages + D1).

**Step by step setup: [SETUP.md](SETUP.md)**

## Pages

| Page | File |
|---|---|
| Home | `public/index.html` |
| Shop (search, filter, sort) | `public/shop.html` |
| Product detail | `public/product.html?id=` |
| Cart + Checkout (WhatsApp or database order) | `public/checkout.html` |
| Invoice (print / PDF) | `public/invoice.html`, `public/js/invoice.js` |
| About, Contact | `public/about.html`, `public/contact.html` |
| Payment Methods | `public/payments.html` |
| Shipping & Returns, Privacy, Terms | `public/shipping-returns.html`, `privacy.html`, `terms.html` |
| Admin panel | `public/admin.html` |
| 404 | `public/404.html` |

## Folder structure

```
public/                    <- website (yahi publish hota hai)
  js/config.js             <- SABHI DETAILS YAHAN REPLACE KARO
  js/common.js             <- header, footer, cart, product card
  js/home.js shop.js product.js checkout.js admin.js
  data/products.json       <- products (jab tak database off hai)
  images/                  <- logo, placeholder aur product photos
  css/style.css
functions/api/             <- backend (Cloudflare Pages Functions)
  products.js              <- GET /api/products
  orders.js                <- POST /api/orders
  admin/                   <- products + orders admin API (ADMIN_TOKEN se protected)
db/schema.sql, seed.sql    <- D1 tables aur sample data
wrangler.toml              <- D1 binding
```

## Replace karne wali cheezein (checklist)

- [ ] `public/js/config.js`: naam, WhatsApp, phone, email, address, GSTIN/Udyam, shipping, siteUrl
- [ ] `public/js/config.js`: payment (`upiId`, `upiQrImage`, bank details). Khaali = "details WhatsApp par milenge"
- [ ] Products: `public/data/products.json` ya admin panel
- [ ] Photos: `public/images/`
- [ ] `public/about.html` ka text
- [ ] Policy pages (`shipping-returns`, `privacy`, `terms`) check karo
- [ ] `public/sitemap.xml` aur `public/robots.txt` me asli link
- [ ] `wrangler.toml` me `database_id` (database banane ke baad)
- [ ] Cloudflare me `ADMIN_TOKEN` secret

## Kaise kaam karta hai

- **Cart** browser ke local storage me rehta hai.
- **Order**: checkout form bharne par order ka message WhatsApp par khulta hai. Database on ho to order `orders` table me bhi save hota hai (daam server par database se hi nikalte hain).
- **Products**: `useDatabase: false` = JSON file, `true` = D1 database (admin panel se manage).
