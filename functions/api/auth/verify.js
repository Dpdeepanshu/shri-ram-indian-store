// POST /api/auth/verify  {email, code}  -> email verify + login
import { json, clean, EMAIL_RE, checkOtp, createSession } from "../../_lib/util.js";

export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const email = clean(b.email, 120).toLowerCase(), code = clean(b.code, 6);
  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) return json({ error: "Please enter the 6-digit code." }, 400);
  const r = await checkOtp(env, email, "verify", code);
  if (!r.ok) return json({ error: r.error }, 400);
  const u = await env.DB.prepare("SELECT id, name, email, phone FROM users WHERE email = ?").bind(email).first();
  if (!u) return json({ error: "Account not found." }, 404);
  await env.DB.prepare("UPDATE users SET verified = 1 WHERE id = ?").bind(u.id).run();
  const cookie = await createSession(env, request, u.id);
  return json({ ok: true, user: u }, 200, { "set-cookie": cookie });
}
