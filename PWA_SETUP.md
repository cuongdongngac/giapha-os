# PWA Icons Setup

## Required Icons

Create the following icons in the `public/icons/` directory:

### App Icons (PNG format)
- `icon-16x16.png` - 16x16px
- `icon-32x32.png` - 32x32px  
- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-150x150.png` - 150x150px (for Windows tiles)
- `icon-152x152.png` - 152x152px (for iOS)
- `icon-192x192.png` - 192x192px
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px

### Design Guidelines
- Use the family crest or logo
- Keep it simple and recognizable at small sizes
- Use transparent background for better compatibility
- For iOS: rounded corners are applied automatically

### Screenshots (Optional but recommended)
Create screenshots in `public/screenshots/`:
- `desktop-1.png` - 1280x720px
- `mobile-1.png` - 375x667px

## How to Create Icons

### Option 1: Use Online Tools
1. Go to https://favicon.io/favicon-generator/
2. Upload your logo (minimum 260x260px)
3. Download the generated icon pack
4. Extract to `public/icons/`

### Option 2: Design Manually
1. Start with a 512x512px design
2. Scale down to required sizes
3. Ensure readability at small sizes
4. Export as PNG with transparency

### Option 3: Use AI Tools
- ChatGPT + DALL-E: "Create a simple family crest logo for Phạm Đông Ngạc family"
- Midjourney: Similar prompts
- Then use favicon.io to generate all sizes

## Testing PWA

### Chrome/Android
1. Open app in Chrome
2. Look for "Install app" icon in address bar
3. Click to install

### Safari/iPhone
1. Open app in Safari
2. Tap Share button
3. Scroll down and tap "Add to Home Screen"
4. Confirm installation

### Verification
After installation:
- App should open in standalone mode (no browser UI)
- App should work offline (basic functionality)
- App icon should appear on home screen

## PWA Features Enabled

✅ **Manifest.json** - App metadata and install prompts
✅ **Service Worker** - Offline caching and performance
✅ **iOS Support** - Apple-specific meta tags
✅ **Android Support** - Chrome install prompts
✅ **Windows Support** - Tile configuration
✅ **App Shortcuts** - Quick access to key features
✅ **Responsive Design** - Works on all screen sizes
✅ **Theme Integration** - Matches app color scheme

## Deployment Notes

- Ensure HTTPS is enabled (required for PWA)
- Service worker needs to be served from root
- Manifest.json must be accessible at `/manifest.json`
- Icons must be accessible at specified paths
