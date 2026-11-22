(async function () {
  const S = window.SRIS, cfg = S.cfg, esc = S.esc;
  const box = document.getElementById("product");
  const id = new URLSearchParams(location.search).get("id");
  let all = [];
  try { all = await S.loadProducts(); } catch (e) {}
  const p = all.find((x) => String(x.id) === String(id));
  if (!p) { box.innerHTML = `<p class="empty">Product not found. <a href="shop.html">Back to shop</a></p>`; return; }

  document.title = `${p.name} | ${cfg.storeName}`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = (p.description || p.name).slice(0, 150);

  const off = S.discount(p), oos = S.outOfStock(p) || (p.stock_qty !== null && p.stock_qty !== undefined && p.stock_qty <= 0);
  const imgs = (Array.isArray(p.images) && p.images.length ? p.images : [p.image || S.PLACEHOLDER]).slice(0, 5);
  const maxQ = p.stock_qty !== null && p.stock_qty !== undefined ? Math.max(1, Math.min(S.MAX_QTY, p.stock_qty)) : S.MAX_QTY;
  const pageUrl = cfg.siteUrl.replace(/\/$/, "") + "/product.html?id=" + encodeURIComponent(p.id);
  const ask = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent("Hello, I have a question about this product: " + p.name + " " + pageUrl)}`;

  box.innerHTML = `<div class="crumbs"><a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <a href="shop.html?cat=${esc(p.category)}">${esc(S.categoryLabel(p.category))}</a></div>
  <div class="pd">
    <div class="pd-gal"><div class="pd-img gal-main"><img id="mainImg" src="${esc(imgs[0])}" alt="${esc(p.name)}" referrerpolicy="no-referrer" onerror="${S.imgFallback}"></div>
      ${imgs.length > 1 ? `<div class="gal-thumbs">${imgs.map((u, i) => `<button type="button" class="${i === 0 ? "on" : ""}" data-i="${i}" aria-label="Photo ${i + 1}"><img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="${S.imgFallback}"></button>`).join("")}</div>` : ""}</div>
    <div class="pd-info">
      <span class="cat" style="color:var(--gold-deep);font-weight:600">${esc(S.categoryLabel(p.category))}</span>
      <h1>${esc(p.name)}</h1>
      <div class="price big"><b>${S.money(p.price)}</b>${off ? `<s>${S.money(p.mrp)}</s><span class="off">${off}% off</span>` : ""}</div>
      <p class="tax-note">Inclusive of all taxes</p>
      ${!oos && p.stock_qty !== null && p.stock_qty !== undefined && p.stock_qty <= 5 ? `<p class="stock-left">Only ${p.stock_qty} left in stock</p>` : ""}
      <p class="desc">${esc(p.description || "")}</p>
      ${S.asinOf(p) ? `<p class="tax-note">ASIN: <b>${esc(S.asinOf(p))}</b></p>` : ""}
      <ul class="points">
        ${cfg.codAvailable ? `<li>${S.icon("cash")}Cash on Delivery available</li>` : ""}
        <li>${S.icon("phone")}Pay by UPI or bank transfer</li>
        <li>${S.icon("truck")}Free shipping above ${S.money(cfg.freeShippingAbove)}. Delivery in ${esc(cfg.deliveryDays)}</li>
        <li>${S.icon("ret")}${esc(cfg.returnDays)}-day return and exchange, as per our policy</li>
      </ul>
      <div class="buy">
        ${oos ? `<button class="btn" disabled>Out of stock</button>` : `
        <input id="qty" type="number" inputmode="numeric" min="1" max="${maxQ}" step="1" value="1" aria-label="Quantity (type a number)">
        <button class="btn navy" id="addBtn">Add to cart</button>
        <button class="btn" id="buyBtn">Buy now</button>`}
      </div>
      ${oos ? "" : `<p class="qty-note">Type any quantity. Retail orders: up to ${S.MAX_RETAIL} per item. Business (GST) orders: up to ${S.MAX_QTY} per item.</p>`}
      <a class="btn wa" href="${ask}" target="_blank" rel="noopener">Ask on WhatsApp</a>
    </div>
  </div>`;

  if (!oos) {
    const qty = () => Math.min(maxQ, Math.max(1, parseInt(document.getElementById("qty").value, 10) || 1));
    document.getElementById("addBtn").addEventListener("click", () => S.addToCart(p.id, qty()));
    document.getElementById("buyBtn").addEventListener("click", () => { S.addToCart(p.id, qty()); location.href = "checkout.html"; });
  }

  const thumbs = document.querySelector(".gal-thumbs");
  if (thumbs) thumbs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    document.getElementById("mainImg").src = imgs[+b.dataset.i];
    thumbs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  });

  try {
    const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description || p.name, category: S.categoryLabel(p.category),
      image: imgs.map((u) => (/^https?:/.test(u) ? u : cfg.siteUrl.replace(/\/$/, "") + "/" + String(u).replace(/^\//, ""))),
      offers: { "@type": "Offer", url: pageUrl, priceCurrency: "INR", price: String(p.price), availability: oos ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" } };
    const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
  } catch (e) {}

  const rel = all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  if (rel.length) {
    document.getElementById("related").innerHTML = rel.map(S.productCard).join("");
    document.getElementById("relatedBox").hidden = false;
  }
})();
