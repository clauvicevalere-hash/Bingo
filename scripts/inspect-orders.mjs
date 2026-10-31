import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const orders = await db.order.findMany({ orderBy: { id: "desc" }, take: 3 });
for (const o of orders) {
  console.log(o.id, o.number, o.paymentMethod, o.paymentStatus, o.status, o.total);
}
await db.$disconnect();
