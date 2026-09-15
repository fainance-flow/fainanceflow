// Regenerates PWA icon PNGs from src/app/icon.svg — Chrome's install/A2HS
// criteria expect real raster sizes ("192x192"/"512x512"), not an SVG with
// sizes:"any", so relying on the SVG alone can silently fail installability
// with no visible error. Run: node scripts/generate-pwa-icons.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "src/app/icon.svg");
const iconsDir = join(root, "public/icons");

mkdirSync(iconsDir, { recursive: true });

const svg = readFileSync(svgPath);

async function render(size, outPath) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(outPath);
  console.log("wrote", outPath);
}

await render(192, join(iconsDir, "icon-192.png"));
await render(512, join(iconsDir, "icon-512.png"));
// The source art is already a full-bleed rounded-square background with a
// centered glyph well inside the safe zone, so it doubles as its own
// maskable variant without extra padding/compositing.
await render(192, join(iconsDir, "icon-maskable-192.png"));
await render(512, join(iconsDir, "icon-maskable-512.png"));
await render(180, join(root, "src/app/apple-icon.png"));

console.log("Done.");
