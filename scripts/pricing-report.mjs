import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const source = JSON.parse(fs.readFileSync("analyse/data/products_all.json", "utf8")).data.data;
const bySku = new Map(source.map((p) => [String(p.product_id), p]));
const rate = 165;

const oldPrice = (aed) => Math.max(500, Math.round((aed * rate * 1.3) / 500) * 500);

const products = await db.product.findMany({
  include: { category: { include: { parent: true } }, variants: true },
});

const groups = new Map();
let adjusted = 0;
let unchanged = 0;
const unmatched = [];

for (const p of products) {
  const src = bySku.get(p.sku);
  const aed = src ? Number(src.product_detail?.sale_price || src.product_detail?.regular_price || 0) : 0;
  if (!src || !aed) {
    unchanged++;
    unmatched.push(p.name);
    continue;
  }
  adjusted++;
  const before = oldPrice(aed);
  const after = p.price;
  const root = p.category?.parent?.name || p.category?.name || "Sans rayon";
  const g = groups.get(root) || { count: 0, before: 0, after: 0, down: 0, up: 0, flat: 0 };
  g.count++;
  g.before += before;
  g.after += after;
  if (after < before) g.down++;
  else if (after > before) g.up++;
  else g.flat++;
  groups.set(root, g);
}

console.log(`Produits : ${products.length} · réajustés : ${adjusted} · non réajustés : ${unchanged}`);
for (const [name, g] of [...groups.entries()].sort((a, b) => b[1].count - a[1].count)) {
  const pct = ((g.after - g.before) / g.before) * 100;
  console.log(
    `${name.padEnd(22)} ${String(g.count).padStart(4)} produits · ${pct > 0 ? "+" : ""}${pct.toFixed(1)} % · ↓${g.down} ↑${g.up} =${g.flat}`
  );
}
if (unmatched.length) {
  console.log("\nNon réajustés (pas de correspondance source) :");
  for (const n of unmatched) console.log("-", n);
}

await db.$disconnect();
