const base = process.argv[2] || process.env.PUBLIC_URL;
if (!base) throw new Error("URL manquante");

const health = await fetch(`${base}/api/health`);
console.log("health", health.status, (await health.text()).slice(0, 120));

const product = await fetch(`${base}/p/iphone-13-pro-used`);
const html = await product.text();
console.log("product", product.status);
const og = html.match(/https:\/\/[^"']+\.webp/);
console.log("og image:", og ? og[0] : "aucune");

const admin = await fetch(`${base}/admin`, { redirect: "manual" });
console.log("admin", admin.status, admin.headers.get("location"));

const manifest = await fetch(`${base}/manifest.webmanifest`);
console.log("manifest", manifest.status, manifest.headers.get("content-type"));
const sw = await fetch(`${base}/sw.js`);
console.log("sw", sw.status, sw.headers.get("content-type"));
