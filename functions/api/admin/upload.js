// POST /api/admin/upload {data: "data:image/jpeg;base64,..."} -> {url: "/api/img/12"}
// Photo browser me chhoti (max 900px) karke aati hai, D1 me save hoti hai (free, R2/card ki zaroorat nahi).
import { json } from "../../_lib/util.js";
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.data || ""));
  if (!m) return json({ error: "Only JPG, PNG or WEBP photos are allowed" }, 400);
  if (m[2].length > 900000) return json({ error: "Photo is too big. Please use a smaller photo." }, 413);
  try {
    const r = await env.DB.prepare("INSERT INTO product_images (mime, data) VALUES (?,?)").bind(m[1], m[2]).run();
    return json({ ok: true, url: "/api/img/" + r.meta.last_row_id });
  } catch (e) { return json({ error: "Could not save the photo (did you run the migration?)" }, 500); }
}
