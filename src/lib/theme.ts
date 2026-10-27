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

export const TOXIC = { lime: '#8EFF01', purple: '#8B53FE', navy: '#1D2331', ink: '#0B0D14' } as const;

export const palettes: Record<Scheme, Palette> = {
  light: {
    bg: ['#FBF7EE', '#FBF7EE', '#FBF7EE'],
    text: '#0B0D14',
    sub: '#5E6372',
    faint: '#8C90A0',
    glassTint: '#FFFFFF',
    glassBorder: 'rgba(11,13,20,0.16)',
    glassHighlight: '#FFFFFF',
    primary: '#6F3DF0',
    accent: '#2E7D00',
    pink: '#D63C72',
    warn: '#B26B00',
    danger: '#D92D3A',
    success: '#2E8B00',
    blobs: ['#8B53FE', '#8EFF01', '#FF8FB0'],
    inputBg: '#EEE8DC',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    shadow: 'rgba(11,13,20,0.12)',
    hero: ['#8B53FE', '#7746F0', '#6B3FE0'],
    ink: '#0B0D14',
    onInk: '#F2F2F2',
    lime: '#8EFF01',
    onLime: '#0B0D14',
    purple: '#8B53FE',
    navy: '#1D2331',
    soft: '#EEE8DC',
    lil: '#E9DFFF',
    lim: '#E6FFC2',
    yel: '#FFF1BF',
    pnk: '#FFDCE6',
  },
  dark: {
    bg: ['#10131C', '#10131C', '#10131C'],
    text: '#F2F2F2',
    sub: '#9AA3B5',
    faint: '#6E7689',
    glassTint: '#1D2331',
    glassBorder: 'rgba(242,242,242,0.16)',
    glassHighlight: '#2B3245',
    primary: '#C9AEFF',
    accent: '#8EFF01',
    pink: '#FF8FB0',
    warn: '#FFD23F',
    danger: '#FF6B6B',
    success: '#8EFF01',
    blobs: ['#8B53FE', '#8EFF01', '#FF8FB0'],
    inputBg: '#2B3245',
    card: '#1D2331',
    surface: '#1D2331',
    shadow: 'rgba(0,0,0,0.4)',
    hero: ['#8B53FE', '#7746F0', '#6B3FE0'],
    ink: '#F2F2F2',
    onInk: '#0B0D14',
    lime: '#8EFF01',
    onLime: '#0B0D14',
    purple: '#8B53FE',
    navy: '#1D2331',
    soft: '#2B3245',
    lil: '#2F2856',
    lim: '#26381A',
    yel: '#3B3420',
    pnk: '#41243A',
  },
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28 };

/** Adds an alpha channel to a 6-digit hex color. */
export function alpha(hex: string, a: number) {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${v}`;
}

/** Hard, blur-less sticker shadow. */
export function hard(color: string, offset = 5) {
  return `${offset}px ${offset}px 0px ${color}`;
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