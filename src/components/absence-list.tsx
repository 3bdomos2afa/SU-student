import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { canonical, text, type Row } from '@/lib/academic';
import { absenceByCourse, absenceDetails, absenceTone, dateOf, toneColor, warningPercent, warningRows } from '@/lib/absence';
import { currentCourses } from '@/lib/student';
import { AbsenceBar } from './academic-cards';
import { Expand, PageTop } from './page';
import { Button, Glass, Screen, Txt } from './ui';

export function AbsenceList({ mode }: { mode: 'absence' | 'warnings' }) {
  const a = useApp(); const { tr, row, palette, cache, lang } = a;
  const { code: focus } = useLocalSearchParams<{ code?: string }>();
  const by = absenceByCourse(cache); const warn = mode === 'warnings';
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';
  const day = (r: Row) => { const t = dateOf(r); return t ? new Date(t).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : text(r.AttenDay) || text(r.WeekDay) || '—'; };
  const kind = (r: Row) => { const k = text(r.TypeNameEN) || text(r.TypeName); return /lab|sec|tut/i.test(k) ? tr('سكشن', 'Section') : /lec/i.test(k) ? tr('محاضرة', 'Lecture') : k; };
  const courses = currentCourses(cache).map(c => ({ ...c, pct: by.get(canonical(c.code)) ?? null, list: warn ? warningRows(cache, c.code) : absenceDetails(cache, c.code) }))
    .sort((x, y) => (warn ? y.list.length - x.list.length : 0) || (y.pct ?? 0) - (x.pct ?? 0));
  return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
    <PageTop title={warn ? tr('إنذارات الغياب', 'Absence warnings') : tr('الغياب', 'Absence')}
      subtitle={warn ? tr('الإنذارات اللي الجامعة بعتتها بس — دوس على المادة', 'Only warnings issued by the university — tap a course') : tr('الحرمان عند 25% — دوس على المادة تشوف كل غياب', 'Exclusion at 25% — tap a course for every absence')} />
    {!courses.length ? <Glass><Txt variant="sub">{tr('لسه مفيش مواد اتحمّلت. حدّث بيانات الجامعة.', 'No courses loaded yet. Refresh university data.')}</Txt><Button small title={tr('تحديث', 'Refresh')} disabled={!a.session || a.refreshing} onPress={() => { void a.refreshAll(); }} /></Glass> : null}
    {courses.map(c => {
      const tone = toneColor(absenceTone(c.pct)); const list = c.list; const wc = list.length ? '#EF4444' : palette.success;
      return <Expand key={c.code} color={warn ? wc : tone} open={focus ? canonical(focus) === canonical(c.code) : false}
        head={<View style={{ gap: 8 }}>
          <View style={{ flexDirection: row, justifyContent: 'space-between', gap: 8 }}>
            <Txt variant="label" style={{ flex: 1 }} numberOfLines={2}>{c.title}</Txt>
            {warn ? <Txt variant="label" color={wc}>{list.length ? tr(`${list.length} إنذار`, `${list.length} warnings`) : tr('مفيش', 'None')}</Txt> : <Txt variant="h3" color={tone}>{c.pct ?? 0}%</Txt>}
          </View>
          {warn ? <Txt variant="caption">{tr(`نسبة غيابك ${c.pct ?? 0}%`, `Absence ${c.pct ?? 0}%`)}</Txt> : <AbsenceBar pct={c.pct} />}
        </View>}>
        {!list.length ? <Txt variant="sub">{warn ? tr('الجامعة مبعتتش أي إنذار في المادة دي.', 'No warning issued for this course.') : (c.pct ?? 0) > 0 ? tr('تفاصيل الغياب لسه متزامنتش. اسحب لتحت عشان تحدّث.', 'Absence details not synced yet. Pull to refresh.') : tr('مفيش غياب 👏', 'No absences 👏')}</Txt>
          : list.map((r, i) => <View key={i} style={{ flexDirection: row, alignItems: 'center', gap: 10, paddingVertical: 4 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${warn ? '#EF4444' : tone}22`, alignItems: 'center', justifyContent: 'center' }}><Txt variant="caption" color={warn ? '#EF4444' : tone}>{list.length - i}</Txt></View>
            <View style={{ flex: 1 }}>
              {warn ? <><Txt variant="label">{text(r.WarningName) || text(r.WarningTypeName) || text(r.WarningNameAR) || tr(`إنذار ${list.length - i}`, `Warning ${list.length - i}`)}{warningPercent(r) !== null ? ` · ${warningPercent(r)}%` : ''}</Txt><Txt variant="caption">{day(r)}</Txt></>
                : <><Txt variant="label">{day(r)}</Txt><Txt variant="caption">{[kind(r), text(r.SectionNumber) ? tr(`مجموعة ${text(r.SectionNumber)}`, `Group ${text(r.SectionNumber)}`) : '', text(r.AttendanceStatus)].filter(Boolean).join(' · ')}</Txt></>}
            </View>
          </View>)}
      </Expand>;
    })}
    <Txt variant="caption" center color={palette.faint}>{tr('الأبلكيشن مش بيطلّع إنذارات من عنده. بيبعتلك تنبيه لما غيابك يوصل 20%، والإنذار الرسمي بيجيلك أول ما الجامعة تنزّله.', 'The app never invents warnings. You get a heads-up at 20%, and official warnings as soon as the university issues them.')}</Txt>
  </Screen>;
}