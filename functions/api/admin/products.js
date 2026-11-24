// Admin: products ka GET (sab), POST (naya), PUT (edit), PATCH (sirf price/stock), DELETE (?id=)
import { json, clean } from "../../_lib/util.js";
const flag = (v) => (v === true || v === 1 || v === "1" || v === "true" || v === "on" ? 1 : 0);
const okImg = (u) => /^(https:\/\/|\/images\/|images\/|\/api\/img\/\d+$)/.test(u);

function parse(b) {
  let images = Array.isArray(b.images) ? b.images : (b.image ? [b.image] : []);
  images = images.map((u) => clean(u, 500)).filter(Boolean);
  const stock = b.stock_qty === "" || b.stock_qty == null ? null : Number(b.stock_qty);
  const p = {
    name: clean(b.name, 120), category: clean(b.category, 40),
    price: Number(b.price), mrp: b.mrp === "" || b.mrp == null ? null : Number(b.mrp),
    images, description: clean(b.description, 1500), stock_qty: stock,
    in_stock: flag(b.in_stock), featured: flag(b.featured), active: flag(b.active)
  };
  if (!p.name || !p.category) return { error: "Name and category are required" };
  if (!Number.isInteger(p.price) || p.price <= 0) return { error: "Enter a valid price" };
  if (p.mrp !== null && (!Number.isInteger(p.mrp) || p.mrp < 0)) return { error: "Invalid MRP" };
  if (p.mrp === 0) p.mrp = null;
  if (p.mrp !== null && p.mrp < p.price) return { error: "MRP should not be lower than the price (leave it empty if there is no discount)" };
  if (p.stock_qty !== null && (!Number.isInteger(p.stock_qty) || p.stock_qty < 0 || p.stock_qty > 100000)) return { error: "Stock quantity must be 0 or more (or leave it empty)" };
  if (p.images.length < 1) return { error: "Add at least 1 photo" };
  if (p.images.length > 5) return { error: "Maximum 5 photos allowed" };
  if (p.images.some((u) => !okImg(u))) return { error: "Each photo must be an uploaded photo or a link starting with https://" };
  if (p.stock_qty !== null) p.in_stock = p.stock_qty > 0 ? p.in_stock : 0; // stock 0 = out of stock
  return { p };
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY id DESC").all();
    return json(results.map((r) => { let im = []; try { im = JSON.parse(r.images || "[]"); } catch (e) {} if (!im.length && r.image) im = [r.image]; return { ...r, images: im }; }));
  } catch (e) { return json({ error: "Database error. Did you run the migration (SETUP.md, Step 13)?" }, 500); }
}

export async function onRequestPost({ env, request }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const { p, error } = parse(b);
  if (error) return json({ error }, 400);
  let r;
  try { r = await env.DB.prepare(
    "INSERT INTO products (name, category, price, mrp, image, images, description, in_stock, featured, active, stock_qty) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(p.name, p.category, p.price, p.mrp, p.images[0], JSON.stringify(p.images), p.description, p.in_stock, p.featured, p.active, p.stock_qty).run(); }
  catch (e) { return json({ error: "Could not save the product (did you run the migration?)" }, 500); }
  return json({ ok: true, id: r.meta.last_row_id });
}

export async function onRequestPut({ env, request }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const id = parseInt(b.id, 10);
  if (!Number.isInteger(id)) return json({ error: "id chahiye" }, 400);
  const { p, error } = parse(b);
  if (error) return json({ error }, 400);
  let r;
  try {
    r = await env.DB.prepare(
      "UPDATE products SET name=?, category=?, price=?, mrp=?, image=?, images=?, description=?, in_stock=?, featured=?, active=?, stock_qty=? WHERE id=?"
    ).bind(p.name, p.category, p.price, p.mrp, p.images[0], JSON.stringify(p.images), p.description, p.in_stock, p.featured, p.active, p.stock_qty, id).run();
  } catch (e) { return json({ error: "Could not save the product (did you run the migration?)" }, 500); }
  if (r.meta && r.meta.changes === 0) return json({ error: "Product not found (maybe it was deleted)" }, 404);
  return json({ ok: true });
}

// Quick update: sirf price / mrp / stock (table se seedha)
export async function onRequestPatch({ env, request }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const id = parseInt(b.id, 10);
  if (!Number.isInteger(id)) return json({ error: "id chahiye" }, 400);
  const price = Number(b.price), stock = b.stock_qty === "" || b.stock_qty == null ? null : Number(b.stock_qty);
  if (!Number.isInteger(price) || price <= 0) return json({ error: "Enter a valid price" }, 400);
  if (stock !== null && (!Number.isInteger(stock) || stock < 0 || stock > 100000)) return json({ error: "Stock must be 0 or more (or empty)" }, 400);
  const cur = await env.DB.prepare("SELECT mrp, in_stock FROM products WHERE id = ?").bind(id).first();
  if (!cur) return json({ error: "Product not found" }, 404);
  const mrp = cur.mrp && cur.mrp < price ? null : cur.mrp; // naya price MRP se upar gaya to MRP hata do
  const inStock = stock === null ? cur.in_stock : stock > 0 ? 1 : 0;
  try { await env.DB.prepare("UPDATE products SET price=?, mrp=?, stock_qty=?, in_stock=? WHERE id=?").bind(price, mrp, stock, inStock, id).run(); }
  catch (e) { return json({ error: "Could not update (did you run the migration?)" }, 500); }
  return json({ ok: true });
}

export async function onRequestDelete({ env, request }) {
  const id = parseInt(new URL(request.url).searchParams.get("id"), 10);
  if (!Number.isInteger(id)) return json({ error: "id chahiye" }, 400);
  const row = await env.DB.prepare("SELECT images FROM products WHERE id = ?").bind(id).first();
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  // is product ki upload ki hui photos bhi hatao
  try {
    for (const u of JSON.parse((row && row.images) || "[]")) {
      const m = /^\/api\/img\/(\d+)$/.exec(u);
      if (m) await env.DB.prepare("DELETE FROM product_images WHERE id = ?").bind(+m[1]).run();
    }
  } catch (e) {}
  return json({ ok: true });
}
