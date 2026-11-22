// POST /api/auth/reset {email, code, password} -> naya password + login
import { json, clean, EMAIL_RE, checkOtp, hashPassword, createSession } from "../../_lib/util.js";
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const email = clean(b.email, 120).toLowerCase(), code = clean(b.code, 6), password = String(b.password || "");
  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) return json({ error: "Please enter the 6-digit code." }, 400);
  if (password.length < 8 || password.length > 100) return json({ error: "Password must be at least 8 characters." }, 400);
  const r = await checkOtp(env, email, "reset", code);
  if (!r.ok) return json({ error: r.error }, 400);
  const u = await env.DB.prepare("SELECT id, name, email, phone FROM users WHERE email = ?").bind(email).first();
  if (!u) return json({ error: "Account not found." }, 404);
  const { salt, hash } = await hashPassword(password);
  await env.DB.prepare("UPDATE users SET pass_hash=?, pass_salt=?, verified=1 WHERE id=?").bind(hash, salt, u.id).run();
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(u.id).run(); // purane login band
  const cookie = await createSession(env, request, u.id);
  return json({ ok: true, user: u }, 200, { "set-cookie": cookie });
}
