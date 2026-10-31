const res = await fetch('https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=mustaqbal', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' } });
const html = await res.text();
const links = [...html.matchAll(/href="([^"]*\/apk\/[^"]*)"/g)].map(m => m[1]);
console.log([...new Set(links)].join('\n'));
console.log('--- titles');
const t = html.match(/<h[0-9][^>]*>[\s\S]{0,200}?<\/h[0-9]>/g) || [];
console.log(t.slice(0, 20).join('\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
