# SU Student 1.3 — verification record

Date: 24 October 2026. This is a source-code release, not a device-certified binary.

## Completed checks
- TypeScript: `npm run typecheck` passed.
- Automated tests: **35 passed**. Includes own-account portal mocks, origin/session validation, encrypted-state tests, date validation, build arguments, focus timestamp restore/pause/resume, reminder opt-in/deletion/cap/privacy, class timing, 95-credit project eligibility, map bounds and SSO configuration validation.
- Expo Doctor: **20/20** passed.
- `expo prebuild --no-install --clean`: Android and iOS projects generated. This does not compile Gradle/Xcode or install CocoaPods.
- `expo export --platform all`: Android and iOS Hermes bundles and web export generated.
- Native config inspected: iOS and Android register the `unicodesis` callback scheme.
- Chromium 390 × 844 browser smoke: Arabic/English, unconfigured Google clearly disabled, map search/project details, named-course task creation/edit/completion, running focus countdown retained across home/study navigation, gradebook/timetable routes, dark theme, English custom font alias. No JavaScript page errors.
- Synthetic Chromium two-touch pinch changed map scale from 0.85 to approximately 1.48. Fixed map layers intercepting bottom navigation and browser page scrolling during pinch. This does **not** establish native multitouch performance.
- User-supplied Thmanyah and Froople assets are included. Postinstall regenerates font mappings; English body and headings use Froople.
- Final archive checks: fresh extraction; `npm ci` including the font hook; SHA-256 source-manifest verification; TypeScript; automated tests; Android/iOS direct-folder build dry-runs. No cloud builds are started by dry-runs.

## Not verified / not delivered
- No signed APK/IPA, full Gradle/Xcode compilation, App Store/TestFlight submission or physical Android/iPhone testing.
- No physical-device notification scheduling/delivery, permission-denial, Focus/Doze/force-stop, biometric lock, native WebView login, background termination/relaunch persistence or native pinch testing.
- No real student account was used. Live API field mappings, grade completeness and login remain to be validated against an authorized test account.
- Google SSO is **not operational** with the blank delivered configuration. Only a broker client and integration contract are included. University-controlled backend, Google configuration, account mapping and an actual end-to-end test are required; see AUTH-SETUP.md.
- No remote push server or background university polling. Absence notices require an actual foreground synchronization and recognized course-warning data.
- Web state is memory-only. Web refresh is not a test of native encrypted storage persistence.
- No guarantee of exact notification timing: the OS may delay/suppress local notifications. Android uses inexact scheduling where exact-alarm permission is unavailable.
- Data unavailable from the university remains `—`. Mock fixtures are test-only, never production dashboard records.

## Dependency audit — unresolved
`npm audit` reported **5 high-severity entries** and no critical entries:
`expo`, `@expo/cli`, `@expo/code-signing-certificates`, `node-forge`, `zod`.
These are dependency-chain audit entries, not five independently proven app exploits. They were not force-fixed or declared harmless. Review supported Expo/tooling upgrades and advisory exposure before production; an indiscriminate `npm audit fix --force` proposed incompatible SDK changes during development.

## Device acceptance checklist before distribution
1. Build the complete archive, not the old incomplete GitHub tree. iOS internal distribution requires Apple signing and registered devices.
2. On both OSes: official login, compare profile/credits/CGPA/timetable/marks, offline reads, expiry, account switch and sign-out.
3. Start focus, change screens, background 5 minutes, terminate/relaunch, compare remaining time; pause/reset and verify notification cancellation.
4. Enable/deny/revoke notification permission. Verify task edits/deletions, class notices, sign-out cancellation, timezone changes, battery restrictions and absence sync.
5. Pinch/pan/search map, tap nodes, scroll outside map, navigate tabs; test large text and Reduce Motion.
6. Validate configured Google SSO success/cancel/bad-state/replayed-code/wrong-PKCE/expired-code paths on installed Android and iOS builds.
7. Review HTTP portal transport with the university. Local AES-GCM encryption and HTTPS SSO do not encrypt the existing HTTP university API.
8. Review font distribution rights and all dependency advisories before student release.

`verify:source` compares against the delivered manifest. Intentional edits (including SSO configuration) are reported as differences; review them rather than deleting required files.