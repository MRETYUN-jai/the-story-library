const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const src = 'C:/Users/MRETYUN JAI/.gemini/antigravity-ide/brain/438ebf56-3337-47a6-8e5e-2577ab98c936/.user_uploaded/media_1789629004434.jpg';
  const size = 512;
  const radius = size / 2;
  
  // Create circular SVG mask
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius - 6}" fill="#fff" /></svg>`
  );

  const roundedBuffer = await sharp(src)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const publicPng = path.join(__dirname, '../public/favicon.png');
  const publicIco = path.join(__dirname, '../public/favicon.ico');
  const appIcon = path.join(__dirname, '../src/app/icon.png');
  const appAppleIcon = path.join(__dirname, '../src/app/apple-icon.png');
  const appFavicon = path.join(__dirname, '../src/app/favicon.ico');

  fs.writeFileSync(publicPng, roundedBuffer);
  fs.writeFileSync(publicIco, roundedBuffer);
  fs.writeFileSync(appIcon, roundedBuffer);
  fs.writeFileSync(appAppleIcon, roundedBuffer);
  fs.writeFileSync(appFavicon, roundedBuffer);

  console.log('Circular transparent favicon generated successfully!');
}

run().catch(console.error);
