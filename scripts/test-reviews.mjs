import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const db = new PrismaClient();
const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const payload = `admin:${Date.now() + 86400000}`;
const cookie = `te_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

const product = await db.product.findFirst({ where: { slug: "iphone-13-pro-used" } });
if (!product) throw new Error("produit introuvable");

const res = await fetch(`${BASE}/api/reviews`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    productId: product.id,
    name: "Client Test",
    phone: `+2267${String(Date.now()).slice(-7)}`,
    rating: 5,
    comment: "Produit conforme et livraison rapide, je recommande.",
  }),
});
console.log("création avis:", res.status, (await res.json()).ok === true);

const pending = await fetch(`${BASE}/p/${product.slug}`).then((r) => r.text());
console.log("non publié avant validation:", !pending.includes("Produit conforme et livraison rapide"));

const adminPending = await fetch(`${BASE}/admin/avis`, { headers: { cookie } });
const adminPendingHtml = await adminPending.text();
console.log("admin (en attente):", adminPending.status, adminPendingHtml.includes("Client Test"));

const review = await db.review.findFirst({ where: { productId: product.id, name: "Client Test" }, orderBy: { id: "desc" } });
await db.review.update({ where: { id: review.id }, data: { status: "approved" } });

const approved = await fetch(`${BASE}/p/${product.slug}`).then((r) => r.text());
console.log("visible après validation:", approved.includes("Produit conforme et livraison rapide"));
console.log("note agrégée affichée:", approved.includes("★ 5 (1)") || approved.includes("5 / 5"));

const admin = await fetch(`${BASE}/admin/avis?status=approved`, { headers: { cookie } });
const adminHtml = await admin.text();
console.log("admin avis:", admin.status, adminHtml.includes("Client Test"));

await db.review.delete({ where: { id: review.id } });
console.log("nettoyé");
await db.$disconnect();
