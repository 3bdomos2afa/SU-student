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
    bg: ['#101D1D', '#132322', '#182C29'],
    text: '#EDF4EF',
    sub: 'rgba(226,232,255,0.72)',
    faint: 'rgba(226,232,255,0.45)',
    glassTint: 'rgba(255,255,255,0.075)',
    glassBorder: 'rgba(255,255,255,0.15)',
    glassHighlight: 'rgba(255,255,255,0.16)',
    primary: '#7DCEAF',
    accent: '#5EEAD4',
    pink: '#D9B779',
    warn: '#FBBF24',
    danger: '#FB7185',
    success: '#34D399',
    blobs: ['#6366F1', '#06B6D4', '#AA6A41'],
    inputBg: 'rgba(255,255,255,0.07)',
    card: '#1D302E',
  },
  light: {
    bg: ['#F7F6F1', '#F1F4EE', '#EEF4EE'],
    text: '#173330',
    sub: '#4C6460',
    faint: '#687C77',
    glassTint: 'rgba(255,255,255,0.55)',
    glassBorder: '#DCE5DC',
    glassHighlight: 'rgba(255,255,255,0.75)',
    primary: '#236B5B',
    accent: '#0D9488',
    pink: '#AA6A41',
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