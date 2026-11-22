(async function () {
  const S = window.SRIS, cfg = S.cfg, esc = S.esc;
  const box = document.getElementById("product");
  const id = new URLSearchParams(location.search).get("id");
  let all = [];
  try { all = await S.loadProducts(); } catch (e) {}
  const p = all.find((x) => String(x.id) === String(id));
  if (!p) { box.innerHTML = `<p class="empty">Product nahi mila. <a href="shop.html">Shop par jaayein</a></p>`; return; }

  document.title = `${p.name} | ${cfg.storeName}`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = (p.description || p.name).slice(0, 150);

  const off = S.discount(p), oos = S.outOfStock(p);
  const pageUrl = cfg.siteUrl.replace(/\/$/, "") + "/product.html?id=" + encodeURIComponent(p.id);
  const ask = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent("Namaste, mujhe is product ke baare me poochna hai: " + p.name + " " + pageUrl)}`;

  box.innerHTML = `<div class="pd">
    <div class="pd-img"><img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='https://placehold.co/600x600?text=No+Image'"></div>
    <div class="pd-info">
      <span class="cat" style="color:var(--gold);font-weight:700;text-transform:uppercase;font-size:.75rem;letter-spacing:.08em">${esc(S.categoryLabel(p.category))}</span>
      <h1>${esc(p.name)}</h1>
      <div class="price big"><b>${S.money(p.price)}</b>${off ? `<s>${S.money(p.mrp)}</s><span class="off">${off}% OFF</span>` : ""}</div>
      <p class="desc">${esc(p.description || "")}</p>
      <ul class="points">
        ${cfg.codAvailable ? "<li>💵 Cash on Delivery available</li>" : ""}
        <li>🚚 ${S.money(cfg.freeShippingAbove)} se upar free shipping, delivery ${esc(cfg.deliveryDays)}</li>
        <li>↩️ ${esc(cfg.returnDays)} din me return/exchange (policy ke anusaar)</li>
      </ul>
      <div class="buy">
        ${oos ? `<button class="btn" disabled style="background:#bbb">Stock khatam</button>` : `
        <input id="qty" type="number" min="1" max="20" value="1" aria-label="Quantity">
        <button class="btn maroon" id="addBtn">Cart me daalein</button>
        <button class="btn" id="buyBtn">Abhi kharidein</button>`}
      </div>
      <a class="btn wa" href="${ask}" target="_blank" rel="noopener">💬 WhatsApp par puchein</a>
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
