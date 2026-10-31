import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/site";

const COUNTRIES = ["BF", "ML", "NE", "CI"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toParagraphs(value: string) {
  return escapeHtml(value.trim())
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }

  const name = String(form.get("name") || "").trim();
  const price = Math.round(Number(form.get("price")) || 0);
  const oldPriceRaw = Math.round(Number(form.get("oldPrice")) || 0);
  const categoryId = Number(form.get("categoryId")) || null;
  const brandName = String(form.get("brand") || "").trim();
  const condition = String(form.get("condition") || "Neuf");
  const description = String(form.get("description") || "");
  const specs = String(form.get("specs") || "");
  const active = form.get("active") === "on" || form.get("active") === "true";
  const featured = form.get("featured") === "on" || form.get("featured") === "true";

  if (name.length < 2) return NextResponse.json({ error: "Nom du produit trop court." }, { status: 400 });
  if (price <= 0) return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "Choisissez une catégorie." }, { status: 400 });

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) return NextResponse.json({ error: "Catégorie introuvable." }, { status: 400 });

  let brandId: number | null = null;
  if (brandName) {
    const bSlug = slugify(brandName) || `marque-${Date.now()}`;
    const brand = await db.brand.upsert({
      where: { slug: bSlug },
      update: { name: brandName },
      create: { slug: bSlug, name: brandName },
    });
    brandId = brand.id;
  }

  let slug = slugify(name) || `produit-${Date.now()}`;
  let candidate = slug;
  let i = 2;
  while (await db.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${i++}`;
  }

  const product = await db.product.create({
    data: {
      name,
      slug: candidate,
      price,
      oldPrice: oldPriceRaw > price ? oldPriceRaw : null,
      condition,
      description: toParagraphs(description),
      specs: toParagraphs(specs),
      categoryId,
      brandId,
      active,
      featured,
    },
  });

  for (const code of COUNTRIES) {
    const qty = Math.max(0, Math.round(Number(form.get(`stock_${code}`)) || 0));
    await db.stock.create({
      data: { productId: product.id, variantId: null, countryCode: code, qty },
    });
  }

  const file = form.get("image");
  if (file && typeof file === "object" && "arrayBuffer" in file) {
    const blob = file as File;
    if (blob.size > 0 && blob.size <= 8 * 1024 * 1024 && blob.type.startsWith("image/")) {
      try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        const filename = `${product.id}-0.webp`;
        const buffer = Buffer.from(await blob.arrayBuffer());
        await sharp(buffer)
          .resize(900, 900, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(path.join(UPLOAD_DIR, filename));
        await db.productImage.create({
          data: { productId: product.id, url: `/uploads/products/${filename}`, sort: 0 },
        });
      } catch (e) {
        console.error("upload failed", e);
      }
    }
  }

  return NextResponse.json({ ok: true, id: product.id, slug: product.slug });
}
