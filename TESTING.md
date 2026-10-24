# SU Student 1.6.2 — verification record

Date: 25 October 2026. Complete source-code release; no device-certified binary.

## Reproduced uploaded-source defect
- Inspected the public files at commit `254ebe9706ed275829a8b24d8bedbff1928a7628`.
- Its package.json matches 1.6.1, but package-lock.json contains old 1.0.0 root metadata and incompatible/missing dependencies.
- `npm ci --dry-run --ignore-scripts --no-audit --no-fund` against those two uploaded files failed with `EUSAGE`, reporting that package/lock are out of sync.
- `.gitignore` and `.easignore` from the delivered source were absent from the commit.
- Attempted the requested EAS `build:view` command; Expo authentication was unavailable. The actual cloud logs for build `64ea45d4-3ca5-4c4d-a636-95342da18edc` were NOT read. The reproduced defect is a confirmed blocker, not a claim about every possible cloud error.

## Completed for 1.6.2
- Correct package-lock retained; root version metadata aligned to 1.6.2. Dependency versions were not force-upgraded.
- `npm ci --dry-run --ignore-scripts --no-audit --no-fund` with corrected files passed. This is install-plan validation, not a fresh dependency installation.
- TypeScript passed.
- **54 app tests passed**, including 5 new build-integrity/sync-result checks. Existing Google-origin gating, popup patch/restore, course ownership and encrypted-state checks also passed.
- **6 server tests passed** against fixtures.
- Expo Doctor **20/20** passed.
- `expo export --platform all` passed: Android/iOS Hermes bundles and web export.
- Both local Android build commands passed dry-runs: normal `preview` and isolated `google-test`.
- Preflight validates local release hashes and package/lock root metadata; cloud pre-install validates package/lock and build files without depending on intentionally excluded server files.
- Per-course grade failures now contribute to partial-sync errors. UI no longer says that all university data is up to date solely because some requests succeeded.

## Earlier source verification retained
The unchanged Google experiment was Android-prebuilt in an isolated folder for 1.6.1; generated package/name and native patch were inspected. Patched Java parsed with a syntax parser. Neither check was a Gradle compile or Google sign-in test. The native helper and plugin were not modified for 1.6.2.

## Not verified / not delivered
- No EAS cloud build, signed APK/IPA, full Gradle/Xcode compilation, physical-device test or store submission.
- No real student/Google account login. The experiment may be rejected by Google; it does not turn WebView into Chrome.
- No guarantee of university API field completeness, live data correctness, native popup callback/MFA behavior or notification delivery.
- Google experiment remains opt-in, Android-only, and requires the `google-test` native build. Normal `preview`, iOS, Expo Go and OTA do not enable it.
- Official broker/SIS integration remains unconfigured; server fixtures are not a working university server.
- Data cached offline may be old. University sessions can expire even with local biometric protection.
- Background polling interval is OS-controlled; no immediate remote-push service exists.
- The university portal/API are configured with HTTP. Local encryption does not secure this network traffic.

## Acceptance before sharing with students
Follow `BUILD-FIX-AR.md` and `GOOGLE-TEST-AR.md`. Use a fresh folder, authorized Expo account and a new build, not Rebuild on the old commit.
On a real device, validate Google sign-in/cancel/MFA/blocked-useragent, only the signed-in student's data, official grades and absence, timestamps/partial failures, expiry/account-switch/sign-out, offline/reconnect behavior and notification permissions/restrictions.
Never send passwords, OTPs, tokens or session storage in diagnostics.

## Unresolved audit carried forward
Previous audit reported 5 high-severity transitive tooling entries (`expo`, `@expo/cli`, `@expo/code-signing-certificates`, `node-forge`, `zod`). No force-fix or unsupported SDK downgrade was applied. Review supported updates and advisory exposure before production.
Font distribution rights also require review before public redistribution.