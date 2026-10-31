const urls = [
  'https://d.apkpure.com/b/APK/com.mustaqbal.zamzam?version=latest',
  'https://apkcombo.com/mustaqbal-zamzam/com.mustaqbal.zamzam/download/apk',
  'https://apkpure.com/mustaqbal-zamzam/com.mustaqbal.zamzam/download',
];
for (const u of urls) {
  try {
    const res = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' } });
    console.log(u, '=>', res.status, res.url, res.headers.get('content-type'), res.headers.get('content-length'));
    const buf = Buffer.from(await res.arrayBuffer());
    console.log('bytes', buf.length, 'magic', buf.subarray(0, 4).toString('hex'));
  } catch (e) { console.log(u, '=> ERR', e.message); }
}
