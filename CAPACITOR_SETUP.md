# 📱 Capacitor App Store Setup Guide

Your LadyBoss Academy app is now ready for native iOS and Android deployment! This guide will walk you through the process.

## ✅ What's Been Done

All Capacitor dependencies and code adaptations are complete:

- ✅ Capacitor Core, iOS, and Android packages installed
- ✅ Native plugins for splash screen, status bar, push notifications, and browser installed
- ✅ `capacitor.config.ts` created with hot reload for development
- ✅ Code updated to detect native vs PWA platform
- ✅ Stripe checkout opens in native browser on mobile
- ✅ Push notifications support both web and native
- ✅ PWA install prompts hidden when running as native app

## 📋 Next Steps (On Your Local Machine)

### 1. Export to GitHub & Clone

```bash
# In Lovable: Click GitHub → Export to GitHub
# Then on your machine:
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Capacitor (First Time Only)

```bash
npx cap init
```

When prompted, use these values:
- **App Name:** `LadyBoss Academy`
- **App ID:** `app.lovable.9d54663c1af540669ceb1723206ae5f8`
- **Web Directory:** `dist`

> Note: The config file already exists in the repo, so this step may not be necessary unless you need to regenerate it.

### 4. Build Web Assets

```bash
npm run build
```

### 5. Add Native Platforms

```bash
# For iOS (Mac only):
npx cap add ios

# For Android:
npx cap add android
```

### 6. Sync Web Assets to Native Projects

```bash
npx cap sync
```

Run this command every time you:
- Update code and rebuild (`npm run build`)
- Pull changes from GitHub
- Install new plugins

### 7. Configure for Production

**Important:** Before building for app stores, remove the hot reload server configuration:

Edit `capacitor.config.ts` and remove/comment out the `server` block:

```typescript
// Comment this out for production builds:
// server: {
//   url: 'https://9d54663c-1af5-4066-9ceb-1723206ae5f8.lovableproject.com?forceHideBadge=true',
//   cleartext: true
// },
```

### 8. Open in Native IDE

```bash
# For iOS (requires Mac + Xcode):
npx cap open ios

# For Android (requires Android Studio):
npx cap open android
```

## 🍎 iOS App Store Deployment

### Prerequisites
- Mac with Xcode installed
- Apple Developer Program membership ($99/year)
- App Store Connect account

### Steps
1. **Open in Xcode:** `npx cap open ios`
2. **Configure Signing:**
   - Select your project in Xcode
   - Go to "Signing & Capabilities"
   - Select your team and certificate
3. **Set App Icons:**
   - Icons are in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Use your `public/pwa-512x512.png` as source
4. **Configure Splash Screen:**
   - Located in `ios/App/App/Assets.xcassets/Splash.imageset/`
5. **Build for Archive:**
   - Product → Archive
   - Upload to App Store Connect
6. **Submit for Review:**
   - Complete metadata in App Store Connect
   - Add screenshots, description, keywords
   - Submit for Apple review (1-7 days)

### iOS Testing
```bash
# Run on simulator:
npx cap run ios

# Run on connected device:
# Select device in Xcode and press Run
```

## 🤖 Android App Store Deployment

### Prerequisites
- Android Studio installed
- Google Play Console account ($25 one-time)

### Steps
1. **Open in Android Studio:** `npx cap open android`
2. **Configure App Icons:**
   - Icons are in `android/app/src/main/res/mipmap-*/`
   - Generate all sizes from your `public/pwa-512x512.png`
3. **Build Signed APK/AAB:**
   - Build → Generate Signed Bundle/APK
   - Create keystore (save it securely!)
   - Choose "Android App Bundle" (preferred)
4. **Upload to Play Console:**
   - Create app listing
   - Upload AAB file
   - Add screenshots, description, category
   - Submit for review (few hours typically)

### Android Testing
```bash
# Run on emulator or connected device:
npx cap run android
```

## 🔄 Development Workflow

### With Hot Reload (Development)
1. Keep the `server` config in `capacitor.config.ts`
2. Make changes in Lovable
3. Changes reflect immediately in native app
4. No rebuild needed!

### Without Hot Reload (Production Testing)
1. Remove `server` config from `capacitor.config.ts`
2. Make changes in code
3. Run `npm run build`
4. Run `npx cap sync`
5. Rebuild in Xcode/Android Studio

## 🧪 Testing Strategy

### Test Both Environments:
1. **Web/PWA:** Test at `https://your-lovable-url.com`
2. **Native App:** Test via Xcode/Android Studio

### Key Features to Test:
- ✅ Stripe checkout (opens in native browser)
- ✅ Push notifications (native permissions)
- ✅ Audio playback
- ✅ User authentication
- ✅ Course enrollment
- ✅ Offline functionality

## 📊 Current vs Native Features

| Feature | PWA (Current) | Native App (New) |
|---------|---------------|------------------|
| Install from browser | ✅ | ❌ (from app store) |
| Push notifications | Limited on iOS | ✅ Full support |
| Offline access | ✅ | ✅ Enhanced |
| Stripe payments | ✅ | ✅ Better UX |
| App icon on home | ✅ | ✅ |
| App store presence | ❌ | ✅ |
| Discovery | Limited | ✅ App stores |

## 🔐 Important Notes

### Push Notifications
- Native apps get better notification delivery on iOS
- The code automatically detects platform and uses appropriate API
- Native tokens are saved with `native:` prefix in database

### Stripe Payments
- Opens in native in-app browser (better UX)
- Return URLs work correctly with both web and native
- No code changes needed to payment logic

### User Accounts
- Same database, same authentication
- Users can log in on web, PWA, or native app
- All data syncs across platforms

### Performance
- Native apps load faster (no browser overhead)
- Better offline caching
- Smoother animations

## 🆘 Troubleshooting

### "Command not found: cap"
```bash
npm install -g @capacitor/cli
```

### Build fails after code changes
```bash
npm run build
npx cap sync
```

### Icons not showing
- Regenerate icons for both platforms
- iOS: Use Xcode asset catalog
- Android: Place in all `mipmap-*` folders

### Push notifications not working
- Check native permissions in device settings
- Verify VAPID keys in environment
- Check console logs for token registration

## 🚨 CRITICAL: Push Notifications Setup

⚠️ **If you plan to use push notifications, there is a required manual step that is NOT handled by `npx cap add ios`.**

Capacitor's PushNotifications plugin requires two native iOS methods in `AppDelegate.swift` to bridge APNs tokens/errors from native code to JavaScript. Without these methods, push notification registration will timeout and fail.

**You MUST manually add these methods to `ios/App/App/AppDelegate.swift`:**

```swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```

📚 **See complete instructions**: [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md)  
📋 **Full template**: [IOS_APPDELEGATE_TEMPLATE.md](./IOS_APPDELEGATE_TEMPLATE.md)

**Important**: If you ever delete the `ios/` folder and run `npx cap add ios` again, you will need to re-add these methods.

## 📱 App Store Requirements

### iOS Screenshots Required
- 6.7" display (iPhone 14 Pro Max)
- 6.5" display (iPhone 11 Pro Max)
- 5.5" display (iPhone 8 Plus)

### Android Screenshots Required
- Phone (1080x1920 or larger)
- Tablet (1920x1080 or larger)

### Metadata Needed
- App description (4000 characters max)
- Keywords (100 characters max)
- Privacy policy URL (you have `/privacy`)
- Support URL
- App category
- Age rating

## 🎉 Success Checklist

Before submitting to app stores:

- [ ] Remove hot reload server config
- [ ] Build and test production version
- [ ] Test Stripe checkout flow
- [ ] Test push notifications
- [ ] Verify all course content loads
- [ ] Test user authentication
- [ ] Take required screenshots
- [ ] Prepare app descriptions
- [ ] Review privacy policy
- [ ] Create developer accounts
- [ ] Submit for review!

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Guidelines](https://play.google.com/console/about/guides/)
- [Capacitor Blog Post](https://lovable.dev/blog/capacitor-mobile-apps)

---

**Need Help?** Check the Lovable Discord or reach out to support!
