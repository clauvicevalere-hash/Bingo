import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const base = "http://localhost:3000";
const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const payload = `admin:${Date.now() + 86400000}`;
const cookie = `te_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

const product = await db.product.findFirst({ where: { active: true, images: { some: {} } }, include: { images: true } });

const csvProducts = await fetch(base + "/api/admin/export?type=products", { headers: { cookie } });
const csvText = await csvProducts.text();
console.log("csv produits:", csvProducts.status, csvProducts.headers.get("content-type"), "| lignes:", csvText.split("\r\n").length);

const csvOrders = await fetch(base + "/api/admin/export?type=orders", { headers: { cookie } });
console.log("csv commandes:", csvOrders.status);

const api = await fetch(base + `/api/products?ids=${product.id}`).then((r) => r.json());
console.log("api wishlist:", api.products?.length, api.products?.[0]?.slug);

const fav = await fetch(base + "/favoris");
console.log("page favoris:", fav.status);

const page = await fetch(base + "/p/" + product.slug).then((r) => r.text());
console.log("next/image:", page.includes("/_next/image"), "| wishlist bouton:", page.includes("Ajouter aux favoris"));

const optimized = await fetch(base + `/_next/image?url=${encodeURIComponent(product.images[0].url)}&w=640&q=75`);
console.log("image optimisée:", optimized.status, optimized.headers.get("content-type"));

const cat = await db.category.count({ where: { image: { not: "" } } });
console.log("catégories avec image:", cat, "/", await db.category.count());

await db.$disconnect();
