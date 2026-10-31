import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orangeConfig, getTransactionStatus } from "@/lib/orange";

/**
 * Notification serveur Orange Money.
 * En mode live, le statut est revérifié auprès d'Orange avant de valider la commande.
 */
export async function POST(req: Request) {
  const cfg = orangeConfig();
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const number = String(body.order_id || body.orderId || body.reference || "");
  if (!number) return NextResponse.json({ ok: false }, { status: 200 });

  const order = await db.order.findUnique({ where: { number } });
  if (!order) return NextResponse.json({ ok: false }, { status: 200 });
  if (order.paymentStatus === "paid") return NextResponse.json({ ok: true });

  let paid = false;
  if (cfg.mode === "mock") {
    paid = String(body.status || "").toUpperCase() === "SUCCESS" && order.paymentRef.startsWith("MOCK:");
  } else {
    const token = String(body.pay_token || body.notif_token || order.paymentRef || "");
    if (token) {
      try {
        const status = await getTransactionStatus(cfg, token, body.txnid);
        paid = status.ok;
      } catch (e) {
        console.error("Orange status check failed", e);
      }
    }
  }

  if (paid) {
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "paid", status: order.status === "new" ? "confirmed" : order.status },
    });
  }

  return NextResponse.json({ ok: true });
}
