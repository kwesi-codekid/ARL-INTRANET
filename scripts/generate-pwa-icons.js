/**
 * PWA Icon Generator Script
 *
 * This script generates PWA icons from a source image.
 * Run: npm install sharp --save-dev
 * Then: node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const sourceImage = join(rootDir, 'public/images/logo-icon.png');
const outputDir = join(rootDir, 'public/icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating PWA icons from:', sourceImage);

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);

    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 26, g: 26, b: 26, alpha: 1 } // #1a1a1a
      })
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  console.log('Done! Icons generated in public/icons/');
}

generateIcons().catch(console.error);
