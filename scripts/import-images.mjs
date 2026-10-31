/**
 * Téléchargement parallèle des images produits (reprend là où l'import s'est arrêté).
 * Usage : node scripts/import-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();
const ROOT = process.cwd();
const DATA = path.join(ROOT, "analyse", "data");
const DIR = path.join(ROOT, "public", "uploads", "products");
const REMOTE = "https://backend.mustaqbalzamzam.com/storage/app/public";
const CONCURRENCY = 16;
const MAX_PER_PRODUCT = 2;

fs.mkdirSync(DIR, { recursive: true });

const json = JSON.parse(fs.readFileSync(path.join(DATA, "products_all.json"), "utf8"));
const products = json.data.data;

const dbProducts = await prisma.product.findMany({ select: { id: true, sku: true } });
const bySku = new Map(dbProducts.map((p) => [p.sku, p.id]));

const existing = await prisma.productImage.findMany({ select: { productId: true, url: true } });
const existingSet = new Set(existing.map((e) => `${e.productId}:${e.url}`));

const jobs = [];
for (const p of products) {
  const productId = bySku.get(p.product_id);
  if (!productId) continue;
  const paths = [...new Set((p.product_images || []).map((i) => i.path))].slice(0, MAX_PER_PRODUCT);
  paths.forEach((imgPath, idx) => {
    const filename = `${productId}-${idx}.webp`;
    const url = `/uploads/products/${filename}`;
    if (existingSet.has(`${productId}:${url}`)) return;
    jobs.push({ productId, imgPath, filename, url, idx });
  });
}

console.log(`${jobs.length} images à télécharger.`);

let done = 0;
let failed = 0;

async function worker() {
  while (jobs.length) {
    const job = jobs.shift();
    const out = path.join(DIR, job.filename);
    try {
      if (!fs.existsSync(out)) {
        const res = await fetch(REMOTE + job.imgPath, {
          headers: { "User-Agent": "BingoImporter/1.0" },
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await sharp(buf)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(out);
      }
      await prisma.productImage.create({
        data: { productId: job.productId, url: job.url, sort: job.idx },
      });
      done += 1;
    } catch (e) {
      failed += 1;
    }
    if ((done + failed) % 100 === 0) {
      console.log(`${done + failed}/${jobs.length + done + failed} (ok ${done}, échecs ${failed})`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`Terminé : ${done} images, ${failed} échecs.`);
await prisma.$disconnect();
