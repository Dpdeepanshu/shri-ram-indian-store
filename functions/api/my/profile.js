// PUT /api/my/profile {name, phone}  |  POST {oldPassword, newPassword}
import { json, clean, phoneOf, getUser, hashPassword, safeEqual } from "../../_lib/util.js";
export async function onRequestPut({ request, env }) {
  const u = await getUser(env, request); if (!u) return json({ error: "login required" }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const name = clean(b.name, 80), phone = phoneOf(b.phone);
  if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone)) return json({ error: "Please enter a valid name and 10-digit mobile number." }, 400);
  await env.DB.prepare("UPDATE users SET name=?, phone=? WHERE id=?").bind(name, phone, u.id).run();
  return json({ ok: true });
}
export async function onRequestPost({ request, env }) {
  const u = await getUser(env, request); if (!u) return json({ error: "login required" }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const np = String(b.newPassword || "");
  if (np.length < 8 || np.length > 100) return json({ error: "New password must be at least 8 characters." }, 400);
  const row = await env.DB.prepare("SELECT pass_hash, pass_salt FROM users WHERE id = ?").bind(u.id).first();
  const { hash } = await hashPassword(String(b.oldPassword || ""), row.pass_salt);
  if (!safeEqual(hash, row.pass_hash)) return json({ error: "Current password is wrong." }, 400);
  const n = await hashPassword(np);
  await env.DB.prepare("UPDATE users SET pass_hash=?, pass_salt=? WHERE id=?").bind(n.hash, n.salt, u.id).run();
  return json({ ok: true });
}
