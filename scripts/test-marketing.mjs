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

async function create(suffix, opts) {
  const form = new FormData();
  form.append("name", `Test Marketing ${suffix}`);
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
  form.append("oldPriceMode", opts.mode);
  form.append("oldPriceValue", String(opts.value));
  if (opts.show) form.append("showOldPrice", "on");
  if (opts.badge) form.append("showDiscountBadge", "on");

  const res = await fetch("http://localhost:3000/api/admin/products", {
    method: "POST",
    body: form,
    headers: { cookie },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const product = await db.product.findUnique({ where: { id: data.id } });
  const html = await fetch(`http://localhost:3000/p/${product.slug}`).then((r) => r.text());
  console.log(
    suffix,
    "| prix", product.price,
    "| barré", product.oldPrice,
    "| page oldPrice:", html.includes("old-price"),
    "| badge:", /class="saving"/.test(html)
  );
  await db.product.delete({ where: { id: data.id } });
}

await create("pourcent-badge", { mode: "percent", value: 50, show: true, badge: true });
await create("pourcent-sans-badge", { mode: "percent", value: 50, show: true, badge: false });
await create("fixe", { mode: "fixed", value: 250000, show: true, badge: true });
await create("aucun", { mode: "none", value: 0, show: false, badge: false });

await db.$disconnect();
