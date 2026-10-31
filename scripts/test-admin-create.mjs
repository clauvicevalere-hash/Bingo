/**
 * Test de bout en bout de la création admin (catégorie + produit + image).
 * Usage : node scripts/test-admin-create.mjs [--keep]
 */
import crypto from "node:crypto";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = process.env.SESSION_SECRET || "change-me-in-production-8f3a9c2e5b7d1a4f";
const db = new PrismaClient();

const payload = `admin:${Date.now() + 86400000}`;
const token = `${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", SECRET)
  .update(payload)
  .digest("base64url")}`;
const cookie = `te_admin=${token}`;

const catRes = await fetch(`${BASE}/api/admin/categories`, {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie },
  body: JSON.stringify({ name: "Test Accessoires Auto", icon: "🚗" }),
});
const cat = await catRes.json();
if (!catRes.ok) throw new Error(`catégorie: ${JSON.stringify(cat)}`);
console.log("catégorie créée:", cat.category.slug);

const image = await sharp({
  create: { width: 600, height: 600, channels: 3, background: "#f26a1b" },
})
  .png()
  .toBuffer();

const fd = new FormData();
fd.append("name", "Test Produit Bingo");
fd.append("categoryId", String(cat.category.id));
fd.append("brand", "Bingo Test");
fd.append("price", "123500");
fd.append("oldPrice", "150000");
fd.append("condition", "Neuf");
fd.append("description", "Produit de test créé depuis le back-office.\n\nDeuxième paragraphe.");
fd.append("specs", "Écran 6,5\"\nBatterie 5000 mAh");
fd.append("active", "on");
fd.append("stock_BF", "7");
fd.append("stock_ML", "3");
fd.append("stock_NE", "2");
fd.append("stock_CI", "4");
fd.append("image", new Blob([image], { type: "image/png" }), "test.png");

const prodRes = await fetch(`${BASE}/api/admin/products`, { method: "POST", body: fd, headers: { cookie } });
const prod = await prodRes.json();
if (!prodRes.ok) throw new Error(`produit: ${JSON.stringify(prod)}`);
console.log("produit créé:", prod.id, prod.slug);

const page = await fetch(`${BASE}/p/${prod.slug}`);
const html = (await page.text()).replace(/[\u202f\u00a0]/g, " ");
const okPage = page.status === 200 && html.includes("Test Produit Bingo") && html.includes("123 500");
const catPage = await fetch(`${BASE}/c/${cat.category.slug}`);
const catHtml = (await catPage.text()).replace(/[\u202f\u00a0]/g, " ");
const okCat = catPage.status === 200 && catHtml.includes("Test Produit Bingo");

const stockRows = await db.stock.findMany({ where: { productId: prod.id } });
const okStock = stockRows.length === 4 && stockRows.some((s) => s.countryCode === "BF" && s.qty === 7);
const img = await db.productImage.count({ where: { productId: prod.id } });

console.log(`page produit: ${page.status} contenu=${okPage}`);
console.log(`page catégorie: ${catPage.status} contenu=${okCat}`);
console.log(`stock 4 pays: ${okStock} · image: ${img}`);

if (!process.argv.includes("--keep")) {
  await db.product.delete({ where: { id: prod.id } });
  await db.category.delete({ where: { id: cat.category.id } });
  console.log("nettoyé (produit + catégorie supprimés)");
}

await db.$disconnect();
