import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const base = "http://localhost:3000";

const product = await db.product.findFirst({
  where: { active: true, variants: { none: {} }, stocks: { some: { qty: { gte: 1 } } } },
  include: { stocks: { where: { qty: { gte: 1 } } } },
});
if (!product) throw new Error("aucun produit testable");
const stock = product.stocks[0];
const before = stock.qty;

const res = await fetch(base + "/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    countryCode: stock.countryCode,
    city: "Ouagadougou",
    customerName: "Test Notification",
    phone: "+22670000001",
    address: "Rue de test 123",
    paymentMethod: "COD",
    items: [{ productId: product.id, qty: 1 }],
  }),
});
const data = await res.json();
console.log("commande:", res.status, data.number || data.error);

if (res.ok) {
  const order = await db.order.findUnique({ where: { number: data.number } });
  const notif = await db.notification.findFirst({ where: { type: "order_new" }, orderBy: { id: "desc" } });
  console.log("notification:", notif?.title, "| lien:", notif?.link);
  if (order) await db.order.delete({ where: { id: order.id } });
  await db.stock.update({ where: { id: stock.id }, data: { qty: before } });
  if (notif) await db.notification.delete({ where: { id: notif.id } });
  console.log("nettoyé, stock restauré à", before);
}

await db.$disconnect();
