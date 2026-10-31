import { db } from "@/lib/db";

export class OrderStatusError extends Error {
  code: "NOT_FOUND" | "CANCELLED_LOCKED";
  constructor(code: "NOT_FOUND" | "CANCELLED_LOCKED") {
    super(code);
    this.code = code;
  }
}

/**
 * Change le statut d'une commande.
 * - une annulation remet les articles en stock ;
 * - une commande annulée ne peut pas être réactivée.
 */
export async function changeOrderStatus(id: number, next: string) {
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new OrderStatusError("NOT_FOUND");

  if (order.status === "cancelled" && next !== "cancelled") {
    throw new OrderStatusError("CANCELLED_LOCKED");
  }

  if (next === "cancelled" && order.status !== "cancelled") {
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
        }
      }
      await tx.order.update({ where: { id }, data: { status: "cancelled" } });
    });
    return;
  }

  await db.order.update({ where: { id }, data: { status: next } });
}
