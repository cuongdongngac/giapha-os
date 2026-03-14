const fs = require('fs');
const path = require('path');

// Create missing Android icon sizes
function createAndroidPNG(size) {
  const width = size;
  const height = size;
  
  // Create image data (RGBA)
  const imageData = Buffer.alloc(width * height * 4);
  
  // Fill with amber gradient (simplified)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Create gradient effect
      const gradientPos = (x + y) / (width + height);
      if (gradientPos < 0.5) {
        imageData[i] = 217;     // R - darker amber
        imageData[i + 1] = 119; // G  
        imageData[i + 2] = 6;   // B
      } else {
        imageData[i] = 251;     // R - lighter amber
        imageData[i + 1] = 191; // G  
        imageData[i + 2] = 36;  // B
      }
      imageData[i + 3] = 255; // A
    }
  }
  
  // Create minimal PNG
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 6;   // color type (RGBA)
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace
  
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(0x6D9B91D8, 0);
  
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]),
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);
  
  // Simple IDAT with raw data
  const idatData = Buffer.concat([
    Buffer.from([0x78, 0x01]),
    Buffer.from([0x01]),
    imageData,
    Buffer.from([0x00, 0x00, 0x00])
  ]);
  
  const idatCrc = Buffer.alloc(4);
  let crc = 0xFFFFFFFF;
  const idatHeader = Buffer.from('IDAT');
  for (let i = 0; i < idatHeader.length; i++) {
    crc ^= idatHeader[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
  }
  for (let i = 0; i < idatData.length; i++) {
    crc ^= idatData[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
  }
  idatCrc.writeUInt32BE(~crc >>> 0, 0);
  
  const idatChunk = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from('IDAT'),
    idatData,
    idatCrc
  ]);
  idatChunk.writeUInt32BE(idatData.length, 0);
  
  // IEND chunk
  const iendChunk = Buffer.from([0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Create missing Android sizes
const androidSizes = [36, 48];
const iconsDir = path.join(__dirname, 'public', 'icons');

console.log('Creating missing Android icon sizes...');

androidSizes.forEach(size => {
  try {
    const pngData = createAndroidPNG(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, pngData);
    console.log(`✅ Created ${filename} for Android`);
  } catch (error) {
    console.error(`❌ Failed to create icon-${size}x${size}.png:`, error.message);
  }
});

console.log('\n🤖 Android icons created!');
console.log('✅ PWA should now show "Install" on Chrome/Android');
console.log('🚀 Deploy and test the installation prompt');
