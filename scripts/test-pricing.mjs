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

const category = await db.category.findFirst({
  where: { parent: { slug: "new-mobile" } },
  orderBy: { id: "asc" },
});
if (!category) throw new Error("catégorie téléphone introuvable");

const form = new FormData();
form.append("name", "Test Prix Intelligent");
form.append("categoryId", String(category.id));
form.append("condition", "Neuf");
form.append("active", "on");
form.append("supplierPriceAed", "499");
form.append("logisticsCost", "10000");
form.append("profitMode", "percent");
form.append("profitValue", "10");
form.append("minProfit", "15000");
form.append("maxProfit", "25000");
form.append("roundTo", "500");
form.append("stock_BF", "1");

const res = await fetch("http://localhost:3000/api/admin/products", {
  method: "POST",
  body: form,
  headers: { cookie },
});
const data = await res.json();
console.log("création:", res.status, data.slug || data.error);

if (res.ok) {
  const product = await db.product.findUnique({ where: { id: data.id } });
  console.log("prix calculé:", product.price, "| attendu 107500");
  console.log("champs:", product.supplierPriceAed, product.logisticsCost, product.profitMode, product.profitValue, product.pricingMode, product.roundTo);
  await db.product.delete({ where: { id: data.id } });
  console.log("nettoyé");
}

await db.$disconnect();
