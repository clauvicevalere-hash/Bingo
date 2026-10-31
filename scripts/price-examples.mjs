import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const slugs = ["iphone-13-pro-used", "apple-macbook-air-with-m1-chip-2020", "smaker-gorgeous-analog-watch"];
for (const slug of slugs) {
  const p = await db.product.findUnique({ where: { slug }, include: { variants: true } });
  if (!p) continue;
  const prices = p.variants.length ? p.variants.map((v) => v.price) : [p.price];
  console.log(
    p.name,
    "| base:", p.price,
    "| variantes:", Math.min(...prices), "-", Math.max(...prices),
    "| AED:", p.supplierPriceAed,
    "| log:", p.logisticsCost,
    "| marge:", p.profitValue + (p.profitMode === "percent" ? "%" : " F")
  );
}
await db.$disconnect();
