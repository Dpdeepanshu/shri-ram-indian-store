(function () {
  const cfg = window.STORE_CONFIG;
  const CART_KEY = "sris_cart_v1";
  const $ = (s, r = document) => r.querySelector(s);

  const money = (n) => cfg.currency + Number(n).toLocaleString("en-IN");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const categoryLabel = (key) => (cfg.categories.find((c) => c.key === key) || { label: key }).label;
  const PLACEHOLDER = "images/placeholder.svg";
  const imgFallback = `this.onerror=null;this.src='${PLACEHOLDER}'`;

  // ---------- Icons (24x24 line icons) ----------
  const ICONS = {
    dress: "M9 3l3 3 3-3 2 5-2 3 3 10H6l3-10-2-3z",
    beauty: "M10 3h4v5h-4zM8 8h8v13H8zM8 13h8",
    kitchen: "M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM2 11h20M8 4c0 2 2 2 2 4M13 4c0 2 2 2 2 4",
    wallet: "M3 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l11-3v3M16 13.5h4",
    ring: "M12 8l3-4-3-1-3 1zM12 8a6 6 0 1 0 .01 0z",
    truck: "M2 6h11v10H2zM13 9h4l4 4v3h-8M6 19a2 2 0 1 0 .01 0M17 19a2 2 0 1 0 .01 0",
    cash: "M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 .01 0M6 10v4M18 10v4",
    ret: "M4 9h12a4 4 0 0 1 0 8H8M4 9l4-4M4 9l4 4",
    chat: "M4 5h16v11H9l-5 4z",
    cart: "M3 4h3l2.5 11h9L20 7H7M9 20a1 1 0 1 0 .01 0M17 20a1 1 0 1 0 .01 0",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5L16 9.5",
    phone: "M8 3h8v18H8zM11 18h2",
    bank: "M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
    check: "M5 12l4.5 4.5L19 7",
    user: "M12 12a4 4 0 1 0 .01 0M4 21c0-4 3.6-7 8-7s8 3 8 7"
  };
  const icon = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ICONS.check}"/></svg>`;

  // ---------- Payment methods (driven by config.js) ----------
  function payMethods() {
    const m = [];
    if (cfg.codAvailable) m.push({ id: "Cash on Delivery", label: "Cash on Delivery", sub: "Pay in cash when your order arrives.", icon: "cash" });
    m.push({ id: "UPI", label: "UPI", sub: "Pay with any UPI app (Google Pay, PhonePe, Paytm, BHIM).", icon: "phone" });
    m.push({ id: "Bank Transfer", label: "Bank Transfer (NEFT / IMPS)", sub: "Pay directly to our bank account.", icon: "bank" });
    return m;
  }
  const bankShown = () => cfg.bankAccountNumber && cfg.bankIfsc;
  function payDetailHtml(id, total, orderNo) {
    if (id === "UPI") {
      if (!cfg.upiId) return `<p>UPI payment details will be shared on WhatsApp once we confirm your order.</p>`;
      const link = `upi://pay?pa=${encodeURIComponent(cfg.upiId)}&pn=${encodeURIComponent(cfg.storeName)}&am=${total}&cu=INR&tn=${encodeURIComponent(orderNo || "Order")}`;
      return `<p>Pay <b>${money(total)}</b> to UPI ID <code>${esc(cfg.upiId)}</code></p>
        ${cfg.upiQrImage ? `<img src="${esc(cfg.upiQrImage)}" alt="UPI QR code">` : ""}
        <p><a class="btn navy" style="padding:8px 18px" href="${link}">Pay with UPI app</a></p>
        <p class="hint">After paying, send the payment screenshot or UTR number on WhatsApp so we can confirm your order.</p>`;
    }
    if (id === "Bank Transfer") {
      if (!bankShown()) return `<p>Bank account details will be shared on WhatsApp once we confirm your order.</p>`;
      return `<table class="kv"><tr><td>Account name</td><td>${esc(cfg.bankAccountName)}</td></tr><tr><td>Bank</td><td>${esc(cfg.bankName)}</td></tr><tr><td>Account number</td><td>${esc(cfg.bankAccountNumber)}</td></tr><tr><td>IFSC</td><td>${esc(cfg.bankIfsc)}</td></tr></table>
        <p class="hint">Send the transaction reference on WhatsApp after paying.</p>`;
    }
    return `<p>Keep <b>${money(total)}</b> ready. You pay when the parcel is delivered.</p>`;
  }
  const payChips = () => payMethods().map((m) => `<span class="chip">${icon(m.icon)}${esc(m.label.replace(" (NEFT / IMPS)", ""))}</span>`).join("");

  const STATES = ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

  // Phone: paste kiya hua +91 / 0 / spaces / dashes hata kar 10-digit number
  function normalizePhone(v) {
    let d = String(v == null ? "" : v).replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    return d;
  }

  // ---------- Cart ----------
  const MAX_QTY = 20;
  function getCart() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) {}
    const c = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      Object.keys(raw).forEach((id) => { const q = Math.floor(Number(raw[id])); if (q > 0) c[id] = Math.min(MAX_QTY, q); });
    }
    return c;
  }
  function setCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} updateCartCount(); }
  function addToCart(id, qty) {
    const c = getCart(), cur = c[id] || 0, want = cur + (qty || 1);
    c[id] = Math.min(MAX_QTY, want); setCart(c);
    toast(want > MAX_QTY ? "Maximum " + MAX_QTY + " per item" : "Added to cart");
  }
  function changeQty(id, d) { const c = getCart(); c[id] = Math.min(MAX_QTY, (c[id] || 0) + d); if (c[id] <= 0) delete c[id]; setCart(c); }
  function clearCart() { setCart({}); }
  function cartCount() { return Object.values(getCart()).reduce((a, b) => a + b, 0); }
  function updateCartCount() { document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cartCount())); }

  // ---------- Products ----------
  let _cache = null;
  async function loadProducts() {
    if (_cache) return _cache;
    const all = await loadProductsRaw();
    pruneCart(all);
    return all;
  }
  async function loadProductsRaw() {
    if (cfg.useDatabase) {
      try {
        const r = await fetch("/api/products");
        if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) { _cache = d; return _cache; } }
      } catch (e) {}
    }
    const r = await fetch("data/products.json");
    _cache = await r.json();
    return _cache;
  }
  // cart me purane/hate hue products ke ids ho sakte hain; unhe hata do taaki cart count galat na dikhe
  function pruneCart(all) {
    const c = getCart(); let changed = false;
    Object.keys(c).forEach((id) => { if (!all.some((p) => String(p.id) === id)) { delete c[id]; changed = true; } });
    if (changed) setCart(c);
  }
  function outOfStock(p) { return p.in_stock === 0 || p.in_stock === false || (p.stock_qty !== null && p.stock_qty !== undefined && p.stock_qty <= 0); }
  function discount(p) { return p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0; }
  function productCard(p) {
    const off = discount(p);
    const link = "product.html?id=" + encodeURIComponent(p.id);
    return `<article class="card">
      <a href="${link}" class="thumb">
        ${off ? `<span class="badge">${off}% OFF</span>` : ""}
        <img src="${esc(p.image || PLACEHOLDER)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="${imgFallback}">
      </a>
      <div class="body">
        <span class="cat">${esc(categoryLabel(p.category))}</span>
        <a href="${link}"><h3>${esc(p.name)}</h3></a>
        <div class="price"><b>${money(p.price)}</b>${off ? `<s>${money(p.mrp)}</s>` : ""}</div>
        ${outOfStock(p) ? `<button disabled>Out of stock</button>` : `<button data-add="${esc(p.id)}">Add to cart</button>`}
      </div>
    </article>`;
  }

  // ---------- Customer login state ----------
  // Server ke cookie session se pata chalta hai. Pehla jawab cache me rakhte hain.
  let _me; 
  function me() {
    if (!_me) _me = fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" }).then((r) => (r.ok ? r.json() : { user: null })).then((d) => d.user || null).catch(() => null);
    return _me;
  }
  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {}
    _me = null; location.href = "index.html";
  }
  function paintAccount(u) {
    const a = $("#acctLink"), m = $("#acctNav");
    if (!cfg.useDatabase) { if (a) a.hidden = true; if (m) m.hidden = true; return; }
    if (u) {
      const first = esc(String(u.name || "Account").split(" ")[0]);
      if (a) { a.href = "account.html"; a.innerHTML = icon("user") + `<span>${first}</span>`; a.title = "My account and order history"; }
      if (m) { m.href = "account.html"; m.textContent = "My Orders"; }
    } else {
      if (a) { a.href = "login.html"; a.innerHTML = icon("user") + "<span>Login</span>"; }
      if (m) { m.href = "login.html"; m.textContent = "Login / Sign up"; }
    }
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- Header / Footer ----------
  function renderChrome() {
    const h = $("#site-header");
    if (h) {
      h.innerHTML = `
        <div class="topbar">${esc(cfg.topbarText)}</div>
        <div class="header-main">
          <a class="brand" href="index.html"><img src="images/logo-sm.png" alt="" width="52" height="52" onerror="this.style.display='none'"><span>SHRI RAM<small>INDIAN STORE</small></span></a>
          <nav class="nav" id="nav" aria-label="Main">
            <a href="index.html">Home</a>
            <a href="shop.html">Shop</a>
            ${cfg.categories.map((c) => `<a class="sub" href="shop.html?cat=${esc(c.key)}">${esc(c.label)}</a>`).join("")}
            <a href="about.html">About</a>
            <a href="payments.html">Payments</a>
            <a href="contact.html">Contact</a>
            <a class="sub acct-m" href="login.html" id="acctNav">Login / Sign up</a>
          </nav>
          <a class="acct-link" id="acctLink" href="login.html">Login</a>
          <a class="cart-link" href="checkout.html" aria-label="Cart">${icon("cart")}<span class="cart-badge" data-cart-count>0</span></a>
          <button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false">&#9776;</button>
        </div>`;
      const here = location.pathname.split("/").pop() || "index.html";
      h.querySelectorAll(".nav a").forEach((a) => { if (a.getAttribute("href") === here) a.classList.add("active"); });
      $("#menuBtn").addEventListener("click", (e) => { const o = $("#nav").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", o); });
    }
    const f = $("#site-footer");
    if (f) {
      const social = [cfg.instagram && `<a href="${esc(cfg.instagram)}" target="_blank" rel="noopener">Instagram</a>`, cfg.facebook && `<a href="${esc(cfg.facebook)}" target="_blank" rel="noopener">Facebook</a>`].filter(Boolean).join(" ");
      f.innerHTML = `
        <div class="footer-grid">
          <div class="footer-brand"><img src="images/logo-sm.png" alt="${esc(cfg.storeName)} logo" width="72" height="72"><p>${esc(cfg.tagline)}</p>${social ? `<p>${social}</p>` : ""}</div>
          <div><h4>Shop</h4>${cfg.categories.map((c) => `<a href="shop.html?cat=${esc(c.key)}">${esc(c.label)}</a>`).join("")}</div>
          <div><h4>Help</h4>
            <a href="payments.html">Payment Methods</a>
            <a href="shipping-returns.html">Shipping &amp; Returns</a>
            <a href="privacy.html">Privacy Policy</a>
            <a href="terms.html">Terms &amp; Conditions</a>
            <a href="contact.html">Contact Us</a>
            ${cfg.useDatabase ? '<a href="account.html">My Account &amp; Orders</a>' : ""}
          </div>
          <div><h4>Contact</h4>
            <p>${esc(cfg.address)}</p>
            <p>Phone: <a href="tel:+${esc(cfg.whatsappNumber)}">${esc(cfg.phoneDisplay)}</a></p>
            <p>Email: <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></p>
            <p>${esc(cfg.hours)}</p>
          </div>
        </div>
        <div class="footer-pay"><span>We accept:</span>${payChips()}</div>
        <div class="footer-bottom">&copy; ${new Date().getFullYear()} ${esc(cfg.storeName)} (${esc(cfg.legalName)}, ${esc(cfg.businessType)}). All rights reserved.<br>GSTIN: ${esc(cfg.gstin)} &nbsp;|&nbsp; Udyam Registration No.: ${esc(cfg.udyam)}</div>`;
    }
    if (!$("#waFloat")) {
      const a = document.createElement("a");
      a.id = "waFloat"; a.className = "wa-float"; a.target = "_blank"; a.rel = "noopener";
      a.href = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent("Hello, I have a question about " + cfg.storeName + ".")}`;
      a.textContent = "Chat on WhatsApp";
      document.body.appendChild(a);
    }
    // [data-cfg="key"] elements are filled from config
    document.querySelectorAll("[data-cfg]").forEach((el) => {
      const v = cfg[el.dataset.cfg];
      if (v === undefined || v === "") return;
      el.textContent = el.hasAttribute("data-money") ? money(v) : v;
      if (el.dataset.link === "mail") el.href = "mailto:" + v;
      if (el.dataset.link === "tel") el.href = "tel:+" + cfg.whatsappNumber;
    });
    updateCartCount();
    if (cfg.useDatabase) me().then(paintAccount); else paintAccount(null);
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (b) addToCart(b.dataset.add, 1);
  });

  window.SRIS = { me, logout, STATES, MAX_QTY, normalizePhone, cfg, $, money, esc, icon, imgFallback, PLACEHOLDER, categoryLabel, getCart, setCart, addToCart, changeQty, clearCart, loadProducts, productCard, outOfStock, discount, toast, payMethods, payDetailHtml, payChips };
  renderChrome();
})();
