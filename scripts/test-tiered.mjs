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

async function create(aed, expected) {
  const form = new FormData();
  form.append("name", `Test Tranche ${aed}`);
  form.append("categoryId", String(category.id));
  form.append("condition", "Neuf");
  form.append("active", "on");
  form.append("supplierPriceAed", String(aed));
  form.append("logisticsCost", "10000");
  form.append("roundTo", "500");
  form.append("stock_BF", "1");

  const res = await fetch("http://localhost:3000/api/admin/products", {
    method: "POST",
    body: form,
    headers: { cookie },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const p = await db.product.findUnique({ where: { id: data.id } });
  console.log(`${aed} AED → ${p.price} F (attendu ${expected}) · mode ${p.profitMode}`);
  await db.product.delete({ where: { id: data.id } });
}

await create(499, 102500);
await create(1499, 277500);
await db.$disconnect();
