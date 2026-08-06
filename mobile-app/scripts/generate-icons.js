/**
 * Generates FinanceFlow launcher assets:
 * dark canvas + yellow rounded mark with black "f" + yellow "FinanceFlow" wordmark.
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT_DIR = process.argv[2] || path.join(__dirname, "..", "assets");

const CANVAS = "#0b0e11";
const YELLOW = "#fcd535";
const ON_YELLOW = "#181a20";
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Brand "f" path from web icon.svg / Logo.tsx (viewBox 0 0 32 32). */
const F_PATH =
  "M20.5 9.5H14.9c-1.55 0-2.8 1.26-2.8 2.8V14h-1.9v3h1.9v6.5h3.1V17h3.2v-3h-3.2v-1.2c0-.44.36-.8.8-.8h4.5v-2.5Z";

/**
 * Full launcher icon: yellow square + f centered, FinanceFlow in yellow at bottom.
 */
function iconSvg(size = 1024) {
  const mark = Math.round(size * 0.48);
  const markX = Math.round((size - mark) / 2);
  const markY = Math.round(size * 0.18);
  const rx = Math.round(mark * (7 / 32));
  const scale = mark / 32;
  const textY = Math.round(size * 0.88);
  const fontSize = Math.round(size * 0.078);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${CANVAS}"/>
  <g transform="translate(${markX} ${markY})">
    <rect width="${mark}" height="${mark}" rx="${rx}" fill="${YELLOW}"/>
    <g transform="scale(${scale})">
      <path d="${F_PATH}" fill="${ON_YELLOW}"/>
    </g>
  </g>
  <text
    x="${size / 2}"
    y="${textY}"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${YELLOW}"
  >FinanceFlow</text>
</svg>`;
}

/**
 * Adaptive / splash: yellow mark + f only (safe for circular Android masks).
 * Optional small wordmark kept inside ~66% safe zone when includeWordmark.
 */
function markSvg(size = 1024, { includeWordmark = false } = {}) {
  const mark = includeWordmark ? Math.round(size * 0.42) : Math.round(size * 0.56);
  const markX = Math.round((size - mark) / 2);
  const markY = includeWordmark ? Math.round(size * 0.22) : Math.round((size - mark) / 2);
  const rx = Math.round(mark * (7 / 32));
  const scale = mark / 32;
  const fontSize = Math.round(size * 0.055);
  const textY = Math.round(size * 0.78);

  const wordmark = includeWordmark
    ? `<text x="${size / 2}" y="${textY}" text-anchor="middle"
         font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
         font-weight="700" fill="${YELLOW}">FinanceFlow</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${markX} ${markY})">
    <rect width="${mark}" height="${mark}" rx="${rx}" fill="${YELLOW}"/>
    <g transform="scale(${scale})">
      <path d="${F_PATH}" fill="${ON_YELLOW}"/>
    </g>
  </g>
  ${wordmark}
</svg>`;
}

async function rasterize(svg, outPath) {
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. icon.png — full launcher (dark + yellow f + FinanceFlow)
  await rasterize(iconSvg(1024), path.join(OUT_DIR, "icon.png"));

  // 2. adaptive-icon.png — foreground on transparent; wordmark in safe zone
  const adaptiveFg = await sharp(Buffer.from(markSvg(1024, { includeWordmark: true })))
    .ensureAlpha()
    .png()
    .toBuffer();
  // Transparent canvas so Android adaptive backgroundColor shows around edges
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: adaptiveFg, left: 0, top: 0 }])
    .png()
    .toFile(path.join(OUT_DIR, "adaptive-icon.png"));

  // 3. splash-icon.png — mark + wordmark for splash
  await rasterize(markSvg(1024, { includeWordmark: true }), path.join(OUT_DIR, "splash-icon.png"));

  // 4. favicon — compact mark only
  await rasterize(markSvg(196, { includeWordmark: false }), path.join(OUT_DIR, "favicon.png"));

  console.log("Generated yellow FinanceFlow icon set →", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
