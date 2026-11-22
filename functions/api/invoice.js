// GET /api/invoice?no=ORDERNO&k=KEY -> invoice ka order data (login ke bina, sirf sahi verify key ke saath).
// Link invoice ke footer me chhapta hai, taaki customer PDF se invoice online verify kar sake.
import { readOpts } from "../_lib/invopts.js";
import { json, invoiceKey, safeEqual, rateLimit, clientIp } from "../_lib/util.js";
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "database not connected" }, 503);
  const u = new URL(request.url), no = String(u.searchParams.get("no") || "").slice(0, 40), k = String(u.searchParams.get("k") || "").slice(0, 64);
  if (!no || !k) return json({ error: "not found" }, 404);
  if (!(await rateLimit(env, "inv:" + clientIp(request), 60, 900))) return json({ error: "Too many requests. Please try later." }, 429);
  const want = await invoiceKey(env, no);
  if (!want || !safeEqual(k, want)) return json({ error: "not found" }, 404);
  const row = await env.DB.prepare("SELECT * FROM orders WHERE order_no = ?").bind(no).first();
  if (!row) return json({ error: "not found" }, 404);
  const { user_id, ...pub } = row;
  return json({ ...pub, opts: await readOpts(env.DB, no) });
}
