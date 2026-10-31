/**
 * Import du catalogue Mustaqbal Zamzam vers la base Bingo.
 * Usage : node scripts/import-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();
const ROOT = process.cwd();
const DATA = path.join(ROOT, "analyse", "data");
const UPLOADS = path.join(ROOT, "public", "uploads");
const PRODUCTS_DIR = path.join(UPLOADS, "products");
const CATEGORIES_DIR = path.join(UPLOADS, "categories");
const REMOTE = "https://backend.mustaqbalzamzam.com/storage/app/public";
const SKIP_IMAGES = process.env.SKIP_IMAGES === "1";

const RATE = Number(process.env.PRICE_RATE || 165);
const MARGIN = Number(process.env.PRICE_MARGIN || 1.3);

const COUNTRIES = [
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫", sort: 1 },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱", sort: 2 },
  { code: "NE", name: "Niger", dialCode: "+227", flag: "🇳🇪", sort: 3 },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮", sort: 4 },
];

const CITIES = {
  BF: [
    ["Ouagadougou", 1500],
    ["Bobo-Dioulasso", 2500],
    ["Koudougou", 2500],
    ["Ouahigouya", 3000],
    ["Banfora", 3000],
    ["Fada N'Gourma", 3000],
  ],
  ML: [
    ["Bamako", 1500],
    ["Ségou", 2500],
    ["Sikasso", 3000],
    ["Mopti", 3500],
    ["Kayes", 3500],
    ["Gao", 4500],
  ],
  NE: [
    ["Niamey", 1500],
    ["Maradi", 3000],
    ["Zinder", 3500],
    ["Tahoua", 3000],
    ["Agadez", 5000],
    ["Dosso", 2500],
  ],
  CI: [
    ["Abidjan", 1500],
    ["Bouaké", 2500],
    ["Yamoussoukro", 2500],
    ["San-Pédro", 3000],
    ["Korhogo", 3500],
    ["Daloa", 3000],
  ],
};

const STOCK = {
  BF: 8,
  ML: 5,
  NE: 4,
  CI: 5,
};

const ICONS = {
  "new-mobile": "📱",
  "used-mobile": "📲",
  watches: "⌚",
  laptop: "💻",
  tablet: "📟",
  ipad: "📱",
  gadget: "🎧",
  accessories: "🔌",
  "fashion-beauty": "💄",
  bags: "👜",
  "apple-imac": "🖥️",
  "crystal-whale-lamp": "🐋",
  "lucky-box": "🎁",
  "combo-offer": "📦",
};

function slugify(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 70);
}

function toXof(aed) {
  const n = Number(aed);
  if (!n || n <= 0) return 0;
  return Math.max(500, Math.round((n * RATE * MARGIN) / 500) * 500);
}

async function downloadImage(url, outPath) {
  if (fs.existsSync(outPath)) return true;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "BingoImporter/1.0" } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return false;
    fs.writeFileSync(outPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function saveProductImage(url, outPath) {
  if (fs.existsSync(outPath)) return true;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "BingoImporter/1.0" } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf)
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);
    return true;
  } catch {
    return false;
  }
}

async function pool(items, size, fn) {
  const queue = [...items];
  const workers = Array.from({ length: size }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await fn(item);
    }
  });
  await Promise.all(workers);
}

async function main() {
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

  const productsJson = JSON.parse(fs.readFileSync(path.join(DATA, "products_all.json"), "utf8"));
  const groupsJson = JSON.parse(fs.readFileSync(path.join(DATA, "groups.json"), "utf8"));
  const categoriesJson = JSON.parse(fs.readFileSync(path.join(DATA, "categories.json"), "utf8"));

  const products = productsJson.data.data;

  // --- pays + villes
  for (const c of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, dialCode: c.dialCode, flag: c.flag, sort: c.sort },
      create: { code: c.code, name: c.name, dialCode: c.dialCode, flag: c.flag, sort: c.sort },
    });
    for (const [name, fee] of CITIES[c.code]) {
      const exists = await prisma.city.findFirst({ where: { countryCode: c.code, name } });
      if (!exists) {
        await prisma.city.create({ data: { countryCode: c.code, name, deliveryFee: fee } });
      }
    }
  }
  console.log("Pays et villes prêts.");

  // --- rayons
  const groupSlug = new Map();
  const groups = groupsJson.data || [];
  for (const [i, g] of groups.entries()) {
    const slug = slugify(g.name);
    let image = "";
    if (!SKIP_IMAGES && g.image) {
      const ext = path.extname(g.image) || ".png";
      const filename = `${slug}${ext}`;
      const ok = await downloadImage(REMOTE + g.image, path.join(CATEGORIES_DIR, filename));
      if (ok) image = `/uploads/categories/${filename}`;
    }
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name: g.name, icon: ICONS[slug] || "📦", image, sort: i },
      create: { slug, name: g.name, icon: ICONS[slug] || "📦", image, sort: i },
    });
    groupSlug.set(g.id, cat);
  }
  console.log(`${groupSlug.size} rayons importés.`);

  // --- sous-catégories
  const categoryMap = new Map();
  const cats = categoriesJson.data || [];
  for (const c of cats) {
    const parent = groupSlug.get(c.item_id) || null;
    const slug = `${slugify(c.name)}-${c.id}`;
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name: c.name, parentId: parent?.id ?? null, sort: c.sl ?? 0 },
      create: { slug, name: c.name, parentId: parent?.id ?? null, sort: c.sl ?? 0 },
    });
    categoryMap.set(c.id, cat);
  }
  console.log(`${categoryMap.size} catégories importées.`);

  // --- marques
  const brandMap = new Map();
  for (const p of products) {
    const b = p.brand;
    if (!b) continue;
    const slug = slugify(b.name);
    if (!slug) continue;
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name: b.name },
      create: { slug, name: b.name },
    });
    brandMap.set(b.id, brand);
  }
  console.log(`${brandMap.size} marques prêtes.`);

  // --- produits
  let done = 0;
  const slugSeen = new Set();

  for (const p of products) {
    const detail = p.product_detail || {};
    let slug = slugify(detail.slug || p.name) || `produit-${p.id}`;
    if (slugSeen.has(slug)) slug = `${slug}-${p.id}`;
    slugSeen.add(slug);

    const aedPrice = Number(detail.sale_price || detail.regular_price || p.sale_price) || 0;
    const aedOld = Number(detail.regular_price || 0);
    const price = toXof(aedPrice);
    const oldPrice = aedOld > aedPrice ? toXof(aedOld) : null;

    const category = categoryMap.get(p.category_id) || groupSlug.get(p.item_id) || null;
    const brand = brandMap.get(p.brand_id) || null;
    const isUsed = /used|occasion/i.test(p.name) || (p.variants || []).some((v) => /used/i.test(JSON.stringify(v.attribute_values || [])));

    const existingProduct = await prisma.product.findUnique({ where: { slug } });

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        sku: p.product_id || "",
        price,
        oldPrice,
        description: detail.description || "",
        specs: detail.specification || "",
        condition: isUsed ? "Occasion" : "Neuf",
        categoryId: category?.id ?? null,
        brandId: brand?.id ?? null,
        views: Number(p.view) || 0,
        active: true,
      },
      create: {
        slug,
        name: p.name,
        sku: p.product_id || "",
        price,
        oldPrice,
        description: detail.description || "",
        specs: detail.specification || "",
        condition: isUsed ? "Occasion" : "Neuf",
        categoryId: category?.id ?? null,
        brandId: brand?.id ?? null,
        views: Number(p.view) || 0,
        active: true,
      },
    });

    // images (max 4, uniques)
    const paths = [...new Set((p.product_images || []).map((i) => i.path))].slice(0, 4);
    if (!SKIP_IMAGES) {
      await Promise.all(
        paths.map(async (imgPath, idx) => {
          const filename = `${product.id}-${idx}.webp`;
          const url = `/uploads/products/${filename}`;
          const ok = await saveProductImage(REMOTE + imgPath, path.join(PRODUCTS_DIR, filename));
          if (!ok) return;
          const existing = await prisma.productImage.findFirst({ where: { productId: product.id, url } });
          if (!existing) {
            await prisma.productImage.create({ data: { productId: product.id, url, sort: idx } });
          }
        })
      );
    }

    // variantes (uniquement à la première importation)
    const variants = p.variants || [];
    const variantRows = [];
    if (!existingProduct) {
      const seenLabels = new Set();
      for (const v of variants) {
        const values = (v.attribute_values || []).map((a) => a.value).filter(Boolean);
        const label = values.join(" / ") || `Option ${v.id}`;
        if (seenLabels.has(label)) continue;
        seenLabels.add(label);
        const vPrice = toXof(v.sale_price || v.regular_price || aedPrice);
        const vOld = Number(v.regular_price) > Number(v.sale_price) ? toXof(v.regular_price) : null;
        const row = await prisma.variant.create({
          data: { productId: product.id, label, sku: v.sku || "", price: vPrice, oldPrice: vOld },
        });
        variantRows.push(row);
      }

      for (const c of COUNTRIES) {
        if (variantRows.length) {
          for (const v of variantRows) {
            await prisma.stock.create({
              data: {
                productId: product.id,
                variantId: v.id,
                countryCode: c.code,
                qty: STOCK[c.code],
              },
            });
          }
        } else {
          await prisma.stock.create({
            data: { productId: product.id, variantId: null, countryCode: c.code, qty: STOCK[c.code] },
          });
        }
      }
    }

    done += 1;
    if (done % 25 === 0) console.log(`${done}/${products.length} produits…`);
  }

  console.log(`Import terminé : ${done} produits.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
