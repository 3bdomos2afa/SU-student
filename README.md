# UnicodeSIS Mobile 📱

تطبيق Expo (React Native) لأندرويد وآيفون لبوابة طلاب **UnicodeSIS** — تصميم Glass / Liquid Glass، عربي وإنجليزي، دارك ولايت.

## المميزات

- **تسجيل دخول مرة واحدة**: الجلسة بتتحفظ مشفّرة (Keychain / Keystore عن طريق `expo-secure-store`) — الطالب مش بيسجّل كل مرة.
- **قفل بالبصمة / Face ID** اختياري.
- **أوفلاين بالكامل**: كل نتيجة خدمة بتتحفظ على الجهاز. لما النت يقطع يظهر بانر «أنت أوفلاين»، ولما يرجع يظهر «النت رجع ✅» مع زرار تحديث. اسحب لتحت (pull-to-refresh) في أي صفحة.
- **18 خدمة** من UnicodeSIS (الملف، المعدل، السجل، الجدول، الحضور، الإنذارات، Moodle، التسجيل، التحليل الذكي…).
- **الخطة الدراسية IT**: 49 مادة، المتطلبات السابقة، المواد اللي كل مادة بتفتحها، تعليم المواد اللي خلصتها، نسبة التقدم من 144 ساعة.
- **مخطط تسجيل ذكي**: يقترح مسودة 12/18/21 ساعة ويقدّم المواد اللي بتفتح مواد أكتر، مع تحذير لو فيه متطلب ناقص ومشاركة المسودة.
- **حاسبة معدل**: المعدل المتوقع للترم والتراكمي، والمتوسط المطلوب عشان توصل لهدفك.
- **Liquid Glass أصلي على iOS 26+** (`expo-glass-effect`) و Blur زجاجي على باقي الأجهزة، خلفية متحركة، Haptics.

## التشغيل

```bash
npm install
npx expo start
```

افتح **Expo Go** على موبايلك وامسح الـ QR.

## الربط بـ expo.dev وعمل APK / IPA

```bash
npm i -g eas-cli
eas login
eas init            # يربط المشروع بحسابك على expo.dev
eas build -p android --profile preview   # APK للتجربة
eas build -p ios --profile production    # محتاج حساب Apple Developer
```

أو من expo.dev: **Projects → Link GitHub repository** واختار الريبو ده عشان الـ builds تشتغل تلقائي.

## ربط n8n Workflow

من **الإعدادات → ربط n8n Workflow** حط رابط الـ Webhook (أو `EXPO_PUBLIC_WORKFLOW_URL` في `.env`).
التطبيق بيبعت نفس شكل Telegram اللي الـ Router في V19/V20 بيفهمه:

- الأوامر: `callback_query.data = "SEC_PROFILE|AR"`
- النص (زي الإيميل وقت LOGIN): `message.text`
- `from.id` / `chat.id` = `app:<random>` (مش رقم طالب)
- الرد المتوقع: `{ "reply_text": "...", "route": "...", "state": "...", "authenticated": false }`

في n8n: ضيف **Webhook Trigger** → `Normalize Input` → … → **Respond to Webhook** بدل عقد Telegram Send.

> ⚠️ أي قيمة `EXPO_PUBLIC_*` بتتضمّن جوه التطبيق. متحطش مفاتيح سرية فيها — استخدم backend/proxy يحمي المفتاح ويتحقق من هوية الطالب.

من غير رابط، التطبيق بيشتغل **Demo mode** ومش بيعرض بيانات طالب مزيفة.

## الهيكل

```
src/app/            الشاشات (expo-router)
  login.tsx         تسجيل الدخول
  (tabs)/           الرئيسية · الخدمات · الخطة · الأدوات · الإعدادات
  service/[action]  تفاصيل خدمة (مع الكاش)
  course/[code]     تفاصيل مادة
src/context/        الحالة: الجلسة، الأوفلاين، الكاش، الإعدادات
src/components/     مكونات Glass
src/data/           الخطة الدراسية والخدمات
src/lib/            الـ workflow client، التخزين، الثيم
```