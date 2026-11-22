// Stock quantity: products.stock_qty NULL = stock track nahi hota (hamesha available). Number = bacha hua stock.
// lines: [{id, qty}]. sign -1 = stock ghatao (order), +1 = wapas jodo (cancel / delete / qty kam)
export async function moveStock(DB, lines, sign) {
  for (const l of lines) {
    const id = parseInt(l.id, 10), q = parseInt(l.qty, 10) || 0;
    if (!Number.isInteger(id) || q <= 0) continue;
    if (sign < 0) {
      await DB.prepare("UPDATE products SET stock_qty = MAX(0, stock_qty - ?1), in_stock = CASE WHEN stock_qty - ?1 <= 0 THEN 0 ELSE in_stock END WHERE id = ?2 AND stock_qty IS NOT NULL").bind(q, id).run();
    } else {
      await DB.prepare("UPDATE products SET stock_qty = stock_qty + ?1, in_stock = 1 WHERE id = ?2 AND stock_qty IS NOT NULL").bind(q, id).run();
    }
  }
}
export function qtyMap(lines) {
  const m = new Map();
  for (const l of lines || []) { const id = parseInt(l.id, 10), q = parseInt(l.qty, 10) || 0; if (Number.isInteger(id) && q > 0) m.set(id, (m.get(id) || 0) + q); }
  return m;
}
// purani aur nayi lines ka farak: stock me kitna badlega
export async function applyDiff(DB, oldLines, newLines) {
  const a = qtyMap(oldLines), b = qtyMap(newLines), plus = [], minus = [];
  for (const id of new Set([...a.keys(), ...b.keys()])) {
    const d = (b.get(id) || 0) - (a.get(id) || 0);
    if (d > 0) minus.push({ id, qty: d }); else if (d < 0) plus.push({ id, qty: -d });
  }
  await moveStock(DB, minus, -1); await moveStock(DB, plus, +1);
}
