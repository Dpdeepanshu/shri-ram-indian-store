// POST /api/auth/forgot {email} -> reset code email par
import { json, clean, EMAIL_RE, issueOtp, rateLimit } from "../../_lib/util.js";
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const email = clean(b.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (!(await rateLimit(env, "otp:" + email, 5, 3600))) return json({ error: "Too many codes requested. Please try after some time." }, 429);
  const u = await env.DB.prepare("SELECT id, verified FROM users WHERE email = ?").bind(email).first();
  let dev = {};
  if (u && u.verified) { const m = await issueOtp(env, email, "reset"); if (!m.ok) return json({ error: m.error }, 502); if (m.devOtp) dev = { devOtp: m.devOtp }; }
  return json({ ok: true, ...dev }); // account ho ya na ho, same jawab
}
