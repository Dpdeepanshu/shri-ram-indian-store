// /api/admin/* ke liye check: admin login ka token (x-admin-token header) chahiye.
import { checkAdminToken } from "../../_lib/admin.js";
export async function onRequest({ request, env, next }) {
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  if (!env.ADMIN_TOKEN) return new Response(JSON.stringify({ error: "ADMIN_TOKEN is not set" }), { status: 500, headers });
  if (!(await checkAdminToken(env, request.headers.get("x-admin-token") || ""))) return new Response(JSON.stringify({ error: "Please log in again" }), { status: 401, headers });
  return next();
}
