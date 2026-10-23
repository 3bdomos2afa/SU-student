import type { Lang } from './i18n';

/**
 * Client for the UnicodeSIS n8n workflow (V19/V20 Router contract).
 *
 * Router commands are sent as a Telegram-shaped `callback_query` with
 * `data = ACTION|AR` / `ACTION|EN`; free text (e.g. the e-mail during LOGIN)
 * is sent as `message.text`. `from.id` / `chat.id` are an opaque
 * `app:<random>` transport id, never a Telegram id or student id.
 * The workflow answers with `{ reply_text, route, state, language, authenticated }`
 * (single object or an n8n item array).
 */

export type WorkflowOk = {
  ok: true;
  mode: 'demo' | 'live';
  reply: string;
  route?: string;
  state?: string;
  authenticated?: boolean;
};
export type WorkflowResult = WorkflowOk | { ok: false; error: string };

type CallOptions = {
  url?: string;
  token?: string;
  transportId: string;
  name: string;
  lang: Lang;
  action: string;
  text?: string;
};

const TIMEOUT_MS = 25_000;
let updateCounter = Date.now() % 1_000_000;

export function resolveWorkflowUrl(custom?: string) {
  const value = (custom || process.env.EXPO_PUBLIC_WORKFLOW_URL || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(value) ? value : '';
}

export function randomId(length = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function buildPayload(o: CallOptions) {
  updateCounter += 1;
  const from = { id: o.transportId, is_bot: false, first_name: o.name || 'Student', language_code: o.lang };
  const chat = { id: o.transportId, type: 'private' };
  const base = {
    update_id: updateCounter,
    channel: 'mobile',
    transport: { kind: 'expo-mobile-app', id: o.transportId, authenticated: false },
  };
  const date = Math.floor(Date.now() / 1000);

  if (o.action === 'MESSAGE' || typeof o.text === 'string') {
    return { ...base, message: { message_id: updateCounter, date, from, chat, text: o.text ?? '' } };
  }

  const action = o.action === 'DASHBOARD' ? 'MAIN_MENU' : o.action;
  return {
    ...base,
    callback_query: {
      id: `cb_${updateCounter}`,
      from,
      chat_instance: o.transportId,
      message: { message_id: updateCounter, date, chat },
      data: `${action}|${o.lang.toUpperCase()}`,
    },
  };
}

function asString(v: unknown) {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function pickReply(data: unknown): Omit<WorkflowOk, 'ok' | 'mode'> | null {
  let item: unknown = data;
  if (Array.isArray(item)) item = item[0];
  if (item && typeof item === 'object' && 'json' in (item as Record<string, unknown>)) {
    item = (item as Record<string, unknown>).json;
  }
  if (typeof item === 'string') {
    const text = item.trim();
    return text && !text.startsWith('<') ? { reply: text } : null;
  }
  if (!item || typeof item !== 'object') return null;
  const rec = item as Record<string, unknown>;
  const reply = asString(rec.reply_text) ?? asString(rec.reply) ?? asString(rec.text);
  if (!reply) return null;
  return {
    reply,
    route: asString(rec.route),
    state: asString(rec.state),
    authenticated: rec.authenticated === true,
  };
}

/** Removes Telegram HTML formatting tags from workflow replies. */
export function cleanReply(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(b|strong|i|em|u|s|code|pre|tg-spoiler|blockquote|span)[^>]*>/gi, '')
    .replace(/<a [^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

export async function callWorkflow(o: CallOptions): Promise<WorkflowResult> {
  const url = resolveWorkflowUrl(o.url);
  if (!url) {
    await new Promise((r) => setTimeout(r, 450));
    return { ok: true, mode: 'demo', reply: demoReply(o.action, o.lang) };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const token = (o.token ?? process.env.EXPO_PUBLIC_WORKFLOW_TOKEN ?? '').trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildPayload(o)),
      signal: controller.signal,
    });
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, error: o.lang === 'ar' ? `السيرفر رجّع خطأ (${res.status})` : `Server error (${res.status})` };
    }
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // plain-text reply
    }
    const picked = pickReply(parsed);
    if (!picked) {
      return { ok: false, error: o.lang === 'ar' ? 'رد غير متوقع من الـ Workflow.' : 'Unexpected workflow response.' };
    }
    return { ok: true, mode: 'live', ...picked };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    if (o.lang === 'ar') return { ok: false, error: aborted ? 'الطلب أخد وقت طويل. جرّب تاني.' : 'تعذّر الاتصال بالسيرفر.' };
    return { ok: false, error: aborted ? 'Request timed out. Try again.' : 'Could not reach the server.' };
  } finally {
    clearTimeout(timer);
  }
}

function demoReply(action: string, lang: Lang) {
  if (action === 'LOGIN' || action === 'MESSAGE') {
    return lang === 'ar'
      ? '🧪 وضع تجريبي: تم تسجيل الدخول محليًا. أضف رابط n8n Webhook من الإعدادات عشان بياناتك الحقيقية من UnicodeSIS تظهر.'
      : '🧪 Demo mode: signed in locally. Add your n8n Webhook URL in Settings to load your real UnicodeSIS data.';
  }
  return lang === 'ar'
    ? `🧪 وضع تجريبي — الأمر ${action} جاهز ومتسجّل.\n\nمفيش رابط Workflow متضاف لسه، فمفيش بيانات طالب حقيقية هنا. أول ما تضيف رابط n8n من الإعدادات، النتيجة الفعلية من UnicodeSIS هتظهر في المكان ده وتتحفظ للاستخدام أوفلاين.`
    : `🧪 Demo mode — the ${action} command is ready.\n\nNo workflow URL is configured yet, so no real student data is shown. Once you add your n8n URL in Settings, the real UnicodeSIS result appears here and is cached for offline use.`;
}