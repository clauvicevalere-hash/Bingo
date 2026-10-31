/**
 * Test : création d'un produit + variante + commande avec variante + décrément du stock.
 * Usage : node scripts/test-variants.mjs
 */
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = process.env.SESSION_SECRET || "change-me-in-production-8f3a9c2e5b7d1a4f";
const db = new PrismaClient();

const payload = `admin:${Date.now() + 86400000}`;
const cookie = `te_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", SECRET)
  .update(payload)
  .digest("base64url")}`;

const catRes = await fetch(`${BASE}/api/admin/categories`, {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie },
  body: JSON.stringify({ name: "Test Variantes", icon: "🧪" }),
});
const cat = await catRes.json();
if (!catRes.ok) throw new Error(JSON.stringify(cat));

const fd = new FormData();
fd.append("name", "Test Produit Variante");
fd.append("categoryId", String(cat.category.id));
fd.append("brand", "Test");
fd.append("price", "99000");
fd.append("condition", "Neuf");
fd.append("active", "on");
fd.append("stock_BF", "0");
fd.append("stock_ML", "0");
fd.append("stock_NE", "0");
fd.append("stock_CI", "0");

const prodRes = await fetch(`${BASE}/api/admin/products`, { method: "POST", body: fd, headers: { cookie } });
const prod = await prodRes.json();
if (!prodRes.ok) throw new Error(JSON.stringify(prod));
console.log("produit:", prod.id, prod.slug);

const varRes = await fetch(`${BASE}/api/admin/variants`, {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie },
  body: JSON.stringify({
    productId: prod.id,
    label: "128 Go / Noir",
    price: 105000,
    oldPrice: 120000,
    stocks: { BF: 5, ML: 2, NE: 1, CI: 0 },
  }),
});
const variant = await varRes.json();
if (!varRes.ok) throw new Error(JSON.stringify(variant));
console.log("variante:", variant.variant.id, variant.variant.label);

const page = await fetch(`${BASE}/p/${prod.slug}`);
const html = (await page.text()).replace(/[\u202f\u00a0]/g, " ");
const shown = page.status === 200 && html.includes("128 Go / Noir") && html.includes("105 000");
console.log("page produit affiche l'option:", shown);

const orderRes = await fetch(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    countryCode: "BF",
    city: "Ouagadougou",
    customerName: "Test Variante",
    phone: "+22670000001",
    address: "Rue test 1",
    paymentMethod: "COD",
    items: [{ productId: prod.id, variantId: variant.variant.id, qty: 2 }],
  }),
});
const order = await orderRes.json();
if (!orderRes.ok) throw new Error(JSON.stringify(order));
console.log("commande:", order.number);

const stock = await db.stock.findFirst({
  where: { productId: prod.id, variantId: variant.variant.id, countryCode: "BF" },
});
console.log("stock BF après commande (attendu 3):", stock?.qty);

// nettoyage
await db.order.delete({ where: { number: order.number } });
await db.product.delete({ where: { id: prod.id } });
await db.category.delete({ where: { id: cat.category.id } });
console.log("nettoyé");

await db.$disconnect();
