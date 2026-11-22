// GET /api/img/123 -> admin se upload ki hui product photo (D1 me rakhi hai)
export async function onRequestGet({ params, env }) {
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || !env.DB) return new Response("not found", { status: 404 });
  const row = await env.DB.prepare("SELECT mime, data FROM product_images WHERE id = ?").bind(id).first();
  if (!row) return new Response("not found", { status: 404 });
  const bin = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
  return new Response(bin, { headers: { "content-type": row.mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
