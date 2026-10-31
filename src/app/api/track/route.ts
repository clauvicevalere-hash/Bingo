import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const TYPES = new Set(["page_view", "product_view", "add_to_cart", "checkout", "order"]);

export async function POST(req: Request) {
  const limit = rateLimit(`track:${clientIp(req)}`, 180, 60 * 1000);
  if (!limit.ok) return NextResponse.json({ ok: false }, { status: 429 });

  let body: {
    type?: string;
    path?: string;
    productId?: number;
    session?: string;
    country?: string;
    value?: number;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type = String(body.type || "");
  if (!TYPES.has(type)) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await db.event.create({
      data: {
        type,
        path: String(body.path || "").slice(0, 200),
        productId: Number(body.productId) || null,
        session: String(body.session || "").slice(0, 64),
        country: String(body.country || "").slice(0, 2),
        value: Math.max(0, Math.round(Number(body.value) || 0)),
      },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
