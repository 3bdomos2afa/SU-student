# سيرفر الدخول بجوجل (SU Student SSO Broker)

السيرفر ده بيخلّي الطالب يدخل الأبلكيشن بحساب جوجل بتاع الجامعة بدل اسم المستخدم وكلمة السر.

## بيشتغل إزاي
1. الأبلكيشن بيفتح `https://<السيرفر>/oauth/authorize` في متصفح النظام (Custom Tab على أندرويد وSafari sheet على آيفون).
2. السيرفر بيحوّل الطالب لجوجل. الطالب بيختار إيميل الجامعة.
3. السيرفر بيتأكد من توكن جوجل: التوقيع، والـaudience، والـnonce، وإن الإيميل متأكد ومن دومين الجامعة.
4. السيرفر بيدوّر على الطالب بالإيميل، وبيعمل له جلسة UnicodeSIS عادية.
5. الأبلكيشن بياخد كود لمرة واحدة، ويبدّله بالجلسة بـPKCE. توكن جوجل عمره ما بيوصل للموبايل.

## المطلوب من IT الجامعة
1. **Google Cloud:** اعمل OAuth Client من نوع *Web application*، وحط فيه Redirect URI:
   `https://<السيرفر>/oauth/google/callback`
2. **adapter.mjs:** اكتب دالتين بس:
   - `findStudentByEmail(email)` ← ترجع الطالب صاحب الإيميل من قاعدة بيانات SIS.
   - `issuePortalSession(student)` ← تعمل جلسة زي اللوجين العادي وترجع `{ Token, StudentID, FirstNameEN, LastNameEN }`.
   ممنوع تستخدم أي route عام بيدخل باسم المستخدم بس من غير تحقق.
3. **شغّل السيرفر على HTTPS** بالمتغيرات دي:

| المتغير | مثال |
|---|---|
| `PUBLIC_BASE_URL` | `https://sso.su.edu.eg` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | من Google Cloud |
| `ALLOWED_EMAIL_DOMAIN` | `su.edu.eg` |
| `APP_CLIENT_IDS` | `su-student-android,su-student-ios` |
| `ADAPTER` | `./adapter.mjs` |

```bash
cd server
npm test
docker build -t su-sso . && docker run -p 8080:8080 --env-file .env su-sso
```

4. **في الأبلكيشن** املا `src/lib/sso-config.json`، وبعدين اعمل build جديد:
```json
{
  "authorizationEndpoint": "https://sso.su.edu.eg/oauth/authorize",
  "tokenEndpoint": "https://sso.su.edu.eg/oauth/token",
  "androidClientId": "su-student-android",
  "iosClientId": "su-student-ios"
}
```
أول ما الملف يتملي، زرار جوجل بيشتغل لوحده.

## تجربة محلية
`ADAPTER=./adapter.mock.mjs` بيستخدم طالب وهمي من `students.mock.json`، وبيرفض يشتغل لو `NODE_ENV=production`.