const urls = [
  'https://apkfab.com/mustaqbal-zamzam/com.mustaqbal.zamzam',
  'https://apk.support/download-app/com.mustaqbal.zamzam',
  'https://www.apkmirror.com/apk/mustaqbal-zamzam-general-trading-l-l-c/mustaqbal-zamzam/',
  'https://m.apkpure.com/mustaqbal-zamzam/com.mustaqbal.zamzam',
  'https://apkdone.com/mustaqbal-zamzam/',
  'https://apkcombo.app/mustaqbal-zamzam/com.mustaqbal.zamzam/download/apk',
];
for (const u of urls) {
  try {
    const res = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' } });
    const txt = await res.text();
    console.log(u, '=>', res.status, res.url, res.headers.get('content-type'), txt.length);
    const m = txt.match(/https?:\/\/[^"'\s]+\.(?:apk|xapk|apks)[^"'\s]*/g);
    if (m) console.log('  links:', [...new Set(m)].slice(0, 5).join(' | '));
  } catch (e) { console.log(u, '=> ERR', e.message); }
}
