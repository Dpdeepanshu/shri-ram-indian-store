// Admin dashboard numbers
import { json } from "../../_lib/util.js";
export async function onRequestGet({ env }) {
  const one = async (sql) => { try { return await env.DB.prepare(sql).first(); } catch (e) { return null; } };
  const orders = await one("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END),0) AS revenue, SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS new_orders FROM orders");
  const today = await one("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END),0) AS revenue FROM orders WHERE date(created_at, '+5 hours', '+30 minutes') = date('now', '+5 hours', '+30 minutes')");
  const products = await one("SELECT COUNT(*) AS n, SUM(CASE WHEN in_stock = 0 THEN 1 ELSE 0 END) AS out FROM products");
  const users = await one("SELECT COUNT(*) AS n FROM users WHERE verified = 1");
  let low = []; try { low = (await env.DB.prepare("SELECT id, name, stock_qty FROM products WHERE stock_qty IS NOT NULL AND stock_qty <= 5 ORDER BY stock_qty ASC LIMIT 10").all()).results; } catch (e) {}
  return json({ orders, today, products, users, low });
}
