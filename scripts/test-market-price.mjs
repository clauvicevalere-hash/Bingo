import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const payload = `admin:${Date.now() + 86400000}`;
const cookie = `te_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

const category = await db.category.findFirst({ where: { parent: { slug: "new-mobile" } } });
const form = new FormData();
form.append("name", "Test Prix Marche");
form.append("categoryId", String(category.id));
form.append("condition", "Neuf");
form.append("active", "on");
form.append("supplierPriceAed", "499");
form.append("logisticsCost", "10000");
form.append("marketPrice", "95000");
form.append("stock_BF", "1");

const res = await fetch("http://localhost:3000/api/admin/products", {
  method: "POST",
  body: form,
  headers: { cookie },
});
const data = await res.json();
const p = await db.product.findUnique({ where: { id: data.id } });
console.log("prix:", p.price, "| marché:", p.marketPrice, "| marge marché:", p.marketPrice - 92335);

const page = await fetch(`http://localhost:3000/admin/produits/${p.id}`, { headers: { cookie } }).then((r) => r.text());
console.log("admin marge:", page.includes("Marge au prix du marché"), "| alerte perte:", page.includes("vendez à perte"));

const manifest = await fetch("http://localhost:3000/manifest.webmanifest").then((r) => r.json());
console.log("shortcuts:", manifest.shortcuts?.length, "| screenshots:", manifest.screenshots?.length);

await db.product.delete({ where: { id: p.id } });
await db.$disconnect();
