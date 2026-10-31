const base = 'https://backend.mustaqbalzamzam.com/api';
const calls = [
  ['GET', '/group/list'],
  ['GET', '/category/list'],
  ['GET', '/get/sliders'],
  ['GET', '/reels'],
  ['POST', '/product/list', { per_page: 2, page: 1 }],
  ['POST', '/get/shops', {}],
  ['POST', '/combo/list', {}],
  ['POST', '/fetch/shop', {}],
  ['GET', '/social_link'],
  ['GET', '/reviews'],
];
for (const [method, path, body] of calls) {
  try {
    const res = await fetch(base + path, {
      method,
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const txt = await res.text();
    console.log(method, path, '=>', res.status, res.headers.get('content-type'), '|', txt.slice(0, 240).replace(/\s+/g, ' '));
  } catch (e) { console.log(method, path, 'ERR', e.message); }
}
