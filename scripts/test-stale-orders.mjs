/**
 * Test : libération d'une commande Orange Money non payée.
 * Usage : node scripts/test-stale-orders.mjs
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

const db = new PrismaClient();

const product = await db.product.findFirst({
  where: { slug: "iphone-13-pro-used" },
  include: { variants: { take: 1 }, stocks: true },
});
if (!product) throw new Error("produit introuvable");
const variant = product.variants[0];
const country = "BF";

const stockBefore = await db.stock.findFirst({
  where: { productId: product.id, variantId: variant?.id ?? null, countryCode: country },
});
if (!stockBefore) throw new Error("stock introuvable");

const order = await db.order.create({
  data: {
    number: `TEST-STALE-${Date.now()}`,
    countryCode: country,
    city: "Ouagadougou",
    customerName: "Test Stale",
    phone: "+22670000009",
    address: "Rue test",
    subtotal: 1000,
    deliveryFee: 0,
    total: 1000,
    paymentMethod: "ORANGE_MONEY",
    paymentStatus: "awaiting_payment",
    status: "new",
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    items: {
      create: {
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        variantLabel: variant?.label ?? "",
        price: 1000,
        qty: 1,
      },
    },
  },
});
await db.stock.update({ where: { id: stockBefore.id }, data: { qty: { decrement: 1 } } });

console.log("commande ancienne créée:", order.number);
execFileSync(process.execPath, ["scripts/release-stale-orders.mjs", "24"], { stdio: "inherit" });

const after = await db.order.findUnique({ where: { id: order.id } });
const stockAfter = await db.stock.findUnique({ where: { id: stockBefore.id } });
console.log("statut après:", after?.status, "· stock restauré:", stockAfter?.qty === stockBefore.qty);

await db.order.delete({ where: { id: order.id } });
await db.$disconnect();
