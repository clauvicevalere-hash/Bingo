import fs from "node:fs";
import crypto from "node:crypto";

const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const base = process.env.BASE_URL || "http://localhost:3000";
const payload = `admin:${Date.now() + 86400000}`;
const token = `${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

const headers = { cookie: `bingo_admin=${token}` };
for (const path of ["/admin", "/admin/produits", "/admin/produits/1", "/admin/categories", "/admin/commandes", "/admin/stocks"]) {
  const res = await fetch(base + path, { headers });
  const html = await res.text();
  console.log(path, res.status, html.includes("Options / variantes") ? "variants" : "", html.includes("Ajouter une image") ? "images" : "");
}
