// GET /api/products   (optional ?category=clothing)
// D1 binding ka naam "DB" hona chahiye (wrangler.toml me set hai)
export async function onRequestGet({ env, request }) {
  try {
    const category = new URL(request.url).searchParams.get("category");
    const base = "SELECT id, name, category, price, mrp, image, description, in_stock, featured FROM products WHERE active = 1";
    const stmt = category
      ? env.DB.prepare(base + " AND category = ? ORDER BY id DESC").bind(category)
      : env.DB.prepare(base + " ORDER BY id DESC");
    const { results } = await stmt.all();
    return new Response(JSON.stringify(results), {
      headers: { "content-type": "application/json", "cache-control": "public, max-age=30" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "database error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
