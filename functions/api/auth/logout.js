import { json, getCookie, COOKIE, sha256, sessionCookie } from "../../_lib/util.js";
export async function onRequestPost({ request, env }) {
  const t = getCookie(request, COOKIE);
  if (t && env.DB) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(t)).run().catch(() => {});
  return json({ ok: true }, 200, { "set-cookie": sessionCookie(request, "", 0) });
}
