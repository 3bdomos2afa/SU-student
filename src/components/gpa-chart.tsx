// GPA per term as a colored line chart (oldest → newest), with the cumulative GPA as a dashed line.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Txt } from './ui';

export type GpaPoint = { label: string; sub: string; gpa: number; cgpa: number | null };
export function gpaColor(g: number) { return g >= 3.4 ? '#16A34A' : g >= 2.8 ? '#0EA5E9' : g >= 2.2 ? '#F59E0B' : g >= 2 ? '#F97316' : '#EF4444'; }
const BANDS: [string, string][] = [['#16A34A', '3.4+'], ['#0EA5E9', '2.8–3.4'], ['#F59E0B', '2.2–2.8'], ['#F97316', '2–2.2'], ['#EF4444', '< 2']];

export function GpaChart({ points, isAr, palette }: { points: GpaPoint[]; isAr: boolean; palette: { sub: string; faint: string; primary: string } }) {
  const [w, setW] = useState(0);
  if (!points.length) return null;
  const H = 220, top = 22, bottom = 46, left = 30, right = 20;
  const step = points.length > 1 ? Math.max(32, Math.min(66, (w - left - right - 24) / (points.length - 1))) : 66;
  const width = Math.max(w, left + right + 24 + Math.max(0, points.length - 1) * step);
  const plotW = width - left - right, plotH = H - top - bottom;
  const x = (i: number) => points.length === 1 ? left + plotW / 2 : left + 12 + (i * (plotW - 24)) / (points.length - 1);
  const y = (g: number) => top + plotH * (1 - Math.max(0, Math.min(4, g)) / 4);
  const path = (vals: (number | null)[]) => vals.map((v, i) => v === null ? '' : `${i > 0 && vals[i - 1] !== null ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(' ');
  const gpaPath = path(points.map(p => p.gpa));
  const area = points.length > 1 ? `${gpaPath} L${x(points.length - 1).toFixed(1)},${top + plotH} L${x(0).toFixed(1)},${top + plotH} Z` : '';
  const hasCgpa = points.some(p => p.cgpa !== null);
  return (
    <View style={{ gap: 10 }} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: w }}>
          <Svg width={width} height={H}>
            <Defs>
              <LinearGradient id="gpaFill" gradientUnits="userSpaceOnUse" x1="0" y1={String(top)} x2="0" y2={String(top + plotH)}>
                <Stop offset="0" stopColor={palette.primary} stopOpacity={0.3} />
                <Stop offset="1" stopColor={palette.primary} stopOpacity={0} />
              </LinearGradient>
              <LinearGradient id="gpaLine" gradientUnits="userSpaceOnUse" x1={String(x(0))} y1="0" x2={String(x(Math.max(1, points.length - 1)))} y2="0">
                {points.map((p, i) => <Stop key={i} offset={String(points.length === 1 ? 0 : i / (points.length - 1))} stopColor={gpaColor(p.gpa)} />)}
              </LinearGradient>
            </Defs>
            {[0, 1, 2, 3, 4].map(g => (
              <G key={g}>
                <Line x1={left} x2={width - right} y1={y(g)} y2={y(g)} stroke={palette.faint} strokeOpacity={0.45} strokeDasharray={g === 0 ? undefined : '3 6'} />
                <SvgText x={left - 8} y={y(g) + 4} fontSize={10} fill={palette.sub} textAnchor="end">{String(g)}</SvgText>
              </G>
            ))}
            {area ? <Path d={area} fill="url(#gpaFill)" /> : null}
            {hasCgpa ? <Path d={path(points.map(p => p.cgpa))} stroke={palette.sub} strokeWidth={1.6} strokeDasharray="5 5" fill="none" /> : null}
            {points.length > 1 ? <Path d={gpaPath} stroke="url(#gpaLine)" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {points.map((p, i) => (
              <G key={`p${i}`}>
                <Circle cx={x(i)} cy={y(p.gpa)} r={7} fill={gpaColor(p.gpa)} stroke="#FFFFFF" strokeWidth={2.5} />
                <SvgText x={x(i)} y={y(p.gpa) - 13} fontSize={11} fontWeight="700" fill={gpaColor(p.gpa)} textAnchor="middle">{p.gpa.toFixed(2)}</SvgText>
                <SvgText x={x(i)} y={H - 28} fontSize={10.5} fill={palette.sub} textAnchor="middle">{p.label}</SvgText>
                <SvgText x={x(i)} y={H - 13} fontSize={9.5} fill={palette.sub} fillOpacity={0.75} textAnchor="middle">{p.sub}</SvgText>
              </G>
            ))}
          </Svg>
        </ScrollView>
      ) : <View style={{ height: H }} />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {BANDS.map(([c, l]) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
            <Txt variant="caption">{l}</Txt>
          </View>
        ))}
        {hasCgpa ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 16, borderTopWidth: 2, borderStyle: 'dashed', borderColor: palette.sub }} />
            <Txt variant="caption">{isAr ? 'التراكمي' : 'CGPA'}</Txt>
          </View>
        ) : null}
      </View>
    </View>
  );
}