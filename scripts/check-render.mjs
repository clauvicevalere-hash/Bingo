const base = "https://bingo-8itp.onrender.com";
const paths = ["/", "/catalogue", "/p/iphone-13-pro-used", "/admin/login", "/manifest.webmanifest", "/sitemap.xml"];

for (const path of paths) {
  try {
    const res = await fetch(base + path, { signal: AbortSignal.timeout(60000) });
    const text = await res.text();
    console.log(path, res.status, text.length);
  } catch (e) {
    console.log(path, "ERR", e.name);
  }
}

try {
  const img = await fetch(base + "/uploads/products/452-0.webp", { signal: AbortSignal.timeout(60000) });
  console.log("image", img.status, img.headers.get("content-type"), img.headers.get("content-length"));
} catch (e) {
  console.log("image ERR", e.name);
}

try {
  const xml = await fetch(base + "/sitemap.xml", { signal: AbortSignal.timeout(60000) }).then((r) => r.text());
  console.log("sitemap first:", (xml.match(/<loc>[^<]+<\/loc>/) || ["none"])[0]);
  console.log("sitemap urls:", (xml.match(/<loc>/g) || []).length);
} catch (e) {
  console.log("sitemap ERR", e.name);
}
