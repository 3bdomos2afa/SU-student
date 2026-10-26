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
};

export const palettes: Record<Scheme, Palette> = {
  dark: {
    bg: ['#060918', '#0E1233', '#1B1142'],
    text: '#F1F3FF',
    sub: 'rgba(222,226,255,0.72)',
    faint: 'rgba(222,226,255,0.42)',
    glassTint: 'rgba(255,255,255,0.07)',
    glassBorder: 'rgba(255,255,255,0.11)',
    glassHighlight: 'rgba(255,255,255,0.16)',
    primary: '#A5B4FC',
    accent: '#67E8F9',
    pink: '#D8B4FE',
    warn: '#FBBF24',
    danger: '#FB7185',
    success: '#34D399',
    blobs: ['#6366F1', '#06B6D4', '#A855F7'],
    inputBg: 'rgba(255,255,255,0.07)',
    card: 'rgba(30,38,74,0.82)',
    surface: "rgba(255,255,255,0.12)",
    shadow: 'rgba(0,0,0,0.28)',
    hero: ['#312E81', '#4C1D95', '#1E3A8A'],
  },
  light: {
    bg: ['#F8F8FF', '#EEF0FF', '#F6EEFF'],
    text: '#151A3B',
    sub: '#5A6283',
    faint: '#8A90AB',
    glassTint: 'rgba(255,255,255,0.6)',
    glassBorder: 'rgba(99,102,241,0.10)',
    glassHighlight: 'rgba(255,255,255,0.8)',
    primary: '#4F46E5',
    accent: '#0891B2',
    pink: '#9333EA',
    warn: '#D97706',
    danger: '#E11D48',
    success: '#059669',
    blobs: ['#818CF8', '#22D3EE', '#C084FC'],
    inputBg: 'rgba(99,102,241,0.07)',
    card: 'rgba(255,255,255,0.88)',
    surface: '#FFFFFF',
    shadow: 'rgba(55,48,163,0.09)',
    hero: ['#4F46E5', '#7C3AED', '#2563EB'],
  },
};

export const radius = { sm: 12, md: 18, lg: 24, xl: 32 };

/** Adds an alpha channel to a 6-digit hex color. */
export function alpha(hex: string, a: number) {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${v}`;
}