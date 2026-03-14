const fs = require('fs');
const path = require('path');

// Simple SVG template for different sizes
function createSVG(size) {
  const radius = Math.floor(size * 0.2);
  const fontSize = Math.floor(size * 0.35);
  const textY = Math.floor(size * 0.55);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d97706;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fbbf24;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow${size}" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="${Math.floor(size * 0.02)}" stdDeviation="${Math.floor(size * 0.05)}" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background rounded rectangle -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bgGradient${size})" filter="url(#shadow${size})"/>
  
  <!-- Shine effect -->
  <path d="M 0 ${Math.floor(size * 0.25)} Q ${Math.floor(size * 0.5)} ${Math.floor(size * 0.125)} ${size} ${Math.floor(size * 0.25)} L ${size} ${Math.floor(size * 0.75)} Q ${Math.floor(size * 0.5)} ${Math.floor(size * 0.875)} 0 ${Math.floor(size * 0.75)} Z" fill="rgba(255,255,255,0.1)"/>
  
  <!-- Text ĐN -->
  <text x="${Math.floor(size * 0.5)}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">
    ĐN
  </text>
</svg>`;
}

// Generate all icon sizes
const sizes = [16, 32, 72, 96, 128, 144, 150, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Create directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files
sizes.forEach(size => {
  const svgContent = createSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent, 'utf8');
  console.log(`Created ${filename}`);
});

console.log('All SVG icons generated!');
console.log('Note: These are SVG files. For PWA, you need PNG files.');
console.log('You can convert them using online tools or Node.js libraries like sharp.');
