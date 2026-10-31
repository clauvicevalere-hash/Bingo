import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const res = path.join(root, "android", "app", "src", "main", "res");
const svg = fs.readFileSync(path.join(root, "public", "icons", "icon.svg"));

const densities = {
  mdpi: { launcher: 48, foreground: 108 },
  hdpi: { launcher: 72, foreground: 162 },
  xhdpi: { launcher: 96, foreground: 216 },
  xxhdpi: { launcher: 144, foreground: 324 },
  xxxhdpi: { launcher: 192, foreground: 432 },
};

for (const [density, sizes] of Object.entries(densities)) {
  const dir = path.join(res, `mipmap-${density}`);

  const launcher = await sharp(svg).resize(sizes.launcher, sizes.launcher).png().toBuffer();
  fs.writeFileSync(path.join(dir, "ic_launcher.png"), launcher);
  fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), launcher);

  const inner = Math.round(sizes.foreground * 0.6);
  const logo = await sharp(svg).resize(inner, inner).png().toBuffer();
  const foreground = await sharp({
    create: { width: sizes.foreground, height: sizes.foreground, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), foreground);

  console.log(`mipmap-${density} ok`);
}

// fond adaptatif orange
fs.writeFileSync(
  path.join(res, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#F26A1B</color>\n</resources>\n`
);

// splashes : fond orange + logo centré, mêmes dimensions que l'existant
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
  const inner = Math.round(Math.min(width, height) * 0.32);
  const logo = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({
    create: { width, height, channels: 4, background: "#F26A1B" },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(file);
}

console.log("splashes ok");
