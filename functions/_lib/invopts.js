// Invoice ke "jaari" options (retail/business, date, business details, signature) server par rakhe jaate hain,
// taaki PDF ke verify link par bilkul wahi invoice dikhe jo customer ne download ki. Table apne aap ban jaati hai.
const TABLE = "CREATE TABLE IF NOT EXISTS invoice_opts (order_no TEXT PRIMARY KEY, opts TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))";
const c = (s, n) => String(s == null ? "" : s).trim().slice(0, n);
export function cleanOpts(o) {
  o = o && typeof o === "object" ? o : {};
  const business = o.type === "business", b = o.biz && typeof o.biz === "object" ? o.biz : {};
  const out = { type: business ? "business" : "retail", date: /^\d{4}-\d{2}-\d{2}$/.test(String(o.date)) ? o.date : "", sign: o.sign !== false };
  if (business) {
    const g = c(b.gstin, 15).toUpperCase();
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g) || c(b.name, 100).length < 2) return null;
    out.biz = { name: c(b.name, 100), gstin: g, address: c(b.address, 300), state: c(b.state, 40), phone: c(b.phone, 15) };
  }
  return out;
}
export async function saveOpts(DB, orderNo, raw) {
  const o = cleanOpts(raw); if (!o) return false;
  await DB.prepare(TABLE).run();
  await DB.prepare("INSERT OR REPLACE INTO invoice_opts (order_no, opts, updated_at) VALUES (?,?,datetime('now'))").bind(orderNo, JSON.stringify(o)).run();
  return true;
}
export async function readOpts(DB, orderNo) {
  try { const r = await DB.prepare("SELECT opts FROM invoice_opts WHERE order_no = ?").bind(orderNo).first(); return r ? JSON.parse(r.opts) : null; } catch (e) { return null; }
}
