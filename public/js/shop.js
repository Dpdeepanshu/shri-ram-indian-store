(async function () {
  const S = window.SRIS, cfg = S.cfg;
  const q = document.getElementById("q"), cat = document.getElementById("cat"), sort = document.getElementById("sort");
  const grid = document.getElementById("grid"), count = document.getElementById("count"), empty = document.getElementById("empty");

  cat.innerHTML = `<option value="all">All categories</option>` + cfg.categories.map((c) => `<option value="${S.esc(c.key)}">${S.esc(c.label)}</option>`).join("");
  const params = new URLSearchParams(location.search);
  const wanted = params.get("cat");
  if (wanted && cfg.categories.some((c) => c.key === wanted)) cat.value = wanted;
  q.value = params.get("q") || "";

  let all = [];
  try { all = await S.loadProducts(); } catch (e) { count.textContent = "Products could not be loaded."; }

  function render() {
    const term = q.value.trim().toLowerCase();
    const list = all.filter((p) =>
      (cat.value === "all" || p.category === cat.value) &&
      (!term || (p.name + " " + (p.description || "")).toLowerCase().includes(term)));
    if (sort.value === "low") list.sort((a, b) => a.price - b.price);
    else if (sort.value === "high") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => b.id - a.id);
    grid.innerHTML = list.map(S.productCard).join("");
    count.textContent = list.length + " products";
    empty.hidden = list.length > 0;
    const u = new URLSearchParams();
    if (cat.value !== "all") u.set("cat", cat.value);
    if (term) u.set("q", q.value.trim());
    history.replaceState(null, "", u.toString() ? "?" + u : location.pathname);
  }
  [q, cat, sort].forEach((el) => { el.addEventListener("input", render); el.addEventListener("change", render); });
  render();
})();
