export type Scheme = 'light' | 'dark';

export type Palette = {
  bg: readonly [string, string, string];
  text: string;
  sub: string;
  faint: string;
  glassTint: string;
  glassBorder: string;
  glassHighlight: string;
  primary: string;
  accent: string;
  pink: string;
  warn: string;
  danger: string;
  success: string;
  blobs: readonly [string, string, string];
  inputBg: string;
  card: string;
  surface: string;
  shadow: string;
  hero: readonly [string, string, string];
  /** Sticker system ("Toxic Pulse"). */
  ink: string; // outlines, hard shadows, the floating tab bar
  onInk: string; // content drawn on an ink surface
  lime: string;
  onLime: string;
  purple: string;
  navy: string;
  soft: string; // quiet fills: tracks, segmented background
  lil: string; // pastel card fills
  lim: string;
  yel: string;
  pnk: string;
};

export const TOXIC = { lime: '#D6F77E', purple: '#6A4BEF', navy: '#17161D', ink: '#17161D' } as const;

/** SU+ palette: violet, lilac, lime and pastel cards on a soft mist background. */
export const SUPLUS = { violet: '#6A4BEF', lilac: '#C9BBFA', lime: '#D6F77E', ink: '#17161D', mist: '#F4F3F9', peach: '#FFDCC4', sky: '#CBE7FF', butter: '#FFEBA3', rose: '#FFD0DE', mint: '#C6F1DF' } as const;

export const palettes: Record<Scheme, Palette> = {
  light: {
    bg: ['#F4F3F9', '#F4F3F9', '#F4F3F9'],
    text: '#17161D', sub: '#6B6878', faint: '#9A98A6',
    glassTint: '#FFFFFF', glassBorder: 'rgba(23,22,29,0.08)', glassHighlight: '#FFFFFF',
    primary: '#6A4BEF', accent: '#4F8F12', pink: '#D9487A', warn: '#B87000', danger: '#DE3B47', success: '#3B8F22',
    blobs: ['#6A4BEF', '#D6F77E', '#FFD0DE'],
    inputBg: '#ECEAF4', card: '#FFFFFF', surface: '#FFFFFF', shadow: 'rgba(23,22,29,0.06)',
    hero: ['#7C60F3', '#6A4BEF', '#5B3DE0'],
    ink: '#17161D', onInk: '#F4F3F9', lime: '#D6F77E', onLime: '#17161D', purple: '#6A4BEF', navy: '#17161D',
    soft: '#ECEAF4', lil: '#E2D9FE', lim: '#ECF9C6', yel: '#FFEBA3', pnk: '#FFD0DE',
  },
  dark: {
    bg: ['#121118', '#121118', '#121118'],
    text: '#F4F3F9', sub: '#A9A6B8', faint: '#74717F',
    glassTint: '#1E1C26', glassBorder: 'rgba(244,243,249,0.10)', glassHighlight: '#2A2734',
    primary: '#B9A8FF', accent: '#D6F77E', pink: '#FF9DB8', warn: '#FFD46B', danger: '#FF7A7A', success: '#B8EA6A',
    blobs: ['#6A4BEF', '#D6F77E', '#FFD0DE'],
    inputBg: '#2A2734', card: '#1E1C26', surface: '#1E1C26', shadow: 'rgba(0,0,0,0.35)',
    hero: ['#7C60F3', '#6A4BEF', '#5B3DE0'],
    ink: '#2E2B3A', onInk: '#F4F3F9', lime: '#D6F77E', onLime: '#17161D', purple: '#7C60F3', navy: '#1E1C26',
    soft: '#2A2734', lil: '#2E2850', lim: '#2A3418', yel: '#3A3320', pnk: '#3D2430',
  },
};

export const radius = { sm: 14, md: 18, lg: 24, xl: 30 };

/** Adds an alpha channel to a 6-digit hex color. */
export function alpha(hex: string, a: number) {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${v}`;
}

/** Soft, diffused card shadow (the colour argument is kept for call-site compatibility). */
export function hard(_color: string, offset = 5) {
  return `0px ${offset + 3}px ${offset * 4 + 4}px rgba(23,22,29,0.07)`;
}

/** Black or white, whichever reads better on a solid hex background. */
export function readableOn(hex: string) {
  const m = /^#?([0-9a-f]{6})/i.exec(hex);
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return lum > 0.36 ? '#0B0D14' : '#FFFFFF';
}