import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const products = await db.product.findMany({
  include: { images: true, category: { include: { parent: true } } },
});
const noImage = products.filter((p) => p.images.length === 0);
const shortDesc = products.filter((p) => (p.description || "").length < 80);
const english = products.filter((p) => /\b(the|with|and|for|this|from|screen|battery|camera)\b/i.test(p.description || ""));
const categories = await db.category.findMany({ include: { _count: { select: { products: true } } } });
const catNoImage = categories.filter((c) => !c.image);
const emptyCats = categories.filter((c) => c._count.products === 0);
const orders = await db.order.count();
const reviews = await db.review.count();
const variants = await db.variant.count();
const noStock = products.filter((p) => p.stocks ? false : false);

console.log("produits:", products.length, "| sans image:", noImage.length, "| description <80:", shortDesc.length, "| description anglaise:", english.length);
console.log("catégories:", categories.length, "| sans image:", catNoImage.length, "| sans produit:", emptyCats.length);
console.log("variantes:", variants, "| commandes:", orders, "| avis:", reviews);
console.log("exemples sans image:", noImage.slice(0, 6).map((p) => p.name).join(" ; "));
console.log("exemples anglais:", english.slice(0, 3).map((p) => p.name).join(" ; "));
console.log("catégories vides:", emptyCats.slice(0, 8).map((c) => c.name).join(" ; "));
await db.$disconnect();
