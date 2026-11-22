(async function () {
  const S = window.SRIS, cfg = S.cfg, esc = S.esc, $ = (id) => document.getElementById(id);
  const LAST_KEY = "sris_last_order_v1", LAST_TTL = 48 * 3600 * 1000;
  let all = [], loadFailed = false, placing = false, removedNote = "";
  try { all = await S.loadProducts(); } catch (e) { loadFailed = true; }
  if (!Array.isArray(all) || !all.length) loadFailed = true;

  const methods = S.payMethods();
  $("payOpts").innerHTML = methods.map((m, i) => `<label class="pay-opt"><input type="radio" name="payment" value="${esc(m.id)}" ${i === 0 ? "checked" : ""}><span><b>${esc(m.label)}</b><small>${esc(m.sub)}</small></span></label>`).join("");
  const chosen = () => (document.querySelector('input[name="payment"]:checked') || {}).value || methods[0].id;
  function showPayDetail() { $("payDetail").innerHTML = S.payDetailHtml(chosen(), totals().total); }
  $("payOpts").addEventListener("change", showPayDetail);

  // Last order (confirmation page reload / back ke baad bhi dikhe)
  const saveLast = (o) => { try { localStorage.setItem(LAST_KEY, JSON.stringify(o)); } catch (e) {} };
  const clearLast = () => { try { localStorage.removeItem(LAST_KEY); } catch (e) {} };
  function loadLast() {
    try {
      const o = JSON.parse(localStorage.getItem(LAST_KEY));
      if (o && o.no && Date.now() - o.ts < LAST_TTL) return o;
    } catch (e) {}
    return null;
  }

  // Cart me jo products ab nahi hain ya stock me nahi hain, unhe hata do aur customer ko bata do
  function cleanCart() {
    if (loadFailed) return;
    const cart = S.getCart(), gone = [];
    let changed = false;
    Object.keys(cart).forEach((id) => {
      const p = all.find((x) => String(x.id) === id);
      if (!p) { delete cart[id]; changed = true; return; }
      if (S.outOfStock(p)) { gone.push(p.name); delete cart[id]; changed = true; }
    });
    if (changed) S.setCart(cart);
    if (gone.length) removedNote = "Removed from your cart because it is out of stock: " + gone.join(", ");
  }

  function totals() {
    const cart = S.getCart();
    const lines = Object.keys(cart).map((id) => {
      const p = all.find((x) => String(x.id) === id);
      return p ? { p, qty: Math.min(S.MAX_QTY, cart[id]) } : null;
    }).filter(Boolean);
    const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
    const shipping = subtotal === 0 ? 0 : subtotal >= cfg.freeShippingAbove ? 0 : cfg.shippingCharge;
    return { lines, subtotal, shipping, total: subtotal + shipping };
  }

  function render() {
    const t = totals();
    const has = t.lines.length > 0;
    $("co").hidden = !has;
    $("emptyCart").hidden = has || loadFailed || !$("done").hidden;
    $("loadError").hidden = !loadFailed;
    $("cartNote").hidden = !removedNote; $("cartNote").textContent = removedNote;
    $("items").innerHTML = t.lines.map(({ p, qty }) => `
      <div class="cart-row">
        <img src="${esc(p.image || S.PLACEHOLDER)}" alt="" referrerpolicy="no-referrer" onerror="${S.imgFallback}">
        <div><a href="product.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none"><b>${esc(p.name)}</b></a><br>
          <small>${S.money(p.price)} × ${qty} = ${S.money(p.price * qty)}</small><br>
          <button type="button" class="link-btn" data-rm="${esc(p.id)}">Remove</button></div>
        <div class="qty"><button type="button" data-dec="${esc(p.id)}" aria-label="Decrease quantity">−</button><span>${qty}</span><button type="button" data-inc="${esc(p.id)}" aria-label="Increase quantity" ${qty >= S.MAX_QTY ? "disabled" : ""}>+</button></div>
      </div>`).join("");
    const left = cfg.freeShippingAbove - t.subtotal;
    $("summary").innerHTML = `
      <div class="sum-row"><span>Subtotal</span><span>${S.money(t.subtotal)}</span></div>
      <div class="sum-row"><span>Shipping</span><span>${t.shipping ? S.money(t.shipping) : "Free"}</span></div>
      <div class="sum-row total"><span>Total</span><span>${S.money(t.total)}</span></div>
      ${has && left > 0 ? `<p class="hint">Add ${S.money(left)} more to get free shipping.</p>` : ""}`;
  }

  $("items").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.inc) S.changeQty(b.dataset.inc, 1);
    else if (b.dataset.dec) S.changeQty(b.dataset.dec, -1);
    else if (b.dataset.rm) { const c = S.getCart(); delete c[b.dataset.rm]; S.setCart(c); }
    else return;
    render(); showPayDetail();
  });

  // Paste ki hui values saaf karo (phone: +91, spaces, dashes; PIN: spaces)
  $("phone").addEventListener("input", (e) => { const d = S.normalizePhone(e.target.value); if (d !== e.target.value) e.target.value = d.slice(0, 10); });
  $("pincode").addEventListener("input", (e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 6); if (d !== e.target.value) e.target.value = d; });

  function orderNo() {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    const rnd = (Math.random().toString(36).slice(2) + "000000").slice(0, 5).toUpperCase();
    return "SRIS-" + ymd + "-" + rnd;
  }

  function fail(msg, field) {
    $("formError").textContent = msg;
    if (field) $(field).focus();
    return false;
  }

  function buildMessage(o) {
    const lines = o.lines.map((l) => `• ${l.name} x ${l.qty} = ${S.money(l.price * l.qty)}`).join("\n");
    const paid = o.payment === "Cash on Delivery" ? "pay on delivery" : "payment pending, details to be confirmed";
    return `*New order: ${cfg.storeName}*\nOrder No: ${o.no}\n\n${lines}\n\nSubtotal: ${S.money(o.subtotal)}\nShipping: ${o.shipping ? S.money(o.shipping) : "Free"}\n*Total: ${S.money(o.total)}*\n\nPayment method: ${o.payment} (${paid})\n\nName: ${o.name}\nMobile: ${o.phone}\nAddress: ${o.address}, ${o.city} - ${o.pincode}${o.notes ? "\nNote: " + o.notes : ""}`;
  }
  const waUrl = (o) => `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(buildMessage(o))}`;

  // Order confirmation: payment details yahan rehti hain (cart clear hone ke baad bhi)
  function showDone(o, opened) {
    $("co").hidden = true; $("emptyCart").hidden = true; $("cartNote").hidden = true; $("loadError").hidden = true;
    $("pageTitle").textContent = "Order placed";
    const rows = o.lines.map((l) => `<tr><td>${esc(l.name)} × ${l.qty}</td><td>${S.money(l.price * l.qty)}</td></tr>`).join("");
    $("done").innerHTML = `
      <p class="ok">Thank you, ${esc(o.name)}! Your order is ready.</p>
      <p>Order number: <span class="ono">${esc(o.no)}</span></p>
      <div class="notice"><b>One last step:</b> ${opened ? "WhatsApp should have opened with your order message. " : ""}Send the order message to us on WhatsApp so we can confirm it. If WhatsApp did not open, tap the green button below.</div>
      <div class="btns-col"><a class="btn wa" href="${esc(waUrl(o))}" target="_blank" rel="noopener">Send order on WhatsApp</a></div>
      <h2>Payment: ${esc(o.payment)}</h2>
      <div class="pay-detail">${S.payDetailHtml(o.payment, o.total, o.no)}</div>
      <h2 style="margin-top:14px">Order details</h2>
      <table class="kv">${rows}
        <tr><td>Subtotal</td><td>${S.money(o.subtotal)}</td></tr>
        <tr><td>Shipping</td><td>${o.shipping ? S.money(o.shipping) : "Free"}</td></tr>
        <tr><td><b>Total</b></td><td><b>${S.money(o.total)}</b></td></tr>
      </table>
      <p class="hint">Delivering to: ${esc(o.name)}, ${esc(o.phone)}, ${esc(o.address)}, ${esc(o.city)} - ${esc(o.pincode)}</p>
      <div class="btns-col"><a class="btn navy" href="shop.html" id="newOrder">Continue shopping</a></div>`;
    $("done").hidden = false;
    $("newOrder").addEventListener("click", clearLast);
    window.scrollTo(0, 0);
  }

  $("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (placing) return;
    const t = totals();
    if (!t.lines.length) return;
    const d = {};
    ["name", "phone", "address", "city", "pincode", "notes"].forEach((k) => (d[k] = String($(k).value || "").trim().replace(/[ \t]+/g, " ")));
    d.phone = S.normalizePhone(d.phone); $("phone").value = d.phone;
    d.pincode = d.pincode.replace(/\D/g, ""); $("pincode").value = d.pincode;
    d.payment = chosen();

    if (d.name.length < 2) return fail("Please enter your name.", "name");
    if (!/^[6-9]\d{9}$/.test(d.phone)) return fail("Please enter a valid 10-digit mobile number (it should start with 6, 7, 8 or 9).", "phone");
    if (d.address.length < 8) return fail("Please enter your full address (house no., street, area).", "address");
    if (d.city.length < 2) return fail("Please enter your city and state.", "city");
    if (!/^[1-9]\d{5}$/.test(d.pincode)) return fail("Please enter a valid 6-digit PIN code.", "pincode");
    $("formError").textContent = "";

    placing = true; $("placeBtn").disabled = true;
    const o = {
      no: orderNo(), ts: Date.now(), payment: d.payment, name: d.name, phone: d.phone, address: d.address, city: d.city, pincode: d.pincode, notes: d.notes,
      subtotal: t.subtotal, shipping: t.shipping, total: t.total,
      lines: t.lines.map((l) => ({ id: l.p.id, name: l.p.name, price: l.p.price, qty: l.qty }))
    };
    saveLast(o);

    // WhatsApp isi click me kholo (popup blocker se bachne ke liye), page par confirmation rehta hai
    let w = null;
    try { w = window.open(waUrl(o), "_blank"); } catch (x) {}

    if (cfg.useDatabase) {
      try {
        fetch("/api/orders", {
          method: "POST", keepalive: true, headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderNo: o.no, name: o.name, phone: o.phone, address: o.address, city: o.city, pincode: o.pincode, payment: o.payment, notes: o.notes, shipping: o.shipping, items: o.lines.map((l) => ({ id: l.id, qty: l.qty })) })
        }).catch(() => {});
      } catch (x) {}
    }
    S.clearCart();
    placing = false; $("placeBtn").disabled = false;
    showDone(o, !!w);
  });

  // ---- start ----
  cleanCart();
  const last = loadLast();
  if (!Object.keys(S.getCart()).length && last && !loadFailed) { showDone(last, false); }
  else { render(); showPayDetail(); }
})();
