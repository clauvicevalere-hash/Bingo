import fs from "node:fs";
import crypto from "node:crypto";

const base = "http://localhost:3000";
const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const payload = `admin:${Date.now() + 86400000}`;
const cookie = `te_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

const contact = await fetch(base + "/contact").then((r) => r.text());
const product = await fetch(base + "/p/infinix-smart-20").then((r) => r.text());
const admin = await fetch(base + "/admin/parametres", { headers: { cookie } }).then((r) => r.text());

console.log("contact 971:", contact.includes("+971"), "| 226:", contact.includes("+226"));
console.log("wa link:", /wa\.me\/971568934905/.test(product), "| tel:", /tel:\+22676950089/.test(product + contact));
console.log("admin paramètres:", /Paramètres/.test(admin), "| whatsapp:", admin.includes("971"));
