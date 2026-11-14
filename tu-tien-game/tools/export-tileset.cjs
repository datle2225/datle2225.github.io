/* Xuất src/data/maps/tileset.png từ các texture trong game (để mở map trong Tiled thấy đúng ô).
   Cách dùng: npm run build && npx vite preview --port 4173 &  rồi  node tools/export-tileset.cjs
   Cần Playwright (đã cài sẵn trong môi trường dev của repo). */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../src/core/tileset.ts'), 'utf8');
const keys = [...src.matchAll(/tex: '([a-z0-9_]+)'/g)].map((m) => m[1]);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(process.env.URL || 'http://localhost:4173/');
  await page.waitForTimeout(1500);
  const url = await page.evaluate((ks) => {
    const g = window.__phaser;
    const rows = Math.ceil(ks.length / 8);
    const c = document.createElement('canvas');
    c.width = 128; c.height = rows * 16;
    const x = c.getContext('2d');
    ks.forEach((k, i) => x.drawImage(g.textures.get(k).getSourceImage(), (i % 8) * 16, Math.floor(i / 8) * 16));
    return c.toDataURL('image/png');
  }, keys);
  fs.writeFileSync(path.join(__dirname, '../src/data/maps/tileset.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log(`tileset.png: ${keys.length} ô`);
  await browser.close();
})();
