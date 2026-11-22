(function () {
  const cfg = window.STORE_CONFIG;
  const CART_KEY = "sris_cart_v1";
  const $ = (s, r = document) => r.querySelector(s);

  const money = (n) => cfg.currency + Number(n).toLocaleString("en-IN");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const categoryLabel = (key) => (cfg.categories.find((c) => c.key === key) || { label: key }).label;

  // ---------- Cart ----------
  function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } }
  function setCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} updateCartCount(); }
  function addToCart(id, qty) { const c = getCart(); c[id] = (c[id] || 0) + (qty || 1); setCart(c); toast("Cart me add ho gaya ✓"); }
  function changeQty(id, d) { const c = getCart(); c[id] = (c[id] || 0) + d; if (c[id] <= 0) delete c[id]; setCart(c); }
  function clearCart() { setCart({}); }
  function cartCount() { return Object.values(getCart()).reduce((a, b) => a + b, 0); }
  function updateCartCount() { document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cartCount())); }

  // ---------- Products ----------
  let _cache = null;
  async function loadProducts() {
    if (_cache) return _cache;
    if (cfg.useDatabase) {
      try {
        const r = await fetch("/api/products");
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d) && d.length) { _cache = d; return _cache; }
        }
      } catch (e) {}
    }
    const r = await fetch("data/products.json");
    _cache = await r.json();
    return _cache;
  }

  function outOfStock(p) { return p.in_stock === 0 || p.in_stock === false; }
  function discount(p) { return p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0; }

  function productCard(p) {
    const off = discount(p);
    const link = "product.html?id=" + encodeURIComponent(p.id);
    return `<article class="card">
      <a href="${link}" class="thumb">
        ${off ? `<span class="badge">${off}% OFF</span>` : ""}
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x600?text=No+Image'">
      </a>
      <div class="body">
        <span class="cat">${esc(categoryLabel(p.category))}</span>
        <a href="${link}"><h3>${esc(p.name)}</h3></a>
        <div class="price"><b>${money(p.price)}</b>${off ? `<s>${money(p.mrp)}</s>` : ""}</div>
        ${outOfStock(p) ? `<button disabled>Stock khatam</button>` : `<button data-add="${esc(p.id)}">Cart me daalein</button>`}
      </div>
    </article>`;
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
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
          <a class="brand" href="index.html">${esc(cfg.storeName)}</a>
          <nav class="nav" id="nav">
            <a href="index.html">Home</a>
            <a href="shop.html">Shop</a>
            ${cfg.categories.map((c) => `<a class="sub" href="shop.html?cat=${esc(c.key)}">${esc(c.label)}</a>`).join("")}
            <a href="about.html">About</a>
            <a href="contact.html">Contact</a>
          </nav>
          <a class="cart-link" href="checkout.html" aria-label="Cart">🛒 <span class="cart-badge" data-cart-count>0</span></a>
          <button class="menu-btn" id="menuBtn" aria-label="Menu">☰</button>
        </div>`;
      const here = location.pathname.split("/").pop() || "index.html";
      h.querySelectorAll(".nav a").forEach((a) => { if (a.getAttribute("href") === here) a.classList.add("active"); });
      $("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("open"));
    }
    const f = $("#site-footer");
    if (f) {
      const social = [cfg.instagram && `<a href="${esc(cfg.instagram)}" target="_blank" rel="noopener">Instagram</a>`, cfg.facebook && `<a href="${esc(cfg.facebook)}" target="_blank" rel="noopener">Facebook</a>`].filter(Boolean).join(" • ");
      f.innerHTML = `
        <div class="footer-grid">
          <div><h4>${esc(cfg.storeName)}</h4><p>${esc(cfg.tagline)}</p>${social ? `<p>${social}</p>` : ""}</div>
          <div><h4>Shop</h4>${cfg.categories.map((c) => `<a href="shop.html?cat=${esc(c.key)}">${esc(c.label)}</a>`).join("")}</div>
          <div><h4>Madad</h4>
            <a href="shipping-returns.html">Shipping &amp; Returns</a>
            <a href="privacy.html">Privacy Policy</a>
            <a href="terms.html">Terms &amp; Conditions</a>
            <a href="contact.html">Contact Us</a>
          </div>
          <div><h4>Sampark</h4>
            <p>${esc(cfg.address)}</p>
            <p>📞 <a href="tel:+${esc(cfg.whatsappNumber)}">${esc(cfg.phoneDisplay)}</a></p>
            <p>✉️ <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></p>
            <p>🕒 ${esc(cfg.hours)}</p>
          </div>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} ${esc(cfg.storeName)}. Sabhi adhikar surakshit.${cfg.gstin ? " • GSTIN: " + esc(cfg.gstin) : ""}</div>`;
    }
    // Floating WhatsApp button
    if (!$("#waFloat")) {
      const a = document.createElement("a");
      a.id = "waFloat"; a.className = "wa-float"; a.target = "_blank"; a.rel = "noopener";
      a.href = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent("Namaste, mujhe " + cfg.storeName + " ke baare me poochna hai.")}`;
      a.textContent = "💬 WhatsApp";
      document.body.appendChild(a);
    }
    // [data-cfg="key"] wale elements ko config se bharo
    document.querySelectorAll("[data-cfg]").forEach((el) => {
      const v = cfg[el.dataset.cfg];
      if (v === undefined || v === "") return;
      el.textContent = el.hasAttribute("data-money") ? money(v) : v;
      if (el.dataset.link === "mail") el.href = "mailto:" + v;
      if (el.dataset.link === "tel") el.href = "tel:+" + cfg.whatsappNumber;
    });
    updateCartCount();
  }

  // Add-to-cart buttons (sab pages par)
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (b) addToCart(b.dataset.add, 1);
  });

  window.SRIS = { cfg, $, money, esc, categoryLabel, getCart, setCart, addToCart, changeQty, clearCart, loadProducts, productCard, outOfStock, discount, toast };
  renderChrome();
})();
