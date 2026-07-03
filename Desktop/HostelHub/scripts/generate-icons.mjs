/**
 * One-shot icon generator. Reads public/icons/icon.svg and writes
 * 192x192, 512x512, and 512x512-maskable PNGs to public/icons/.
 *
 * Run: node scripts/generate-icons.mjs
 * Requires: sharp (devDep, installed automatically by npm install)
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'public/icons/icon.svg');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

// Maskable needs ~20% safe-zone padding on each side; the master SVG has the
// glyph already centered, so we just enlarge it slightly inside a flat bg.
const MASKABLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4F46E5"/>
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">
    ${svgBuffer.toString().replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}
  </g>
</svg>`;

async function render(input, size, file) {
  await sharp(input)
    .resize(size, size, { fit: 'contain', background: '#4F46E5' })
    .png({ compressionLevel: 9 })
    .toFile(resolve(outDir, file));
  console.log(`  ✓ ${file} (${size}x${size})`);
}

console.log('Generating PWA icons…');
await render(svgBuffer, 192, 'icon-192.png');
await render(svgBuffer, 512, 'icon-512.png');
await render(Buffer.from(MASKABLE_SVG), 512, 'icon-512-maskable.png');
console.log('Done.');
