/**
 * Crée prisma/seed.db : copie cohérente de la base locale, livrée dans l'image Docker
 * pour que Render démarre avec le catalogue complet (images et catégories incluses).
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const source = path.join(root, "prisma", "dev.db");
const target = path.join(root, "prisma", "seed.db");

if (!fs.existsSync(source)) {
  console.error("Base locale introuvable :", source);
  process.exit(1);
}
if (fs.existsSync(target)) fs.rmSync(target);

const db = new DatabaseSync(source);
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);

const check = new DatabaseSync(target, { readOnly: true });
const count = (table) => check.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).get().c;
console.log("seed.db créé");
console.log("produits:", count("Product"));
console.log("images:", count("ProductImage"));
console.log("catégories:", count("Category"));
console.log("catégories avec image:", check.prepare("SELECT COUNT(*) AS c FROM Category WHERE image != ''").get().c);
console.log("stocks:", count("Stock"));
console.log("commandes:", count("Order"));
console.log("avis:", count("Review"));
check.close();
db.close();
console.log("taille:", (fs.statSync(target).size / 1024 / 1024).toFixed(1), "Mo");
