import fs from 'node:fs';
const base = 'https://backend.mustaqbalzamzam.com/api';
const dir = 'C:/Users/Tresor/Documents/ecommerce/Bingo/analyse/data';
fs.mkdirSync(dir, { recursive: true });
const H = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
async function call(method, path, body, file) {
  const res = await fetch(base + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  let json = null; try { json = JSON.parse(txt); } catch {}
  if (file) fs.writeFileSync(`${dir}/${file}`, JSON.stringify(json ?? txt, null, 2));
  console.log(method, path, res.status, 'bytes=' + txt.length);
  return json;
}
const shop = await call('POST', '/fetch/shop', {}, 'shop.json');
const groups = await call('GET', '/group/list', null, 'groups.json');
const cats = await call('GET', '/category/list', null, 'categories.json');
const sliders = await call('GET', '/get/sliders', null, 'sliders.json');
const reels = await call('GET', '/reels', null, 'reels.json');
const shops = await call('POST', '/get/shops', {}, 'shops.json');
const brands = await call('POST', '/get/brands', {}, 'brands.json');
const offers = await call('POST', '/get/offers', {}, 'offers.json');
const products = await call('POST', '/product/list', { per_page: 5, page: 1 }, 'products_p1.json');
console.log('shop keys:', shop?.data ? Object.keys(shop.data) : shop);
console.log('counts: groups', groups?.data?.length, 'cats', cats?.data?.length, 'sliders', sliders?.data?.length, 'reels', reels?.data?.data?.length, 'brands', brands?.data?.length);
