import fs from "node:fs";
import path from "node:path";

const url =
  "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe";
const dir = path.join(process.cwd(), "tools");
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, "cloudflared.exe");

console.log("Téléchargement de cloudflared…");
const res = await fetch(url, { redirect: "follow" });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(out, buf);
console.log(`OK ${(buf.length / 1024 / 1024).toFixed(1)} Mo -> ${out}`);
