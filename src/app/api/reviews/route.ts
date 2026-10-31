import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const perIp = rateLimit(`review-ip:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!perIp.ok) {
    return NextResponse.json({ error: "Trop d'avis envoyés. Réessayez plus tard." }, { status: 429 });
  }

  let body: { productId?: number; name?: string; phone?: string; rating?: number; comment?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const productId = Number(body.productId);
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const rating = Math.round(Number(body.rating));
  const comment = String(body.comment || "").trim();

  if (!productId) return NextResponse.json({ error: "Produit manquant." }, { status: 400 });
  if (name.length < 2 || name.length > 40) return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Note invalide." }, { status: 400 });
  }
  if (comment.length < 5 || comment.length > 1000) {
    return NextResponse.json({ error: "Commentaire trop court ou trop long." }, { status: 400 });
  }
  if (phone && !/^[0-9 +().-]{6,20}$/.test(phone)) {
    return NextResponse.json({ error: "Téléphone invalide." }, { status: 400 });
  }

  if (phone) {
    const perPhone = rateLimit(`review-phone:${phone}`, 2, 24 * 60 * 60 * 1000);
    if (!perPhone.ok) {
      return NextResponse.json({ error: "Un avis a déjà été envoyé avec ce numéro." }, { status: 429 });
    }
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  await db.review.create({
    data: {
      productId,
      name,
      phone,
      rating,
      comment,
      status: "pending",
    },
  });

  return NextResponse.json({ ok: true, message: "Merci ! Votre avis sera publié après vérification." });
}
