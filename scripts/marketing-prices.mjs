/**
 * Gestion du prix barré marketing.
 *
 *   node scripts/marketing-prices.mjs --apply                 (initialise : conserve les prix barrés actuels)
 *   node scripts/marketing-prices.mjs --percent 25 --badge on --apply
 *   node scripts/marketing-prices.mjs --off --apply           (masque tous les prix barrés)
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const off = args.includes("--off");
const get = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const percent = get("--percent") ? Number(get("--percent")) : null;
const fixed = get("--fixed") ? Number(get("--fixed")) : null;
const badge = get("--badge") !== "off";
const show = !off && get("--show") !== "off";

const products = await db.product.findMany();
let changed = 0;

for (const p of products) {
  let data = null;

  if (off) {
    data = { oldPrice: null, oldPriceMode: "none", oldPriceValue: 0, showOldPrice: false, showDiscountBadge: false };
  } else if (percent != null) {
    const old = Math.round((p.price * (1 + percent / 100)) / 500) * 500;
    data = { oldPrice: old > p.price ? old : null, oldPriceMode: "percent", oldPriceValue: percent, showOldPrice: show, showDiscountBadge: badge };
  } else if (fixed != null) {
    data = { oldPrice: fixed > p.price ? fixed : null, oldPriceMode: "fixed", oldPriceValue: fixed, showOldPrice: show, showDiscountBadge: badge };
  } else {
    // initialisation : on conserve le prix barré existant
    const has = (p.oldPrice ?? 0) > p.price;
    data = {
      oldPrice: has ? p.oldPrice : null,
      oldPriceMode: has ? "fixed" : "none",
      oldPriceValue: has ? p.oldPrice ?? 0 : 0,
      showOldPrice: has,
      showDiscountBadge: has ? true : false,
    };
  }

  if (apply) await db.product.update({ where: { id: p.id }, data });
  changed++;
}

console.log(`Mode : ${off ? "aucun prix barré" : percent != null ? `+${percent} %` : fixed != null ? `fixe ${fixed} F` : "conserver l'existant"}`);
console.log(`${changed} produits ${apply ? "mis à jour" : "analysés (simulation)"}`);
if (!apply) console.log("Relancez avec --apply.");
await db.$disconnect();
