// Admin: orders dekhna (GET) aur status badalna (PUT)
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 200").all();
  return json(results);
}

export async function onRequestPut({ env, request }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const id = parseInt(b.id, 10);
  if (!Number.isInteger(id) || !STATUSES.includes(b.status)) return json({ error: "galat data" }, 400);
  await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(b.status, id).run();
  return json({ ok: true });
}
