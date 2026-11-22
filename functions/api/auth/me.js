// GET /api/auth/me -> login hai to {user}, nahi to {user:null}
import { json, getUser } from "../../_lib/util.js";
export async function onRequestGet({ request, env }) {
  const u = await getUser(env, request);
  return json({ user: u || null });
}
