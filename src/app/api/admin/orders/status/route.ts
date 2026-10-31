import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { changeOrderStatus, OrderStatusError } from "@/lib/orders";
import { db } from "@/lib/db";
import { notifyStatus } from "@/lib/notify";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { id?: number; status?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const id = Number(body.id);
  const status = String(body.status || "");
  if (!id || !["new", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    await changeOrderStatus(id, status);
    const order = await db.order.findUnique({ where: { id }, select: { status: true, number: true } });
    if (order) await notifyStatus(order.number, status);
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    if (e instanceof OrderStatusError) {
      return NextResponse.json({ error: e.code }, { status: e.code === "NOT_FOUND" ? 404 : 409 });
    }
    throw e;
  }
}
