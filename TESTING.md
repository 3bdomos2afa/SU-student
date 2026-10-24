# SU Student 1.6.1 — verification record

Date: 25 October 2026. This is a complete source-code release, not a device-certified binary.

## Checks completed for this release
- TypeScript: `npm run typecheck` passed.
- App tests: **49 passed**, including 8 new checks for the experimental Android capability/profile gate, exact Google-origin policy, native source-patch idempotence/checksum restoration, absence of Google credential-reading code, explicit opt-in, and the isolated build command.
- Server tests: **6 passed**. Server fixtures do not establish a live university integration.
- Expo Doctor: **20/20** passed.
- Dynamic Expo config checked for both normal and test profiles: normal app keeps its name/package and disables the capability; `google-test` uses `SU Student Test` / `com.unicodesis.student.googletrial`.
- Android `expo prebuild --no-install` succeeded in a separate verification folder with the test profile. Generated application ID/name and the native popup patch were inspected.
- Standard `node_modules` WebView source was restored after the prebuild check. Restoration is also tested with a temporary fixture.
- `expo export --platform all` passed: Android/iOS Hermes JS bundles and the web export were generated.
- Patched Java source parsed with a Java syntax parser; this is not Android type-checking or compilation.
- Fonts supplied by users remain included. Postinstall regenerates the font map.

Prebuild/config generation and source tests do **not** compile Java/Gradle or test a Google account login.

## Not verified / not delivered
- No signed APK/IPA, EAS cloud build, full Gradle/Xcode compilation, physical device test, store submission or native notification delivery check.
- No real Google/student account was used. The experimental User-Agent/popup may still be rejected with `disallowed_useragent` or another error.
- The native popup is Android-only and requires a fresh native test build; not Expo Go, an OTA update, iOS or a web preview.
- The official SSO broker client remains unconfigured. The separate WebView experiment uses the university's original page and is not proof of official Google mobile support.
- Live data field mappings, completeness, Google popup callbacks, MFA, cancellation and account/session expiry must be validated by an authorized account holder.
- Background synchronization requests a 30-minute minimum interval; the OS can delay or suppress it. No immediate remote-push service is included.
- Offline views show previously fetched data. Biometrics protect local access but do not prevent the university session expiring.
- The university portal/API use HTTP in the delivered configuration. Local encryption does not secure HTTP transport.
- Mock data remains test-only and is never a substitute for official student records.

## Device acceptance before any distribution
1. For the experiment, follow `GOOGLE-TEST-AR.md` and use `npm run build:google-test`. Confirm that the installed app says **SU Student Test** and the experimental button is present.
2. Enable the experiment explicitly. Press Google **inside the university page**. Verify login success/cancel/blocked-browser/MFA without recording credentials or tokens.
3. Close the popup, close the login sheet, navigate away and reopen; ensure the opt-in resets and no orphan window remains.
4. If Google rejects the browser, stop. Report a redacted screenshot; never share passwords, OTPs, tokens or session storage.
5. If a session is obtained, compare only the signed-in student's profile, timetable, credits, grades and attendance to the official portal. Check offline reads, refresh, session expiry, account switch and sign-out.
6. Test notification opt-in/denial/revocation, first-sync baseline, duplicate suppression, class/task edits, timezone changes, background restrictions and force-stop.
7. Normal `preview`/`production` builds must not expose the experimental button. Build and test iOS separately for ordinary login and app features.
8. Review HTTP transport with the university, font distribution rights and dependency advisories before sharing with students.

## Dependency audit carried forward
Earlier audit reported **5 high-severity transitive tooling entries** (`expo`, `@expo/cli`, `@expo/code-signing-certificates`, `node-forge`, `zod`). They were not force-fixed or declared harmless. Review supported Expo updates and exposure before production; do not blindly use `npm audit fix --force` with incompatible SDK changes.

`verify:source` checks the delivered manifest. Intentional edits are reported as differences; review them rather than removing required files.