import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const limit = rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de messages. Réessayez plus tard." }, { status: 429 });
  }

  let body: { name?: string; phone?: string; email?: string; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();

  if (name.length < 2) return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  if (!/^[0-9 +().-]{8,20}$/.test(phone)) {
    return NextResponse.json({ error: "Téléphone invalide." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Message trop court." }, { status: 400 });
  }

  const saved = await db.contactMessage.create({
    data: { name, phone, email, message: message.slice(0, 4000) },
  });

  await notify({
    type: "contact",
    title: `Message de ${name}`,
    body: message.slice(0, 160),
    link: "/admin/messages",
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
