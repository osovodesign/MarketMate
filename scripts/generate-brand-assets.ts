import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// SVG Definitions for Light and Dark modes
export const getLogoSvg = (variant: 'light' | 'dark', size = 512): string => {
  const isDark = variant === 'dark';
  const bgColor = isDark ? '#07203B' : '#FFFFFF';
  const barColor = isDark ? '#FFFFFF' : '#07203B';
  const greenStroke = 'url(#mmGreenGrad)';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="mmGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2ecc71" />
      <stop offset="100%" stop-color="#1db954" />
    </linearGradient>
    <linearGradient id="mmBgDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07203B" />
      <stop offset="100%" stop-color="#05172C" />
    </linearGradient>
  </defs>

  <!-- Squircle Container -->
  <rect width="512" height="512" rx="105" fill="${isDark ? 'url(#mmBgDarkGrad)' : '#FFFFFF'}" />

  <!-- Shopping Bag Handle Arch -->
  <path
    d="M 205 195 C 205 110, 307 110, 307 195"
    fill="none"
    stroke="${greenStroke}"
    stroke-width="26"
    stroke-linecap="round"
  />

  <!-- Shopping Bag Outer Body (Left Shoulder to Bottom-Left) -->
  <path
    d="M 205 185 L 160 185 C 140 185, 126 198, 122 218 L 100 375 C 96 398, 112 412, 130 405 L 140 398"
    fill="none"
    stroke="${greenStroke}"
    stroke-width="26"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Shopping Bag Outer Body (Right Shoulder) -->
  <path
    d="M 307 185 L 345 185 C 368 185, 382 198, 385 215"
    fill="none"
    stroke="${greenStroke}"
    stroke-width="26"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- 4 Financial Bar Chart Columns -->
  <rect x="162" y="388" width="42" height="48" rx="12" fill="${barColor}" />
  <rect x="222" y="350" width="42" height="86" rx="12" fill="${barColor}" />
  <rect x="282" y="350" width="42" height="86" rx="12" fill="${barColor}" />
  <rect x="343" y="280" width="42" height="156" rx="12" fill="${barColor}" />

  <!-- Upward Growth Trendline -->
  <path
    d="M 115 390 L 246 276 L 290 326 L 388 238"
    fill="none"
    stroke="${greenStroke}"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Growth Arrowhead -->
  <path
    d="M 358 228 L 408 214 L 396 264 Z"
    fill="${greenStroke}"
    stroke="${greenStroke}"
    stroke-width="8"
    stroke-linejoin="round"
  />
</svg>`;
};

// Generate assets
async function generateBrandAssets() {
  const publicDir = path.join(process.cwd(), 'public');
  
  const lightSvg = getLogoSvg('light');
  const darkSvg = getLogoSvg('dark');

  fs.writeFileSync(path.join(publicDir, 'logo-light.svg'), lightSvg, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'logo-dark.svg'), darkSvg, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), lightSvg, 'utf-8');

  console.log('SVGs written successfully. Generating high-res PNGs...');

  // Generate PNGs using sharp
  const lightBuffer = Buffer.from(lightSvg);
  const darkBuffer = Buffer.from(darkSvg);

  // 1. PWA 192x192
  await sharp(lightBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 2. PWA 512x512
  await sharp(lightBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Apple Touch Icon 180x180
  await sharp(lightBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. PWA Maskable 512x512 (with 10% safe area padding on 512 canvas)
  const innerSize = Math.round(512 * 0.82);
  const innerPadded = await sharp(lightBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#FFFFFF',
    },
  })
    .composite([{ input: innerPadded, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 5. Favicon 48x48 PNG (saved as favicon.ico compatible)
  await sharp(lightBuffer)
    .resize(48, 48)
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('All brand assets successfully generated!');
}

generateBrandAssets().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
