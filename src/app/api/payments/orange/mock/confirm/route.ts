import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orangeConfig } from "@/lib/orange";

/** Validation d'un paiement simulé (mode mock uniquement). */
export async function POST(req: Request) {
  const cfg = orangeConfig();
  if (cfg.mode !== "mock") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: { number?: string; token?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { number: String(body.number || "") } });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  const expected = order.paymentRef.startsWith("MOCK:") ? order.paymentRef.slice(5) : "";
  if (!expected || expected !== String(body.token || "")) {
    return NextResponse.json({ error: "Jeton de paiement invalide." }, { status: 403 });
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "paid",
      paymentRef: `MOCKPAID:${expected}`,
      status: order.status === "new" ? "confirmed" : order.status,
    },
  });

  return NextResponse.json({ ok: true, url: `/commande/${order.number}?paiement=ok` });
}
