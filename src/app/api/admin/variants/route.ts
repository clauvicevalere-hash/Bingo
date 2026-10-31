import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const COUNTRIES = ["BF", "ML", "NE", "CI"];

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    productId?: number;
    label?: string;
    price?: number;
    oldPrice?: number;
    stocks?: Record<string, number>;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const productId = Number(body.productId);
  const label = String(body.label || "").trim();
  const price = Math.round(Number(body.price) || 0);
  const oldPriceRaw = Math.round(Number(body.oldPrice) || 0);

  if (!productId) return NextResponse.json({ error: "Produit manquant." }, { status: 400 });
  if (label.length < 2) return NextResponse.json({ error: "Libellé trop court." }, { status: 400 });
  if (price <= 0) return NextResponse.json({ error: "Prix invalide." }, { status: 400 });

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  const duplicate = await db.variant.findFirst({ where: { productId, label } });
  if (duplicate) return NextResponse.json({ error: "Cette option existe déjà." }, { status: 409 });

  const variant = await db.variant.create({
    data: {
      productId,
      label,
      price,
      oldPrice: oldPriceRaw > price ? oldPriceRaw : null,
    },
  });

  for (const code of COUNTRIES) {
    const qty = Math.max(0, Math.round(Number(body.stocks?.[code]) || 0));
    await db.stock.create({
      data: { productId, variantId: variant.id, countryCode: code, qty },
    });
  }

  return NextResponse.json({ ok: true, variant });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const variant = await db.variant.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!variant) return NextResponse.json({ error: "Option introuvable." }, { status: 404 });
  if (variant._count.orderItems > 0) {
    return NextResponse.json(
      { error: "Cette option est utilisée dans des commandes : désactivez le produit plutôt que de la supprimer." },
      { status: 409 }
    );
  }

  await db.variant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
