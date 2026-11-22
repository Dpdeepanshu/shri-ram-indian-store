(function () {
  const S = window.SRIS, esc = S.esc, cfg = S.cfg, $ = (id) => document.getElementById(id);
  let token = "";
  try { token = sessionStorage.getItem("sris_admin") || ""; } catch (e) {}
  let products = [], photos = [], orders = [];
  const STATUS = ["new", "confirmed", "shipped", "delivered", "cancelled"];
  const PAY = ["Cash on Delivery", "UPI", "Bank Transfer", "Other"];

  async function api(path, opt) {
    opt = opt || {};
    const r = await fetch(path, { ...opt, headers: { "content-type": "application/json", "x-admin-token": token } });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { logout(); throw new Error("Please log in again"); }
    if (!r.ok) throw new Error(d.error || "Error " + r.status);
    return d;
  }
  const post = (p, m, b) => api(p, { method: m, body: JSON.stringify(b) });

  function logout() {
    token = ""; try { sessionStorage.removeItem("sris_admin"); } catch (e) {}
    $("panel").hidden = true; $("loginBox").hidden = false;
  }
  $("pCat").innerHTML = cfg.categories.map((c) => `<option value="${esc(c.key)}">${esc(c.label)}</option>`).join("");
  $("oStatus").innerHTML += STATUS.map((s) => `<option>${s}</option>`).join("");
  $("user").value = "admin";

  // ---------- login (username + password) ----------
  $("loginBox").addEventListener("submit", async (e) => {
    e.preventDefault(); $("loginErr").textContent = "";
    try {
      const r = await fetch("/api/admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: $("user").value, password: $("token").value }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Login failed (" + r.status + ")");
      token = d.token; try { sessionStorage.setItem("sris_admin", token); } catch (x) {}
      $("token").value = ""; await start();
    } catch (err) { $("loginErr").textContent = err.message; }
  });
  $("logout").addEventListener("click", logout);

  async function start() {
    await loadProducts();
    $("loginBox").hidden = true; $("panel").hidden = false;
    if (!cfg.useDatabase && !$("dbWarn")) {
      const n = document.createElement("div"); n.id = "dbWarn"; n.className = "notice"; n.style.marginBottom = "14px";
      n.textContent = "Note: useDatabase is false in js/config.js, so the public site still shows products from data/products.json. Set useDatabase: true for the changes made here to appear on the site.";
      $("panel").insertBefore(n, $("panel").firstChild);
    }
    tab("d");
  }

  // ---------- tabs ----------
  const TABS = { d: "secD", p: "secP", o: "secO", u: "secU" }, BTN = { d: "tabD", p: "tabP", o: "tabO", u: "tabU" };
  function tab(w) {
    Object.keys(TABS).forEach((k) => { $(TABS[k]).hidden = k !== w; $(BTN[k]).classList.toggle("active", k === w); });
    if (w === "d") loadStats(); if (w === "o") loadOrders(); if (w === "u") loadUsers(); if (w === "p") renderProducts();
  }
  Object.keys(BTN).forEach((k) => $(BTN[k]).addEventListener("click", () => tab(k)));

  // ---------- dashboard ----------
  async function loadStats() {
    try {
      const d = await api("/api/admin/stats"), o = d.orders || {}, t = d.today || {}, p = d.products || {};
      const card = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
      $("stats").innerHTML = card(o.new_orders || 0, "New orders") + card(t.n || 0, "Orders today") + card(S.money(t.revenue || 0), "Sales today") + card(o.n || 0, "Total orders") +
        card(S.money(o.revenue || 0), "Total sales (excl. cancelled)") + card(p.n || 0, "Products") + card(p.out || 0, "Out of stock") + card((d.users || {}).n || 0, "Customers");
      $("lowBox").innerHTML = d.low && d.low.length
        ? `<div class="box"><h2>Low stock (5 or less)</h2>${d.low.map((x) => `<div>${esc(x.name)}: <b>${x.stock_qty}</b> left</div>`).join("")}</div>` : "";
    } catch (err) { $("stats").innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
  }

  // =================== PRODUCTS ===================
  async function loadProducts() { products = await api("/api/admin/products"); }
  function renderProducts() {
    const t = $("pSearch").value.trim().toLowerCase();
    const list = products.filter((p) => !t || (p.name + " " + p.category).toLowerCase().includes(t));
    $("pRows").innerHTML = list.map((p) => `<tr>
      <td>${p.id}</td>
      <td><img src="${esc((p.images && p.images[0]) || p.image || S.PLACEHOLDER)}" alt="" width="44" height="44" style="object-fit:cover;border-radius:6px" referrerpolicy="no-referrer" onerror="${S.imgFallback}"></td>
      <td>${esc(p.name)}<br><small>${esc(S.categoryLabel(p.category))}</small></td>
      <td><input class="mini" type="number" min="1" value="${p.price}" data-price="${p.id}"></td>
      <td><input class="mini" type="number" min="0" value="${p.stock_qty == null ? "" : p.stock_qty}" placeholder="-" data-qty="${p.id}"></td>
      <td>${p.active ? '<span class="tag">Live</span>' : '<span class="tag off">Hidden</span>'}${p.in_stock ? "" : '<span class="tag off">Out of stock</span>'}${p.featured ? '<span class="tag">Home</span>' : ""}</td>
      <td><button class="link-btn" data-quick="${p.id}">Update</button> • <button class="link-btn" data-edit="${p.id}">Edit</button> • <button class="link-btn" data-del="${p.id}">Delete</button></td></tr>`).join("") || `<tr><td colspan="7">No products.</td></tr>`;
  }
  $("pSearch").addEventListener("input", renderProducts);

  // ---- photo manager (min 1, max 5) ----
  function renderPhotos() {
    $("phGrid").innerHTML = photos.map((u, i) => `<div class="ph"><img src="${esc(u)}" alt="Photo ${i + 1}" referrerpolicy="no-referrer" onerror="${S.imgFallback}">
      ${i === 0 ? "<em>Main</em>" : `<em data-main="${i}" style="cursor:pointer;background:#fff">Make main</em>`}<button type="button" data-rmph="${i}" aria-label="Remove photo">×</button></div>`).join("");
    $("phMsg").textContent = photos.length + " / 5 photos" + (photos.length < 1 ? " (add at least 1)" : "");
    $("phFile").disabled = photos.length >= 5;
  }
  $("phGrid").addEventListener("click", (e) => {
    const r = e.target.closest("[data-rmph]"), m = e.target.closest("[data-main]");
    if (r) photos.splice(+r.dataset.rmph, 1);
    else if (m) { const [x] = photos.splice(+m.dataset.main, 1); photos.unshift(x); } else return;
    renderPhotos();
  });
  $("phAdd").addEventListener("click", () => {
    const u = $("phUrl").value.trim();
    if (!u) return;
    if (!/^https?:\/\//.test(u)) { $("pErr").textContent = "Photo link must start with https://"; return; }
    if (photos.length >= 5) { $("pErr").textContent = "Maximum 5 photos allowed."; return; }
    photos.push(u); $("phUrl").value = ""; $("pErr").textContent = ""; renderPhotos();
  });
  // photo ko browser me chhota karke (max 900px, JPEG) upload karte hain
  function shrink(file) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        let q = 0.85, d = c.toDataURL("image/jpeg", q);
        while (d.length > 800000 && q > 0.4) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
        res(d);
      };
      img.onerror = () => rej(new Error("Could not read " + file.name));
      img.src = url;
    });
  }
  $("phFile").addEventListener("change", async (e) => {
    const files = [...e.target.files]; e.target.value = ""; $("pErr").textContent = "";
    const room = 5 - photos.length;
    if (files.length > room) $("pErr").textContent = "Maximum 5 photos. Only the first " + room + " will be added.";
    for (const f of files.slice(0, Math.max(0, room))) {
      try {
        $("phMsg").textContent = "Uploading " + f.name + "...";
        const d = await shrink(f), r = await post("/api/admin/upload", "POST", { data: d });
        photos.push(r.url); renderPhotos();
      } catch (err) { $("pErr").textContent = err.message; renderPhotos(); }
    }
  });

  function resetForm() {
    $("pForm").reset(); $("pId").value = ""; $("pStock").checked = true; $("pActive").checked = true; photos = []; renderPhotos();
    $("pFormTitle").textContent = "Add new product"; $("pCancel").hidden = true; $("pErr").textContent = "";
  }
  $("pCancel").addEventListener("click", resetForm);

  $("pRows").addEventListener("click", async (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.edit) {
      const p = products.find((x) => String(x.id) === t.dataset.edit); if (!p) return;
      $("pId").value = p.id; $("pName").value = p.name; $("pCat").value = p.category; $("pPrice").value = p.price;
      $("pMrp").value = p.mrp == null ? "" : p.mrp; $("pQty").value = p.stock_qty == null ? "" : p.stock_qty; $("pDesc").value = p.description || "";
      photos = (p.images && p.images.length ? p.images : p.image ? [p.image] : []).slice(0, 5); renderPhotos();
      $("pStock").checked = !!p.in_stock; $("pFeat").checked = !!p.featured; $("pActive").checked = !!p.active;
      $("pFormTitle").textContent = "Edit product (ID " + p.id + ")"; $("pCancel").hidden = false; $("pErr").textContent = "";
      $("pForm").scrollIntoView({ behavior: "smooth" });
    } else if (t.dataset.quick) {
      const id = t.dataset.quick, price = document.querySelector(`[data-price="${id}"]`).value, qty = document.querySelector(`[data-qty="${id}"]`).value;
      try { await post("/api/admin/products", "PATCH", { id, price, stock_qty: qty }); await loadProducts(); renderProducts(); S.toast("Price / stock updated"); }
      catch (err) { alert(err.message); }
    } else if (t.dataset.del) {
      if (!confirm("Delete this product permanently? (To just hide it, untick 'Show on site' in Edit.)")) return;
      try { await api("/api/admin/products?id=" + t.dataset.del, { method: "DELETE" }); await loadProducts(); renderProducts(); S.toast("Deleted"); }
      catch (err) { alert(err.message); }
    }
  });

  $("pForm").addEventListener("submit", async (e) => {
    e.preventDefault(); $("pErr").textContent = "";
    if (photos.length < 1) return ($("pErr").textContent = "Please add at least 1 photo.");
    if (photos.length > 5) return ($("pErr").textContent = "Maximum 5 photos allowed.");
    const body = {
      id: $("pId").value, name: $("pName").value, category: $("pCat").value, price: $("pPrice").value, mrp: $("pMrp").value, stock_qty: $("pQty").value,
      images: photos, description: $("pDesc").value, in_stock: $("pStock").checked, featured: $("pFeat").checked, active: $("pActive").checked
    };
    try {
      await post("/api/admin/products", body.id ? "PUT" : "POST", body);
      await loadProducts(); renderProducts(); resetForm(); S.toast("Saved");
    } catch (err) { $("pErr").textContent = err.message; }
  });

  // =================== ORDERS ===================
  const when = (o) => new Date(String(o.created_at).replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const itemsOf = (o) => { try { return JSON.parse(o.items) || []; } catch (e) { return []; } };
  let tmr;
  $("oSearch").addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(loadOrders, 300); });
  $("oStatus").addEventListener("change", loadOrders);

  async function loadOrders() {
    const box = $("oList"); box.innerHTML = "<p class='empty'>Loading...</p>";
    try {
      const qs = new URLSearchParams(); if ($("oSearch").value.trim()) qs.set("q", $("oSearch").value.trim()); if ($("oStatus").value) qs.set("status", $("oStatus").value);
      orders = await api("/api/admin/orders?" + qs);
      box.innerHTML = orders.map((o) => {
        const items = itemsOf(o);
        return `<div class="order-card">
          <header><b>${esc(o.order_no)}</b>${o.invoice_no ? `<span>Invoice ${esc(o.invoice_no)}</span>` : ""}<span>${esc(when(o))}</span>
            <select data-order="${o.id}" style="width:auto">${STATUS.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></header>
          ${o.biz_name || /^\[B2B\]/.test(o.notes || "") ? `<div><span class="tag">Business (GST)</span> ${esc(o.biz_name ? o.biz_name + " | GSTIN " + o.gstin : String(o.notes).replace(/^\[B2B\] /, "").slice(0, 80))}</div>` : ""}
          ${o.user_id ? `<div><span class="tag">Account #${o.user_id}</span></div>` : ""}
          <div><b>${esc(o.name)}</b> • <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></div>
          <div>${esc(o.address)}, ${esc(o.city || "")}${o.state ? ", " + esc(o.state) : ""} - ${esc(o.pincode)}</div>
          <div style="margin:6px 0">${items.map((i) => `${esc(i.name)} x ${i.qty} @ ${S.money(i.price)}`).join("<br>")}</div>
          <div><b>Total: ${S.money(o.total)}</b> (shipping ${S.money(o.shipping)}) • ${esc(o.payment || "")}${o.notes ? " • Note: " + esc(o.notes) : ""}</div>
          <div style="margin-top:8px"><button class="link-btn" data-edit="${o.id}">Edit items / price / quantity</button> • <button class="link-btn" data-inv="${o.id}">View / print invoice</button> • <a href="https://wa.me/91${esc(o.phone)}" target="_blank" rel="noopener">WhatsApp customer</a> • <button class="link-btn" data-odel="${o.id}" style="color:var(--red)">Delete order</button></div>
        </div>`;
      }).join("") || "<p class='empty'>No orders found.</p>";
    } catch (err) { box.innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
  }
  $("oList").addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.inv) window.open("invoice.html?id=" + encodeURIComponent(b.dataset.inv), "_blank"); // noopener nahi: token wala sessionStorage naye tab me copy hota hai
    else if (b.dataset.edit) orderModal(orders.find((o) => String(o.id) === b.dataset.edit));
    else if (b.dataset.odel) {
      if (!confirm("Delete this order permanently? Stock of its items will be added back.")) return;
      try { await api("/api/admin/orders?id=" + b.dataset.odel, { method: "DELETE" }); S.toast("Order deleted"); loadOrders(); } catch (err) { alert(err.message); }
    }
  });
  $("oList").addEventListener("change", async (e) => {
    const sel = e.target; if (!sel.dataset.order) return;
    try { await post("/api/admin/orders", "PUT", { id: sel.dataset.order, status: sel.value }); S.toast("Status updated"); }
    catch (err) { alert(err.message); loadOrders(); }
  });
  $("oAdd").addEventListener("click", () => orderModal(null));

  // ---- Add / Edit order popup ----
  function orderModal(o) {
    const isNew = !o, lines = o ? itemsOf(o).map((i) => ({ id: i.id, name: i.name, category: i.category, qty: i.qty, price: i.price })) : [{ id: "", qty: 1, price: "" }];
    const bg = document.createElement("div"); bg.className = "modal-bg";
    const val = (k, d) => esc(o && o[k] != null ? o[k] : d || "");
    bg.innerHTML = `<form class="modal" novalidate>
      <h2>${isNew ? "Add order" : "Edit order " + esc(o.order_no)}</h2>
      <div class="form-grid">
        <div class="field"><label>Customer name *</label><input id="m_name" value="${val("name")}"></div>
        <div class="field"><label>Mobile (10 digit) *</label><input id="m_phone" inputmode="numeric" value="${val("phone")}"></div>
        ${isNew ? `<div class="field full"><label>Customer account email (optional, links the order to their order history)</label><input id="m_email" type="email"></div>` : ""}
        <div class="field full"><label>Address *</label><input id="m_address" value="${val("address")}"></div>
        <div class="field"><label>City *</label><input id="m_city" value="${val("city")}"></div>
        <div class="field"><label>State *</label><select id="m_state"><option value="">Select</option>${S.STATES.map((x) => `<option ${o && o.state === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
        <div class="field"><label>PIN code *</label><input id="m_pin" inputmode="numeric" maxlength="6" value="${val("pincode")}"></div>
        <div class="field"><label>Payment</label><select id="m_pay">${PAY.map((x) => `<option ${o && o.payment === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="field"><label>Status</label><select id="m_status">${STATUS.map((x) => `<option ${o && o.status === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="field"><label>Shipping charge (₹)</label><input id="m_ship" type="number" min="0" value="${o ? o.shipping : 0}"></div>
        <div class="field full"><label>Note</label><input id="m_notes" value="${val("notes")}"></div>
      </div>
      <h3 style="margin:8px 0">Items (change quantity or price here)</h3>
      <div id="m_items"></div>
      <button type="button" class="btn sm" id="m_addline">+ Add item</button>
      <p style="margin-top:10px"><b id="m_total"></b></p>
      <div class="form-error" id="m_err"></div>
      <button class="btn navy" type="submit">Save order</button> <button class="btn" type="button" id="m_close">Close</button>
    </form>`;
    document.body.appendChild(bg);
    const $m = (id) => bg.querySelector("#" + id);
    const opts = (sel) => `<option value="">Select product</option>` + products.map((p) => `<option value="${p.id}" ${String(sel) === String(p.id) ? "selected" : ""}>${esc(p.name.slice(0, 50))}</option>`).join("") +
      (sel && !products.some((p) => String(p.id) === String(sel)) ? `<option value="${esc(sel)}" selected>(deleted product)</option>` : "");
    function draw() {
      $m("m_items").innerHTML = lines.map((l, i) => `<div class="it-row"><select data-i="${i}" data-f="id">${opts(l.id)}</select><input type="number" min="1" value="${l.qty}" data-i="${i}" data-f="qty" aria-label="Quantity"><input type="number" min="0" value="${l.price}" placeholder="Price" data-i="${i}" data-f="price" aria-label="Price"><button type="button" class="link-btn" data-rm="${i}" aria-label="Remove">×</button></div>`).join("");
      total();
    }
    function total() { const s = lines.reduce((a, l) => a + (Number(l.price) || 0) * (Number(l.qty) || 0), 0); $m("m_total").textContent = "Items total: " + S.money(s) + "  +  shipping " + S.money(Number($m("m_ship").value) || 0) + "  =  " + S.money(s + (Number($m("m_ship").value) || 0)); }
    bg.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.f) { lines[+t.dataset.i][t.dataset.f] = t.value; total(); }
      if (t.id === "m_ship") total();
    });
    bg.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.f === "id") { const l = lines[+t.dataset.i], p = products.find((x) => String(x.id) === t.value); l.id = t.value; if (p) { l.price = p.price; l.name = p.name; l.category = p.category; } draw(); }
    });
    bg.addEventListener("click", (e) => {
      if (e.target.id === "m_addline") { lines.push({ id: "", qty: 1, price: "" }); draw(); }
      else if (e.target.dataset.rm) { lines.splice(+e.target.dataset.rm, 1); draw(); }
      else if (e.target.id === "m_close" || e.target === bg) bg.remove();
    });
    bg.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault(); $m("m_err").textContent = "";
      const body = { name: $m("m_name").value, phone: $m("m_phone").value, address: $m("m_address").value, city: $m("m_city").value, state: $m("m_state").value, pincode: $m("m_pin").value,
        payment: $m("m_pay").value, status: $m("m_status").value, shipping: $m("m_ship").value, notes: $m("m_notes").value,
        items: lines.filter((l) => l.id).map((l) => ({ id: l.id, qty: l.qty, price: l.price, name: l.name, category: l.category })) };
      if (!body.items.length) return ($m("m_err").textContent = "Add at least one item.");
      if (isNew) body.email = $m("m_email").value;
      try {
        if (isNew) await post("/api/admin/orders", "POST", body); else { body.id = o.id; await post("/api/admin/orders", "PUT", body); }
        bg.remove(); S.toast("Order saved"); await loadProducts(); loadOrders();
      } catch (err) { $m("m_err").textContent = err.message; }
    });
    draw();
  }

  // CSV export (jo orders screen par dikh rahe hain)
  $("oCsv").addEventListener("click", () => {
    const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const head = ["Order No", "Invoice No", "Date", "Status", "Name", "Phone", "Address", "City", "State", "PIN", "Items", "Subtotal", "Shipping", "Total", "Payment"];
    const rows = orders.map((o) => [o.order_no, o.invoice_no, when(o), o.status, o.name, o.phone, o.address, o.city, o.state, o.pincode, itemsOf(o).map((i) => i.name + " x" + i.qty).join("; "), o.subtotal, o.shipping, o.total, o.payment]);
    const csv = "\ufeff" + [head, ...rows].map((r) => r.map(q).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "orders-" + new Date().toISOString().slice(0, 10) + ".csv"; a.click();
  });

  // =================== CUSTOMERS ===================
  async function loadUsers() {
    try {
      const us = await api("/api/admin/users");
      $("uRows").innerHTML = us.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><a href="tel:${esc(u.phone || "")}">${esc(u.phone || "")}</a></td><td>${u.verified ? '<span class="tag">Yes</span>' : '<span class="tag off">No</span>'}</td><td>${u.orders}</td><td>${esc(String(u.created_at).slice(0, 10))}</td><td><button class="link-btn" data-udel="${u.id}">Delete</button></td></tr>`).join("") || `<tr><td colspan="7">No customers yet.</td></tr>`;
    } catch (err) { $("uRows").innerHTML = `<tr><td colspan="7">${esc(err.message)}</td></tr>`; }
  }
  $("uRows").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-udel]"); if (!b) return;
    if (!confirm("Delete this customer account? Their past orders stay in Orders.")) return;
    try { await api("/api/admin/users?id=" + b.dataset.udel, { method: "DELETE" }); loadUsers(); } catch (err) { alert(err.message); }
  });

  // auto-login agar token session me hai
  renderPhotos();
  if (token) start().catch(() => {});
})();
