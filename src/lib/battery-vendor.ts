// Pure helpers (no React Native imports) for the "background notifications" settings card.
// Some Android makers kill background work even when Android itself allows it, so they need an extra step.

export type Vendor = 'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'huawei';

export function vendorOf(brand: string): Vendor | null {
  const b = (brand || '').toLowerCase();
  if (/xiaomi|redmi|poco/.test(b)) return 'xiaomi';
  if (/samsung/.test(b)) return 'samsung';
  if (/oppo|realme|oneplus/.test(b)) return 'oppo';
  if (/vivo|iqoo/.test(b)) return 'vivo';
  if (/huawei|honor/.test(b)) return 'huawei';
  return null;
}

export const VENDOR_NAME: Record<Vendor, string> = {
  xiaomi: 'شاومي / ريدمي / بوكو', samsung: 'سامسونج', oppo: 'أوبو / ريلمي / وان بلس', vivo: 'فيفو', huawei: 'هواوي / هونر',
};

/** The extra manufacturer step, written the way it appears on the phone. */
export function vendorSteps(v: Vendor, ar: boolean): string[] {
  const s: Record<Vendor, [string, string][]> = {
    xiaomi: [
      ['الإعدادات ← التطبيقات ← SU+ ← شغّل "التشغيل التلقائي"', 'Settings → Apps → SU+ → turn on "Autostart"'],
      ['وفي نفس الصفحة: توفير البطارية ← "بلا قيود"', 'Same page: Battery saver → "No restrictions"'],
    ],
    samsung: [
      ['الإعدادات ← البطارية ← حدود الاستخدام في الخلفية', 'Settings → Battery → Background usage limits'],
      ['"التطبيقات اللي مش بتنام أبداً" ← ضيف SU+', '"Never sleeping apps" → add SU+'],
    ],
    oppo: [
      ['الإعدادات ← البطارية ← SU+', 'Settings → Battery → SU+'],
      ['شغّل "السماح بالنشاط في الخلفية" و"التشغيل التلقائي"', 'Allow background activity and auto launch'],
    ],
    vivo: [
      ['i Manager ← إدارة التطبيقات ← التشغيل التلقائي ← شغّل SU+', 'i Manager → App manager → Autostart → SU+'],
      ['الإعدادات ← البطارية ← "استهلاك عالي في الخلفية" ← SU+', 'Battery → High background power consumption → SU+'],
    ],
    huawei: [
      ['الإعدادات ← البطارية ← تشغيل التطبيقات ← SU+', 'Settings → Battery → App launch → SU+'],
      ['اقفل "إدارة تلقائية" وشغّل الثلاث اختيارات', 'Turn off "Manage automatically" and enable all three'],
    ],
  };
  return s[v].map(([a, e]) => (ar ? a : e));
}

export type BatteryState = { supported: boolean; ignoring: boolean; restricted: boolean; brand: string };
/** Android lets SU+ run in the background (not battery-optimised and not background-restricted). */
export const unrestricted = (h: BatteryState) => !h.supported || (h.ignoring && !h.restricted);