import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const source = JSON.parse(fs.readFileSync("analyse/data/products_all.json", "utf8")).data.data;
const bySku = new Map(source.map((p) => [String(p.product_id), p]));

const products = await db.product.findMany({
  where: { name: { contains: "Infinix Smart 20" } },
  include: { category: { include: { parent: true } }, variants: true },
});

for (const p of products) {
  const src = bySku.get(p.sku);
  const d = src?.product_detail || {};
  const aed = Number(d.sale_price || d.regular_price || 0);
  const rate = 165;
  const costXof = aed * rate;
  const logistics = p.logisticsCost > 0 ? Math.min(p.logisticsCost, costXof * 0.2) : 0;
  const landed = costXof + logistics;
  let profit = p.profitMode === "fixed" ? p.profitValue : (landed * p.profitValue) / 100;
  if (p.profitMode === "tiered") {
    const tiers = JSON.parse(fs.readFileSync("src/lib/pricing-defaults.json", "utf8"))[
      p.category?.parent?.slug || p.category?.slug || ""
    ]?.tiers || [];
    const tier = tiers.find((t) => t.max <= 0 || landed <= t.max);
    profit = tier ? tier.margin : 0;
  }
  const floor = p.profitMode !== "tiered" && p.minProfit > 0 ? Math.min(p.minProfit, landed * 0.4) : 0;
  if (floor > 0) profit = Math.max(profit, floor);
  if (p.maxProfit > 0) profit = Math.min(profit, p.maxProfit);
  const raw = landed + profit;

  console.log("Nom:", p.name, "| slug:", p.slug, "| catégorie:", p.category?.parent?.name, "/", p.category?.name);
  console.log("SKU:", p.sku);
  console.log("Prix source:", aed, "AED (sale:", d.sale_price, "regular:", d.regular_price, ")");
  console.log("Taux:", rate, "→ coût:", Math.round(costXof), "F");
  console.log("Fret paramétré:", p.logisticsCost, "| fret retenu (max 20%):", Math.round(logistics));
  console.log("Coût rendu:", Math.round(landed));
  console.log("Marge:", p.profitMode, p.profitValue, "| mini:", p.minProfit, "| maxi:", p.maxProfit, "→ marge calculée:", Math.round(profit));
  console.log("Brut:", Math.round(raw), "| arrondi:", p.roundTo, "→ PRIX:", p.price);
  console.log("Prix barré:", p.oldPrice, "| mode:", p.oldPriceMode, p.oldPriceValue, "| affiché:", p.showOldPrice);
  if (p.variants.length) {
    console.log("Variantes:", p.variants.map((v) => `${v.label} = ${v.price}`).join(" | "));
  }
  console.log("---");
}

await db.$disconnect();
