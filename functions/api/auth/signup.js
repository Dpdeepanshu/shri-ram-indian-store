// POST /api/auth/signup  {name, email, phone, password}  -> account banta hai (unverified) + email par 6-digit code
import { json, clean, phoneOf, EMAIL_RE, hashPassword, issueOtp, rateLimit, clientIp } from "../../_lib/util.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "database not connected" }, 503);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase(), phone = phoneOf(b.phone), password = String(b.password || "");
  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (!/^[6-9]\d{9}$/.test(phone)) return json({ error: "Please enter a valid 10-digit mobile number." }, 400);
  if (password.length < 8 || password.length > 100) return json({ error: "Password must be at least 8 characters." }, 400);
  if (!(await rateLimit(env, "signup:" + clientIp(request), 10, 3600))) return json({ error: "Too many attempts. Please try again later." }, 429);

  const old = await env.DB.prepare("SELECT id, verified FROM users WHERE email = ?").bind(email).first();
  if (old && old.verified) return json({ error: "An account with this email already exists. Please log in." }, 409);
  if (!(await rateLimit(env, "otp:" + email, 5, 3600))) return json({ error: "Too many codes requested. Please try after some time." }, 429);

  const { salt, hash } = await hashPassword(password);
  if (old) await env.DB.prepare("UPDATE users SET name=?, phone=?, pass_hash=?, pass_salt=? WHERE id=?").bind(name, phone, hash, salt, old.id).run();
  else await env.DB.prepare("INSERT INTO users (name, email, phone, pass_hash, pass_salt) VALUES (?,?,?,?,?)").bind(name, email, phone, hash, salt).run();

  const m = await issueOtp(env, email, "verify");
  if (!m.ok) return json({ error: m.error }, 502);
  return json({ ok: true, needVerify: true, email, ...(m.devOtp ? { devOtp: m.devOtp } : {}) });
}
