import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Share, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { academic, canonical } from '@/lib/academic';
import { curriculumCourses } from '@/data/curriculum';
import { GRADE_SCALE, courseByCode, earnedCredits } from '@/data/curriculum-helpers';
import { LOADS, PASS_PERCENT, cappedGrade, defaultLoad, fillPlan, projectGpa, suggestions, type PlanCourse, type Suggestion } from '@/lib/planner';
import { OptionSheet } from '@/components/dropdown';
import { studyLabel, upcomingStudyTerm } from '@/lib/term-label';
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
  const info = academic(cache); const { pos, entry } = useTerms(cache);
  const failures = info.failures as Record<string, number>;
  const fails = (code: string) => failures[canonical(code)] ?? 0;

  // ---- planner ----
  const next = upcomingStudyTerm(pos, entry);
  const summer = !!next?.summer;
  const nextSem: 1 | 2 | null = next?.kind === 'spring' ? 2 : next?.kind === 'fall' ? 1 : null;
  const completed = useMemo(() => new Set([...a.completed, ...curriculumCourses.filter(c => info.passed.has(canonical(c.code))).map(c => c.code)]), [a.completed, info.passed]);
  const earned = info.earned ?? earnedCredits(completed);
  const sugg = suggestions({ completed, earned, registered: info.registered, passed: info.passed, failures }, nextSem);
  const byCode = new Map(sugg.map(s => [s.course.code, s]));
  const [load, setLoad] = useState<number | null>(null); const L = load ?? defaultLoad(info.gpa, summer);
  const [plan, setPlan] = useState<string[] | null>(null);
  const [sheet, setSheet] = useState<{ mode: 'swap' | 'add'; code?: string } | null>(null);
  const draft = (plan ?? fillPlan(sugg, L)).filter(c => byCode.has(c));
  const hours = draft.reduce((s, c) => s + (byCode.get(c)?.course.credits ?? 0), 0);
  const hrs = (n: number) => tr(n === 0 ? 'بدون ساعات' : n === 1 ? 'ساعة' : n === 2 ? 'ساعتين' : `${n} ساعات`, `${n} cr`);
  const termOf = (c: PlanCourse) => tr(`مستوى ${c.level} · ${c.semester === 1 ? 'ترم أول' : 'ترم تاني'}`, `Level ${c.level} · Term ${c.semester}`);
  const otherTag = (c: PlanCourse) => !nextSem || c.semester === nextSem ? '' : nextSem === 2
    ? tr('من الترم الأول، ممكن تفتح في التاني وممكن لأ', 'A first-term course: it may or may not open in the second term')
    : tr('من الترم التاني، ممكن تفتح في الأول وممكن لأ', 'A second-term course: it may or may not open in the first term');
  const meta = (s: Suggestion) => [s.course.code, hrs(s.course.credits), termOf(s.course)].join(' · ');
  const freed = sheet?.mode === 'swap' && sheet.code ? byCode.get(sheet.code)?.course.credits ?? 0 : 0;
  const sheetOptions = sugg.filter(s => !draft.includes(s.course.code)).map(s => { const after = hours - freed + s.course.credits;
    return { value: s.course.code, label: s.course.title + (s.failures ? tr(` · شلتها ×${s.failures}`, ` · failed ×${s.failures}`) : ''),
      hint: [meta(s), otherTag(s.course), after > L ? tr(`هتبقى ${after}/${L} ساعة`, `would be ${after}/${L} cr`) : ''].filter(Boolean).join(' · ') }; });
  const semName = nextSem === 2 ? tr('الترم التاني', 'second-term') : nextSem === 1 ? tr('الترم الأول', 'first-term') : tr('أي ترم', 'any');
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
    <Header title={tab === 'planner' ? tr('تخطيط التسجيل', 'Registration planner') : tr('حاسبة المعدل', 'GPA calculator')} subtitle={tab === 'planner' ? (next ? tr(`للترم الجاي: ${studyLabel(next, true, 'long')}`, `Next term: ${studyLabel(next, false, 'long')}`) : undefined) : tr('موادك الحالية ومعدّلك متحطين جاهزين', 'Your current courses and CGPA are filled in')} />
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
        {draft.map(code => { const s = byCode.get(code)!; const c = s.course; const tag = otherTag(c);
          return <View key={code} style={{ flexDirection: row, alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <PressScale style={{ flex: 1 }} label={c.title} onPress={() => router.push(`/course/${encodeURIComponent(code)}` as never)}>
              <View style={{ gap: 2 }}>
                <Txt variant="label" color={s.failures ? palette.danger : undefined} numberOfLines={2}>{c.title}</Txt>
                <Txt variant="caption">{meta(s)}</Txt>
                {s.failures ? <Txt variant="caption" color={palette.danger}>{tr(`شلتها ×${s.failures} · ليها الأولوية`, `Failed ×${s.failures} · priority`)}</Txt> : null}
                {tag ? <Txt variant="caption" color={palette.warn}>{tag}</Txt> : null}
              </View>
            </PressScale>
            <Button small variant="glass" title={tr('غيّر', 'Change')} onPress={() => setSheet({ mode: 'swap', code })} />
            <Button small variant="glass" title="✕" onPress={() => setPlan(draft.filter(d => d !== code))} />
          </View>; })}
        {sheetOptions.length ? <Button small variant="glass" icon="add" title={tr('ضيف مادة', 'Add a course')} onPress={() => setSheet({ mode: 'add' })} /> : null}
        <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap' }}>
          <Button small icon="share-outline" title={tr('شارك الخطة', 'Share plan')} disabled={!draft.length} onPress={() => { void Share.share({ message: draft.map(c => { const s = byCode.get(c)!; return `${s.course.code} — ${s.course.title} (${s.course.credits})`; }).join('\n') + `\n${tr('الإجمالي', 'Total')}: ${hours}` }); }} />
          <Button small variant="glass" icon="refresh" title={tr('رجّع الاقتراح', 'Reset')} onPress={() => setPlan(null)} />
          <Button small variant="glass" icon="map-outline" title={tr('افتح الخريطة', 'Open the map')} onPress={() => router.push('/(tabs)/plan' as never)} />
        </View>
        <Txt variant="caption">{tr(`بنعرض بس المواد اللي نجحت في كل متطلباتها. الترتيب: اللي شلتها الأول، بعدين مواد ${semName}، ولو فاضل ساعات بنكمّل من الترم التاني. التسجيل الفعلي من الموقع الرسمي.`, `Only courses whose prerequisites you passed. Failed courses first, then ${semName} courses, then the other term to fill the hours. Register on the official site.`)}</Txt>
      </View></Glass>
      <OptionSheet visible={!!sheet} title={sheet?.mode === 'swap' ? tr('بدّلها بمادة تانية', 'Replace with') : tr('ضيف مادة', 'Add a course')} options={sheetOptions}
        empty={tr('مفيش مواد متاحة تانية.', 'No other available courses.')} onClose={() => setSheet(null)}
        onPick={v => { const code = String(v); setPlan(sheet?.mode === 'swap' && sheet.code ? draft.map(d => (d === sheet.code ? code : d)) : [...draft, code]); setSheet(null); }} />
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
        <Txt variant="caption">{tr('سلّم الجامعة (من خريف 2018): ', 'University scale (since Fall 2018): ') + GRADE_SCALE.map(g => `${g.grade} ${g.min ? `≥${g.min}%` : '<60%'} = ${g.points}`).join(' · ')}</Txt>
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