import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("ids") || "";
  const ids = raw
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 60);

  if (ids.length === 0) return NextResponse.json({ products: [] });

  const products = await db.product.findMany({
    where: { id: { in: ids }, active: true },
    include: {
      images: { orderBy: { sort: "asc" }, take: 1 },
      category: true,
      stocks: { select: { qty: true } },
    },
  });

  const order = new Map(ids.map((id, index) => [id, index]));
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({ products });
}
