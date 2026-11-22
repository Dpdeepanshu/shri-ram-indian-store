// POST /api/auth/login  {email, password}
import { json, clean, hashPassword, safeEqual, createSession, issueOtp, rateLimit, clientIp } from "../../_lib/util.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "database not connected" }, 503);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const email = clean(b.email, 120).toLowerCase(), password = String(b.password || "");
  if (!email || !password) return json({ error: "Enter your email and password." }, 400);
  if (!(await rateLimit(env, "login:" + clientIp(request), 20, 900)) || !(await rateLimit(env, "loginm:" + email, 10, 900)))
    return json({ error: "Too many attempts. Please try again in 15 minutes." }, 429);
  const u = await env.DB.prepare("SELECT id, name, email, phone, pass_hash, pass_salt, verified FROM users WHERE email = ?").bind(email).first();
  const bad = () => json({ error: "Incorrect email or password." }, 401);
  if (!u) return bad();
  const { hash } = await hashPassword(password, u.pass_salt);
  if (!safeEqual(hash, u.pass_hash)) return bad();
  if (!u.verified) {
    const m = await issueOtp(env, email, "verify");
    return json({ needVerify: true, email, error: "Please verify your email. We sent a code.", ...(m && m.devOtp ? { devOtp: m.devOtp } : {}) }, 403);
  }
  const cookie = await createSession(env, request, u.id);
  return json({ ok: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone } }, 200, { "set-cookie": cookie });
}
