# SHRI RAM INDIAN STORE: Step by Step Setup

Is guide ko upar se neeche ek-ek step karte jaao. Step 1 se 7 tak me site free HTTPS link ke saath live ho jaayegi (invoice me link daal sakte ho). Step 8 se 11 me database, admin panel aur orders jodoge.

---

## Step 0: Pehle yeh sab ready rakho (sab free)

- **VS Code**: https://code.visualstudio.com
- **Git**: https://git-scm.com/downloads
- **Node.js (LTS)**: https://nodejs.org (database ke steps ke liye)
- **GitHub account**: https://github.com
- **Cloudflare account**: https://dash.cloudflare.com/sign-up

Check karne ke liye terminal me: `git --version` aur `node --version`

---

## Step 1: Project VS Code me kholo aur chalao

1. Zip ko unzip karo, folder `shri-ram-indian-store` milega.
2. VS Code: **File > Open Folder** > `shri-ram-indian-store` chuno.
3. Extensions (Ctrl+Shift+X) me **Live Server** install karo.
4. `public/index.html` par right-click > **Open with Live Server**. Site browser me khulegi.

Local me products `public/data/products.json` se aate hain. Database ke bina bhi cart aur WhatsApp order chalega.

---

## Step 2: Apni details replace karo (sabse zaroori)

Sirf yeh jagah badalni hain. Poori site me apne aap lag jaayega.

| Kya | Kahan | Kya badalna hai |
|---|---|---|
| Brand naam, tagline | `public/js/config.js` | `storeName`, `tagline`, `topbarText` |
| WhatsApp number | `public/js/config.js` | `whatsappNumber` (91 ke saath, bina + ya space) |
| Phone, email, address, timing | `public/js/config.js` | `phoneDisplay`, `email`, `address`, `hours` |
| GST / Udyam details | `public/js/config.js` | `legalName`, `gstin`, `gstAddress`, `udyam` (site me footer, About, Terms me apne aap dikhte hain) |
| Payment (UPI, bank) | `public/js/config.js` | `upiId`, `upiQrImage` (QR photo `public/images/upi-qr.png`), `bankName`, `bankAccountName`, `bankAccountNumber`, `bankIfsc`, `codAvailable` |
| Instagram / Facebook | `public/js/config.js` | `instagram`, `facebook` (link ya khaali) |
| Shipping, COD, return days | `public/js/config.js` | `freeShippingAbove`, `shippingCharge`, `codAvailable`, `deliveryDays`, `returnDays` |
| Site ka link | `public/js/config.js` | `siteUrl` (Step 6 ke baad asli link) |
| Categories | `public/js/config.js` | `categories` (naam, icon, chhoti line) |
| Products | `public/data/products.json` (ya admin panel) | naam, price, mrp, image, description |
| Product photos | `public/images/` folder | photo daalo, products me `images/photo.jpg` likho (kuch products ki photo online link se aa rahi hai, `PRODUCTS-LIST.md` dekho) |
| About text | `public/about.html` | `EDIT` comment ke neeche ka text |
| Policies | `shipping-returns.html`, `privacy.html`, `terms.html` | sample text hai, apne hisaab se check/badlo |
| SEO link | `public/sitemap.xml`, `public/robots.txt` | `shriramindianstore.pages.dev` ko asli link se badlo |

Tip: VS Code me **Ctrl+Shift+F** (Search) me `9999999999` ya `example.com` search karke dekh lo ki koi placeholder bacha to nahi.

---

## Step 3: Local test checklist

- Home page par categories aur products dikh rahe hain.
- Shop page par search, category filter, sort chal rahe hain.
- Product page khulta hai, "Cart me daalein" chalta hai.
- Cart page me quantity badal sakte ho, form bharke "WhatsApp par order bhejein" dabane par WhatsApp me poora order message khulta hai.
- Mobile view check karo (browser me F12 > mobile icon).

---

## Step 4: GitHub par code daalo

1. https://github.com/new par jao. Repository name: `shri-ram-indian-store`. **Private ya Public**, dono chalega. **README/gitignore add mat karna** (empty rakhna). **Create repository**.
2. VS Code me terminal kholo (**Ctrl + `**) aur ek baar apni pehchaan set karo:
   ```bash
   git config --global user.name "Aapka Naam"
   git config --global user.email "aapka-github-email@example.com"
   ```
3. Phir:
   ```bash
   git init
   git add .
   git commit -m "Initial website"
   git branch -M main
   git remote add origin https://github.com/<APNA-USERNAME>/shri-ram-indian-store.git
   git push -u origin main
   ```
   Push ke time GitHub login maangega. Browser me sign-in kar do.

Aage har change ke baad:
```bash
git add .
git commit -m "kya badla"
git push
```
Ya VS Code ke **Source Control** (Ctrl+Shift+G) panel se message likho, Commit dabao, phir Sync/Push dabao.

---

## Step 5: Cloudflare account ready karo

1. https://dash.cloudflare.com par login karo.
2. Email verify kar lo. Card ki zaroorat nahi, free plan kaafi hai.

---

## Step 6: Cloudflare Pages par host karo (free HTTPS/SSL ke saath)

1. Dashboard me **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   (Cloudflare ka menu kabhi-kabhi thoda alag dikhta hai. Jahan "Pages" aur "Connect to Git" mile wahi sahi hai.)
2. GitHub authorize karo, repo `shri-ram-indian-store` chuno, **Begin setup**.
3. Settings:
   - **Project name**: `shriramindianstore` (agar mil jaaye, warna jo bhi naam rakho woh `wrangler.toml` ke `name` me bhi likhna)
   - **Production branch**: `main`
   - **Framework preset**: `None`
   - **Build command**: khaali chhod do
   - **Build output directory**: `public`
4. **Save and Deploy**. 1 se 2 minute me site live.
5. Link milega: `https://shriramindianstore.pages.dev`. Browser me kholo, address bar me tala (HTTPS) dikhega. Yeh free SSL certificate hai, Cloudflare khud lagata aur renew karta hai.

---

## Step 7: Link ko final karo aur invoice me daalo

1. `public/js/config.js` me `siteUrl` ko asli link se badlo.
2. `public/sitemap.xml` aur `public/robots.txt` me bhi link badlo.
3. `git add . && git commit -m "site url" && git push`. 1 minute me auto-deploy ho jaayega.
4. Invoice me yahi link daalo: `https://shriramindianstore.pages.dev`

Yahan tak website poori tarah kaam kar rahi hai (products JSON se, orders WhatsApp par).

---

## Step 8: Database (Cloudflare D1) banao

Ab products aur orders ko database me rakhna hai. Terminal me project folder me:

```bash
npx wrangler login
npx wrangler d1 create shriram-store-db
```

`wrangler login` browser kholega, Cloudflare me Allow karo. `d1 create` ke output me ek `database_id` milega (lambi ID). Usse copy kar lo.

---

## Step 9: Database ko site se jodo

1. `wrangler.toml` kholo. Neeche ke 4 lines ka `#` hata do aur `database_id` me copy ki hui ID paste karo:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "shriram-store-db"
   database_id = "yahan-apni-id"
   ```
   `name = "..."` wahi hona chahiye jo Cloudflare Pages project ka naam hai.
2. Tables banao aur sample products daalo:
   ```bash
   npm run db:schema:remote
   npm run db:seed:remote
   ```
   (`seed` sirf ek baar chalana. Isme ab 11 asli products hain; baaki admin panel se add karo.)
3. `public/js/config.js` me `useDatabase: true` karo.
4. Push karo:
   ```bash
   git add .
   git commit -m "Enable database"
   git push
   ```
5. Deploy ke baad `https://<apna-link>/api/products` kholo. Products ka JSON dikhna chahiye.

Agar yahan error aaye: Cloudflare dashboard > aapka Pages project > **Settings > Bindings** me dekho ki D1 binding `DB` naam se dikh rahi hai. Nahi dikhe to wahan **Add > D1 database** se `DB` naam se jod do.

---

---

## Step 9B: Order WhatsApp ke bina (database ON) + Invoice

`useDatabase: true` karte hi checkout par 2 button aate hain:
- **Place order**: order seedha database me save hota hai (WhatsApp chat ki zaroorat nahi). Customer ko order number, payment details aur invoice turant milta hai. Aap admin panel > Orders me dekhte ho.
- **Place order and send on WhatsApp**: order save bhi hota hai aur WhatsApp message bhi khulta hai.

`useDatabase: false` rahe to sirf WhatsApp wala order chalega (invoice "Order copy / provisional" aata hai, final invoice number sirf database ON hone par).

**Naya database (Step 8 se)**: `npm run db:schema:remote` hi kaafi hai (naye columns usme hain).

**Purana database (pehle se orders table bani hai)**: ek baar yeh chalao:
```bash
npm run db:migrate:remote
```
("duplicate column name" error aaye to columns pehle se hain, aage badho.) Bina migration ke order save hoga hi nahi.

**Invoice**: order ke baad customer "View / download invoice" dabata hai, print window me "Save as PDF" chunta hai. Aap admin panel > Orders > "View / print invoice" se kisi bhi order ka invoice dobara nikal sakte ho. Invoice number: `SRIS/WEB/2627/0001, 0002...` (aapke manual invoices SRIS/2627/xxxx se alag series). Badalna ho to `config.js` (`webInvoicePrefix`, `webInvoiceStart`) aur Cloudflare variables `INVOICE_PREFIX`, `INVOICE_START` dono same rakho.

**GST**: UP ke customer par CGST+SGST (9%+9%), baaki states par IGST 18%. HSN/GST % `config.js` ki `categories` me hain (CA se confirm kar lo).

**Variables (optional)**: Cloudflare Pages > Settings > Variables: `FREE_SHIPPING_ABOVE` (999) aur `SHIPPING_CHARGE` (60) agar config se shipping rule badlo to server me bhi badlo.

**Test**: `npx wrangler pages dev public` se local chalao, `npm run db:schema:local` + `db:seed:local` ke baad ek order do aur admin me check karo (admin ke liye `.dev.vars` file me `ADMIN_TOKEN=test123` likho).

---

## Step 10: Admin panel ka password set karo

1. Ek lamba, mushkil password socho (jaise 16+ characters). Yahi `ADMIN_TOKEN` hai.
2. Terminal me (project name apna likho):
   ```bash
   npx wrangler pages secret put ADMIN_TOKEN --project-name shriramindianstore
   ```
   Poochhne par password paste karo.
   Ya dashboard se: Pages project > **Settings > Variables and Secrets > Add** > naam `ADMIN_TOKEN`, value password, type **Secret**.
3. Dobara deploy chahiye ho to dashboard me **Deployments > Retry deployment** karo, ya koi chhota change push karo.
4. `https://<apna-link>/admin.html` kholo, password daalo.

Admin panel me:
- **Products**: naya jodo, edit karo, stock khatam mark karo, home par dikhane wale chuno, hide/delete karo.
- **Orders**: aaye hue orders dekho aur status badlo (new, confirmed, shipped, delivered, cancelled).

Photos ke liye: photo `public/images/` me daalo, push karo, aur admin me image path `/images/photo.jpg` likho.

---

## Step 11: Order flow test karo

1. Live site par ek test order do (apna hi number/address).
2. WhatsApp me order message aaya? Admin panel > Orders me order dikha?
3. Status badal ke dekho.

---

## Step 12 (optional): Apna domain

Free `.pages.dev` link bilkul chalega. Baad me `.in` domain (lagbhag ₹500 se ₹800 saal) lena ho to: domain kharido, Cloudflare Pages project > **Custom domains** > **Set up a custom domain**. SSL tab bhi free rahega. Phir `siteUrl`, sitemap aur robots.txt me naya link badalna na bhulna.

---

## Local me database ke saath chalana (optional)

```bash
npm run db:schema:local
npm run db:seed:local
npm run dev
```
Browser me `http://localhost:8788`. Local admin ke liye project folder me `.dev.vars` file banao: `ADMIN_TOKEN=test123` (yeh file git me nahi jaati).

---

## Aam dikkatein

| Dikkat | Hal |
|---|---|
| Build fail, D1 ka error | Pehle deploy tak `wrangler.toml` me D1 block comment rakho. Database ID sahi paste karo. |
| `/api/products` 500 error | Step 8 ke `schema` command chalaya? Binding `DB` naam se hai? |
| Site par purane products dikh rahe | Browser refresh (Ctrl+Shift+R). API 30 second cache karti hai. |
| Admin: "ADMIN_TOKEN set nahi hai" | Step 10 karo aur redeploy karo. |
| Admin: "Password galat hai" | Wahi password daalo jo secret me dala, extra space na ho. |
| WhatsApp number galat khul raha | `whatsappNumber` me sirf digits, 91 se shuru. |
| Photo nahi dikh rahi | Path `/images/naam.jpg` (naam ka spelling aur extension same ho), aur photo push ki ho. |
| Change live nahi dikha | `git push` hua? Dashboard > Deployments me latest deploy "Success" hai? |

---

## Surakshit rehne ke liye

- `ADMIN_TOKEN` kisi ko mat batao, aur code me kabhi mat likho.
- Orders me customer ka number/address hota hai, admin panel ka link aur password sambhal ke rakho.
- Policy pages sample hain. Business ke hisaab se zaroor badlo.
