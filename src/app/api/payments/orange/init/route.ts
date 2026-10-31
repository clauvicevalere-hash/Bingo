import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orangeConfig, createWebPayment, mockToken, notifUrl } from "@/lib/orange";

export async function POST(req: Request) {
  let body: { number?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const number = String(body.number || "").trim();
  if (!number) return NextResponse.json({ error: "Commande manquante." }, { status: 400 });

  const cfg = orangeConfig();
  if (!cfg.enabled) {
    return NextResponse.json(
      { error: "Orange Money n'est pas encore activé. Choisissez le paiement à la livraison." },
      { status: 409 }
    );
  }

  const order = await db.order.findUnique({ where: { number } });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (order.paymentMethod !== "ORANGE_MONEY") {
    return NextResponse.json({ error: "Cette commande n'est pas réglée par Orange Money." }, { status: 400 });
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ url: `/commande/${order.number}` });
  }

  if (cfg.mode === "mock") {
    const token = mockToken();
    await db.order.update({
      where: { id: order.id },
      data: { paymentRef: `MOCK:${token}`, paymentStatus: "awaiting_payment" },
    });
    return NextResponse.json({
      url: `/paiement/mock?order=${encodeURIComponent(order.number)}&token=${token}`,
      mock: true,
    });
  }

  try {
    const payment = await createWebPayment(cfg, {
      orderNumber: order.number,
      amount: order.total,
      returnUrl: `${cfg.appUrl}/commande/${order.number}`,
      cancelUrl: `${cfg.appUrl}/paiement/${order.number}?annule=1`,
      notifUrl: notifUrl(cfg),
      reference: "Bingo",
    });

    await db.order.update({
      where: { id: order.id },
      data: { paymentRef: payment.payToken, paymentStatus: "awaiting_payment" },
    });

    return NextResponse.json({ url: payment.paymentUrl });
  } catch (e) {
    console.error("Orange init error", e);
    return NextResponse.json(
      { error: "Le paiement Orange Money est momentanément indisponible." },
      { status: 502 }
    );
  }
}
