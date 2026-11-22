(async function () {
  const S = window.SRIS, esc = S.esc, $ = (id) => document.getElementById(id);
  if (!S.cfg.useDatabase) { $("loading").textContent = "Accounts are not enabled yet."; return; }
  const user = await S.me();
  if (!user) { location.replace("login.html?next=account.html"); return; }
  $("loading").hidden = true; $("acct").hidden = false;
  $("pEmail").value = user.email; $("pName").value = user.name || ""; $("pPhone").value = user.phone || "";

  const tab = (w) => { $("secO").hidden = w !== "o"; $("secP").hidden = w !== "p"; $("tabO").classList.toggle("active", w === "o"); $("tabP").classList.toggle("active", w === "p"); };
  $("tabO").onclick = () => tab("o"); $("tabP").onclick = () => tab("p");
  $("out").onclick = () => S.logout();
  if (location.hash === "#profile") tab("p");

  const FLOW = ["new", "confirmed", "shipped", "delivered"];
  const mine = async (opt) => { const r = await fetch("/api/my/orders", { credentials: "same-origin", ...opt }); if (r.status === 401) { location.replace("login.html?next=account.html"); return null; } return r; };

  async function loadOrders() {
    const box = $("oList"); box.innerHTML = "<p class='empty'>Loading...</p>";
    const r = await mine().catch(() => null);
    if (!r) return;
    if (!r.ok) { box.innerHTML = "<p class='empty'>Could not load your orders. Please try again.</p>"; return; }
    const orders = await r.json();
    if (!orders.length) { box.innerHTML = `<div class="box" style="text-align:center"><p>You have not placed any orders yet.</p><br><a class="btn navy" href="shop.html">Start shopping</a></div>`; return; }
    box.innerHTML = orders.map((o) => {
      let items = []; try { items = JSON.parse(o.items); } catch (e) {}
      const when = new Date(String(o.created_at).replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
      const idx = FLOW.indexOf(o.status);
      const steps = o.status === "cancelled" ? "" : `<div class="o-steps" title="${esc(o.status)}">${FLOW.map((_, i) => `<i class="${i <= idx ? "on" : ""}"></i>`).join("")}</div>`;
      return `<div class="o-card">
        <header><div><b>${esc(o.order_no)}</b><br><small>${esc(when)}</small></div><span class="st ${esc(o.status)}">${esc(o.status)}</span></header>
        ${steps}
        <div class="o-lines">${items.map((i) => `${esc(i.name)} × ${i.qty}`).join("<br>")}</div>
        <div class="o-foot"><span><b>${S.money(o.total)}</b> • ${esc(o.payment || "")}</span>
          <a class="btn navy sm" href="invoice.html?no=${encodeURIComponent(o.order_no)}" target="_blank" rel="noopener">View / download invoice</a></div>
        <small class="hint">Delivering to: ${esc(o.address)}, ${esc(o.city || "")}, ${esc(o.state || "")} - ${esc(o.pincode)}</small>
      </div>`;
    }).join("");
  }
  loadOrders();

  $("pPhone").addEventListener("input", (e) => { const d = S.normalizePhone(e.target.value); if (d !== e.target.value) e.target.value = d.slice(0, 10); });
  $("pf").addEventListener("submit", async (e) => {
    e.preventDefault(); $("pErr").textContent = "";
    const r = await fetch("/api/my/profile", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: $("pName").value, phone: $("pPhone").value }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) $("pErr").textContent = d.error || "Could not save."; else S.toast("Saved");
  });
  $("pw").addEventListener("submit", async (e) => {
    e.preventDefault(); $("wErr").textContent = "";
    const r = await fetch("/api/my/profile", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ oldPassword: $("oPw").value, newPassword: $("nPw").value }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) $("wErr").textContent = d.error || "Could not change the password."; else { S.toast("Password changed"); $("pw").reset(); }
  });
})();
