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
};

export const palettes: Record<Scheme, Palette> = {
  dark: {
    bg: ['#0B132C', '#111E3A', '#182848'],
    text: '#EDF4EF',
    sub: 'rgba(226,232,255,0.72)',
    faint: 'rgba(226,232,255,0.45)',
    glassTint: 'rgba(255,255,255,0.075)',
    glassBorder: 'rgba(255,255,255,0.15)',
    glassHighlight: 'rgba(255,255,255,0.16)',
    primary: '#9BAFFF',
    accent: '#71D7F3',
    pink: '#C4B5FD',
    warn: '#FBBF24',
    danger: '#FB7185',
    success: '#34D399',
    blobs: ['#6366F1', '#06B6D4', '#9878DA'],
    inputBg: 'rgba(255,255,255,0.07)',
    card: 'rgba(38,55,88,0.80)',
  },
  light: {
    bg: ['#EDF4FF', '#F2F2FE', '#E8F5FD'],
    text: '#14264E',
    sub: '#536583',
    faint: '#73819B',
    glassTint: 'rgba(255,255,255,0.55)',
    glassBorder: 'rgba(255,255,255,0.95)',
    glassHighlight: 'rgba(255,255,255,0.75)',
    primary: '#3C60D7',
    accent: '#268ED0',
    pink: '#9878DA',
    warn: '#D97706',
    danger: '#E11D48',
    success: '#059669',
    blobs: ['#818CF8', '#22D3EE', '#F9A8D4'],
    inputBg: 'rgba(255,255,255,0.65)',
    card: 'rgba(255,255,255,0.72)',
  },
};

export const radius = { sm: 12, md: 18, lg: 24, xl: 32 };

/** Adds an alpha channel to a 6-digit hex color. */
export function alpha(hex: string, a: number) {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${v}`;
}