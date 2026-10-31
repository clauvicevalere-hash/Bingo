import fs from 'node:fs';
const base = 'https://backend.mustaqbalzamzam.com/api';
const dir = 'C:/Users/Tresor/Documents/ecommerce/Bingo/analyse/data';
const H = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
async function post(path, body) {
  const res = await fetch(base + path, { method: 'POST', headers: H, body: JSON.stringify(body) });
  return res.json();
}
const all = await post('/product/list', { per_page: 1000, page: 1 });
fs.writeFileSync(`${dir}/products_all.json`, JSON.stringify(all, null, 2));
const rows = all.data.data;
const num = v => (v === null || v === undefined || v === '' ? NaN : Number(v));
const prices = rows.map(r => num(r.product_detail?.sale_price)).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
const q = p => prices[Math.floor(p * (prices.length - 1))];
const byItem = {};
for (const r of rows) { const k = r.item?.name || 'n/a'; byItem[k] = (byItem[k] || 0) + 1; }
const withDiscount = rows.filter(r => num(r.product_detail?.discount_percentage) > 0);
const stock = rows.reduce((s, r) => s + (num(r.qty) || 0), 0);
console.log(JSON.stringify({
  total: all.data.total, returned: rows.length,
  price: { min: prices[0], p25: q(.25), median: q(.5), p75: q(.75), max: prices.at(-1) },
  withDiscount: withDiscount.length,
  avgDiscount: withDiscount.length ? (withDiscount.reduce((s, r) => s + num(r.product_detail.discount_percentage), 0) / withDiscount.length).toFixed(1) : 0,
  totalQty: stock,
  zeroStock: rows.filter(r => (num(r.qty) || 0) <= 0).length,
  variants: rows.filter(r => (r.variants || []).length > 0).length,
  views: rows.reduce((s, r) => s + (num(r.view) || 0), 0),
  likes: rows.reduce((s, r) => s + (num(r.like) || 0), 0),
  byItem,
}, null, 2));
