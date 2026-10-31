/**
 * Ouvre un lien public HTTPS temporaire vers la boutique locale.
 * Usage : node scripts/tunnel.mjs
 * Prérequis : tools/cloudflared.exe (node scripts/download-cloudflared.mjs)
 *
 * Attention : le lien ne vit que tant que ce processus tourne.
 * Pour une mise en ligne permanente, voir deploy/README.md.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const bin = path.join(root, "tools", process.platform === "win32" ? "cloudflared.exe" : "cloudflared");
if (!fs.existsSync(bin)) {
  console.error("cloudflared introuvable. Lancez : node scripts/download-cloudflared.mjs");
  process.exit(1);
}

const target = process.env.TUNNEL_TARGET || "http://localhost:3000";
const child = spawn(bin, ["tunnel", "--url", target, "--no-autoupdate"], {
  stdio: ["ignore", "pipe", "pipe"],
});

let found = false;
const onData = (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (match && !found) {
    found = true;
    console.log(`\n=== URL publique : ${match[0]} ===`);
    console.log("Pensez à mettre APP_URL à cette valeur puis à redémarrer l'application.\n");
  }
};

child.stdout.on("data", onData);
child.stderr.on("data", onData);
child.on("exit", (code) => process.exit(code ?? 0));
