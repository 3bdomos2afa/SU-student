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
    bg: ['#050816', '#0B1030', '#121A44'],
    text: '#F5F7FF',
    sub: 'rgba(226,232,255,0.72)',
    faint: 'rgba(226,232,255,0.45)',
    glassTint: 'rgba(255,255,255,0.075)',
    glassBorder: 'rgba(255,255,255,0.15)',
    glassHighlight: 'rgba(255,255,255,0.16)',
    primary: '#8B9DFF',
    accent: '#5EEAD4',
    pink: '#F472B6',
    warn: '#FBBF24',
    danger: '#FB7185',
    success: '#34D399',
    blobs: ['#6366F1', '#06B6D4', '#DB2777'],
    inputBg: 'rgba(255,255,255,0.07)',
    card: '#0E1538',
  },
  light: {
    bg: ['#EEF2FF', '#F5F3FF', '#ECFEFF'],
    text: '#0F172A',
    sub: 'rgba(15,23,42,0.68)',
    faint: 'rgba(15,23,42,0.42)',
    glassTint: 'rgba(255,255,255,0.55)',
    glassBorder: 'rgba(255,255,255,0.9)',
    glassHighlight: 'rgba(255,255,255,0.75)',
    primary: '#4F46E5',
    accent: '#0D9488',
    pink: '#DB2777',
    warn: '#D97706',
    danger: '#E11D48',
    success: '#059669',
    blobs: ['#818CF8', '#22D3EE', '#F9A8D4'],
    inputBg: 'rgba(255,255,255,0.65)',
    card: '#FFFFFF',
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