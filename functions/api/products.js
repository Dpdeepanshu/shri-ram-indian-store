// GET /api/products   (optional ?category=beauty)
// D1 binding ka naam "DB" hona chahiye (wrangler.toml me set hai)
const H = { "content-type": "application/json", "cache-control": "public, max-age=30" };
export async function onRequestGet({ env, request }) {
  const category = new URL(request.url).searchParams.get("category");
  const run = async (cols) => {
    const base = `SELECT ${cols} FROM products WHERE active = 1`;
    const stmt = category ? env.DB.prepare(base + " AND category = ? ORDER BY id DESC").bind(category) : env.DB.prepare(base + " ORDER BY id DESC");
    return (await stmt.all()).results;
  };
  try {
    let rows;
    try { rows = await run("id, name, category, price, mrp, image, images, description, in_stock, featured, stock_qty"); }
    catch (e) { rows = await run("id, name, category, price, mrp, image, description, in_stock, featured"); } // migrate_004 chalne se pehle
    rows = rows.map((r) => {
      let imgs = []; try { imgs = JSON.parse(r.images || "[]"); } catch (e) {}
      if (!Array.isArray(imgs) || !imgs.length) imgs = r.image ? [r.image] : [];
      const { images, ...rest } = r;
      return { ...rest, image: imgs[0] || r.image || "", images: imgs };
    });
    return new Response(JSON.stringify(rows), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: "database error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
