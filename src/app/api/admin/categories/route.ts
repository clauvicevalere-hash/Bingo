import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/site";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string; parentId?: number | null; icon?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  if (name.length < 2) return NextResponse.json({ error: "Nom trop court." }, { status: 400 });

  let slug = slugify(name);
  if (!slug) return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  let candidate = slug;
  let i = 2;
  while (await db.category.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${i++}`;
  }

  const parentId = body.parentId ? Number(body.parentId) : null;
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId } });
    if (!parent) return NextResponse.json({ error: "Rayon parent introuvable." }, { status: 400 });
  }

  const category = await db.category.create({
    data: {
      name,
      slug: candidate,
      icon: String(body.icon || "📦").slice(0, 8),
      parentId,
    },
  });

  return NextResponse.json({ ok: true, category });
}
