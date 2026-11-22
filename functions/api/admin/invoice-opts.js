// POST /api/admin/invoice-opts {no, opts}  (admin token middleware se protected)
import { json } from "../../_lib/util.js";
import { saveOpts } from "../../_lib/invopts.js";
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const no = String(b.no || "").slice(0, 40);
  const row = await env.DB.prepare("SELECT order_no FROM orders WHERE order_no = ?").bind(no).first();
  if (!row) return json({ error: "not found" }, 404);
  try { return (await saveOpts(env.DB, no, b.opts)) ? json({ ok: true }) : json({ error: "invalid invoice details" }, 400); }
  catch (e) { console.error(e); return json({ error: "could not save" }, 500); }
}
