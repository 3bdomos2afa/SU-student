import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/icon';
import { useApp } from '@/context/app-context';
import { academic, canonical } from '@/lib/academic';
import { curriculumCourses, type CurriculumCourse } from '@/data/curriculum';
import { courseStatus, creditCondition, earnedCredits, unlocksOf } from '@/data/curriculum-helpers';
import { Button, Chip, Field, Glass, Header, PressScale, Screen, Txt } from '@/components/ui';
import { Entrance } from '@/components/entrance';

/** "الخريطة": the IT curriculum as a clean, filterable list grouped term by term. */
type St = 'passed' | 'registered' | 'available' | 'locked';
export const MAP_COLORS: Record<St, string> = { passed: '#10B981', registered: '#F59E0B', available: '#6366F1', locked: '#94A3B8' };
const ICON = { passed: 'checkmark-circle', registered: 'time', available: 'lock-open', locked: 'lock-closed' } as const;
const byCode = new Map(curriculumCourses.map(c => [c.code, c]));
const TOTAL = curriculumCourses.reduce((s, c) => s + c.credits, 0);
const YEAR_AR = ['أولى', 'تانية', 'تالتة', 'رابعة'];
const termIndex = (c: CurriculumCourse) => (c.level - 1) * 2 + c.semester - 1;

export default function MapScreen() {
  const { tr, row, palette, completed, courseNotes, cache } = useApp();
  const data = useMemo(() => academic(cache), [cache]);
  const [year, setYear] = useState(0);
  const [filter, setFilter] = useState<St | 'all'>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState('');
  const combined = useMemo(() => new Set([...completed, ...curriculumCourses.filter(c => data.passed.has(canonical(c.code))).map(c => c.code)]), [completed, data]);
  const credits = data.earned ?? earnedCredits(combined);
  const info = useMemo(() => new Map(curriculumCourses.map(c => {
    const key = canonical(c.code), note = courseNotes[c.code];
    const passed = data.passed.has(key) || completed.has(c.code);
    const registered = !passed && (data.registered.has(key) || !!note?.registered);
    const failures = data.failures[key] ?? note?.failures ?? 0;
    const manual = (!data.passed.has(key) && completed.has(c.code)) || (!data.registered.has(key) && !!note?.registered) || (!data.failures[key] && !!note?.failures);
    const cs = courseStatus(c, combined, credits);
    const status: St = passed ? 'passed' : registered ? 'registered' : cs.status === 'locked' ? 'locked' : 'available';
    return [c.code, { status, failures, manual, missing: cs.missing }];
  })), [data, completed, courseNotes, combined, credits]);
  const label: Record<St, string> = {
    passed: tr('خلّصتها', 'Passed'), registered: tr('بتاخدها دلوقتي', 'In progress'),
    available: tr('متاحة ليك', 'Available'), locked: tr('مستنية متطلب', 'Locked'),
  };
  const count = (s: St) => curriculumCourses.filter(c => info.get(c.code)?.status === s).length;
  const pct = TOTAL ? Math.min(100, Math.round((credits / TOTAL) * 100)) : 0;
  const q = query.trim().toLowerCase();
  const shown = curriculumCourses.filter(c => (!year || c.level === year) && (filter === 'all' || info.get(c.code)?.status === filter) && (!q || `${c.title} ${c.code}`.toLowerCase().includes(q)));
  const groups = Array.from({ length: 8 }, (_, i) => shown.filter(c => termIndex(c) === i)).map((list, i) => ({ i, list })).filter(g => g.list.length);
  const termName = (i: number) => tr(`سنة ${YEAR_AR[Math.floor(i / 2)]} · ترم ${i % 2 ? 'تاني' : 'أول'}`, `Year ${Math.floor(i / 2) + 1} · Term ${(i % 2) + 1}`);
  const jump = (code: string) => { const c = byCode.get(code); if (c) { setYear(c.level); setFilter('all'); setQuery(''); setOpen(code); } };
  const project = Math.min(100, Math.round((credits / 95) * 100));

  return <Screen>
    <Header title={tr('الخريطة', 'Map')} subtitle={tr('دي كل مواد تخصصك ترم بترم. دوس على أي مادة وشوف بتفتحلك إيه.', 'Your whole major, term by term. Tap a course to see what it unlocks.')} />

    <Entrance>
      <Glass padding={18} tint={palette.ink}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: row, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Txt variant="caption" color={palette.onInk}>{tr('ساعاتك الناجحة', 'Passed credits')}</Txt>
              <Txt variant="display" color={palette.onInk}>{credits}<Txt variant="sub" color={palette.onInk}>{` / ${TOTAL}`}</Txt></Txt>
            </View>
            <View style={{ backgroundColor: palette.lime, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 2 }}><Txt variant="h3" color={palette.onLime}>{pct}%</Txt></View>
          </View>
          <View style={{ height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
            <View style={{ width: `${pct}%`, height: '100%', borderRadius: 6, backgroundColor: palette.lime }} />
          </View>
          <View style={{ flexDirection: row, gap: 8 }}>
            {(['passed', 'registered', 'available', 'locked'] as St[]).map(s => <PressScale key={s} label={label[s]} style={{ flex: 1 }} onPress={() => setFilter(f => f === s ? 'all' : s)}>
              <View style={{ alignItems: 'center', paddingVertical: 8, borderRadius: 14, backgroundColor: filter === s ? MAP_COLORS[s] + '33' : palette.inputBg, borderWidth: 1, borderColor: filter === s ? MAP_COLORS[s] : 'transparent' }}>
                <Txt variant="h3" color={MAP_COLORS[s]}>{count(s)}</Txt>
                <Txt variant="caption" center numberOfLines={1} style={{ fontSize: 10.5 }}>{label[s]}</Txt>
              </View>
            </PressScale>)}
          </View>
          {data.earned === null ? <Txt variant="caption">{tr('الساعات دي محسوبة من اللي معلّمه في الخطة، مش من السيستم.', 'Credits are estimated from the plan, not the official record.')}</Txt> : null}
        </View>
      </Glass>
    </Entrance>

    <Field icon="search" value={query} onChangeText={setQuery} placeholder={tr('دوّر على مادة بالاسم أو الكود', 'Search by name or code')} />
    <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 6 }}>
      <Chip label={tr('الكل', 'All')} active={!year} onPress={() => setYear(0)} />
      {[1, 2, 3, 4].map(y => <Chip key={y} label={tr(`سنة ${YEAR_AR[y - 1]}`, `Year ${y}`)} active={year === y} onPress={() => setYear(y)} />)}
    </View>

    {!groups.length ? <Glass><Txt center>{tr('مفيش مواد بالفلتر ده. جرّب تشيله.', 'No courses match this filter.')}</Txt></Glass> : null}

    {groups.map(({ i, list }, gi) => <Entrance key={i} delay={Math.min(gi, 6) * 60} style={{ gap: 8 }}>
      <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 6 }}>
        <Txt variant="h3">{termName(i)}</Txt>
        <Txt variant="caption">{tr(`${list.length} مواد · ${list.reduce((s, c) => s + c.credits, 0)} ساعة`, `${list.length} courses · ${list.reduce((s, c) => s + c.credits, 0)} cr`)}</Txt>
      </View>
      {list.map(c => {
        const it = info.get(c.code)!; const color = MAP_COLORS[it.status]; const isOpen = open === c.code;
        const unlocks = unlocksOf(c.code);
        return <View key={c.code} style={{ borderRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: isOpen ? color : palette.glassBorder, overflow: 'hidden' }}>
          <PressScale label={c.title} onPress={() => setOpen(o => o === c.code ? '' : c.code)}>
            <View style={{ flexDirection: row, alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={ICON[it.status]} size={19} color={color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="label" numberOfLines={2}>{c.title}</Txt>
                <Txt variant="caption">{c.credits} {tr('ساعات', 'cr')}{it.manual ? tr(' · إنت معلّمها', ' · manual') : ''}</Txt>
              </View>
              {it.failures > 0 ? <View style={{ backgroundColor: '#E11D48', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}><Txt variant="caption" color="#fff">F×{it.failures}</Txt></View> : null}
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.faint} />
            </View>
          </PressScale>
          {isOpen ? <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: palette.glassBorder }}>
            <View style={{ flexDirection: row }}><View style={{ backgroundColor: color + '22', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}><Txt variant="caption" color={color}>{label[it.status]}</Txt></View></View>
            <Txt variant="caption">{tr('محتاجة قبلها', 'Needs first')}</Txt>
            {c.prerequisites.length ? <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 6 }}>
              {c.prerequisites.map(p => {
                const hours = creditCondition(p); const done = hours !== null ? credits >= hours : combined.has(p);
                const name = hours !== null ? tr(`${hours} ساعة ناجحة`, `${hours} passed credits`) : byCode.get(p)?.title ?? p;
                return <Chip key={p} label={`${done ? '✓ ' : ''}${name}`} color={done ? MAP_COLORS.passed : MAP_COLORS.locked} onPress={hours === null && byCode.has(p) ? () => jump(p) : undefined} />;
              })}
            </View> : <Txt variant="sub">{tr('ولا حاجة، تقدر تاخدها على طول.', 'Nothing, it is open.')}</Txt>}
            {unlocks.length ? <>
              <Txt variant="caption">{tr('بتفتحلك', 'Unlocks')}</Txt>
              <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 6 }}>
                {unlocks.map(u => <Chip key={u.code} label={u.title} onPress={() => jump(u.code)} />)}
              </View>
            </> : null}
            <Button small variant="glass" icon="open-outline" title={tr('تفاصيل المادة', 'Course details')} onPress={() => router.push(`/course/${encodeURIComponent(c.code)}`)} />
          </View> : null}
        </View>;
      })}
    </Entrance>)}

    <Glass padding={18}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <Ionicons name="rocket-outline" size={22} color={palette.primary} />
          <Txt variant="h3" style={{ flex: 1 }}>{tr('مشروع التخرج', 'Graduation project')} · INT 498</Txt>
        </View>
        <Txt>{tr(`محتاج 95 ساعة ناجحة. معاك ${credits} لحد دلوقتي.`, `Needs 95 passed credits. You have ${credits}.`)}</Txt>
        <View style={{ height: 8, borderRadius: 5, backgroundColor: palette.inputBg, overflow: 'hidden' }}>
          <View style={{ width: `${project}%`, height: '100%', backgroundColor: project >= 100 ? MAP_COLORS.passed : palette.accent }} />
        </View>
        <Txt variant="caption">{tr('المواد اللي بتاخدها دلوقتي مش بتتحسب غير لما تنجح فيها.', 'In-progress courses count only after you pass them.')}</Txt>
        <Button small variant="glass" title={tr('وريني المادة', 'Show me')} onPress={() => jump('INT 498')} />
      </View>
    </Glass>
    <Txt variant="caption" center>{tr('الخريطة دي لتخصص IT. النجاح والرسوب من سجلك الرسمي، واللي إنت معلّمه بإيدك مكتوب جنبه.', 'IT curriculum. Pass/fail from your record; manual marks are labeled.')}</Txt>
  </Screen>;
}