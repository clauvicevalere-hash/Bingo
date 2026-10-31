/**
 * Sauvegarde locale : copie cohérente de la base SQLite + images produits.
 * Usage : node scripts/backup.mjs
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const dbFile = path.join(root, "prisma", "dev.db");
const uploads = path.join(root, "public", "uploads");
const backups = path.join(root, "backups");

if (!fs.existsSync(dbFile)) {
  console.error("Base introuvable :", dbFile);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = path.join(backups, stamp);
await fsp.mkdir(target, { recursive: true });

// VACUUM INTO produit une copie cohérente même si l'app tourne.
const db = new DatabaseSync(dbFile);
const dbOut = path.join(target, "dev.db");
db.exec(`VACUUM INTO '${dbOut.replace(/'/g, "''")}'`);
db.close();

if (fs.existsSync(uploads)) {
  await fsp.cp(uploads, path.join(target, "uploads"), { recursive: true });
}

const size = (await fsp.stat(dbOut)).size;
console.log(`Sauvegarde créée : ${target} (base ${(size / 1024 / 1024).toFixed(1)} Mo)`);

// conservation des 5 dernières
const entries = (await fsp.readdir(backups, { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()
  .reverse();

for (const old of entries.slice(5)) {
  await fsp.rm(path.join(backups, old), { recursive: true, force: true });
  console.log("ancienne sauvegarde supprimée :", old);
}
