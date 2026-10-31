import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }

  const productId = Number(form.get("productId"));
  const file = form.get("image");
  if (!productId) return NextResponse.json({ error: "Produit manquant." }, { status: 400 });
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Image manquante." }, { status: 400 });
  }

  const blob = file as File;
  if (!blob.type.startsWith("image/")) {
    return NextResponse.json({ error: "Format d'image invalide." }, { status: 400 });
  }
  if (blob.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop lourde (max 8 Mo)." }, { status: 400 });
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  const last = await db.productImage.findFirst({
    where: { productId },
    orderBy: { sort: "desc" },
    select: { sort: true },
  });
  const sort = (last?.sort ?? -1) + 1;
  const filename = `${productId}-${Date.now()}.webp`;

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await blob.arrayBuffer());
    await sharp(buffer)
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(UPLOAD_DIR, filename));
  } catch (e) {
    console.error("image upload", e);
    return NextResponse.json({ error: "Traitement de l'image impossible." }, { status: 500 });
  }

  const image = await db.productImage.create({
    data: { productId, url: `/uploads/products/${filename}`, sort },
  });

  return NextResponse.json({ ok: true, image });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const image = await db.productImage.findUnique({ where: { id } });
  if (!image) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });

  await db.productImage.delete({ where: { id } });

  if (image.url.startsWith("/uploads/products/")) {
    const file = path.join(UPLOAD_DIR, path.basename(image.url));
    await fs.unlink(file).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
