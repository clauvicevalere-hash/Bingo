const base = "http://localhost:3000";
const pages = ["/", "/p/iphone-13-pro-used", "/admin/login", "/manifest.webmanifest"];

for (const path of pages) {
  const res = await fetch(base + path);
  const text = await res.text();
  console.log(path, res.status, "| Bingo:", /Bingo/i.test(text), "| Tresor:", /Tresor/i.test(text));
}

for (const asset of ["/brand/logo.png", "/brand/icon-192.png", "/icon", "/apple-icon"]) {
  const res = await fetch(base + asset);
  console.log(asset, res.status, res.headers.get("content-type"));
}
