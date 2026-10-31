import { NextResponse } from "next/server";
import { COUNTRY_CODES } from "@/lib/constants";

export async function POST(req: Request) {
  let code = "";
  try {
    const body = await req.json();
    code = String(body?.code ?? "");
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!COUNTRY_CODES.includes(code)) {
    return NextResponse.json({ error: "unknown country" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, code });
  res.cookies.set("bingo_country", code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
