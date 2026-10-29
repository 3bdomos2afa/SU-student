import { router } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { academic, courseRows, number, text, transcriptStatus, type Row } from '@/lib/academic';
import { courseByCode } from '@/data/curriculum-helpers';
import { GpaChart, gpaColor, type GpaPoint } from '@/components/gpa-chart';
import { Expand, PageTop, Stat, useTerms } from '@/components/page';
import { Button, Glass, PressScale, Screen, Txt } from '@/components/ui';

const f2 = (n: number | null) => (n === null ? '—' : n.toFixed(2));
export default function Transcript() {
  const a = useApp(); const { tr, cache, palette, row, isAr } = a;
  const { list, label } = useTerms(cache); const info = academic(cache);
  const gpaOf = (t: (typeof list)[number]) => number(t.summary?.GPA) ?? number(t.summary?.SemesterGPA);
  const legacy = courseRows(cache, 'SEC_TRANSCRIPT');
  const points = list.map(t => ({ label: label(t, 'short'), sub: label(t, 'yshort'), gpa: number(t.summary?.GPA) ?? number(t.summary?.SemesterGPA), cgpa: number(t.summary?.CGPA) })).filter((p): p is GpaPoint => p.gpa !== null);
  const tone = (g: string) => { const s = transcriptStatus(g); return s === 'failed' ? palette.danger : s === 'passed' ? palette.success : palette.sub; };
  const title = (c: Row) => text(c.CourseNameEN) || text(c.CourseName) || courseByCode.get(text(c.CourseCode))?.title || text(c.CourseCode);
  const line = (c: Row, i: number) => { const g = text(c.GradeName) || '—'; const code = text(c.CourseCode);
    return <PressScale key={`${code}-${i}`} label={code} onPress={() => router.push(`/course/${encodeURIComponent(code)}` as never)}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 4 }}>
        <View style={{ flex: 1, gap: 2 }}><Txt variant="label" numberOfLines={2}>{title(c)}</Txt>
          <Txt variant="caption">{[text(c.CreditHours) ? tr(`${text(c.CreditHours)} ساعات`, `${text(c.CreditHours)} cr`) : ''].filter(Boolean).join(' · ')}</Txt></View>
        <Txt variant="h3" color={tone(g)}>{g}</Txt>
      </View></PressScale>; };
  const newest = [...list].reverse();
  return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
    <PageTop title={tr('السجل الدراسي', 'Transcript')} subtitle={tr('تراكمك ترم بترم — دوس على الترم تشوف مواده', 'Your CGPA term by term — tap a term for its courses')} />
    {!list.length && !legacy.length ? <Glass><Txt variant="sub">{tr('السجل لسه متحمّلش. حدّث بيانات الجامعة.', 'Not loaded yet. Refresh university data.')}</Txt><Button small title={tr('تحديث', 'Refresh')} disabled={!a.session || a.refreshing} onPress={() => { void a.refreshAll(); }} /></Glass> : null}
    {info.gpa !== null || info.earned !== null ? <Glass><View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
      <Stat k={tr('التراكمي (CGPA)', 'CGPA')} v={f2(info.gpa)} color={info.gpa === null ? undefined : gpaColor(info.gpa)} />
      <Stat k={tr('ساعات مكتسبة', 'Earned')} v={info.earned === null ? '—' : String(info.earned)} />
      <Stat k={tr('ساعات مسجّلة', 'Attempted')} v={info.attempted === null ? '—' : String(info.attempted)} />
    </View></Glass> : null}
    {points.length ? <Glass><View style={{ gap: 8 }}>
      <Txt variant="h3">{tr('التراكمي (CGPA) ترم بترم', 'CGPA term by term')}</Txt>
      <Txt variant="caption">{tr('الخط الملوّن هو التراكمي، والمتقطّع معدل الترم لوحده.', 'Colored line = CGPA, dashed = term GPA.')}</Txt>
      <GpaChart points={points} isAr={isAr} palette={palette} />
    </View></Glass> : null}
    {newest.map(t => { const gpa = gpaOf(t), cg = number(t.summary?.CGPA);
      return <Expand key={t.serial} color={(cg ?? gpa) === null ? palette.faint : gpaColor((cg ?? gpa)!)} open={t === newest[0]}
        head={<View style={{ gap: 4 }}>
          <Txt variant="h3">{label(t, 'long')}{t.current ? tr(' · الحالي', ' · current') : ''}</Txt>
          <Txt variant="caption">{`${tr('التراكمي', 'CGPA')} ${f2(cg)} · ${tr('معدل الترم', 'Term GPA')} ${f2(gpa)} · ${tr(`${t.courses.length} مادة`, `${t.courses.length} courses`)}`}</Txt>
        </View>}>
        {t.courses.length ? t.courses.map(line) : <Txt variant="sub">{tr('مفيش مواد متسجلة للترم ده.', 'No courses for this term.')}</Txt>}
        {t.summary ? <Txt variant="caption">{tr(`مكتسب لحد الترم ده ${text(t.summary.CumEarnedCredits) || '—'} ساعة`, `${text(t.summary.CumEarnedCredits) || '—'} credits earned so far`)}</Txt> : null}
      </Expand>; })}
    {!list.length && legacy.length ? <Glass><View style={{ gap: 4 }}><Txt variant="caption">{tr('ده آخر ترم بس. حدّث عشان تظهر كل الترمات.', 'Latest term only. Refresh to load every term.')}</Txt>{legacy.map(line)}</View></Glass> : null}
  </Screen>;
}