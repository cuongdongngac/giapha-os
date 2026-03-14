const fs = require('fs');
const path = require('path');

// Create minimal PNG files using base64 encoded 1x1 pixel
function createSimplePNG(size, color) {
  // Create a simple colored square with rounded corners approximation
  const width = size;
  const height = size;
  
  // Create image data (RGBA)
  const imageData = Buffer.alloc(width * height * 4);
  
  // Fill with amber color
  for (let i = 0; i < imageData.length; i += 4) {
    imageData[i] = 245;     // R
    imageData[i + 1] = 158; // G  
    imageData[i + 2] = 11;  // B
    imageData[i + 3] = 255; // A
  }
  
  // Create a minimal valid PNG
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
  ihdrCrc.writeUInt32BE(0x6D9B91D8, 0); // Pre-calculated CRC for IHDR
  
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);
  
  // Simple IDAT with raw data (no compression)
  const idatData = Buffer.concat([
    Buffer.from([0x78, 0x01]), // zlib header with no compression
    Buffer.from([0x01]), // filter type
    imageData,
    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]) // zlib footer
  ]);
  
  const idatCrc = Buffer.alloc(4);
  // Simple CRC calculation (simplified)
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
    Buffer.alloc(4), // length placeholder
    Buffer.from('IDAT'),
    idatData,
    idatCrc
  ]);
  idatChunk.writeUInt32BE(idatData.length, 0);
  
  // IEND chunk
  const iendChunk = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  
  const pngData = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  
  return pngData;
}

// Create all required sizes
const sizes = [16, 32, 72, 96, 128, 144, 150, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

console.log('Creating PNG icons...');
console.log('Directory:', iconsDir);

sizes.forEach(size => {
  try {
    const pngData = createSimplePNG(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, pngData);
    console.log(`✅ Created ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to create icon-${size}x${size}.png:`, error.message);
  }
});

console.log('\n🎉 PNG icons created!');
console.log('📱 PWA should now work on iPhone and Android');
console.log('🚀 Deploy and test: Add to Home Screen on Safari/iPhone');
