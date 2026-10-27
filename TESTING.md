# SU Student 1.6.3 — verification record

Date: 25 October 2026. Full source-code release, not a signed APK or device-certified fix.

## Report and limitation

The user reports that the installed app closes within about one second. No APK, crash log, device model, installed version or confirmed closing stage was supplied. The cause has NOT been reproduced or identified on Android. This release hardens specific JavaScript startup paths; it is not proof that this particular crash was fixed.

## Changes checked

- Custom `index.js` entry preserves Metro web-runtime-first ordering and loads Expo Router. A synchronous JavaScript import exception attempts a plain native recovery screen with fixed diagnostic code, no raw message/stack/student information, no deletion.
- Background module loading and synchronous task definition are guarded. Definition remains at bundle scope for headless startup. Registration still requests a minimum 30-minute interval; OS scheduling rules remain.
- Closed portal does not evaluate the WebView/SSO implementation. Opening the portal loads it inside its own render error boundary.
- Main render boundary hides splash defensively and shows a sanitized code.
- Text/TextInput use platform font defaults unless bundled custom fonts have actually loaded.
- Settings show version 1.6.3 and a note when background modules could not be initialized.
- Package/lock build-integrity guard and partial-grade-sync fixes from 1.6.2 retained. Google experiment/native helper unchanged.

## Completed checks

- **61 app tests passed**, including 7 new startup tests.
- **6 server fixture tests passed**.
- TypeScript passed.
- Expo Doctor **20/20**.
- `expo export --platform all` passed: new custom entry compiled to Android/iOS Hermes bundles and web assets.
- Headless Chromium mobile-viewport smoke: login page rendered, guest tools opened, reload worked in light/dark contexts; no captured page JavaScript errors. This is a WEB check, not Android/iOS startup testing.
- Dynamic config: normal profile = standard package/test flag false; Google profile = separate test package/flag true.
- Mock tests exercise missing background module, definition/registration failure, synchronous bootstrap import failure/recovery, no eager portal load while hidden, and fixed diagnostic codes. These do not simulate native crashes.

## Not verified

- No full Gradle/Xcode/native build, EAS cloud run, physical Android/iPhone run, signed APK/IPA or production submission.
- No real university/Google login or Google popup/MFA callback test. User-agent experiment may be rejected and is not official SSO.
- No live data correctness/completeness, university field mapping, notification delivery or background schedule guarantee.
- No recovery from native abort, segmentation fault, native-module load failure outside JavaScript, OS process kill, or all asynchronous errors. JavaScript guards cannot reliably catch those.

## Acceptance on the user's device

See `STARTUP-REPAIR-AR.md`. Build from a new folder; do not Rebuild the old commit or use OTA.
Cold-start on/offline several times; open/close the portal; background/foreground; test existing saved state and account switching without deleting data.
If a recovery screen appears, share only its code/version and device model. If the process still closes, capture `adb logcat -b crash -d` immediately after reproducing and redact personal data/tokens.
Only after startup is stable, test authorized university Google sign-in and compare the signed-in student's profile, courses, grades and absence with the official portal.

## Previous build finding

For build `64ea45d4-3ca5-4c4d-a636-95342da18edc`, inspected public commit `254ebe9706ed275829a8b24d8bedbff1928a7628`.
Its package.json was 1.6.1 but lock root was old 1.0.0 with dependency mismatches. `npm ci --dry-run` on those uploaded files failed with EUSAGE. Corrected lock passed install-plan validation in 1.6.2. The EAS build:view request required unavailable Expo login, so actual cloud build logs were NOT read.
The unchanged Google native helper was prebuilt and Java-syntax parsed in 1.6.1, not compiled by Gradle or validated by real sign-in.

## Carried-forward risks

University portal/API are configured with HTTP; encrypted storage does not secure network traffic. Sessions can expire; biometric unlock does not renew SIS authorization. Offline cache may be stale; successful requests alone do not prove all university data is correct.
Previous audit reported 5 high-severity transitive tooling entries; no force-fix or incompatible SDK downgrade was applied. Review supported updates/advisories and font redistribution rights before production.