# Mobile Build Guide

The iPhone and Android apps are Capacitor shells around a static export of the
same Next.js app. There is no second codebase — the `/ideas` route you see in
the browser is the app.

## How it fits together

```
frontend/app/ideas/page.tsx
        │
        │  MOBILE_BUILD=1 next build      → .next-mobile/  (static export)
        │  node scripts/prepare-mobile.mjs → out/          (Capacitor webDir)
        ▼
    npx cap sync
        ├── frontend/ios/       → open in Xcode on a Mac
        └── frontend/android/   → open in Android Studio (works on Windows)
```

`next.config.js` switches behavior on the `MOBILE_BUILD` environment variable.
With it unset, the web build is exactly what it always was, API routes included.

### Why the auth route is named `route.server.ts`

Next refuses to static-export a project containing a route handler, and
`app/api/auth/[...nextauth]` is one. The web build lists `server.ts` in
`pageExtensions` and so still registers the handler; the mobile build omits it
from `pageExtensions` and therefore never sees the file. The mobile app does not
need NextAuth, because the ideas flow is public.

This is a supported Next mechanism, not a workaround. Verify it after any change
to `next.config.js`: `npm run build` must still list `/api/auth/[...nextauth]`.

## Point the app at your backend

`localhost` does not resolve from a phone, and the value is compiled into the
bundle at build time. Set it before building:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com npm run build:mobile
```

The backend already allows the native webview origins (`capacitor://localhost`,
`http://localhost`) in its CORS configuration.

## Android — works on Windows

```bash
npm run cap:android
```

This builds the bundle, syncs it, and opens Android Studio. Press Run to deploy
to an emulator or a connected device.

## iOS — requires a Mac

**Building the iOS app needs Xcode, which only runs on macOS.** This is Apple's
toolchain restriction, not a limitation of this project. `npx cap add ios`
already generated the complete `frontend/ios/` project on Windows, and it is
committed, but compiling it, running the simulator, and producing an `.ipa` all
require a Mac.

On a Mac:

```bash
npm install
npm run cap:ios     # builds, syncs, opens Xcode
```

Then select a simulator or device and press Run. First run also needs CocoaPods
(`sudo gem install cocoapods`), which `cap sync` invokes automatically.

### Testing the iPhone experience from Windows

You cannot compile the iOS app here, but you can exercise the real UI three ways:

1. **Browser at iPhone viewport.** `npm run dev`, open `http://localhost:3000/ideas`,
   and use device emulation at 375×812. This is the same React code the app runs.
2. **A real iPhone over your local network.** Point `server.url` in
   `capacitor.config.ts` at your dev machine's LAN address and load it in Safari
   on the phone — the layout, touch targets, and keyboard behavior are all live.
3. **The Android build**, which shares the entire web layer. Anything that is not
   iOS-chrome-specific behaves identically.

### Building iOS without owning a Mac

Any of these work with the committed project as-is:

- A cloud Mac service (MacStadium, Scaleway Mac minis, GitHub Actions `macos-latest`).
- Ionic Appflow, which builds Capacitor projects in the cloud.
- Borrowing a Mac — the project is self-contained after `npm install`.

Shipping to the App Store additionally needs an Apple Developer account ($99/yr).

## After changing web code

```bash
npm run cap:sync
```

This rebuilds the export and copies it into both native projects. Native code
itself rarely changes; the web layer is where the app lives.
