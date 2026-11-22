(async function () {
  const S = window.SRIS, cfg = S.cfg, esc = S.esc, $ = (id) => document.getElementById(id);
  let all = [];
  try { all = await S.loadProducts(); } catch (e) {}

  const payment = $("payment");
  payment.innerHTML = (cfg.codAvailable ? `<option value="Cash on Delivery">Cash on Delivery</option>` : "") +
    `<option value="UPI / Bank transfer">UPI / Bank transfer (details WhatsApp par milenge)</option>`;

  function totals() {
    const cart = S.getCart();
    const lines = Object.keys(cart).map((id) => {
      const p = all.find((x) => String(x.id) === id);
      return p ? { p, qty: cart[id] } : null;
    }).filter(Boolean);
    const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
    const shipping = subtotal === 0 ? 0 : subtotal >= cfg.freeShippingAbove ? 0 : cfg.shippingCharge;
    return { lines, subtotal, shipping, total: subtotal + shipping };
  }

  function render() {
    const t = totals();
    const has = t.lines.length > 0;
    $("co").hidden = !has;
    $("emptyCart").hidden = has;
    $("items").innerHTML = t.lines.map(({ p, qty }) => `
      <div class="cart-row">
        <img src="${esc(p.image)}" alt="" onerror="this.onerror=null;this.src='https://placehold.co/128x128?text=No+Image'">
        <div><a href="product.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none"><b>${esc(p.name)}</b></a><br>
          <small>${S.money(p.price)} x ${qty} = ${S.money(p.price * qty)}</small><br>
          <button class="link-btn" data-rm="${esc(p.id)}">Hatayein</button></div>
        <div class="qty"><button data-dec="${esc(p.id)}" aria-label="Kam karein">−</button><span>${qty}</span><button data-inc="${esc(p.id)}" aria-label="Badhayein">+</button></div>
      </div>`).join("");
    const left = cfg.freeShippingAbove - t.subtotal;
    $("summary").innerHTML = `
      <div class="sum-row"><span>Subtotal</span><span>${S.money(t.subtotal)}</span></div>
      <div class="sum-row"><span>Shipping</span><span>${t.shipping ? S.money(t.shipping) : "Free"}</span></div>
      <div class="sum-row total"><span>Total</span><span>${S.money(t.total)}</span></div>
      ${has && left > 0 ? `<p class="hint">Aur ${S.money(left)} ka saamaan jodein, shipping free ho jaayegi.</p>` : ""}`;
  }

  $("items").addEventListener("click", (e) => {
    const t = e.target;
    if (t.dataset.inc) S.changeQty(t.dataset.inc, 1);
    else if (t.dataset.dec) S.changeQty(t.dataset.dec, -1);
    else if (t.dataset.rm) { const c = S.getCart(); delete c[t.dataset.rm]; S.setCart(c); }
    else return;
    render();
  });

  function orderNo() {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    return "SRIS-" + ymd + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  $("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("formError");
    const t = totals();
    if (!t.lines.length) return;
    const d = Object.fromEntries(new FormData(e.target).entries());
    Object.keys(d).forEach((k) => (d[k] = String(d[k]).trim()));
    if (!d.name) return (err.textContent = "Apna naam likhein.");
    if (!/^[6-9]\d{9}$/.test(d.phone)) return (err.textContent = "Sahi 10 digit mobile number likhein.");
    if (d.address.length < 8) return (err.textContent = "Poora address likhein.");
    if (!d.city) return (err.textContent = "Sheher / rajya likhein.");
    if (!/^\d{6}$/.test(d.pincode)) return (err.textContent = "Sahi 6 digit pincode likhein.");
    err.textContent = "";

    const no = orderNo();
    const lines = t.lines.map((l) => `• ${l.p.name} x ${l.qty} = ${S.money(l.p.price * l.qty)}`).join("\n");
    const msg = `*Naya Order: ${cfg.storeName}*\nOrder No: ${no}\n\n${lines}\n\nSubtotal: ${S.money(t.subtotal)}\nShipping: ${t.shipping ? S.money(t.shipping) : "Free"}\n*Total: ${S.money(t.total)}*\n\nPayment: ${d.payment}\n\nNaam: ${d.name}\nMobile: ${d.phone}\nAddress: ${d.address}, ${d.city} - ${d.pincode}${d.notes ? "\nNote: " + d.notes : ""}`;

    if (cfg.useDatabase) {
      try {
        fetch("/api/orders", {
          method: "POST", keepalive: true, headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderNo: no, ...d, shipping: t.shipping, items: t.lines.map((l) => ({ id: l.p.id, qty: l.qty })) })
        });
      } catch (x) {}
    }
    S.clearCart();
    location.href = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  });

  render();
})();
