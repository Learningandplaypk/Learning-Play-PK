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

// Owl mascot: rounded-square gradient bg + geometric owl (eyes, beak, tufts)
const svg = (pad = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#05060F"/>
      <stop offset="0.55" stop-color="#0B0D1C"/>
      <stop offset="1" stop-color="#182350"/>
    </linearGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#39FF14"/>
      <stop offset="0.5" stop-color="#2D7CFF"/>
      <stop offset="1" stop-color="#B026FF"/>
    </linearGradient>
  </defs>
  <rect x="${pad * 4}" y="${pad * 4}" width="${512 - pad * 8}" height="${512 - pad * 8}" rx="${pad ? 512 : 110}" fill="url(#g)"/>
  <circle cx="256" cy="250" r="150" fill="url(#acc)" opacity="0.16"/>
  <!-- tufts -->
  <path d="M150 150 L185 205 L135 205 Z" fill="#FF7A00"/>
  <path d="M362 150 L327 205 L377 205 Z" fill="#FF2E97"/>
  <!-- body -->
  <ellipse cx="256" cy="268" rx="128" ry="140" fill="url(#acc)" opacity="0.22"/>
  <ellipse cx="256" cy="268" rx="118" ry="130" fill="none" stroke="url(#acc)" stroke-width="10"/>
  <!-- eyes -->
  <circle cx="204" cy="238" r="52" fill="#F4F6FF"/>
  <circle cx="308" cy="238" r="52" fill="#F4F6FF"/>
  <circle cx="212" cy="246" r="26" fill="#05060F"/>
  <circle cx="300" cy="246" r="26" fill="#05060F"/>
  <circle cx="220" cy="238" r="8" fill="#39FF14"/>
  <circle cx="308" cy="238" r="8" fill="#39FF14"/>
  <!-- beak -->
  <path d="M256 280 L232 316 L280 316 Z" fill="#FF7A00"/>
  <!-- feet -->
  <path d="M216 396 L236 396 M226 396 L226 384 M316 396 L296 396 M306 396 L306 384" stroke="#FF7A00" stroke-width="10" stroke-linecap="round"/>
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
