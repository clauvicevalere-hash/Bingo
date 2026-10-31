import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const base = "http://localhost:3000";
const env = fs.readFileSync(".env", "utf8");
const secret = (env.match(/SESSION_SECRET="([^"]+)"/) || [])[1];
const payload = `admin:${Date.now() + 86400000}`;
const cookie = `te_admin=${Buffer.from(payload).toString("base64url")}.${crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("base64url")}`;

const contact = await fetch(base + "/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test Client",
    phone: "+22670000000",
    email: "test@example.com",
    message: "Bonjour, je voudrais des informations sur l'Infinix Smart 20.",
  }),
});
console.log("contact:", contact.status, await contact.json());

const track = await fetch(base + "/api/track", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "page_view", path: "/", session: "test-session" }),
});
console.log("track:", track.status);

const filtered = await fetch(base + "/catalogue?min=200000&max=300000&tri=prix-asc").then((r) => r.text());
console.log("filtre prix:", filtered.includes("prix minimum"), "| résultats:", /Aucun produit/.test(filtered) ? "0" : "oui");

const stats = await fetch(base + "/admin/statistiques", { headers: { cookie } }).then((r) => r.text());
console.log("admin stats:", stats.includes("Visites"), "| visiteurs:", stats.includes("Visiteurs uniques"));

const messages = await fetch(base + "/admin/messages", { headers: { cookie } }).then((r) => r.text());
console.log("admin messages:", messages.includes("Test Client"));

const backup = await fetch(base + "/api/admin/backup", { headers: { cookie } });
console.log("backup:", backup.status, backup.headers.get("content-type"), "octets:", (await backup.arrayBuffer()).byteLength);

const contactRow = await db.contactMessage.findFirst({ where: { name: "Test Client" } });
const notif = await db.notification.findFirst({ where: { type: "contact" } });
console.log("db message:", Boolean(contactRow), "| notification:", Boolean(notif));
if (contactRow) await db.contactMessage.delete({ where: { id: contactRow.id } });
if (notif) await db.notification.delete({ where: { id: notif.id } });
await db.event.deleteMany({ where: { session: "test-session" } });

await db.$disconnect();
