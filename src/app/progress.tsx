import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { academic, number, type Row } from '@/lib/academic';
import { PROGRAM_TOTAL_CREDITS } from '@/data/curriculum-helpers';
import { Bars } from '@/components/bars';
import { gpaColor } from '@/components/gpa-chart';
import { PageTop, Stat, useTerms } from '@/components/page';
import { Button, Glass, ProgressBar, Screen, Txt } from '@/components/ui';

const pick = (r: Row | null, keys: string[]) => { for (const k of keys) { const v = number(r?.[k]); if (v !== null) return v; } return null; };
const f2 = (n: number | null) => (n === null ? '—' : n.toFixed(2));

export default function Progress() {
  const a = useApp(); const { tr, cache, palette, row } = a;
  const { list, label } = useTerms(cache); const info = academic(cache);
  const rows = list.map(t => ({
    t, gpa: number(t.summary?.GPA) ?? number(t.summary?.SemesterGPA), cgpa: number(t.summary?.CGPA),
    earned: pick(t.summary, ['EarnedCredits', 'EarnedHours']), cum: pick(t.summary, ['CumEarnedCredits', 'CumEarnedHours']),
    qp: pick(t.summary, ['QualityPoints', 'SemesterQualityPoints']), cumQp: pick(t.summary, ['CumQualityPoints', 'CumulativeQualityPoints', 'TotalQualityPoints']),
    att: pick(t.summary, ['AttemptedCredits', 'RegisteredCredits', 'SemesterCredits']),
  }));
  const last = [...rows].reverse().find(r => r.cgpa !== null || r.cum !== null);
  const cgpa = info.gpa ?? last?.cgpa ?? null;
  const earned = info.earned ?? last?.cum ?? null;
  const qpTotal = last?.cumQp ?? (rows.some(r => r.qp !== null) ? rows.reduce((s, r) => s + (r.qp ?? 0), 0) : null);
  const short = (i: number) => label(rows[i].t, 'short');
  const year = (i: number) => label(rows[i].t, 'yshort');
  return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
    <PageTop title={tr('المعدل والتقدم', 'GPA & progress')} subtitle={tr('الإجمالي فوق، وتحت تفاصيل كل ترم', 'Totals first, then every term')} />
    {!rows.length && cgpa === null ? <Glass><Txt variant="sub">{tr('السجل لسه متحمّلش. حدّث بيانات الجامعة.', 'History not loaded yet. Refresh university data.')}</Txt><Button small title={tr('تحديث', 'Refresh')} disabled={!a.session || a.refreshing} onPress={() => { void a.refreshAll(); }} /></Glass> : null}
    <Glass><View style={{ gap: 12 }}>
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
        <Stat k={tr('التراكمي (CGPA)', 'CGPA')} v={f2(cgpa)} color={cgpa === null ? undefined : gpaColor(cgpa)} />
        <Stat k={tr('ساعات مكتسبة', 'Earned credits')} v={earned === null ? '—' : String(earned)} hint={tr(`من ${PROGRAM_TOTAL_CREDITS}`, `of ${PROGRAM_TOTAL_CREDITS}`)} />
      </View>
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
        <Stat k={tr('ساعات مسجّلة', 'Attempted')} v={info.attempted === null ? '—' : String(info.attempted)} />
        <Stat k={tr('نقاط الجودة', 'Quality points')} v={qpTotal === null ? '—' : String(Math.round(qpTotal * 100) / 100)} />
        <Stat k={tr('عدد الترمات', 'Terms')} v={String(rows.length || '—')} />
      </View>
      {earned !== null ? <View style={{ gap: 4 }}><ProgressBar value={Math.min(1, earned / PROGRAM_TOTAL_CREDITS)} /><Txt variant="caption" center>{tr(`خلّصت ${Math.round((earned / PROGRAM_TOTAL_CREDITS) * 100)}% من ساعات البرنامج`, `${Math.round((earned / PROGRAM_TOTAL_CREDITS) * 100)}% of program credits done`)}</Txt></View> : null}
    </View></Glass>
    {rows.some(r => r.cum !== null) ? <Glass><View style={{ gap: 6 }}>
      <Txt variant="h3">{tr('تقدّم ساعاتك المكتسبة', 'Earned credits progress')}</Txt>
      <Txt variant="caption">{tr('إجمالي الساعات بعد كل ترم (ت1 = ترم أول، ت2 = ترم تاني، س = السنة)', 'Total credits after each term (T = term, Y = study year)')}</Txt>
      <Bars color={palette.primary} max={Math.max(PROGRAM_TOTAL_CREDITS / 2, ...rows.map(r => r.cum ?? 0))} items={rows.map((r, i) => ({ label: short(i), sub: year(i), value: r.cum }))} format={n => String(Math.round(n))} />
    </View></Glass> : null}
    {rows.some(r => r.qp !== null) ? <Glass><View style={{ gap: 6 }}>
      <Txt variant="h3">{tr('نقاط الجودة كل ترم', 'Quality points per term')}</Txt>
      <Bars color="#0D9488" items={rows.map((r, i) => ({ label: short(i), sub: year(i), value: r.qp }))} format={n => String(Math.round(n))} />
    </View></Glass> : null}
    {[...rows].reverse().map(r => <Glass key={r.t.serial} padding={14}><View style={{ gap: 8 }}>
      <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Txt variant="h3" style={{ flex: 1 }}>{label(r.t, 'long')}</Txt>
        {r.t.current ? <Txt variant="caption" color={palette.primary}>{tr('الترم الحالي', 'Current')}</Txt> : null}
      </View>
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
        <Stat k={tr('المعدل (GPA)', 'GPA')} v={f2(r.gpa)} color={r.gpa === null ? undefined : gpaColor(r.gpa)} />
        <Stat k={tr('التراكمي (CGPA)', 'CGPA')} v={f2(r.cgpa)} color={r.cgpa === null ? undefined : gpaColor(r.cgpa)} />
      </View>
      <Txt variant="caption">{[r.att !== null ? tr(`مسجّل ${r.att} ساعة`, `${r.att} attempted`) : '', r.earned !== null ? tr(`كسبت ${r.earned} ساعة`, `${r.earned} earned`) : '', r.cum !== null ? tr(`الإجمالي ${r.cum}`, `total ${r.cum}`) : '', r.qp !== null ? tr(`نقاط ${Math.round(r.qp * 100) / 100}`, `${Math.round(r.qp * 100) / 100} points`) : ''].filter(Boolean).join(' · ') || tr('ملخص الترم ده لسه مانزلش', 'No summary for this term yet')}</Txt>
    </View></Glass>)}
  </Screen>;
}