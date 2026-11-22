(async function () {
  const S = window.SRIS, cfg = S.cfg;
  document.getElementById("heroTag").textContent = cfg.tagline;
  document.getElementById("catTiles").innerHTML = cfg.categories.map((c) =>
    `<a class="tile" href="shop.html?cat=${S.esc(c.key)}"><span class="ico">${c.icon}</span><b>${S.esc(c.label)}</b><small>${S.esc(c.blurb || "")}</small></a>`).join("");
  try {
    const all = await S.loadProducts();
    let feat = all.filter((p) => p.featured);
    if (!feat.length) feat = all;
    document.getElementById("featured").innerHTML = feat.slice(0, 8).map(S.productCard).join("");
  } catch (e) {
    document.getElementById("err").hidden = false;
  }
})();
