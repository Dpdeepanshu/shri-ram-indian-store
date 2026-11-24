// Admin orders: GET (list ?q= ?status= / ?id=), POST (naya order jodo), PUT (status ya poora edit), DELETE (?id=)
import { json, clean, phoneOf, invoiceKey } from "../../_lib/util.js";
import { readOpts } from "../../_lib/invopts.js";
import { moveStock, applyDiff } from "../../_lib/stock.js";
const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["Cash on Delivery", "UPI", "Bank Transfer", "Other"];
const parseItems = (s) => { try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch (e) { return []; } };

export async function onRequestGet({ env, request }) {
  const u = new URL(request.url), one = u.searchParams.get("id");
  if (one !== null) {
    const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(parseInt(one, 10) || 0).first();
    return row ? json({ ...row, vk: await invoiceKey(env, row.order_no), opts: await readOpts(env.DB, row.order_no) }) : json({ error: "not found" }, 404);
  }
  const q = clean(u.searchParams.get("q"), 60), st = u.searchParams.get("status");
  const where = [], args = [];
  if (STATUSES.includes(st)) { where.push("status = ?"); args.push(st); }
  if (q) { where.push("(order_no LIKE ? OR name LIKE ? OR phone LIKE ? OR invoice_no LIKE ?)"); const l = "%" + q + "%"; args.push(l, l, l, l); }
  const { results } = await env.DB.prepare("SELECT * FROM orders" + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY id DESC LIMIT 300").bind(...args).all();
  return json(results);
}

// items: [{id, qty, price?}] -> products se naam/category, price override ho sakta hai (price sahi karne ke liye)
async function buildLines(env, items) {
  const arr = (Array.isArray(items) ? items : []).slice(0, 50);
  const ids = [...new Set(arr.map((i) => parseInt(i && i.id, 10)).filter(Number.isInteger))];
  if (!ids.length) return { error: "Add at least one item" };
  const { results } = await env.DB.prepare(`SELECT id, name, category, price, description FROM products WHERE id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all();
  const by = new Map(results.map((r) => [r.id, r]));
  const lines = [];
  for (const i of arr) {
    const id = parseInt(i.id, 10), qty = parseInt(i.qty, 10), p = by.get(id);
    if (!p) { if (i.name && Number.isInteger(id)) { // product baad me delete ho gaya: purani line jaisi rakho
        const pr = Number(i.price); if (!Number.isInteger(qty) || qty < 1 || qty > 1000 || !(pr >= 0)) return { error: "Invalid item" };
        lines.push({ id, name: clean(i.name, 120), category: clean(i.category, 40), price: Math.round(pr), qty }); continue; }
      return { error: "A selected product no longer exists" }; }
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) return { error: "Quantity must be 1 or more" };
    const price = i.price === "" || i.price == null ? p.price : Number(i.price);
    if (!Number.isFinite(price) || price < 0 || price > 10000000) return { error: "Invalid price" };
    const am = /ASIN[:\s]+([A-Z0-9]{10})\b/i.exec(String(p.description || ""));
    lines.push({ id: p.id, name: p.name, asin: am ? am[1].toUpperCase() : "", category: p.category, price: Math.round(price), qty });
  }
  return { lines };
}

function details(b) {
  const d = {
    name: clean(b.name, 80), phone: phoneOf(b.phone), address: clean(b.address, 300), city: clean(b.city, 80), state: clean(b.state, 40),
    pincode: clean(b.pincode, 6), notes: clean(b.notes, 300), payment: PAYMENTS.includes(b.payment) ? b.payment : "Other",
    shipping: Math.max(0, Math.round(Number(b.shipping) || 0)), status: STATUSES.includes(b.status) ? b.status : "new"
  };
  if (!d.name || !d.address || !d.city || !d.state || !/^[6-9]\d{9}$/.test(d.phone) || !/^\d{6}$/.test(d.pincode)) return { error: "Please fill name, a valid 10-digit mobile, address, city, state and 6-digit PIN" };
  return { d };
}

export async function onRequestPost({ env, request }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const { d, error } = details(b); if (error) return json({ error }, 400);
  const { lines, error: e2 } = await buildLines(env, b.items); if (e2) return json({ error: e2 }, 400);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const orderNo = "SRIS-" + Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[x % 32]).join("");
  // customer account: is mobile/email wale user se jod do (order history me dikhe)
  let uid = null;
  const email = clean(b.email, 120).toLowerCase();
  if (email) { const u = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first(); if (u) uid = u.id; }
  else { // sirf tab jodo jab is mobile ka ek hi verified account ho (profile me koi bhi number likh sakta hai)
    const { results: us } = await env.DB.prepare("SELECT id FROM users WHERE phone = ? AND verified = 1 LIMIT 2").bind(d.phone).all(); if (us.length === 1) uid = us[0].id; }
  let r;
  try {
    r = await env.DB.prepare("INSERT INTO orders (order_no, name, phone, address, city, state, pincode, payment, notes, items, subtotal, shipping, total, status, customer_type, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(orderNo, d.name, d.phone, d.address, d.city, d.state, d.pincode, d.payment, d.notes, JSON.stringify(lines), subtotal, d.shipping, subtotal + d.shipping, d.status, "retail", uid).run();
  } catch (e) { console.error(e); return json({ error: "Could not save the order (did you run the migration?)" }, 500); }
  const prefix = env.INVOICE_PREFIX || "SRIS/WEB/2627/", start = Number(env.INVOICE_START) || 1;
  const invoiceNo = prefix + String(start - 1 + r.meta.last_row_id).padStart(4, "0");
  try { await env.DB.prepare("UPDATE orders SET invoice_no = ? WHERE id = ?").bind(invoiceNo, r.meta.last_row_id).run(); } catch (e) { console.error("invoice no update failed", e); }
  if (d.status !== "cancelled") await moveStock(env.DB, lines, -1);
  return json({ ok: true, id: r.meta.last_row_id, orderNo, invoiceNo });
}

export async function onRequestPut({ env, request }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const id = parseInt(b.id, 10);
  if (!Number.isInteger(id)) return json({ error: "bad data" }, 400);
  const old = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  if (!old) return json({ error: "Order not found" }, 404);
  const oldLines = parseItems(old.items);

  // 1) sirf status
  if (b.items === undefined) {
    if (!STATUSES.includes(b.status)) return json({ error: "bad data" }, 400);
    await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(b.status, id).run();
    if (old.status !== "cancelled" && b.status === "cancelled") await moveStock(env.DB, oldLines, +1);   // cancel: stock wapas
    if (old.status === "cancelled" && b.status !== "cancelled") await moveStock(env.DB, oldLines, -1);   // cancel hataya: stock phir ghata
    return json({ ok: true });
  }

  // 2) poora edit: customer details, items ki quantity / price, shipping, status
  const { d, error } = details({ ...old, ...b }); if (error) return json({ error }, 400);
  const { lines, error: e2 } = await buildLines(env, b.items); if (e2) return json({ error: e2 }, 400);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  await env.DB.prepare("UPDATE orders SET name=?, phone=?, address=?, city=?, state=?, pincode=?, payment=?, notes=?, items=?, subtotal=?, shipping=?, total=?, status=? WHERE id=?")
    .bind(d.name, d.phone, d.address, d.city, d.state, d.pincode, d.payment, d.notes, JSON.stringify(lines), subtotal, d.shipping, subtotal + d.shipping, d.status, id).run();
  // stock: pehle jo ghata tha (cancelled na ho to) uska farak lagao
  const wasActive = old.status !== "cancelled", isActive = d.status !== "cancelled";
  if (wasActive && isActive) await applyDiff(env.DB, oldLines, lines);
  else if (wasActive && !isActive) await moveStock(env.DB, oldLines, +1);
  else if (!wasActive && isActive) await moveStock(env.DB, lines, -1);
  return json({ ok: true });
}

export async function onRequestDelete({ env, request }) {
  const id = parseInt(new URL(request.url).searchParams.get("id"), 10);
  if (!Number.isInteger(id)) return json({ error: "id chahiye" }, 400);
  const old = await env.DB.prepare("SELECT items, status, order_no FROM orders WHERE id = ?").bind(id).first();
  if (!old) return json({ error: "Order not found" }, 404);
  await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM invoice_opts WHERE order_no = ?").bind(old.order_no).run().catch(() => {}); // table na ho to chalta hai
  if (old.status !== "cancelled") await moveStock(env.DB, parseItems(old.items), +1);
  return json({ ok: true });
}
