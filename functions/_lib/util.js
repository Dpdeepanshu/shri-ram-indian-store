// Shared helpers (login, session, OTP email, rate limit). Ye file khud koi URL nahi banati.
export const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });
export const clean = (s, n) => String(s == null ? "" : s).trim().slice(0, n);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function phoneOf(v) {
  let d = String(v == null ? "" : v).replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export const randomHex = (n = 32) => hex(crypto.getRandomValues(new Uint8Array(n)));
export async function sha256(s) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(s))); }

// ---- password hash (PBKDF2, Cloudflare Workers me 100000 iterations tak allowed) ----
export async function hashPassword(pw, saltHex) {
  const salt = saltHex || randomHex(16);
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 100000 }, key, 256);
  return { salt, hash: hex(bits) };
}
export function safeEqual(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

// ---- invoice verify key: har invoice ke link ke liye secret-based token (login ke bina invoice kholne ke liye) ----
// Secret: INVOICE_SECRET (optional) warna ADMIN_TOKEN. Dono ho to INVOICE_SECRET badalne se purane links band ho jaate hain.
export async function invoiceKey(env, orderNo) {
  const secret = env.INVOICE_SECRET || env.ADMIN_TOKEN || "";
  if (!secret || !orderNo) return "";
  const key = await crypto.subtle.importKey("raw", enc.encode("sris-invoice|" + secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(String(orderNo)))).slice(0, 24);
}

// ---- cookies / sessions ----
export const COOKIE = "sris_session";
export function getCookie(request, name) {
  const m = (request.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(name + "="));
  if (!m) return "";
  try { return decodeURIComponent(m.slice(name.length + 1)); } catch (e) { return ""; }
}
export function sessionCookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
export async function createSession(env, request, userId) {
  const token = randomHex(32);
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,datetime('now','+30 days'))").bind(await sha256(token), userId).run();
  // purane expire session saaf
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run().catch(() => {});
  return sessionCookie(request, token, 30 * 24 * 3600);
}
export async function getUser(env, request) {
  const token = getCookie(request, COOKIE);
  if (!token || !env.DB) return null;
  try {
    return await env.DB.prepare(
      "SELECT u.id, u.name, u.email, u.phone FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
    ).bind(await sha256(token)).first();
  } catch (e) { return null; }
}

// ---- simple rate limit (D1): key ke liye window me max requests ----
export async function rateLimit(env, key, max, windowSec) {
  try {
    const row = await env.DB.prepare("SELECT count, (strftime('%s','now') - strftime('%s', window_start)) AS age FROM rate_limits WHERE k = ?").bind(key).first();
    if (!row || row.age > windowSec) {
      await env.DB.prepare("INSERT OR REPLACE INTO rate_limits (k, count, window_start) VALUES (?,1,datetime('now'))").bind(key).run();
      return true;
    }
    if (row.count >= max) return false;
    await env.DB.prepare("UPDATE rate_limits SET count = count + 1 WHERE k = ?").bind(key).run();
    return true;
  } catch (e) { return true; } // table na ho to block mat karo
}
export const clientIp = (request) => request.headers.get("cf-connecting-ip") || "local";

// ---- OTP (email verification) ----
export const genOtp = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");

// Email bhejna: Brevo (free 300 mail/din). BREVO_API_KEY + MAIL_FROM (Brevo me verified sender email) secrets chahiye.
// Local test: .dev.vars me DEV_MODE=1 likho, OTP response me dikh jaayega (production me kabhi mat rakhna).
export async function sendOtpMail(env, to, code, purpose) {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) {
    if (env.DEV_MODE === "1") return { ok: true, devOtp: code };
    return { ok: false, error: "email service not configured" };
  }
  const store = env.STORE_NAME || "SHRI RAM INDIAN STORE";
  const what = purpose === "reset" ? "reset your password" : "verify your email";
  const html = `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:20px;border:1px solid #dfe3ee;border-radius:10px">
    <h2 style="color:#112653;margin:0 0 10px">${store}</h2>
    <p>Use this code to ${what}:</p>
    <p style="font-size:30px;letter-spacing:6px;font-weight:700;color:#112653;margin:14px 0">${code}</p>
    <p style="color:#5d6882;font-size:13px">This code is valid for 10 minutes. Do not share it with anyone. If you did not request it, ignore this email.</p></div>`;
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: store, email: env.MAIL_FROM }, to: [{ email: to }], subject: `${code} is your ${store} code`, htmlContent: html })
    });
    if (!r.ok) { console.error("brevo error", r.status, await r.text().catch(() => "")); return { ok: false, error: "could not send email" }; }
    return { ok: true };
  } catch (e) { console.error("mail failed", e); return { ok: false, error: "could not send email" }; }
}

export async function issueOtp(env, email, purpose) {
  const code = genOtp();
  await env.DB.prepare("DELETE FROM otps WHERE email = ? AND purpose = ?").bind(email, purpose).run();
  await env.DB.prepare("INSERT INTO otps (email, purpose, code_hash, expires_at) VALUES (?,?,?,datetime('now','+10 minutes'))").bind(email, purpose, await sha256(code + "|" + email)).run();
  return sendOtpMail(env, email, code, purpose);
}
// sahi code par true (aur code use ho jaata hai). 5 galat koshish ke baad code band.
export async function checkOtp(env, email, purpose, code) {
  const row = await env.DB.prepare("SELECT id, code_hash, attempts FROM otps WHERE email = ? AND purpose = ? AND expires_at > datetime('now')").bind(email, purpose).first();
  if (!row) return { ok: false, error: "Code expired. Please request a new code." };
  if (row.attempts >= 5) return { ok: false, error: "Too many wrong attempts. Please request a new code." };
  if (!safeEqual(row.code_hash, await sha256(String(code).trim() + "|" + email))) {
    await env.DB.prepare("UPDATE otps SET attempts = attempts + 1 WHERE id = ?").bind(row.id).run();
    return { ok: false, error: "Wrong code. Please check and try again." };
  }
  await env.DB.prepare("DELETE FROM otps WHERE id = ?").bind(row.id).run();
  return { ok: true };
}
