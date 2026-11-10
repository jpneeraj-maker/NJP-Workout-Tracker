import { readdir, stat, writeFile } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function walkPngs(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walkPngs(full, out);
    else if (extname(entry.name).toLowerCase() === ".png") out.push(full);
  }
  return out;
}

function fmt(n) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)}MB`;
  return `${Math.round(n / 1024)}KB`;
}

async function compressFile(file, maxWidth, quality) {
  const before = (await stat(file)).size;
  const buffer = await sharp(file)
    .rotate()
    .resize({
      width: maxWidth,
      withoutEnlargement: true,
    })
    .png({
      quality,
      compressionLevel: 9,
      effort: 10,
    })
    .toBuffer();

  if (buffer.length < before) {
    await writeFile(file, buffer);
    console.log(`${relative(root, file)}: ${fmt(before)} → ${fmt(buffer.length)}`);
  } else {
    console.log(`${relative(root, file)}: skipped (${fmt(before)})`);
  }
}

const imageFiles = await walkPngs(join(root, "src", "Assets", "images"));
const backgrounds = [
  join(root, "src", "landing-bg.png"),
  join(root, "src", "app-background.png"),
];

for (const file of imageFiles) {
  await compressFile(file, 720, 70);
}
for (const file of backgrounds) {
  await compressFile(file, 1400, 75);
}

console.log(`Done. Processed ${imageFiles.length + backgrounds.length} images.`);
