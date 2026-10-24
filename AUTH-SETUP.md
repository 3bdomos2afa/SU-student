# University Google SSO — integration contract (not deployed)

## الحالة الحقيقية
واجهة الربط موجودة في التطبيق، لكن زر Google **معطّل حتى إعداد خدمة SSO رسمية تابعة للجامعة**. فتح الموقع في متصفح خارجي لا يربط جلسة التطبيق. هذا التسليم لا يحتوي على خادم SSO جاهز أو بيانات دخول Google، ولم يتم اختبار تسجيل Google بحساب طالب.

## المطلوب من مسؤول الجامعة
1. عنوانا HTTPS لخدمة الجامعة: authorization endpoint وtoken endpoint من نفس الـorigin.
2. معرفا **public client** للتطبيق لدى تلك الخدمة: Android وiOS.
3. تسجيل callback مطابق حرفيًا: `unicodesis://oauth/callback`.
4. ربط الخادم بتطبيق Google OAuth معتمد، وبخدمة تصدر جلسة UnicodeSIS للطالب الذي أثبت هويته.

معرفا التطبيق Native:
- Android package: `com.unicodesis.student`
- iOS bundle ID: `com.unicodesis.student`

إعدادات Google وأسرارها تبقى على الخادم؛ لا تضع client secret أو رموز جلسة داخل المشروع، ولا ترسل كلمات السر في المحادثة. معرفا العميل في الملف أدناه يخصان **وسيط الجامعة**؛ ليسا مجرد نسخ لمعرف Google الظاهر في JavaScript الموقع.

## ملف الإعداد
املأ `src/lib/sso-config.json` بقيم حقيقية بعد تشغيل الخادم:
```json
{
  "authorizationEndpoint": "https://sso.YOUR-UNIVERSITY-DOMAIN/mobile/authorize",
  "tokenEndpoint": "https://sso.YOUR-UNIVERSITY-DOMAIN/mobile/token",
  "androidClientId": "REGISTERED_ANDROID_PUBLIC_CLIENT",
  "iosClientId": "REGISTERED_IOS_PUBLIC_CLIENT"
}
```
العناوين أعلاه توضيحية وغير مفعّلة. القيم الافتراضية المسلّمة فارغة عمدًا. يجب إعادة بناء التطبيق بعد تعديل الملف. `verify:source` سيبلغ عن التعديل المتوقع؛ لا يعدّ ذلك عيبًا في الملف.

## بروتوكول الخادم المطلوب
التطبيق يستخدم `expo-auth-session` ومتصفح النظام، authorization code مع PKCE S256 وstate عشوائي.

### 1. Authorization
الخادم يستقبل `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`, `code_challenge`, `code_challenge_method=S256`, و`provider=google`.
- رفض أي client أو redirect غير مسجل، دون مطابقة wildcard.
- إجراء Google OAuth عبر المتصفح، ويفضل كود خادمي مع nonce/state منفصلين لهذا المسار.
- التحقق من توقيع Google ID token، issuer، audience، expiry، nonce، email_verified وسياسة النطاق/التسجيل بالجامعة.
- ربط هوية Google الموثقة (issuer + subject) بسجل الطالب داخليًا. لا تقبل StudentID أو email يرسله الهاتف كإثبات للهوية.
- إصدار **كود مؤقت أحادي الاستعمال** مرتبط بالهوية وclient وredirect وPKCE challenge، مع صلاحية قصيرة.
- إعادة التوجيه إلى `unicodesis://oauth/callback?code=...&state=...`. لا تضع access token أو بيانات الطالب في الرابط.

### 2. Token exchange
التطبيق يرسل POST بصيغة `application/x-www-form-urlencoded`:
`grant_type=authorization_code`, `client_id`, `code`, `redirect_uri`, `code_verifier`.
- الخادم يتحقق من كل الروابط وS256 verifier، ويستهلك الكود ذريًا مرة واحدة.
- يصدر جلسة UnicodeSIS للطالب المرتبط بالهوية المتحققة، وليس لأي طالب يحدده العميل.
- الرد الموافق لهذا العميل:
```json
{
  "student": {
    "StudentID": "AUTHENTICATED_STUDENT_ID",
    "Token": "UNIVERSITY_ISSUED_BEARER_TOKEN",
    "FirstNameEN": "Student",
    "LastNameEN": "Name"
  }
}
```
`Token` هنا جلسة الجامعة وليس Google ID token. لا يعيد الخادم كلمات سر أو client secret. منع التخزين الوسيط (`Cache-Control: no-store`)، حجب الرموز عن السجلات، rate limiting وتدقيق أمني مطلوبة.

## Android وiPhone
- نفس المسار ونفس المصدر يدعمان الاثنين. PKCE يحمي الكود عند استخدام scheme خاص؛ للطرح العام يوصى بخطة verified App Links/Universal Links مع نطاق الجامعة، ثم تحديث callback في التطبيق والخادم معًا.
- اختبار الرجوع من المتصفح في نسخة مثبتة؛ ليس Expo Go أو معاينة الويب.
- إذا أنهى النظام التطبيق أثناء تسجيل الدخول، يبدأ المستخدم محاولة جديدة؛ لا يتم قبول كود بدون state وverifier المحاولة الأصلية.
- اختبر: النجاح، الإلغاء، رفض النطاق، تغيير state، verifier خاطئ، كود منتهي/مكرر، تبديل الحساب، Google revocation، انتهاء جلسة الجامعة.
- لا يوجد backend implementation في هذا الأرشيف؛ هذا عقد تكامل لربطه بالنظام المعتمد لديكم.

## مسار الجامعة القديم
لا يُستخدم مسار تسجيل يعتمد على اسم مستخدم فقط، ولا تزوير User-Agent لتجاوز حظر Google داخل WebView. الدخول العادي بالجامعة يبقى عبر الصفحة الأصلية. API الجامعة المتصل بهذا الإصدار ما زال HTTP؛ ربط Google عبر HTTPS لا يجعل بقية طلبات الجامعة مشفرة. يلزم نشر HTTPS للبوابة/API ثم تعديل العناوين والسياسة واختبارها قبل التوزيع الطلابي العام.