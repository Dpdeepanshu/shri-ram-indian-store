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

  const off = S.discount(p), oos = S.outOfStock(p);
  const pageUrl = cfg.siteUrl.replace(/\/$/, "") + "/product.html?id=" + encodeURIComponent(p.id);
  const ask = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent("Hello, I have a question about this product: " + p.name + " " + pageUrl)}`;

  box.innerHTML = `<div class="crumbs"><a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <a href="shop.html?cat=${esc(p.category)}">${esc(S.categoryLabel(p.category))}</a></div>
  <div class="pd">
    <div class="pd-img"><img src="${esc(p.image || S.PLACEHOLDER)}" alt="${esc(p.name)}" referrerpolicy="no-referrer" onerror="${S.imgFallback}"></div>
    <div class="pd-info">
      <span class="cat" style="color:var(--gold-deep);font-weight:600">${esc(S.categoryLabel(p.category))}</span>
      <h1>${esc(p.name)}</h1>
      <div class="price big"><b>${S.money(p.price)}</b>${off ? `<s>${S.money(p.mrp)}</s><span class="off">${off}% off</span>` : ""}</div>
      <p class="tax-note">Inclusive of all taxes</p>
      <p class="desc">${esc(p.description || "")}</p>
      <ul class="points">
        ${cfg.codAvailable ? `<li>${S.icon("cash")}Cash on Delivery available</li>` : ""}
        <li>${S.icon("phone")}Pay by UPI or bank transfer</li>
        <li>${S.icon("truck")}Free shipping above ${S.money(cfg.freeShippingAbove)}. Delivery in ${esc(cfg.deliveryDays)}</li>
        <li>${S.icon("ret")}${esc(cfg.returnDays)}-day return and exchange, as per our policy</li>
      </ul>
      <div class="buy">
        ${oos ? `<button class="btn" disabled>Out of stock</button>` : `
        <input id="qty" type="number" min="1" max="20" value="1" aria-label="Quantity">
        <button class="btn navy" id="addBtn">Add to cart</button>
        <button class="btn" id="buyBtn">Buy now</button>`}
      </div>
      <a class="btn wa" href="${ask}" target="_blank" rel="noopener">Ask on WhatsApp</a>
    </div>
  </div>`;

  if (!oos) {
    const qty = () => Math.min(20, Math.max(1, parseInt(document.getElementById("qty").value, 10) || 1));
    document.getElementById("addBtn").addEventListener("click", () => S.addToCart(p.id, qty()));
    document.getElementById("buyBtn").addEventListener("click", () => { S.addToCart(p.id, qty()); location.href = "checkout.html"; });
  }

  const rel = all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  if (rel.length) {
    document.getElementById("related").innerHTML = rel.map(S.productCard).join("");
    document.getElementById("relatedBox").hidden = false;
  }
})();
