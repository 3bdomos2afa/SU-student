import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Share, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { academic, canonical } from '@/lib/academic';
import { curriculumCourses } from '@/data/curriculum';
import { GRADE_SCALE, courseByCode, earnedCredits } from '@/data/curriculum-helpers';
import { LOADS, PASS_PERCENT, candidates, cappedGrade, defaultLoad, pick, projectGpa, swapCourse } from '@/lib/planner';
import { nextStudyTerm, studyLabel } from '@/lib/term-label';
import { currentCourses } from '@/lib/student';
import { gpaColor } from '@/components/gpa-chart';
import { Stat, useTerms } from '@/components/page';
import { Button, Chip, Field, Glass, Header, PressScale, Screen, Segmented, Txt } from '@/components/ui';

type Tab = 'planner' | 'gpa';
const num = (v: string) => { const n = Number(v.replace(',', '.')); return Number.isFinite(n) ? n : null; };

export default function Tools() {
  const a = useApp(); const { tr, row, palette, cache, isAr } = a;
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'gpa' ? 'gpa' : 'planner');
  useEffect(() => { if (params.tab === 'gpa' || params.tab === 'planner') setTab(params.tab); }, [params.tab]);
  const info = academic(cache); const { list, pos } = useTerms(cache);
  const failures = info.failures as Record<string, number>;
  const fails = (code: string) => failures[canonical(code)] ?? 0;

  // ---- planner ----
  const cur = list.find(t => t.current) ?? list[list.length - 1];
  const next = nextStudyTerm(cur ? pos.get(cur.serial) : undefined);
  const summer = !!next?.summer;
  const completed = useMemo(() => new Set([...a.completed, ...curriculumCourses.filter(c => info.passed.has(canonical(c.code))).map(c => c.code)]), [a.completed, info.passed]);
  const earned = info.earned ?? earnedCredits(completed);
  const cands = candidates({ completed, earned, registered: info.registered, passed: info.passed, failures });
  const [load, setLoad] = useState<number | null>(null); const L = load ?? defaultLoad(info.gpa, summer);
  const [plan, setPlan] = useState<string[] | null>(null);
  const draft = (plan ?? pick(cands, L)).filter(c => cands.some(x => x.code === c));
  const hours = draft.reduce((s, c) => s + (courseByCode.get(c)?.credits ?? 0), 0);
  const extra = cands.filter(c => !draft.includes(c.code) && hours + c.credits <= L);
  const loadHint: Record<number, string> = { 9: tr('سمر', 'Summer'), 12: tr('لو المعدل أقل من 2', 'CGPA under 2'), 18: tr('لو المعدل 2 أو أكتر', 'CGPA 2 or more'), 20: '', 21: '' };

  // ---- GPA ----
  const courses = currentCourses(cache).map(c => ({ ...c, credits: c.credits ?? courseByCode.get(c.code)?.credits ?? 3 }));
  const autoHours = info.attempted ?? info.earned;
  const [cg, setCg] = useState(''); const [hr, setHr] = useState('');
  useEffect(() => { if (!cg && info.gpa !== null) setCg(info.gpa.toFixed(2)); if (!hr && autoHours !== null) setHr(String(autoHours)); }, [info.gpa, autoHours]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const baseC = num(cg), baseH = num(hr);
  const res = projectGpa(baseC !== null && baseH !== null ? { points: baseC * baseH, hours: baseH } : null,
    courses.map(c => ({ credits: c.credits, grade: grades[c.code], attempt: fails(c.code) + 1 })));

  return <Screen>
    <Header title={tab === 'planner' ? tr('تخطيط التسجيل', 'Registration planner') : tr('حاسبة المعدل', 'GPA calculator')} subtitle={tab === 'planner' ? (next ? tr(`للترم الجاي: ${studyLabel(next, true)}`, `For next term: ${studyLabel(next, false)}`) : undefined) : tr('موادك الحالية ومعدّلك متحطين جاهزين', 'Your current courses and CGPA are filled in')} />
    <Segmented<Tab> value={tab} onChange={setTab} options={[{ value: 'planner', label: tr('التخطيط', 'Planner'), icon: 'clipboard-outline' }, { value: 'gpa', label: tr('المعدل', 'GPA'), icon: 'calculator-outline' }]} />
    {tab === 'planner' ? <>
      <Glass><View style={{ gap: 10 }}>
        <Txt variant="h3">{tr('عايز تاخد كام ساعة؟', 'How many credits?')}</Txt>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
          {LOADS.map(n => <Chip key={n} active={L === n} label={`${n}${loadHint[n] ? ` · ${loadHint[n]}` : ''}`} onPress={() => { setLoad(n); setPlan(null); }} />)}
        </View>
        <Txt variant="caption">{tr(`معدّلك ${info.gpa === null ? '—' : info.gpa.toFixed(2)} · المقترح ${defaultLoad(info.gpa, summer)} ساعة`, `CGPA ${info.gpa === null ? '—' : info.gpa.toFixed(2)} · suggested ${defaultLoad(info.gpa, summer)} credits`)}</Txt>
      </View></Glass>
      <Glass><View style={{ gap: 10 }}>
        <View style={{ flexDirection: row, justifyContent: 'space-between' }}><Txt variant="h3">{tr('المواد المقترحة', 'Suggested courses')}</Txt><Txt variant="h3" color={hours > L ? palette.danger : palette.primary}>{hours}/{L}</Txt></View>
        {!draft.length ? <Txt variant="sub">{tr('مفيش مواد متاحة دلوقتي حسب المتطلبات والسجل المحمّل.', 'No available courses based on prerequisites and loaded records.')}</Txt> : null}
        {draft.map(code => { const c = courseByCode.get(code)!; const f = fails(code);
          return <View key={code} style={{ flexDirection: row, alignItems: 'center', gap: 10, paddingVertical: 4 }}>
            <PressScale style={{ flex: 1 }} label={c.title} onPress={() => router.push(`/course/${encodeURIComponent(code)}` as never)}>
              <Txt variant="label" color={f ? palette.danger : undefined} numberOfLines={2}>{c.title}{f ? `  F×${f}` : ''}</Txt>
              <Txt variant="caption">{[code, tr(`${c.credits} ساعات`, `${c.credits} cr`), f ? tr('شيلتها قبل كده — ليها الأولوية', 'Failed before — priority') : ''].filter(Boolean).join(' · ')}</Txt>
            </PressScale>
            <Button small variant="glass" title={tr('غيّر', 'Change')} onPress={() => setPlan(swapCourse(draft, code, cands, L))} />
            <Button small variant="glass" title="✕" onPress={() => setPlan(draft.filter(d => d !== code))} />
          </View>; })}
        {extra.length ? <><Txt variant="caption">{tr('تقدر تضيف كمان:', 'You can also add:')}</Txt>
          <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>{extra.slice(0, 8).map(c => <Chip key={c.code} label={`+ ${c.code} (${c.credits})`} color={fails(c.code) ? palette.danger : undefined} onPress={() => setPlan([...draft, c.code])} />)}</View></> : null}
        <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap' }}>
          <Button small icon="share-outline" title={tr('شارك الخطة', 'Share plan')} disabled={!draft.length} onPress={() => { void Share.share({ message: draft.map(c => `${c} — ${courseByCode.get(c)?.title} (${courseByCode.get(c)?.credits})`).join('\n') + `\n${tr('الإجمالي', 'Total')}: ${hours}` }); }} />
          <Button small variant="glass" icon="refresh" title={tr('رجّع الاقتراح', 'Reset')} onPress={() => setPlan(null)} />
          <Button small variant="glass" icon="map-outline" title={tr('افتح الخريطة', 'Open the map')} onPress={() => router.push('/(tabs)/plan' as never)} />
        </View>
        <Txt variant="caption">{tr('مش بنقترح مواد نجحت فيها أو مسجّلها دلوقتي. المواد اللي شيلتها بتيجي الأول بالأحمر. التسجيل الفعلي من الموقع الرسمي.', 'Never suggests passed or currently registered courses. Failed courses come first in red. Register on the official site.')}</Txt>
      </View></Glass>
    </> : <>
      <Glass><View style={{ gap: 10 }}>
        <Txt variant="h3">{tr('وضعك دلوقتي', 'Where you are now')}</Txt>
        <View style={{ flexDirection: row, gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}><Txt variant="caption">{tr('التراكمي (CGPA)', 'CGPA')}</Txt><Field keyboardType="decimal-pad" value={cg} onChangeText={setCg} placeholder="2.00" /></View>
          <View style={{ flex: 1, gap: 4 }}><Txt variant="caption">{tr('الساعات المحسوبة', 'Counted hours')}</Txt><Field keyboardType="number-pad" value={hr} onChangeText={setHr} placeholder="60" /></View>
        </View>
        <Txt variant="caption">{tr('متحطين من سجلّك تلقائي، وتقدر تعدّلهم.', 'Filled from your record; you can edit them.')}</Txt>
      </View></Glass>
      <Glass><View style={{ gap: 12 }}>
        <Txt variant="h3">{tr('توقّع تقديرك في مواد الترم ده', 'Expected grades this term')}</Txt>
        {!courses.length ? <Txt variant="sub">{tr('موادك الحالية لسه متحمّلتش.', 'Current courses not loaded yet.')}</Txt> : null}
        {courses.map(c => { const att = fails(c.code) + 1; const g = grades[c.code];
          return <View key={c.code} style={{ gap: 6 }}>
            <Txt variant="label" color={att > 1 ? palette.danger : undefined} numberOfLines={2}>{c.title}{att > 1 ? `  F×${att - 1}` : ''}</Txt>
            <Txt variant="caption">{[c.code, tr(`${c.credits} ساعات`, `${c.credits} cr`), att >= 3 ? tr('محاولة تالتة: أقصى تقدير D', 'Third attempt: capped at D') : att === 2 ? tr('إعادة: المحاولة القديمة بتفضل في التراكمي', 'Retake: the old attempt stays in CGPA') : ''].filter(Boolean).join(' · ')}</Txt>
            <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 6 }}>
              {GRADE_SCALE.map(s => <Chip key={s.grade} active={g === s.grade} label={s.grade} color={g === s.grade && cappedGrade(s.grade, att) !== s.grade ? palette.warn : undefined} onPress={() => setGrades(x => ({ ...x, [c.code]: x[c.code] === s.grade ? '' : s.grade }))} />)}
            </View>
          </View>; })}
      </View></Glass>
      <Glass><View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap' }}>
        <Stat k={tr('معدّل الترم (GPA)', 'Term GPA')} v={res.termGpa === null ? '—' : res.termGpa.toFixed(2)} color={res.termGpa === null ? undefined : gpaColor(res.termGpa)} />
        <Stat k={tr('التراكمي الجديد (CGPA)', 'New CGPA')} v={res.cgpa === null ? '—' : res.cgpa.toFixed(2)} color={res.cgpa === null ? undefined : gpaColor(res.cgpa)} hint={res.cgpa !== null && baseC !== null ? `${res.cgpa >= baseC ? '▲' : '▼'} ${Math.abs(res.cgpa - baseC).toFixed(2)}` : undefined} />
      </View></Glass>
      <Txt variant="caption" center>{tr(`النجاح من ${PASS_PERCENT}%. المادة اللي شيلتها قبل كده ساعاتها بتتحسب تاني ومحاولتها القديمة بتفضل في التراكمي، والمحاولة التالتة أقصاها D. ده تقدير مش النتيجة الرسمية.`, `Pass mark ${PASS_PERCENT}%. A retaken course counts again and its old attempt stays in the CGPA; a third attempt is capped at D. Estimate only.`)}</Txt>
    </>}
    {isAr ? null : null}
  </Screen>;
}