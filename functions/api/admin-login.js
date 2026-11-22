// POST /api/admin-login {username, password} -> {token}
import { json, safeEqual, rateLimit, clientIp, clean } from "../_lib/util.js";
import { adminUser, adminPass, makeAdminToken } from "../_lib/admin.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_TOKEN && !env.ADMIN_PASSWORD) return json({ error: "Admin password is not set. Set the ADMIN_TOKEN secret (see SETUP.md)." }, 500);
  if (!env.ADMIN_TOKEN) return json({ error: "ADMIN_TOKEN secret is required (it also signs the admin session)." }, 500);
  if (env.DB && !(await rateLimit(env, "admin:" + clientIp(request), 10, 900))) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const u = clean(b.username, 60).toLowerCase(), p = String(b.password || "");
  // dono check hamesha chalte hain (timing se pata na chale)
  const okU = safeEqual(u, adminUser(env)), okP = safeEqual(p, adminPass(env));
  if (!okU || !okP) return json({ error: "Incorrect username or password." }, 401);
  return json({ ok: true, token: await makeAdminToken(env) });
}
