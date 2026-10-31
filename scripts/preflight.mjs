/**
 * Contrôle avant mise en ligne.
 * Usage : node scripts/preflight.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const envPath = path.join(root, ".env");
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
}

const checks = [];
const add = (level, label, detail) => checks.push({ level, label, detail });

add(
  env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== "bingo2026" ? "ok" : "error",
  "Mot de passe admin",
  env.ADMIN_PASSWORD === "bingo2026" ? "mot de passe par défaut, à changer" : "personnalisé"
);

add(
  env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 && !env.SESSION_SECRET.startsWith("change-me")
    ? "ok"
    : "error",
  "SESSION_SECRET",
  `${(env.SESSION_SECRET || "").length} caractères`
);

add(
  String(env.APP_URL || "").startsWith("https://") ? "ok" : "warn",
  "APP_URL",
  env.APP_URL || "non défini"
);

if (env.ORANGE_MODE === "live") {
  const ready = Boolean(env.ORANGE_CLIENT_ID && env.ORANGE_CLIENT_SECRET && env.ORANGE_MERCHANT_KEY);
  add(ready ? "ok" : "error", "Orange Money live", ready ? "clés présentes" : "clés manquantes");
} else {
  add(env.ORANGE_MODE === "mock" ? "warn" : "ok", "Orange Money", `mode ${env.ORANGE_MODE || "off"}`);
}

add(
  env.SITE_WHATSAPP && env.SITE_WHATSAPP !== "22600000000" ? "ok" : "warn",
  "WhatsApp",
  env.SITE_WHATSAPP || "non défini"
);

const buildId = path.join(root, ".next", "BUILD_ID");
add(fs.existsSync(buildId) ? "ok" : "error", "Build de production", fs.existsSync(buildId) ? "présent" : "lancer npm run build");

const uploads = path.join(root, "public", "uploads", "products");
const images = fs.existsSync(uploads) ? fs.readdirSync(uploads).filter((f) => f.endsWith(".webp")).length : 0;
add(images > 0 ? "ok" : "error", "Images produits", `${images} fichiers`);

const db = new PrismaClient();
const [products, stocks] = await Promise.all([db.product.count(), db.stock.aggregate({ _sum: { qty: true } })]);
await db.$disconnect();
add(products > 0 ? "ok" : "error", "Catalogue", `${products} produits`);
add((stocks._sum.qty || 0) > 0 ? "ok" : "warn", "Stock", `${stocks._sum.qty || 0} unités`);

for (const c of checks) {
  const icon = c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "✗";
  console.log(`${icon} ${c.label.padEnd(20)} ${c.detail}`);
}

const errors = checks.filter((c) => c.level === "error").length;
console.log(`\n${errors} erreur(s), ${checks.filter((c) => c.level === "warn").length} avertissement(s).`);
process.exit(errors ? 1 : 0);
