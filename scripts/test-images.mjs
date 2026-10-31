/**
 * Test : ajout puis suppression d'une image produit via l'API admin.
 * Usage : node scripts/test-images.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = process.env.SESSION_SECRET || "change-me-in-production-8f3a9c2e5b7d1a4f";
const db = new PrismaClient();

const payload = `admin:${Date.now() + 86400000}`;
const cookie = `bingo_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", SECRET)
  .update(payload)
  .digest("base64url")}`;

const product = await db.product.findFirst({ where: { slug: "iphone-13-pro-used" } });
if (!product) throw new Error("produit de test introuvable");
const before = await db.productImage.count({ where: { productId: product.id } });

const png = await sharp({
  create: { width: 500, height: 500, channels: 3, background: "#1a7f5a" },
})
  .png()
  .toBuffer();

const form = new FormData();
form.append("productId", String(product.id));
form.append("image", new Blob([png], { type: "image/png" }), "test.png");

const res = await fetch(`${BASE}/api/admin/images`, { method: "POST", body: form, headers: { cookie } });
const data = await res.json();
if (!res.ok) throw new Error(JSON.stringify(data));
console.log("image ajoutée:", data.image.url);

const file = path.join(process.cwd(), "public", data.image.url.replace(/^\//, ""));
console.log("fichier sur disque:", fs.existsSync(file));

const page = await fetch(`${BASE}/p/${product.slug}`);
const html = await page.text();
console.log("visible sur la fiche:", html.includes(data.image.url));

const del = await fetch(`${BASE}/api/admin/images?id=${data.image.id}`, { method: "DELETE", headers: { cookie } });
console.log("suppression:", del.status, (await del.json()).ok === true);
await new Promise((r) => setTimeout(r, 300));
console.log("fichier supprimé:", !fs.existsSync(file));
console.log("nombre d'images inchangé:", (await db.productImage.count({ where: { productId: product.id } })) === before);

await db.$disconnect();
