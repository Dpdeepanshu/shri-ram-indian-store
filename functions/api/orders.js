// POST /api/orders: order database me save karta hai.
// Daam client se nahi, database se liye jaate hain (taaki koi daam badal na sake).
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const clean = (s, n) => String(s == null ? "" : s).trim().slice(0, n);
const PAYMENTS = ["Cash on Delivery", "UPI", "Bank Transfer"];

// +91 / 0 / spaces / dashes hata kar 10 digit
function phoneOf(v) {
  let d = String(v == null ? "" : v).replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "database not connected" }, 503);
  let b;
  try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }

  const name = clean(b.name, 80), phone = phoneOf(b.phone), address = clean(b.address, 300);
  const city = clean(b.city, 80), pincode = clean(b.pincode, 6), notes = clean(b.notes, 300), orderNo = clean(b.orderNo, 30);
  const payment = PAYMENTS.includes(b.payment) ? b.payment : clean(b.payment, 40);

  if (!name || !address || !city || !/^[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(pincode) || !/^[A-Z0-9-]{6,30}$/.test(orderNo))
    return json({ error: "invalid details" }, 400);

  const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  const ids = [...new Set(items.map((i) => parseInt(i && i.id, 10)).filter(Number.isInteger))];
  if (!ids.length) return json({ error: "empty cart" }, 400);

  try {
    const marks = ids.map(() => "?").join(",");
    const { results } = await env.DB.prepare(`SELECT id, name, price, in_stock FROM products WHERE active = 1 AND id IN (${marks})`).bind(...ids).all();
    const byId = new Map(results.map((r) => [r.id, r]));

    // same product do baar aaye to qty jod do
    const qtyById = new Map();
    for (const i of items) {
      const id = parseInt(i && i.id, 10), q = parseInt(i && i.qty, 10) || 0;
      if (!Number.isInteger(id) || q <= 0) continue;
      qtyById.set(id, Math.min(20, (qtyById.get(id) || 0) + q));
    }

    let subtotal = 0;
    const lines = [], soldOut = [];
    for (const [id, qty] of qtyById) {
      const p = byId.get(id);
      if (!p) continue;
      if (!p.in_stock) { soldOut.push(p.name); continue; }
      subtotal += p.price * qty;
      lines.push({ id: p.id, name: p.name, price: p.price, qty });
    }
    if (soldOut.length) return json({ error: "out of stock: " + soldOut.join(", ") }, 409);
    if (!lines.length) return json({ error: "no valid items" }, 400);

    // Shipping server par nikalta hai. Default config.js jaisa (999 / 60); badalna ho to Cloudflare variables
    // FREE_SHIPPING_ABOVE aur SHIPPING_CHARGE set kar do.
    const FREE_ABOVE = Number(env.FREE_SHIPPING_ABOVE) || 999, SHIPPING = env.SHIPPING_CHARGE !== undefined && env.SHIPPING_CHARGE !== "" ? Number(env.SHIPPING_CHARGE) : 60;
    const shipping = subtotal >= FREE_ABOVE ? 0 : SHIPPING;
    await env.DB.prepare(
      "INSERT INTO orders (order_no, name, phone, address, city, pincode, payment, notes, items, subtotal, shipping, total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(orderNo, name, phone, address, city, pincode, payment, notes, JSON.stringify(lines), subtotal, shipping, subtotal + shipping).run();

    return json({ ok: true, orderNo });
  } catch (e) {
    if (String(e).includes("UNIQUE")) return json({ error: "duplicate order" }, 409);
    return json({ error: "server error" }, 500);
  }
}
