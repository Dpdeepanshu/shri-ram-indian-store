// /api/admin/* ke liye password (token) check. Token Cloudflare me ADMIN_TOKEN secret se aata hai.
function safeEqual(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export async function onRequest({ request, env, next }) {
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  if (!env.ADMIN_TOKEN) return new Response(JSON.stringify({ error: "ADMIN_TOKEN is not set" }), { status: 500, headers });
  const token = request.headers.get("x-admin-token") || "";
  if (!safeEqual(token, env.ADMIN_TOKEN)) return new Response(JSON.stringify({ error: "Incorrect token" }), { status: 401, headers });
  return next();
}
