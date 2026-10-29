<div align="center">

<img src="docs/images/banner.png" alt="SU+ — كل جامعتك في مكان واحد" width="100%" />

<br/>

<img src="docs/images/app-icon.png" width="96" alt="SU+ app icon" />

# SU+ · SU Plus

### كل جامعتك في مكان واحد — *Your whole university, in one place.*

A student companion app for **Sinai University**, built with Expo and React Native for **Android** (Android only). Timetable, grades, transcript, absence, KMoodle files, study streak, planner and smart notifications all live in one app.

<br/>

![Version](https://img.shields.io/badge/version-1.15.0-6A4BEF?style=for-the-badge)
![Expo SDK](https://img.shields.io/badge/Expo_SDK-58-17161D?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=17161D)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
<br/>
![Platforms](https://img.shields.io/badge/platform-Android_only-D6F77E?style=for-the-badge&labelColor=17161D)
![Tests](https://img.shields.io/badge/tests-137_passing-2ea44f?style=for-the-badge)
![expo-doctor](https://img.shields.io/badge/expo--doctor-20%2F20-2ea44f?style=for-the-badge)
![Arabic first](https://img.shields.io/badge/UI-عربي_·_English-C9BBFA?style=for-the-badge&labelColor=17161D)

[**Features**](#-features) · [**What's new**](#-whats-new-in-1150) · [**Screens**](#-screens) · [**Videos**](#-videos--posters) · [**Notifications**](#-smart-notifications) · [**Architecture**](#-architecture) · [**Getting started**](#-getting-started) · [**Docs**](#-documentation) · [**Showcase PDF**](media/SU-Plus-1.15.0-Showcase.pdf)

</div>

---

## 📌 Overview

The university already has its systems: **UnicodeSIS** (the student portal) and **KMoodle** (course files). But they are separate websites that aren't built for a phone, and neither of them tells a student when something changes.

**SU+** pulls everything into one fast, Arabic-first mobile app:

| | |
|---|---|
| 🎓 **One sign-in** | The student signs in once on the university's own page, with the university Google account. The app never sees or stores the password. |
| 🔄 **Always fresh** | Light auto-sync while the app is open, a background sync about every 15 minutes **even while the app is closed**, and a silent re-login when the session drops. |
| 🔔 **Tells you first** | 12 notification types: grades the moment they appear, absence and warnings, new lecture files, class and task reminders, and a study streak. Each type has its own switch. |
| 🔐 **Private by design** | Data is encrypted on the device (AES-GCM, with the key kept in the Android Keystore). There is no backend that holds student data. |

> [!NOTE]
> SU+ is an independent student project. It is **not an official Sinai University app**, and it is not affiliated with or endorsed by the university.

<details>
<summary><b>🇪🇬 نبذة بالعربي</b></summary>

<br/>

**SU+** أبلكيشن لطلاب جامعة سيناء، **للأندرويد بس**. بيجمع بوابة الجامعة (UnicodeSIS) وKMoodle في مكان واحد على الموبايل:

- **الرئيسية:** اسمك ورقمك، وستريك النار، و"ناجح في X ساعة"، والخدمات، ومحاضرات النهارده، والغياب، وجدول المذاكرة والمهام.
- **جدولي:** أيام الأسبوع، وكروت ملوّنة للمحاضرات والسكاشن، وعلامة "دلوقتي".
- **الدرجات والسجل والخريطة:** الكورس وورك والميد والفاينل، والـ CGPA، والمواد اللي خلصت واللي فاضلة.
- **الغياب والإنذارات:** نسبة الغياب في كل مادة.
- **ملفات مودل:** فولدر ملوّن لكل مادة، وعلامة **"ذاكرته ✓"** جنب كل ملف، والملفات القديمة مكتوب عليها السنة والترم.
- **الستريك:** كارت أحمر بنار متحركة، وعواميد المذاكرة في الأسبوع.
- **الكشكول:** ملاحظات لكل مادة بالكتابة والرسم.

بتدخل مرة واحدة بإيميل الجامعة، والأبلكيشن مش بيشوف الباسورد ولا بيحفظه. وبعدها بيدخل مودل لوحده.

بيبعتلك 12 نوع إشعار **حتى والأبلكيشن مقفول**، وكل نوع تقدر تقفله لوحده من الإعدادات:

- الدرجات أول ما تنزل
- الغياب والإنذارات
- الملفات الجديدة
- تذكير قبل المحاضرة
- ملخص المذاكرة

</details>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📚 Academics
- **Home:** your name and ID, the fire streak badge, "passed X credits", services, today's classes, absence and the study plan.
- **Timetable (جدولي):** black day chips and pastel lecture and section cards with a time column, room, instructor and a "دلوقتي" badge.
- **Grades:** coursework, quiz, midterm and final per course, plus the CGPA trend.
- **Transcript:** **CGPA-first** term-by-term chart and earned hours.
- **Absence and warnings:** percentage per course against the 25% exclusion limit.
- **Registration, courses and the degree map:** done, available and locked courses on the way to graduation.

</td>
<td width="50%" valign="top">

### 🗂️ KMoodle
- **Coloured course folders**, matched automatically to your registered courses and doctors.
- A **"studied ✓" check** next to every file.
- **Automatic sign-in** after the first Google sign-in.
- Latest files, assignments, and old copies labelled with their **year and term**.
- In-app download and open, with progress.
- **New file and assignment alerts.**
- Silent token renewal with the remembered Google account.

</td>
</tr>
<tr>
<td valign="top">

### 🔥 Study system
- **Red fire streak** with an animated flame, a daily goal (1–6 h), rest days and your longest streak.
- **Study plan on Home:** week strip, "today's progress" gauge, and tasks with a round check and lead-time reminders.
- **Focus timer** and free-study sessions, with a 24-hour time picker.
- **Weekly study chart** and an end-of-day summary.
- **Notebook (الكشكول)** of course-tagged pages with rich text, colours and drawing.

</td>
<td valign="top">

### 🧰 Tools and settings
- **GPA calculator** on the official university scale.
- **Term planner** with expected CGPA.
- **Black profile card** with passed credits, CGPA and study year.
- Arabic / English, a brighter dark mode and a **fingerprint lock**.
- A switch for each notification type, plus **masculine or feminine wording**.
- A **background-health card** for battery optimisation and maker auto-start.

</td>
</tr>
</table>

---

## 🆕 What's new in 1.15.0

- **Design back to the V14 mockups:** lavender background, pastel cards, black chips, round back button and a black pill tab bar.
- **Fonts:** Thmanyah for Arabic, Froople for Latin.
- **Home:** your name with your ID under it, a red fire streak badge, the "passed X credits" hero, services, today's classes, absence, and the study plan (week strip, "today's progress" gauge, tasks with a round check, "add task" button).
- **Streak:** red fire card with an animated flame, glow and sparks, plus a weekly study chart.
- **KMoodle:** coloured course folders, a **"studied ✓" check** next to every file, and old copies labelled with their year and term.
- **Settings:** black profile card with passed credits, CGPA and study year.
- **Study time picker:** 24-hour clock with every minute.
- **Background sync with the app closed** now works, so absence, warning, grade and KMoodle alerts arrive while SU+ is closed.
- **Wording:** سنة, سمر, الإعدادات, كورس وورك, and no course codes anywhere.

The full list is in [CHANGELOG.md](CHANGELOG.md).

---

## 📱 Screens

> Real SU+ 1.15.0 pages with **sample data**. All **26 pages** in light and dark are in [docs/SCREENS.md](docs/SCREENS.md).

<table>
<tr>
<td align="center"><img src="media/screens/light/home.jpg" width="190"/><br/><sub><b>Home</b></sub></td>
<td align="center"><img src="media/screens/light/timetable.jpg" width="190"/><br/><sub><b>Timetable</b></sub></td>
<td align="center"><img src="media/screens/light/study.jpg" width="190"/><br/><sub><b>Study plan</b></sub></td>
<td align="center"><img src="media/screens/light/streak.jpg" width="190"/><br/><sub><b>Streak</b></sub></td>
</tr>
<tr>
<td align="center"><img src="media/screens/light/moodle.jpg" width="190"/><br/><sub><b>KMoodle files</b></sub></td>
<td align="center"><img src="media/screens/light/grades.jpg" width="190"/><br/><sub><b>Grades</b></sub></td>
<td align="center"><img src="media/screens/light/transcript.jpg" width="190"/><br/><sub><b>Transcript</b></sub></td>
<td align="center"><img src="media/screens/light/plan.jpg" width="190"/><br/><sub><b>Degree map</b></sub></td>
</tr>
<tr>
<td align="center"><img src="media/screens/light/tools.jpg" width="190"/><br/><sub><b>Tools · GPA</b></sub></td>
<td align="center"><img src="media/screens/light/notebook.jpg" width="190"/><br/><sub><b>Notebook</b></sub></td>
<td align="center"><img src="media/screens/light/note.jpg" width="190"/><br/><sub><b>Notebook page</b></sub></td>
<td align="center"><img src="media/screens/light/settings.jpg" width="190"/><br/><sub><b>Settings</b></sub></td>
</tr>
</table>

---

## 🎬 Videos & posters

<table>
<tr>
<td align="center"><img src="media/gifs/demo-1.gif" width="190"/></td>
<td align="center"><img src="media/gifs/demo-2.gif" width="190"/></td>
<td align="center"><img src="media/gifs/demo-3.gif" width="190"/></td>
<td align="center"><img src="media/gifs/demo-4.gif" width="190"/></td>
</tr>
</table>

<table>
<tr>
<td align="center" width="50%"><a href="media/videos/SU-Plus-1.15.0-Demo.mp4"><img src="media/posters/00-cover.jpg" width="100%"/></a><br/><b>▶️ <a href="media/videos/SU-Plus-1.15.0-Demo.mp4">Demo video</a></b> — the live app in an Android phone</td>
<td align="center" width="50%"><a href="media/videos/SU-Plus-1.15.0-Showcase.mp4"><img src="media/posters/01-features.jpg" width="100%"/></a><br/><b>▶️ <a href="media/videos/SU-Plus-1.15.0-Showcase.mp4">Showcase video</a></b> — every feature, poster by poster</td>
</tr>
</table>

22 posters, both videos and a PDF showcase are in [docs/MEDIA.md](docs/MEDIA.md).

The full design system (colors, icons, type and motion) is in [docs/DESIGN.md](docs/DESIGN.md).

---

## 🔔 Smart notifications

| # | When | Example (Arabic UI) |
|:-:|---|---|
| N1 | Every day at 07:00 | عليك النهاردة محاضرة X الساعة 9:00 وسكشن Y الساعة 12:45 |
| N2 | 10 minutes before a class | عليك سكشن كمان 10 دقايق في روم B204 ودكتور Y |
| N3 | Coursework grade posted | درجة الكورس ورك نزلت مادة X |
| N4 | Midterm grade posted | استر يا ستااار درجات الميد ظهرت |
| N5 | Final grade posted | استر يا ستااار درجات الفاينل ظهرت |
| N6 | Each new absence | انت غبت محاضرة X ونسبة الغياب وصلت 15% |
| N7 | Attendance warning | جالك انذار اول 10% في مادة X |
| N8 | Before a planned task | جاهز ل… بعد 15 دقيقة |
| N9 | Streak at risk (21:00 / 22:00 / 23:30) | الاستريك هيضيع روح ذاكر |
| N10 | Task still undone 2 h later | متراكمش المذاكرة عشان هتندم |
| N11 | End-of-day summary | عاش ذاكرت النهاردة 3س 20د |
| N12 | New KMoodle file or assignment | الدكتور X رفع المحاضرة … مادة … |

- Every type has its own switch in **Settings → Notifications**.
- The wording follows the student's gender (taken from the university profile, or set by hand).
- There are **no noisy "synced" pings**.

How delivery and background sync with the app closed work is in [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md).

---

## 🏗️ Architecture

```mermaid
flowchart LR
  subgraph Phone["Student's phone · SU+"]
    UI["Expo Router screens"] --> Ctx["AppContext<br/>state and sync"]
    Ctx --> Plan["sync-plan<br/>light / full order"]
    Plan --> Portal["portal.ts<br/>UnicodeSIS client"]
    Ctx --> Vault[("Encrypted vault<br/>AES-GCM")]
    BG["Background task<br/>~15 min"] --> Plan
    BG --> Diff["change-alerts<br/>diff old vs new"]
    Diff --> Deliver["alert-delivery<br/>dedupe · per-type gate"]
    MoodleC["moodle.ts"] --> MA["moodle-alerts"] --> Deliver
    Rem["reminder-plan<br/>N1 N2 N8–N11"] --> Notif["expo-notifications"]
    Deliver --> Notif
  end
  Portal -- "HTTP JSON" --> SIS[("UnicodeSIS API")]
  MoodleC -- "Web-service token" --> KM[("KMoodle")]
```

The layers, modules, data flow and storage are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Tech stack

| Area | Technology |
|---|---|
| App | **Expo SDK 58**, React Native (New Architecture), **TypeScript**, Expo Router |
| UI | react-native-svg charts, Reanimated, Lucide-style icons, a custom RTL design system |
| Data | UnicodeSIS REST client, KMoodle web services, `react-native-webview` for portal sign-in |
| Background | `expo-background-task`, `expo-task-manager`, `expo-notifications` (exact alarms on Android) |
| Security | `expo-secure-store` + `@noble/ciphers` AES-GCM vault, `expo-local-authentication` |
| Native | Kotlin Expo module **SuFocus** (focus and battery health) and a Java WebView popup through a config plugin |
| Quality | Node test runner + `tsx` (**137 tests, 27 suites**), build preflight, `expo-doctor` |
| Delivery | **EAS Build** (`preview`: Android APK) |

---

## 🚀 Getting started

**Prerequisites:**
- Node.js 24 and npm.
- An Expo account with access to `@x3bdoxs-team/abdelrahman`.

```sh
npm ci                       # install exact, locked dependencies
npm run typecheck            # tsc --noEmit
npm test                     # 137 unit tests
npm run preflight            # release integrity checks
npx expo start               # run in development

# cloud builds (EAS)
npx eas-cli@latest build --profile preview --platform android
```

> [!IMPORTANT]
> - Builds from 1.12.0 onward use a **new signing key**, so uninstall the old app before installing.
> - 1.15.0 fixes background sync with the app closed and bundles new fonts, so you need a **new native build**. An OTA update is not enough.
> - After installing, open **Settings → Background notifications** and allow SU+ to run in the background.

Profiles, fonts, checks and troubleshooting are in [docs/BUILD.md](docs/BUILD.md).

---

## 📂 Project structure

```text
su-student/
├─ src/
│  ├─ app/              # Expo Router screens: (tabs), transcript, grades, moodle, streak, …
│  ├─ components/       # UI kit, charts, portal sign-in, reminders, background-health
│  ├─ context/          # AppContext: session, cache, sync orchestration
│  ├─ lib/              # 47 modules: portal, academic, moodle, notifications, vault, …
│  └─ data/             # static data (scales, maps, samples)
├─ modules/su-focus/    # native Kotlin Expo module (Android)
├─ plugins/             # Expo config plugins (Google popup, network, no-minify)
├─ server/              # optional Google SSO broker (Node) and its tests
├─ scripts/             # preflight, source verification, fonts, build helpers
├─ tests/               # 27 test suites
├─ docs/                # documentation
└─ media/               # posters, screenshots, GIFs, videos, PDF (repo only, not in builds)
```

---

## 🛡️ Privacy and security

- **No password handling:** sign-in happens on the university's own page, and the app captures only the session.
- **Encrypted at rest:** every cached record is AES-GCM encrypted, with the key in the Android Keystore.
- **No student-data server:** the app talks directly to UnicodeSIS and KMoodle from the phone.
- **Strict sign-in sandbox:** the Google popup allows only Google-owned HTTPS hosts and the portal, with no JS bridges.
- **Optional app lock** with the fingerprint.

The full details are in [docs/SECURITY.md](docs/SECURITY.md).

---

## 📖 Documentation

| Document | What's inside |
|---|---|
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Layers, modules map, sync engine, storage, diagrams |
| [FEATURES](docs/FEATURES.md) | Every screen and what it does |
| [NOTIFICATIONS](docs/NOTIFICATIONS.md) | N1–N12, scheduling, background sync with the app closed, battery and maker settings |
| [SCREENS](docs/SCREENS.md) | All 26 pages, light and dark |
| [MEDIA](docs/MEDIA.md) | Demo and showcase videos, posters and PDF |
| [UNIVERSITY-API](docs/UNIVERSITY-API.md) | UnicodeSIS endpoints, transcript chain, GPA scale, KMoodle |
| [SECURITY](docs/SECURITY.md) | Threat model, vault, sign-in sandbox |
| [DESIGN](docs/DESIGN.md) | Brand, palette, icons, typography, motion |
| [BUILD](docs/BUILD.md) | EAS profiles, release checks, troubleshooting |
| [TESTING](docs/TESTING.md) | Test suites and what they guard |
| [CHANGELOG](CHANGELOG.md) | Version history |
| [🎞️ Showcase (PDF)](media/SU-Plus-1.15.0-Showcase.pdf) | Every feature of 1.15.0, poster by poster |

<div align="center">
<br/>
<a href="media/SU-Plus-1.15.0-Showcase.pdf"><img src="media/posters/00-cover.jpg" width="60%" alt="SU+ 1.15.0 showcase"/></a>
<br/><sub>Click to open the 1.15.0 showcase (PDF)</sub>
</div>

---

<div align="center">

Made with 💜 for Sinai University students · **SU+ 1.15.0**

</div>