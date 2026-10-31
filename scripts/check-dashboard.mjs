import fs from "node:fs";
import crypto from "node:crypto";

const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const payload = `admin:${Date.now() + 86400000}`;
const token = `${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

const res = await fetch("http://localhost:3000/admin", { headers: { cookie: `bingo_admin=${token}` } });
const html = await res.text();
console.log("status", res.status);
for (const marker of ["Ventes par pays", "Meilleures ventes", "CA 30 derniers jours", "Stock total"]) {
  console.log(marker, html.includes(marker));
}
