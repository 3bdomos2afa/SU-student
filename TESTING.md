# Verification and release gate — 24 October 2026

## Automated checks

- `npm test`: 13 tests covering exact-origin checks, session shape and no password retention, secret-field filtering, response shapes, session-bound requests, transcript request contract, expiry/invalid responses, endpoint allowlist, AES-GCM tampering/account-bound associated data, malformed study data, course prerequisites and manual credit totals.
- These API tests use mocked responses. They do **not** establish compatibility with a real student account.
- `npm run typecheck`: checks app and test sources.
- `npx expo-doctor`: 20/20 checks passed after compatible SDK 58 patch upgrades.
- `npx expo export --platform all`: generates Android/iOS JavaScript bundles and web review output. Not a native binary build.
- `npx expo prebuild --no-install --clean`: generates native project configuration. Not Gradle compilation or Xcode/CocoaPods installation.
- Playwright + headless Chrome: Arabic login → local tools → all five tabs → English → create task → start/pause timer. Zero browser page errors after fixing tab navigation. Reference screenshots use the supplied fonts and contain no student records.

## Confirmed bug fixed

On the previous custom tab bar, clicking a tab reproducibly threw:

```
Cannot read properties of undefined (reading 'navigate')
```

Expo Router 58's installed `BottomTabBarProps` contains `navigateToTab(routeKey)` and `emitter`, not `navigation`. The implementation now imports the real type, emits `tabPress`, and navigates with the supplied callback. No `as unknown as` cast hides the interface mismatch.

This is a verified JavaScript interaction bug; without a device crash log it is **not proof of the cause of every Android force-close**.

## Must pass on physical Android and iOS before release

1. Install a new preview binary; use the five tabs, course details, every calculator control, and Android hardware back repeatedly.
2. Switch Arabic/English and light/dark; test large text, small screen, notch and RTL input.
3. After reviewing the HTTP warning, sign in to your own university account in the popup. Do not share credentials in chat.
4. Confirm StudentID and compare each supported service with the official site. Verify empty responses, shape differences, semester selection and unsupported services without assuming all historical data was imported.
5. Refresh online → enable airplane mode → reopen cached services → reconnect → refresh and inspect each service timestamp and any partial failure.
6. Force-stop/restart: verify encrypted session/data restoration. Expired session should request login, not silently fabricate success.
7. Sign out, then use a different authorized account: confirm no prior account records, grades or tasks remain. Sign out while refresh is in progress.
8. Enable biometrics; cancel unlock, background/foreground, and test device PIN fallback. Verify lock hides native portal modal and back cannot reveal records.
9. Test full storage, corrupted local state, slow network, API timeout, blocked HTTP, external links and WebView renderer restart.
10. Observe memory and native stability on a lower-end device. If it closes, capture Android `adb logcat -b crash -d` or iOS crash report, removing tokens and student data before sharing.
11. Confirm font licenses, EAS upload file list and no raw-font public distribution.
12. Re-run dependency audit; resolve or explicitly accept outstanding toolchain advisories before signing a store release.

No EAS job, APK, AAB, IPA, store submission or real-account sync was executed as part of these checks. The deliverable is source code and review images.