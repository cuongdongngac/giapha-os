// Script to remove CKEditor packages
const { execSync } = require('child_process');

console.log('Removing CKEditor packages...');

try {
  // Remove CKEditor packages
  execSync('npm uninstall @ckeditor/ckeditor5-build-classic @ckeditor/ckeditor5-react', { stdio: 'inherit' });
  
  // Clean node_modules to ensure complete removal
  console.log('Cleaning node_modules...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('✅ CKEditor removed successfully!');
  console.log('🚀 TipTap is now your only editor!');
} catch (error) {
  console.error('❌ Error removing CKEditor:', error.message);
  console.log('💡 You may need to run these commands manually:');
  console.log('   npm uninstall @ckeditor/ckeditor5-build-classic @ckeditor/ckeditor5-react');
  console.log('   npm install');
}
