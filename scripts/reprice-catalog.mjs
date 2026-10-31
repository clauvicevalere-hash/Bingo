/**
 * Reprix du catalogue selon la politique Tresor Empire.
 * Usage :
 *   node scripts/reprice-catalog.mjs          (simulation)
 *   node scripts/reprice-catalog.mjs --apply  (écrit en base)
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");
const rate = Number(process.env.PRICE_RATE || 165);

const defaultsMap = JSON.parse(fs.readFileSync("src/lib/pricing-defaults.json", "utf8"));
const source = JSON.parse(fs.readFileSync("analyse/data/products_all.json", "utf8")).data.data;
const bySku = new Map(source.map((p) => [String(p.product_id), p]));

const FALLBACK = { logistics: 0, mode: "percent", value: 30, min: 1000, max: 0, roundTo: 500 };

function compute(costAed, d) {
  const costXof = Math.max(0, Number(costAed) || 0) * rate;
  const logistics = d.logistics > 0 ? Math.min(d.logistics, costXof * 0.2) : 0;
  const landed = costXof + logistics;
  let profit = d.mode === "fixed" ? d.value : (landed * d.value) / 100;
  const floor = d.min > 0 ? Math.min(d.min, landed * 0.4) : 0;
  if (floor > 0) profit = Math.max(profit, floor);
  if (d.max > 0) profit = Math.min(profit, d.max);
  const raw = landed + profit;
  const step = Math.max(1, d.roundTo);
  return Math.max(500, Math.round(raw / step) * step);
}

const products = await db.product.findMany({
  include: { category: { include: { parent: true } }, variants: true },
});

const changes = [];
let totalOld = 0;
let totalNew = 0;

for (const product of products) {
  const src = bySku.get(product.sku);
  if (!src) continue;
  const detail = src.product_detail || {};
  const aed = Number(detail.sale_price || detail.regular_price || 0);
  if (!aed) continue;

  const rootSlug = product.category?.parent?.slug || product.category?.slug || "";
  const d = defaultsMap[rootSlug] || FALLBACK;
  const newPrice = compute(aed, d);
  const regular = Number(detail.regular_price || 0);
  const newOld = regular > aed ? compute(regular, d) : null;
  const delta = newPrice - product.price;

  totalOld += product.price;
  totalNew += newPrice;
  changes.push({
    id: product.id,
    name: product.name,
    old: product.price,
    neu: newPrice,
    delta,
    pct: product.price ? ((newPrice - product.price) / product.price) * 100 : 0,
    aed,
    d,
    newOld,
    variants: product.variants.map((v) => {
      const sv = (src.variants || []).find((x) => x.sku && x.sku === v.sku);
      const vaed = sv ? Number(sv.sale_price || sv.regular_price || aed) : 0;
      const vPrice = vaed ? compute(vaed, d) : Math.max(500, v.price + delta);
      const vRegular = sv ? Number(sv.regular_price || 0) : 0;
      const vOld = vRegular > vaed && vaed ? compute(vRegular, d) : v.oldPrice;
      return { id: v.id, price: vPrice, oldPrice: vOld };
    }),
  });
}

const down = changes.filter((c) => c.delta < 0).length;
const up = changes.filter((c) => c.delta > 0).length;
const sorted = [...changes].sort((a, b) => a.pct - b.pct);

console.log(`Produits analysés : ${changes.length}`);
console.log(`Baisses : ${down} · Hausses : ${up}`);
console.log(`Valeur catalogue : ${Math.round(totalOld / 1e6)} M → ${Math.round(totalNew / 1e6)} M FCFA`);
console.log(`Variation moyenne : ${(changes.reduce((s, c) => s + c.pct, 0) / changes.length).toFixed(1)} %`);

const show = (title, list) => {
  console.log(`\n${title}`);
  for (const c of list) {
    console.log(
      `- ${c.name.slice(0, 48).padEnd(48)} ${c.old.toLocaleString("fr-FR").padStart(9)} → ${c.neu
        .toLocaleString("fr-FR")
        .padStart(9)}  (${c.pct > 0 ? "+" : ""}${c.pct.toFixed(0)} %) [AED ${c.aed}]`
    );
  }
};

show("Plus fortes baisses", sorted.slice(0, 8));
show("Plus fortes hausses", sorted.slice(-8).reverse());

if (!apply) {
  console.log("\nSimulation uniquement. Relancez avec --apply pour écrire en base.");
  await db.$disconnect();
  process.exit(0);
}

for (const c of changes) {
  await db.product.update({
    where: { id: c.id },
    data: {
      price: c.neu,
      oldPrice: c.newOld,
      supplierPriceAed: c.aed,
      logisticsCost: c.d.logistics,
      profitMode: c.d.mode,
      profitValue: c.d.value,
      minProfit: c.d.min,
      maxProfit: c.d.max,
      roundTo: c.d.roundTo,
      pricingMode: "auto",
    },
  });
  for (const v of c.variants) {
    await db.variant.update({ where: { id: v.id }, data: { price: v.price, oldPrice: v.oldPrice } });
  }
}

console.log(`\n${changes.length} produits et leurs variantes reprixés.`);
await db.$disconnect();
