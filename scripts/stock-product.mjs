import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const productId = Number(process.argv[2] || 1);
const country = process.argv[3] || "NE";
const stocks = await db.stock.findMany({ where: { productId, countryCode: country } });
console.log(country, stocks.map((s) => `${s.variantId ?? "base"}:${s.qty}`).join(" "));
await db.$disconnect();
