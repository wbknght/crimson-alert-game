import fs from 'fs';
import path from 'path';
// import { createCanvas } from 'canvas'; // Removed unused import
// Actually, writing raw PNG bytes for a solid color is easier if we don't want to depend on 'canvas' package which might need native deps.
// Let's just use a simple base64 string or a very simple BMP/PNG generator function.

// Minimal PNG encoder for raw pixel data is complex. 
// Let's just use a simple SVG to PNG conversion or just SVGs? 
// PixiJS supports SVGs. Let's use SVGs for placeholders! Much easier.

const assets = [
  { name: 'rifleman.svg', color: 'red', text: 'Unit' },
  { name: 'tank.svg', color: 'blue', text: 'Tank' },
  { name: 'hq.svg', color: 'green', text: 'HQ' },
  { name: 'power.svg', color: 'orange', text: 'PWR' },
  { name: 'barracks.svg', color: 'brown', text: 'BAR' },
  { name: 'refinery.svg', color: 'purple', text: 'REF' },
  { name: 'grass.svg', color: '#33cc33', text: '' },
  { name: 'projectile.svg', color: 'yellow', text: '', shape: 'circle' },
  { name: 'water.svg', color: '#0000ff', text: '' },
  { name: 'rock.svg', color: '#808080', text: '' }
];

const outDir = 'public/assets/placeholders';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

assets.forEach(asset => {
  let innerSvgContent;
  if (asset.shape === 'circle') {
    innerSvgContent = `<circle cx="32" cy="32" r="10" fill="${asset.color}" />`;
  } else {
    innerSvgContent = `<rect width="64" height="64" fill="${asset.color}" />
    <text x="32" y="32" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">${asset.text}</text>`;
  }

  const svg = `
  <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    ${innerSvgContent}
  </svg>`;

  fs.writeFileSync(path.join(outDir, asset.name), svg);
  console.log(`Created ${asset.name}`);
});
