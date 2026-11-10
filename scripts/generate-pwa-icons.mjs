import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "public", "favicon.svg");
const svg = readFileSync(svgPath);

async function writePng(size, outName) {
  const out = join(root, "public", outName);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`wrote ${outName} (${size}x${size})`);
}

await writePng(180, "apple-touch-icon.png");
await writePng(192, "icon-192.png");
await writePng(512, "icon-512.png");

// Keep a copy of the generated brand asset reference if present (optional).
writeFileSync(join(root, "public", ".pwa-icons-generated"), new Date().toISOString());
