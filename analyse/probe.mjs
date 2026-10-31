const base = 'https://backend.mustaqbalzamzam.com';
const paths = [
  '/api/shop',
  '/api/products',
  '/api/categories',
  '/api/banners',
  '/api/settings',
  '/api/website-settings',
  '/api/home',
  '/api/slider',
  '/api/brand',
  '/api/seller/list',
  '/api/shop/list',
  '/api/product/list',
  '/api/v1/home',
  '/api/documentation',
  '/api/reviews',
];
for (const p of paths) {
  try {
    const res = await fetch(base + p, {
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual',
    });
    const ct = res.headers.get('content-type') || '';
    let body = '';
    if (ct.includes('json')) body = JSON.stringify(await res.json()).slice(0, 300);
    else body = (await res.text()).slice(0, 120).replace(/\s+/g, ' ');
    console.log(p, '=>', res.status, ct, '|', body);
  } catch (e) {
    console.log(p, '=> ERR', e.message);
  }
}
