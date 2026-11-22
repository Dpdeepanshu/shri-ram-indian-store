// GET /api/my/orders  (login zaroori)  ?no=ORDERNO  -> ek order, warna customer ke saare orders
import { json, getUser, invoiceKey } from "../../_lib/util.js";
import { readOpts } from "../../_lib/invopts.js";
export async function onRequestGet({ request, env }) {
  const u = await getUser(env, request);
  if (!u) return json({ error: "login required" }, 401);
  const no = new URL(request.url).searchParams.get("no");
  if (no) {
    const row = await env.DB.prepare("SELECT * FROM orders WHERE order_no = ? AND user_id = ?").bind(no, u.id).first();
    return row ? json({ ...row, vk: await invoiceKey(env, row.order_no), opts: await readOpts(env.DB, row.order_no) }) : json({ error: "not found" }, 404);
  }
  const { results } = await env.DB.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 100").bind(u.id).all();
  return json(results);
}
