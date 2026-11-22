// POST /api/orders: order database me save karta hai.
// Daam client se nahi, database se liye jaate hain (taaki koi daam badal na sake).
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
const clean = (s, n) => String(s == null ? "" : s).trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }

  const name = clean(b.name, 80), phone = clean(b.phone, 10), address = clean(b.address, 300);
  const city = clean(b.city, 80), pincode = clean(b.pincode, 6), payment = clean(b.payment, 40);
  const notes = clean(b.notes, 300), orderNo = clean(b.orderNo, 30);

  if (!name || !address || !/^[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(pincode) || !/^[A-Z0-9-]{6,30}$/.test(orderNo))
    return json({ error: "invalid details" }, 400);

  const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  const ids = [...new Set(items.map((i) => parseInt(i.id, 10)).filter(Number.isInteger))];
  if (!ids.length) return json({ error: "empty cart" }, 400);

  try {
    const marks = ids.map(() => "?").join(",");
    const { results } = await env.DB.prepare(`SELECT id, name, price FROM products WHERE active = 1 AND id IN (${marks})`).bind(...ids).all();
    const byId = new Map(results.map((r) => [r.id, r]));

    let subtotal = 0;
    const lines = [];
    for (const i of items) {
      const p = byId.get(parseInt(i.id, 10));
      const qty = Math.min(Math.max(parseInt(i.qty, 10) || 0, 0), 20);
      if (!p || !qty) continue;
      subtotal += p.price * qty;
      lines.push({ id: p.id, name: p.name, price: p.price, qty });
    }
    if (!lines.length) return json({ error: "no valid items" }, 400);

    // Shipping server par nikalta hai (config.js ke freeShippingAbove / shippingCharge jaisa hi rakho)
    const FREE_ABOVE = 999, SHIPPING = 60;
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
