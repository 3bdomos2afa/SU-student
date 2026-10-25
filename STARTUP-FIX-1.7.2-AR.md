# إصلاح القفلة عند الفتح — SU Student 1.7.2

## اللي اتلاقى
فحص الـAPK اللي كان بيقفل (بيلد 29817d47، إصدار 1.6.3) أظهر إنه اتبنى بـ **R8 full mode** (تصغير وتشويش كود Java/Kotlin + تصغير الموارد). ده جاي من القالب الافتراضي (`android.enableMinifyInReleaseBuilds=true`).
R8 شال كلاسات بيحمّلها Expo/React Native بالـreflection أو من كود C++، منها:
- `expo.modules.ExpoModulesPackageList` (قائمة كل موديولات Expo)
- `expo.modules.splashscreen.SplashScreenManager`

ده متوافق مع اللي ظهر في الفيديو: شاشة سودا أقل من ثانية، من غير splash، والتطبيق يقفل.

## الإصلاح
`plugins/with-android-no-minify.cjs` بيقفل R8 وتصغير الموارد في بيلد أندرويد:
- `android.enableMinifyInReleaseBuilds=false`
- `android.enableShrinkResourcesInReleaseBuilds=false`
النتيجة: APK أكبر شوية، لكن كل الكلاسات موجودة.

## بصراحة
ده أقوى سبب لقيناه ومبني على فحص الـAPK نفسه، بس **ماتجرّبش على جهاز**. شاشة تقرير القفلة (1.7.1) لسه موجودة: لو قفل تاني، هتظهر وتقدر تنسخ التقرير.
