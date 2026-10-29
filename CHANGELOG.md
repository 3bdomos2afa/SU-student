# Changelog

## 1.15.0
- **Android only.** Releases and docs now target Android.
- **Design back to the V14 mockups:** lavender background, pastel cards, black active chips, round back button, black pill tab bar.
- **Fonts:** Thmanyah for Arabic, Froople for Latin.
- **Home:** name with the ID under it, red fire streak badge, "passed X credits" hero, then services, today's classes, absence and the study plan (week strip, "today's progress" gauge, tasks with a round check, "add task" button).
- **Timetable "جدولي":** black day chips, pastel class cards and a time column.
- **Streak:** red fire card with an animated flame, glow and sparks, plus a weekly study bars card.
- **KMoodle:** coloured course folders, a "studied ✓" check next to every file, and old copies labelled with their year and term (no "unknown").
- **Settings:** black profile card with passed credits, CGPA and study year.
- **Study time picker:** 24-hour clock, every minute, durations every 5 minutes.
- **Wording:** سنة instead of مستوى, سمر instead of صيفي, الإعدادات instead of على راحتك, كورس وورك instead of أعمال السنة. No course codes anywhere.
- **Silent Google re-login** and **automatic KMoodle sign-in** after the first Google sign-in (Android).
- **Fixed background sync with the app closed:** the sync task is now defined in `index.js` before Expo Router, so absence, warnings, grades and KMoodle alerts arrive while SU+ is closed. Settings shows the last background check.
- **Docs:** new README banner, GIF previews, every page in light and dark, 22 posters, demo and showcase videos and a showcase PDF. The old 1.12 mockups and presentation were removed.

## 1.14.1
- Aligned Expo SDK 58 patch versions: `expo` 58.0.20, `expo-auth-session` 58.0.15, `expo-file-system` 58.0.12, `expo-router` 58.0.27 and `expo-web-browser` 58.0.7.
- `expo-doctor` now passes 20/20, which fixes the EAS build check.

## 1.14.0
- New **Background notifications** card in Settings:
  - Shows the battery-optimisation status.
  - Opens the official Android dialog.
  - Gives maker auto-start steps for Xiaomi, Samsung, Oppo/Realme, Vivo and Huawei/Honor.
  - Shows the iOS Background App Refresh hint.

## 1.13.0
- **12 notification types (N1–N12)**, each with its own switch, and gender-aware wording.
- Exact-alarm delivery and a high-importance channel, so reminders arrive on time.
- Silent re-login for the portal and KMoodle, and no more noisy "synced" or "sign in again" notifications.
- Fixed the Google popup that spun forever after the password step.
- The transcript is now **CGPA-first**.
- The bug-report page is hidden and replaced with a friendly retry screen.

## 1.12.0 — SU+
- Full redesign: new name and icon, violet / lilac / lime palette, Lucide icons, dark pill tab bar and confetti.

## 1.11.x
- KMoodle course folders, study streak, remembered Google sign-in, and the "Toxic Pulse" UI.

## 1.10.x
- Notebook, planner, term planner and settings.

## 1.7.x – 1.9.x
- Startup hardening, Google sign-in inside the portal page on Android, and the map screen.

## 1.0 – 1.6
- First releases: portal sign-in, timetable, grades, transcript and absence.