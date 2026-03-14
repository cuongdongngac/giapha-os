const fs = require('fs');
const path = require('path');

// Create a simple PNG using canvas-like approach
function createPNGData(size) {
  const radius = Math.floor(size * 0.2);
  const fontSize = Math.floor(size * 0.35);
  
  // Create a simple PNG header (minimal PNG)
  const width = size;
  const height = size;
  
  // For now, create a simple colored rectangle with text
  // This is a basic implementation - in production you'd use proper image libraries
  
  // Create a simple 1x1 pixel data for testing
  const pixelData = Buffer.alloc(width * height * 4); // RGBA
  
  // Fill with amber color (#f59e0b)
  for (let i = 0; i < pixelData.length; i += 4) {
    pixelData[i] = 245;     // R
    pixelData[i + 1] = 158; // G  
    pixelData[i + 2] = 11;  // B
    pixelData[i + 3] = 255; // A
  }
  
  return pixelData;
}

// Create minimal PNG files for testing
const sizes = [16, 32, 72, 96, 128, 144, 150, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

sizes.forEach(size => {
  const pixelData = createPNGData(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Create a minimal PNG file
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 6;   // color type (RGBA)
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace
  
  const ihdrCrc = Buffer.alloc(4);
  // Simple CRC calculation (would need proper implementation)
  ihdrCrc.writeUInt32BE(0, 0);
  
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);
  
  // IDAT chunk (minimal)
  const idatData = Buffer.concat([
    Buffer.from([0x78, 0x9C]), // zlib header
    pixelData,
    Buffer.from([0x01, 0x00, 0x00]) // zlib footer
  ]);
  
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(0, 0);
  
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
  
  fs.writeFileSync(filepath, pngData);
  console.log(`Created ${filename}`);
});

console.log('Basic PNG files created for testing!');
