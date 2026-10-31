/**
 * Annule les commandes Orange Money non payées au-delà du délai et remet le stock.
 * Usage : node scripts/release-stale-orders.mjs [heures=24]
 * À planifier toutes les heures sur le serveur (cron).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const hours = Number(process.argv[2] || 24);
const cutoff = new Date(Date.now() - hours * 3600 * 1000);

const orders = await db.order.findMany({
  where: {
    paymentMethod: "ORANGE_MONEY",
    paymentStatus: { not: "paid" },
    status: { not: "cancelled" },
    createdAt: { lt: cutoff },
  },
  include: { items: true },
});

let restored = 0;
for (const order of orders) {
  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      const stock = await tx.stock.findFirst({
        where: {
          productId: item.productId,
          variantId: item.variantId ?? null,
          countryCode: order.countryCode,
        },
      });
      if (stock) {
        await tx.stock.update({ where: { id: stock.id }, data: { qty: { increment: item.qty } } });
        restored += item.qty;
      }
    }
    await tx.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
  });
  console.log(`annulée: ${order.number} (${order.total} FCFA)`);
}

console.log(`${orders.length} commande(s) libérée(s), ${restored} unité(s) remise(s) en stock.`);
await db.$disconnect();
