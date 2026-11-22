(async function () {
  const S = window.SRIS, cfg = S.cfg;
  document.getElementById("heroTag").textContent = cfg.tagline;
  document.getElementById("payStrip").innerHTML = S.payChips();
  document.getElementById("catTiles").innerHTML = cfg.categories.map((c) =>
    `<a class="tile" href="shop.html?cat=${S.esc(c.key)}">${S.icon(c.icon)}<span><b>${S.esc(c.label)}</b><small>${S.esc(c.blurb || "")}</small></span></a>`).join("");
  try {
    const all = await S.loadProducts();
    let feat = all.filter((p) => p.featured);
    if (!feat.length) feat = all;
    document.getElementById("featured").innerHTML = feat.slice(0, 8).map(S.productCard).join("");
  } catch (e) {
    document.getElementById("err").hidden = false;
  }
  // Search-engine data about the store
  const ld = { "@context": "https://schema.org", "@type": "Store", name: cfg.storeName, url: cfg.siteUrl, logo: cfg.siteUrl + "/images/logo.png", email: cfg.email, telephone: "+" + cfg.whatsappNumber, address: { "@type": "PostalAddress", addressLocality: "Lucknow", addressRegion: "Uttar Pradesh", postalCode: "226020", addressCountry: "IN" }, paymentAccepted: "Cash, UPI, Bank Transfer" };
  const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
})();
