import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const orders = await db.order.findMany({ include: { items: true } });
let restored = 0;

for (const order of orders) {
  // une commande annulée a déjà remis ses articles en stock
  if (order.status === "cancelled") continue;
  for (const item of order.items) {
    const stock = await db.stock.findFirst({
      where: {
        productId: item.productId,
        variantId: item.variantId ?? null,
        countryCode: order.countryCode,
      },
    });
    if (stock) {
      await db.stock.update({ where: { id: stock.id }, data: { qty: { increment: item.qty } } });
      restored += item.qty;
    }
  }
}

const deleted = await db.order.deleteMany();
console.log(`Commandes de test supprimées : ${deleted.count}. Unités remises en stock : ${restored}.`);
await db.$disconnect();
