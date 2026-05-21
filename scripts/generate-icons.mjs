/**
 * One-shot: render the SVG icons in /public into the PNG variants the PWA
 * manifest references. Re-run any time the SVG changes.
 *
 *   pnpm exec node scripts/generate-icons.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

async function render(srcSvg, outPng, size, background) {
  const svg = await readFile(join(PUBLIC, srcSvg));
  const pipeline = sharp(svg).resize(size, size, { fit: 'contain' });
  if (background) pipeline.flatten({ background });
  const buf = await pipeline.png().toBuffer();
  await writeFile(join(PUBLIC, outPng), buf);
  console.log(`✓ ${outPng} (${size}×${size})`);
}

await render('icon.svg', 'icon-192.png', 192, '#FFFFFF');
await render('icon.svg', 'icon-512.png', 512, '#FFFFFF');
await render('icon-maskable.svg', 'icon-maskable-512.png', 512);
await render('icon.svg', 'apple-touch-icon.png', 180, '#FFFFFF');
await render('icon.svg', 'favicon-32.png', 32, '#FFFFFF');
