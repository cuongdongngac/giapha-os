# PWA Icons Placeholder

## Icons Needed for PWA

The following icons are referenced in manifest.json and layout.tsx but don't exist yet:

### Required Icons (missing):
- `/icons/icon-16x16.png`
- `/icons/icon-32x32.png` 
- `/icons/icon-72x72.png`
- `/icons/icon-96x96.png`
- `/icons/icon-128x128.png`
- `/icons/icon-144x144.png`
- `/icons/icon-150x150.png`
- `/icons/icon-152x152.png`
- `/icons/icon-192x192.png`
- `/icons/icon-384x384.png`
- `/icons/icon-512x512.png`

### Screenshots (missing):
- `/screenshots/desktop-1.png`
- `/screenshots/mobile-1.png`

## Current Status: ❌ NO ICONS

Without these icons:
- ❌ PWA install will fail on iPhone
- ❌ Android install prompts won't show app icon
- ❌ Browser favicon will be missing
- ❌ App shortcuts won't have icons
- ❌ Windows tiles won't work

## Quick Fix Options:

### Option 1: Create Simple Text Icons (Temporary)
Use online tools to create simple text-based icons with "HPĐN" or "ĐN"

### Option 2: Use Default Icons
Copy any existing PNG icons and rename them to required sizes

### Option 3: Generate from Logo
Use favicon.io with your family crest/logo

### Option 4: Disable PWA Temporarily
Remove manifest.json reference until icons are ready

## Recommendation:
Create at minimum these 3 critical icons:
1. `icon-152x152.png` - Required for iPhone
2. `icon-192x192.png` - Required for Android  
3. `icon-512x512.png` - Required for PWA manifest

Without these, PWA installation will not work on mobile devices.
