import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const db = new PrismaClient();

const DEFAULT = "/brand/category-default.svg";
const categories = await db.category.findMany({
  select: { id: true, name: true, image: true, parentId: true, slug: true },
});
const byId = new Map(categories.map((c) => [c.id, c]));

function rootImage(cat) {
  let current = cat;
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.image) return current.image;
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return DEFAULT;
}

let updated = 0;
for (const cat of categories) {
  if (cat.image) continue;
  const image = rootImage(cat);
  await db.category.update({ where: { id: cat.id }, data: { image } });
  updated++;
}

const withImage = await db.category.count({ where: { image: { not: "" } } });
console.log(`${updated} catégories illustrées · ${withImage}/${categories.length} avec image`);

if (!fs.existsSync("public/brand/category-default.svg")) {
  console.log("visuel par défaut manquant : public/brand/category-default.svg");
}

await db.$disconnect();
