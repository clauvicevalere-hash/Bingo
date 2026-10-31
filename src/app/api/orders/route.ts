import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COUNTRY_CODES } from "@/lib/constants";
import { orangeConfig } from "@/lib/orange";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const countryCode = String(body?.countryCode ?? "");
  if (!COUNTRY_CODES.includes(countryCode)) {
    return NextResponse.json({ error: "Pays de livraison invalide." }, { status: 400 });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0 || items.length > 20) {
    return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
  }

  const customerName = String(body?.customerName ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const whatsapp = String(body?.whatsapp ?? "").trim();
  const address = String(body?.address ?? "").trim();
  const note = String(body?.note ?? "").trim();
  const cityName = String(body?.city ?? "").trim();
  const paymentMethod = body?.paymentMethod === "ORANGE_MONEY" ? "ORANGE_MONEY" : "COD";

  if (paymentMethod === "ORANGE_MONEY" && !orangeConfig().enabled) {
    return NextResponse.json(
      { error: "Orange Money n'est pas disponible. Choisissez le paiement à la livraison." },
      { status: 400 }
    );
  }

  if (customerName.length < 2) return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  if (!/^[0-9 +().-]{8,20}$/.test(phone)) return NextResponse.json({ error: "Téléphone invalide." }, { status: 400 });
  if (address.length < 6) return NextResponse.json({ error: "Adresse trop courte." }, { status: 400 });

  const city = await db.city.findFirst({ where: { countryCode, name: cityName, active: true } });
  if (!city) return NextResponse.json({ error: "Ville de livraison inconnue." }, { status: 400 });

  const ids = Array.from(
    new Set<number>(
      items
        .map((i: { productId?: unknown }) => Number(i.productId))
        .filter((n: number) => Number.isFinite(n))
    )
  );
  const products = await db.product.findMany({
    where: { id: { in: ids }, active: true },
    include: {
      variants: true,
      images: { orderBy: { sort: "asc" }, take: 1 },
      stocks: { where: { countryCode } },
    },
  });

  type Line = {
    productId: number;
    variantId: number | null;
    name: string;
    variantLabel: string;
    image: string;
    price: number;
    qty: number;
    stockId: number;
  };

  const lines: Line[] = [];
  for (const raw of items) {
    const product = products.find((p) => p.id === Number(raw.productId));
    if (!product) return NextResponse.json({ error: "Un produit du panier n'est plus disponible." }, { status: 409 });
    const variantId = raw.variantId ? Number(raw.variantId) : 0;
    const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
    if (variantId && !variant) {
      return NextResponse.json({ error: `Option indisponible pour ${product.name}.` }, { status: 409 });
    }
    const stock = product.stocks.find((s) => (s.variantId ?? 0) === (variant?.id ?? 0));
    const qty = Math.max(1, Math.min(10, Number(raw.qty) || 1));
    if (!stock || stock.qty < qty) {
      return NextResponse.json(
        { error: `Stock insuffisant pour ${product.name}${variant ? ` (${variant.label})` : ""}.` },
        { status: 409 }
      );
    }
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantLabel: variant?.label ?? "",
      image: product.images[0]?.url ?? "",
      price: variant?.price ?? product.price,
      qty,
      stockId: stock.id,
    });
  }

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const deliveryFee = city.freeAbove && subtotal >= city.freeAbove ? 0 : city.deliveryFee;
  const total = subtotal + deliveryFee;

  const number = `BNG-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const order = await db.$transaction(async (tx) => {
      for (const l of lines) {
        const updated = await tx.stock.updateMany({
          where: { id: l.stockId, qty: { gte: l.qty } },
          data: { qty: { decrement: l.qty } },
        });
        if (updated.count === 0) throw new Error("OUT_OF_STOCK");
      }
      return tx.order.create({
        data: {
          number,
          countryCode,
          city: city.name,
          customerName,
          phone,
          whatsapp,
          address,
          note,
          subtotal,
          deliveryFee,
          total,
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "pending" : "awaiting_payment",
          status: "new",
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              name: l.name,
              variantLabel: l.variantLabel,
              image: l.image,
              price: l.price,
              qty: l.qty,
            })),
          },
        },
      });
    });

    return NextResponse.json({ ok: true, number: order.number, total: order.total });
  } catch (e: any) {
    if (e?.message === "OUT_OF_STOCK") {
      return NextResponse.json({ error: "Stock insuffisant, mettez votre panier à jour." }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
