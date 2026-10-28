# 🛡️ Security and privacy

[← Back to README](../README.md)

## Principles

1. **Never touch passwords.** Sign-in happens on the university's own page (or Google's) inside a WebView. The app only receives the resulting session.
2. **Keep data on the phone.** There is no SU+ backend that stores student data.
3. **Encrypt everything at rest.**
4. **Least privilege** for every web view and permission.

## Encrypted vault

| Piece | Detail |
|---|---|
| Key | 256-bit random key, generated once and stored in the **Keychain / Keystore** (`expo-secure-store`) |
| Cipher | **AES-GCM** (`@noble/ciphers`), authenticated, with a fresh nonce per write |
| Storage | AsyncStorage holds ciphertext only |
| Web preview | Memory-only; university credentials are never persisted |

## Sign-in sandbox (Android Google popup)

- Allows only **HTTPS Google-owned hosts** (`google.com`, `google.com.eg`, `gstatic.com`, `googleusercontent.com`, `googleapis.com`, `accounts.youtube.com`) and the portal host.
- **No** `addJavascriptInterface`, no `evaluateJavascript` and no `postMessage` bridge.
- Certificate errors are cancelled and never proceeded.
- URLs with user-info are rejected, and the port is restricted.
- When the flow reaches the portal, the popup closes and the portal page completes the sign-in.

These rules are enforced by tests (`tests/google-trial.test.ts`), including evil-host checks.

## Silent re-login

- Runs only for the **same student**, only while online, with a 10-minute cooldown and a 45-second timeout.
- If it fails, the app shows a normal "sign in" button. It never loops.

## Permissions

| Permission | Why |
|---|---|
| `POST_NOTIFICATIONS` | Show notifications (Android 13+) |
| `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` | On-time class and task reminders |
| `RECEIVE_BOOT_COMPLETED` | Re-arm reminders after a reboot |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Lets the student exempt SU+ from battery optimisation, so background alerts aren't delayed |
| Face ID / biometrics | Optional app lock |

## Reporting

Please open a GitHub issue **without** any personal data, student code or session values.