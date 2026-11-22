// Admin login: username (default "admin") + password (ADMIN_PASSWORD, nahi to wahi ADMIN_TOKEN secret).
// Login ke baad 12 ghante ka signed token milta hai (ADMIN_TOKEN se sign hota hai).
import { safeEqual } from "./util.js";
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sign(env, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode("sris-admin|" + env.ADMIN_TOKEN), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}
export const adminUser = (env) => (env.ADMIN_USERNAME || "admin").toLowerCase();
export const adminPass = (env) => env.ADMIN_PASSWORD || env.ADMIN_TOKEN || "";
export async function makeAdminToken(env) {
  const exp = String(Date.now() + 12 * 3600 * 1000);
  return exp + "." + (await sign(env, exp));
}
export async function checkAdminToken(env, token) {
  if (!env.ADMIN_TOKEN || !token) return false;
  if (safeEqual(token, env.ADMIN_TOKEN)) return true; // purana tareeka (seedha ADMIN_TOKEN) bhi chalta rahega
  const [exp, sig] = String(token).split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await sign(env, exp));
}
