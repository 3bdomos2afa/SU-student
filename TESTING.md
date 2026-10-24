# SU Student 1.2 — verification record

Date: 24 October 2026.

## Completed checks
- TypeScript: `npm run typecheck` passed.
- Automated tests: 25 passed. Coverage includes exact-origin session parsing, sensitive-field removal, mocked own-account API requests, authenticated encryption, study-state migration, calendar validation, map coordinates, external-link policy and direct-folder build arguments.
- Expo Doctor: 20/20 checks passed.
- Expo prebuild: Android and iOS native projects generated successfully with `--no-install --clean`.
- Metro export: Android/iOS Hermes bundles and web export generated successfully.
- Chromium browser smoke test at a 390 × 844 viewport: non-blocking portal modal, map and course details, AR/EN toggle, task creation/edit/completion, timer start/pause, in-session task persistence across navigation, gradebook/timetable routes and dark theme. No JavaScript page errors were reported.
- Custom font preparation reported `Arabic=Thmanyah, Display=Froople`; custom fonts were included in exported assets.
- Final ZIP validation: fresh extraction, npm ci, source SHA-256 verification, TypeScript and automated tests. The manifest includes the user-authorized font files and `.easignore`.

## What these checks do not establish
- No signed APK/IPA or Gradle/Xcode compilation has been completed here.
- No Android/iPhone physical-device testing, biometric testing, native WebView login or native persistence/restart testing has been completed.
- No real student account was used. API mappings are based on the public university client and mocked fixtures; actual response formats, completeness and login session behavior need live-account testing.
- Google sign-in opens in a separate system browser; its session is not imported into the app. The app does not contain an official university OAuth callback/token exchange.
- Browser smoke testing does not verify native popup navigation or eliminate every possible device crash.
- Tests use mocked marks and students only; no fixtures are injected into the production dashboard.

## Release checklist before student distribution
1. Build from the full delivered folder, not an earlier GitHub commit.
2. Test official username/password login on Android and iOS.
3. Compare profile, schedule, earned credits, CGPA and each assessment against the official portal.
4. Verify log out, different-account login, offline reads and session expiration.
5. Verify biometric/background lock, restart persistence, text scaling and slow network behavior.
6. Test external-link and Google browser behavior without assuming it connects the app.
7. Review HTTP transport risks with the institution; local encryption does not encrypt HTTP traffic.
8. Review font licensing and scope before redistribution. User authorization here does not grant rights to unrelated recipients.
9. Review npm audit and dependency advisories before release; Expo tooling had known transitive findings during development. Do not apply an indiscriminate `npm audit fix --force` that downgrades the SDK.

`verify:source` compares the delivered source with its release manifest. Intentional edits are reported as changes; this is not a build failure. No cloud build is started by the tests.