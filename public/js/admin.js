(function () {
  const S = window.SRIS, esc = S.esc, cfg = S.cfg, $ = (id) => document.getElementById(id);
  let token = "";
  try { token = sessionStorage.getItem("sris_admin") || ""; } catch (e) {}
  let products = [];

  async function api(path, opt) {
    opt = opt || {};
    const r = await fetch(path, { ...opt, headers: { "content-type": "application/json", "x-admin-token": token } });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { logout(); throw new Error("Password galat hai"); }
    if (!r.ok) throw new Error(d.error || "Error " + r.status);
    return d;
  }

  function logout() {
    token = "";
    try { sessionStorage.removeItem("sris_admin"); } catch (e) {}
    $("panel").hidden = true; $("loginBox").hidden = false;
  }

  $("pCat").innerHTML = cfg.categories.map((c) => `<option value="${esc(c.key)}">${esc(c.label)}</option>`).join("");

  // ---- login ----
  $("loginBox").addEventListener("submit", async (e) => {
    e.preventDefault();
    token = $("token").value.trim();
    $("loginErr").textContent = "";
    try {
      await loadProducts();
      try { sessionStorage.setItem("sris_admin", token); } catch (x) {}
      showPanel();
    } catch (err) { $("loginErr").textContent = err.message; token = ""; }
  });
  $("logout").addEventListener("click", logout);

  function showPanel() { $("loginBox").hidden = true; $("panel").hidden = false; renderProducts(); }

  // ---- tabs ----
  function tab(which) {
    $("secP").hidden = which !== "p"; $("secO").hidden = which !== "o";
    $("tabP").classList.toggle("active", which === "p"); $("tabO").classList.toggle("active", which === "o");
    if (which === "o") loadOrders();
  }
  $("tabP").addEventListener("click", () => tab("p"));
  $("tabO").addEventListener("click", () => tab("o"));

  // ---- products ----
  async function loadProducts() { products = await api("/api/admin/products"); }

  function renderProducts() {
    $("pRows").innerHTML = products.map((p) => `<tr>
      <td>${p.id}</td><td>${esc(p.name)}</td><td>${esc(S.categoryLabel(p.category))}</td><td>${S.money(p.price)}</td>
      <td>${p.active ? '<span class="tag">Live</span>' : '<span class="tag off">Hidden</span>'}${p.in_stock ? "" : '<span class="tag off">No stock</span>'}${p.featured ? '<span class="tag">Home</span>' : ""}</td>
      <td><button class="link-btn" data-edit="${p.id}">Edit</button> <button class="link-btn" data-del="${p.id}">Delete</button></td></tr>`).join("") ||
      `<tr><td colspan="6">Abhi koi product nahi hai.</td></tr>`;
  }

  function resetForm() {
    $("pForm").reset(); $("pId").value = ""; $("pStock").checked = true; $("pActive").checked = true;
    $("pFormTitle").textContent = "Naya product jodein"; $("pCancel").hidden = true; $("pErr").textContent = "";
  }
  $("pCancel").addEventListener("click", resetForm);

  $("pRows").addEventListener("click", async (e) => {
    const t = e.target;
    if (t.dataset.edit) {
      const p = products.find((x) => String(x.id) === t.dataset.edit);
      $("pId").value = p.id; $("pName").value = p.name; $("pCat").value = p.category; $("pPrice").value = p.price;
      $("pMrp").value = p.mrp == null ? "" : p.mrp; $("pImage").value = p.image || ""; $("pDesc").value = p.description || "";
      $("pStock").checked = !!p.in_stock; $("pFeat").checked = !!p.featured; $("pActive").checked = !!p.active;
      $("pFormTitle").textContent = "Product edit karein (ID " + p.id + ")"; $("pCancel").hidden = false;
      $("pForm").scrollIntoView({ behavior: "smooth" });
    } else if (t.dataset.del) {
      if (!confirm("Is product ko pakka delete karna hai? (Chhupana ho to Edit me 'Site par dikhayein' band karein)")) return;
      try { await api("/api/admin/products?id=" + t.dataset.del, { method: "DELETE" }); await loadProducts(); renderProducts(); }
      catch (err) { alert(err.message); }
    }
  });

  $("pForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      id: $("pId").value, name: $("pName").value, category: $("pCat").value, price: $("pPrice").value, mrp: $("pMrp").value,
      image: $("pImage").value, description: $("pDesc").value,
      in_stock: $("pStock").checked, featured: $("pFeat").checked, active: $("pActive").checked
    };
    $("pErr").textContent = "";
    try {
      await api("/api/admin/products", { method: body.id ? "PUT" : "POST", body: JSON.stringify(body) });
      await loadProducts(); renderProducts(); resetForm(); S.toast("Save ho gaya ✓");
    } catch (err) { $("pErr").textContent = err.message; }
  });

  // ---- orders ----
  const STATUS = ["new", "confirmed", "shipped", "delivered", "cancelled"];
  async function loadOrders() {
    const box = $("oList");
    box.innerHTML = "<p class='empty'>Load ho raha hai...</p>";
    try {
      const orders = await api("/api/admin/orders");
      box.innerHTML = orders.map((o) => {
        let items = []; try { items = JSON.parse(o.items); } catch (e) {}
        const when = new Date(o.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        return `<div class="order-card">
          <header><b>${esc(o.order_no)}</b><span>${esc(when)}</span>
            <select data-order="${o.id}" style="width:auto">${STATUS.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></header>
          <div><b>${esc(o.name)}</b> • <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></div>
          <div>${esc(o.address)}, ${esc(o.city || "")} - ${esc(o.pincode)}</div>
          <div style="margin:6px 0">${items.map((i) => `${esc(i.name)} x ${i.qty}`).join("<br>")}</div>
          <div><b>Total: ${S.money(o.total)}</b> (shipping ${S.money(o.shipping)}) • ${esc(o.payment || "")}${o.notes ? " • Note: " + esc(o.notes) : ""}</div>
        </div>`;
      }).join("") || "<p class='empty'>Abhi koi order nahi aaya.</p>";
    } catch (err) { box.innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
  }
  $("oList").addEventListener("change", async (e) => {
    const sel = e.target;
    if (!sel.dataset.order) return;
    try { await api("/api/admin/orders", { method: "PUT", body: JSON.stringify({ id: sel.dataset.order, status: sel.value }) }); S.toast("Status badal gaya ✓"); }
    catch (err) { alert(err.message); }
  });

  // auto-login agar token session me hai
  if (token) loadProducts().then(showPanel).catch(() => {});
})();
