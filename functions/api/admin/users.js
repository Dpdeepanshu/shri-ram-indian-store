// Admin: customers ki list (GET) aur delete (DELETE ?id=)
import { json } from "../../_lib/util.js";
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT u.id, u.name, u.email, u.phone, u.verified, u.created_at, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders FROM users u ORDER BY u.id DESC LIMIT 500"
    ).all();
    return json(results);
  } catch (e) { return json({ error: "Database error. Did you run the migration?" }, 500); }
}
export async function onRequestDelete({ env, request }) {
  const id = parseInt(new URL(request.url).searchParams.get("id"), 10);
  if (!Number.isInteger(id)) return json({ error: "id chahiye" }, 400);
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run(); // unke orders admin me bane rehte hain
  return json({ ok: true });
}
