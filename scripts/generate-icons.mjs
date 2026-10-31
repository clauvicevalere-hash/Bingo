import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svg = fs.readFileSync(path.join(root, "public", "icons", "icon.svg"));

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(path.join(root, "public", "icons", `icon-${size}.png`));
  console.log(`icon-${size}.png`);
}

// maskable : marge de sécurité de 20 %
const inner = Math.round(512 * 0.72);
const logo = await sharp(svg).resize(inner, inner).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#f26a1b" },
})
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(path.join(root, "public", "icons", "maskable-512.png"));
console.log("maskable-512.png");
