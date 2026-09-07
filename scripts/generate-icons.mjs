// Icon generator — rasterizes a branded SVG into all PWA icon sizes.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "fs/promises";

const sizes = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-192.png", 192],
  ["icon-maskable-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["icon-32.png", 32],
  ["icon-16.png", 16],
];

// "Ustad" owl on Pakistan Green — flat, two-tone, matches the app mark.
const svg = (pad = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="${pad * 4}" y="${pad * 4}" width="${512 - pad * 8}" height="${512 - pad * 8}" rx="${pad ? 512 : 112}" fill="#178A55"/>
  <!-- ear tufts -->
  <path d="M150 118 L120 196 L206 172 Z" fill="#0E5C3B"/>
  <path d="M362 118 L392 196 L306 172 Z" fill="#0E5C3B"/>
  <!-- body -->
  <path d="M256 108c84 0 138 58 138 138 0 116-62 198-138 198s-138-82-138-198C118 166 172 108 256 108z" fill="#178A55"/>
  <!-- wings -->
  <path d="M138 250c-22 46-16 106 22 142 16-54 12-104-22-142z" fill="#0E5C3B"/>
  <path d="M374 250c22 46 16 106-22 142-16-54-12-104 22-142z" fill="#0E5C3B"/>
  <!-- belly -->
  <ellipse cx="256" cy="332" rx="80" ry="92" fill="#FDF6E9"/>
  <!-- face disc -->
  <ellipse cx="256" cy="222" rx="104" ry="88" fill="#FDF6E9"/>
  <!-- eyes -->
  <circle cx="208" cy="214" r="40" fill="#FFFFFF"/>
  <circle cx="304" cy="214" r="40" fill="#FFFFFF"/>
  <circle cx="212" cy="218" r="18" fill="#1C1C1A"/>
  <circle cx="300" cy="218" r="18" fill="#1C1C1A"/>
  <circle cx="218" cy="212" r="6" fill="#FFFFFF"/>
  <circle cx="306" cy="212" r="6" fill="#FFFFFF"/>
  <!-- beak -->
  <path d="M256 244 L228 296 L284 296 Z" fill="#F5A524"/>
  <!-- feet -->
  <path d="M212 424 L186 466 L212 476 L226 444 Z" fill="#F5A524"/>
  <path d="M300 424 L326 466 L300 476 L286 444 Z" fill="#F5A524"/>
</svg>`;

await mkdir("public", { recursive: true });
for (const [file, size] of sizes) {
  const maskable = file.includes("maskable");
  await sharp(Buffer.from(svg(maskable ? 18 : 0)))
    .resize(size, size)
    .png()
    .toFile(`public/${file}`);
  console.log("✓", file, size);
}
