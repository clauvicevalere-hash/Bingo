const urls = [
  'https://apkpure.net/mustaqbal-zamzam/com.mustaqbal.zamzam/download',
  'https://apkpure.net/mustaqbal-zamzam/com.mustaqbal.zamzam',
  'https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=mustaqbal',
  'https://apkmonk.com/app/com.mustaqbal.zamzam/',
  'https://apkfollow.com/app/com.mustaqbal.zamzam/',
  'https://apkgk.com/com.mustaqbal.zamzam',
];
for (const u of urls) {
  try {
    const res = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' } });
    const txt = await res.text();
    console.log(u, '=>', res.status, res.url, txt.length, (txt.match(/mustaqbal/gi) || []).length);
    const m = txt.match(/https?:\/\/[^"'\s]+\.(?:apk|xapk|apks)[^"'\s]*/g);
    if (m) console.log('  ', [...new Set(m)].slice(0, 3).join(' | '));
  } catch (e) { console.log(u, 'ERR', e.message); }
}
