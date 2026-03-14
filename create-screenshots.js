const fs = require('fs');
const path = require('path');

// Create simple placeholder screenshots
function createScreenshot(width, height, filename) {
  // Create a simple HTML canvas-like representation
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Screenshot ${width}x${height}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #fafaf9;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .screenshot-container {
            width: ${width}px;
            height: ${height}px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 20px;
            box-sizing: border-box;
        }
        .header {
            background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
        }
        .content {
            text-align: center;
        }
        .title {
            font-size: ${width > 400 ? '24px' : '18px'};
            color: #1f2937;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .subtitle {
            font-size: ${width > 400 ? '16px' : '14px'};
            color: #6b7280;
            margin-bottom: 20px;
        }
        .demo-grid {
            display: grid;
            grid-template-columns: repeat(${width > 400 ? '3' : '2'}, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        .demo-item {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 6px;
            font-size: ${width > 400 ? '14px' : '12px'};
        }
    </style>
</head>
<body>
    <div class="screenshot-container">
        <div class="header">
            <strong>HỌ PHẠM ĐÔNG NGẠC</strong>
        </div>
        <div class="content">
            <div class="title">Gia Phả Điện Tử</div>
            <div class="subtitle">Nền tảng gia phả hiện đại</div>
            <div class="demo-grid">
                <div class="demo-item">👤 Thành viên</div>
                <div class="demo-item">🌳 Chi họ</div>
                <div class="demo-item">📜 Thế hệ</div>
                <div class="demo-item">🔍 Tìm kiếm</div>
                <div class="demo-item">📱 Mobile</div>
                <div class="demo-item">☁️ Cloud</div>
            </div>
        </div>
    </div>
</body>
</html>`;

  const filepath = path.join(__dirname, 'public', 'screenshots', filename);
  fs.writeFileSync(filepath, htmlContent, 'utf8');
  console.log(`✅ Created ${filename}`);
}

// Create desktop and mobile screenshots
console.log('Creating placeholder screenshots...');

createScreenshot(1280, 720, 'desktop-1.png');
createScreenshot(375, 667, 'mobile-1.png');

console.log('\n📸 Placeholder screenshots created!');
console.log('💡 Note: These are HTML placeholders. For production:');
console.log('   1. Take real screenshots of the app');
console.log('   2. Save as PNG files');
console.log('   3. Replace these placeholder files');
