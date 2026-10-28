import { Ionicons as Ion } from '@expo/vector-icons';
import { useMemo, type ComponentProps } from 'react';
import type { ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ION_TO_LUCIDE, LUCIDE } from '@/data/lucide';

type Props = ComponentProps<typeof Ion>;

/** Drop-in for Ionicons that draws the matching Lucide line icon; unmapped names (e.g. logo-google) fall back to Ionicons. */
export function Ionicons({ name, size = 24, color = '#17161D', style, ...rest }: Props) {
  const body = LUCIDE[ION_TO_LUCIDE[String(name)] ?? ''];
  const stroke = String(color);
  const xml = useMemo(
    () => (body ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>` : ''),
    [body, stroke],
  );
  if (!body) return <Ion name={name} size={size} color={color} style={style} {...rest} />;
  return <SvgXml xml={xml} width={size} height={size} style={style as ViewStyle} accessibilityLabel={rest.accessibilityLabel} />;
}
