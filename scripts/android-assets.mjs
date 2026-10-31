import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const res = path.join(root, "android", "app", "src", "main", "res");
const logoPath = path.join(root, "public", "brand", "logo.png");

const densities = {
  mdpi: { launcher: 48, foreground: 108 },
  hdpi: { launcher: 72, foreground: 162 },
  xhdpi: { launcher: 96, foreground: 216 },
  xxhdpi: { launcher: 144, foreground: 324 },
  xxxhdpi: { launcher: 192, foreground: 432 },
};

async function canvas(size, ratio, background) {
  const inner = Math.round(size * ratio);
  const logo = await sharp(logoPath).resize(inner, inner, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

for (const [density, sizes] of Object.entries(densities)) {
  const dir = path.join(res, `mipmap-${density}`);

  const launcher = await canvas(sizes.launcher, 0.82, "#ffffff");
  fs.writeFileSync(path.join(dir, "ic_launcher.png"), launcher);
  fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), launcher);

  const foreground = await canvas(sizes.foreground, 0.62, { r: 255, g: 255, b: 255, alpha: 0 });
  fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), foreground);

  console.log(`mipmap-${density} ok`);
}

fs.writeFileSync(
  path.join(res, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n`
);

// Splash : fond blanc + logo centré
const splashDirs = fs
  .readdirSync(res, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("drawable"))
  .map((d) => path.join(res, d.name));

for (const dir of splashDirs) {
  const file = path.join(dir, "splash.png");
  if (!fs.existsSync(file)) continue;
  const meta = await sharp(file).metadata();
  const width = meta.width ?? 480;
  const height = meta.height ?? 800;
  const inner = Math.round(Math.min(width, height) * 0.34);
  const logo = await sharp(logoPath).resize(inner, inner, { fit: "contain" }).png().toBuffer();
  await sharp({
    create: { width, height, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(file);
}

console.log("splashes ok");
