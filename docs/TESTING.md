# 🧪 Testing

[← Back to README](../README.md)

There are **137 tests in 27 suites**, run with the Node test runner through `tsx`. A separate server suite has 6 tests.

```sh
npm test            # tsx --test tests/*.test.ts
npm run test:server # node --test server/test/broker.test.mjs
```

| Suite | Guards |
|---|---|
| `academic`, `study`, `v1100-terms` | Course and term normalisation, GPA and CGPA maths |
| `portal`, `startup`, `build-entry` | Portal client, startup recovery, entry ordering |
| `build-integrity`, `no-minify` | Release manifest, package/lock consistency, Android minify off |
| `google-trial`, `v1112-google-tap` | Sign-in sandbox: allowed hosts, no JS bridges, evil-host rejection |
| `v1100-planner`, `v1100-plan`, `v1100-notebook`, `v1100-settings` | Planner, notebook, settings persistence |
| `v1110-moodle`, `v1111-moodle-match` | KMoodle parsing and course matching |
| `v1110-streak` | Streak rules, rest days, goals |
| `v13`, `v1130` | Reminder plan (N1, N2, N8–N11), gender wording, preference switches, light sync |
| `v16`, `v180`, `v190`, `v173`, `v174` | Change alerts (grades, absence, warnings), channels |
| `v1140` | Battery and maker guidance |
| `v1120-suplus`, `crash-reporter` | Branding, version and hidden bug-report screen |

Real-device testing is done separately on Android and iPhone `preview` builds.