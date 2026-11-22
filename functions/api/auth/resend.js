// POST /api/auth/resend  {email, purpose: "verify" | "reset"}  -> naya code (60 second gap, ghante me 5)
import { json, clean, EMAIL_RE, issueOtp, rateLimit } from "../../_lib/util.js";

export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const email = clean(b.email, 120).toLowerCase(), purpose = b.purpose === "reset" ? "reset" : "verify";
  if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (!(await rateLimit(env, "otp:" + email, 5, 3600))) return json({ error: "Too many codes requested. Please try after some time." }, 429);
  const u = await env.DB.prepare("SELECT id, verified FROM users WHERE email = ?").bind(email).first();
  // account hai ya nahi, ye bahar nahi batate (privacy)
  if (!u || (purpose === "verify" && u.verified) || (purpose === "reset" && !u.verified)) return json({ ok: true });
  const last = await env.DB.prepare("SELECT (strftime('%s','now') - strftime('%s', expires_at) + 600) AS age FROM otps WHERE email = ? AND purpose = ?").bind(email, purpose).first();
  if (last && last.age < 60) return json({ error: "Please wait a minute before asking for a new code." }, 429);
  const m = await issueOtp(env, email, purpose);
  if (!m.ok) return json({ error: m.error }, 502);
  return json({ ok: true, ...(m.devOtp ? { devOtp: m.devOtp } : {}) });
}
