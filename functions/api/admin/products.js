// Admin: products ka GET (sab), POST (naya), PUT (edit), DELETE (?id=)
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const clean = (s, n) => String(s == null ? "" : s).trim().slice(0, n);
const flag = (v) => (v === true || v === 1 || v === "1" || v === "true" || v === "on" ? 1 : 0);

function parse(b) {
  const p = {
    name: clean(b.name, 120),
    category: clean(b.category, 40),
    price: Number(b.price),
    mrp: b.mrp === "" || b.mrp == null ? null : Number(b.mrp),
    image: clean(b.image, 500),
    description: clean(b.description, 1500),
    in_stock: flag(b.in_stock), featured: flag(b.featured), active: flag(b.active)
  };
  if (!p.name || !p.category) return { error: "Name and category are required" };
  if (!Number.isInteger(p.price) || p.price <= 0) return { error: "Enter a valid price" };
  if (p.mrp !== null && (!Number.isInteger(p.mrp) || p.mrp < 0)) return { error: "Invalid MRP" };
  if (p.mrp === 0) p.mrp = null;
  if (p.mrp !== null && p.mrp < p.price) return { error: "MRP should not be lower than the price (leave it empty if there is no discount)" };
  // https://..., /images/x.jpg ya images/x.jpg (seed products ka path) teeno chalenge
  if (p.image && !/^(https?:\/\/|\/|images\/)/.test(p.image)) return { error: "Image link must start with https://, /images/ or images/" };
  return { p };
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY id DESC").all();
    return json(results);
  } catch (e) { return json({ error: "Database error. Did you run the schema (SETUP.md step 9)?" }, 500); }
}

export async function onRequestPost({ env, request }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const { p, error } = parse(b);
  if (error) return json({ error }, 400);
  let r;
  try { r = await env.DB.prepare(
    "INSERT INTO products (name, category, price, mrp, image, description, in_stock, featured, active) VALUES (?,?,?,?,?,?,?,?,?)"
  ).bind(p.name, p.category, p.price, p.mrp, p.image, p.description, p.in_stock, p.featured, p.active).run(); }
  catch (e) { return json({ error: "Could not save the product" }, 500); }
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
      "UPDATE products SET name=?, category=?, price=?, mrp=?, image=?, description=?, in_stock=?, featured=?, active=? WHERE id=?"
    ).bind(p.name, p.category, p.price, p.mrp, p.image, p.description, p.in_stock, p.featured, p.active, id).run();
  } catch (e) { return json({ error: "Could not save the product" }, 500); }
  if (r.meta && r.meta.changes === 0) return json({ error: "Product not found (maybe it was deleted)" }, 404);
  return json({ ok: true });
}

export async function onRequestDelete({ env, request }) {
  const id = parseInt(new URL(request.url).searchParams.get("id"), 10);
  if (!Number.isInteger(id)) return json({ error: "id chahiye" }, 400);
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
