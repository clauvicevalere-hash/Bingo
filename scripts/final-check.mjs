/**
 * Vérification finale de l'application.
 * Usage : node scripts/final-check.mjs [url-publique]
 */
import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const LOCAL = "http://localhost:3000";
const PUBLIC = process.argv[2] || process.env.PUBLIC_URL || "";
const db = new PrismaClient();

const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const payload = `admin:${Date.now() + 86400000}`;
const cookie = `te_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

let failures = 0;
async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`${result === false ? "✗" : "✓"} ${label}${result && result !== true ? ` — ${result}` : ""}`);
    if (result === false) failures += 1;
  } catch (e) {
    console.log(`✗ ${label} — ${e.message}`);
    failures += 1;
  }
}

await check("Santé API", async () => {
  const r = await fetch(`${LOCAL}/api/health`);
  const j = await r.json();
  return r.ok && j.ok ? `${j.products} produits` : false;
});

for (const path of ["/", "/catalogue", "/p/iphone-13-pro-used", "/commande", "/admin/login", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/offline.html"]) {
  await check(`Route ${path}`, async () => {
    const r = await fetch(LOCAL + path);
    return r.ok ? true : `HTTP ${r.status}`;
  });
}

await check("Admin (cookie)", async () => {
  const r = await fetch(`${LOCAL}/admin`, { headers: { cookie } });
  return r.ok ? true : `HTTP ${r.status}`;
});

await check("Sitemap URLs", async () => {
  const xml = await fetch(`${LOCAL}/sitemap.xml`).then((r) => r.text());
  const count = (xml.match(/<loc>/g) || []).length;
  return count > 1000 ? `${count} URLs` : false;
});

await check("APK", async () => {
  const file = "dist/bingo-debug.apk";
  if (!fs.existsSync(file)) return false;
  const mb = (fs.statSync(file).size / 1024 / 1024).toFixed(1);
  return `${mb} Mo`;
});

await check("Base de données", async () => {
  const [products, stocks, orders] = await Promise.all([db.product.count(), db.stock.count(), db.order.count()]);
  return `${products} produits · ${stocks} lignes de stock · ${orders} commandes`;
});

if (PUBLIC) {
  await check("Site public", async () => {
    const r = await fetch(`${PUBLIC}/api/health`);
    const j = await r.json();
    return r.ok && j.ok ? `ok (${j.products} produits)` : false;
  });
}

await db.$disconnect();
console.log(failures === 0 ? "\nTOUT EST VERT" : `\n${failures} échec(s)`);
process.exit(failures ? 1 : 0);
