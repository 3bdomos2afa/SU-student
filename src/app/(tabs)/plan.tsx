import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CourseRow } from '@/components/course-row';
import { Chip, Divider, EmptyState, Field, Glass, Header, ProgressBar, Screen, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { curriculumCourses } from '@/data/curriculum';
import { LISTED_CREDITS, PROGRAM_TOTAL_CREDITS, courseStatus, earnedCredits, type CourseStatus } from '@/data/curriculum-helpers';

type Filter = 'all' | CourseStatus;

export default function Plan() {
  const { tr, palette, row, completed, toggleCompleted } = useApp();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const earned = earnedCredits(completed);
  const query = q.trim().toLowerCase();
  const items = curriculumCourses.map((c) => ({ c, ...courseStatus(c, completed, earned) }));
  const count = (s: CourseStatus) => items.filter((i) => i.status === s).length;
  const visible = items.filter(
    (i) => (filter === 'all' || i.status === filter) && (!query || `${i.c.code} ${i.c.title}`.toLowerCase().includes(query)),
  );

  const groups: { key: string; level: number; semester: number; list: typeof visible }[] = [];
  for (const i of visible) {
    const key = `${i.c.level}-${i.c.semester}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, level: i.c.level, semester: i.c.semester, list: [] };
      groups.push(g);
    }
    g.list.push(i);
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: `${tr('الكل', 'All')} ${items.length}` },
    { id: 'completed', label: `${tr('خلصت', 'Done')} ${count('completed')}` },
    { id: 'available', label: `${tr('متاحة', 'Available')} ${count('available')}` },
    { id: 'locked', label: `${tr('مقفولة', 'Locked')} ${count('locked')}` },
  ];

  return (
    <Screen>
      <Header title={tr('الخطة الدراسية', 'Study plan')} subtitle={tr('Information Technology · اضغط الدايرة لما تخلص مادة', 'Information Technology · tap the circle when you finish a course')} />
      <Glass padding={16}>
        <View style={{ flexDirection: row, justifyContent: 'space-between', marginBottom: 8 }}>
          <Txt variant="label">
            {earned} / {PROGRAM_TOTAL_CREDITS} {tr('ساعة', 'credits')}
          </Txt>
          <Txt variant="label" color={palette.accent}>
            {Math.round((earned / PROGRAM_TOTAL_CREDITS) * 100)}%
          </Txt>
        </View>
        <ProgressBar value={earned / PROGRAM_TOTAL_CREDITS} height={10} />
        {LISTED_CREDITS !== PROGRAM_TOTAL_CREDITS ? (
          <Txt variant="caption" style={{ marginTop: 8 }}>
            {tr(
              `إجمالي البرنامج ${PROGRAM_TOTAL_CREDITS} ساعة، والمواد المسجّلة هنا مجموعها ${LISTED_CREDITS}. الفرق ${PROGRAM_TOTAL_CREDITS - LISTED_CREDITS} ساعة محتاج تأكيد من الكلية.`,
              `Program total is ${PROGRAM_TOTAL_CREDITS} credits; listed courses add up to ${LISTED_CREDITS}. The ${PROGRAM_TOTAL_CREDITS - LISTED_CREDITS}-credit gap needs confirmation from the faculty.`,
            )}
          </Txt>
        ) : null}
      </Glass>
      <Field icon="search" placeholder={tr('دوّر بالكود أو الاسم…', 'Search code or title…')} value={q} onChangeText={setQ} autoCapitalize="characters" />
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
        {filters.map((f) => (
          <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </View>

      {groups.map((g) => {
        const done = g.list.filter((i) => i.status === 'completed').length;
        const hours = g.list.reduce((s, i) => s + i.c.credits, 0);
        const allDone = done === g.list.length;
        return (
          <View key={g.key} style={{ gap: 8 }}>
            <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
              <View>
                <Txt variant="h3">{tr(`المستوى ${g.level} · الترم ${g.semester}`, `Level ${g.level} · Term ${g.semester}`)}</Txt>
                <Txt variant="caption">
                  {done}/{g.list.length} · {hours} {tr('ساعة', 'credits')}
                </Txt>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => g.list.forEach((i) => (allDone || i.status !== 'completed') && toggleCompleted(i.c.code))}>
                <Txt variant="caption" color={palette.primary} weight="700">
                  {allDone ? tr('إلغاء الكل', 'Unmark all') : tr('علّم الترم كله', 'Mark term done')}
                </Txt>
              </Pressable>
            </View>
            <Glass padding={4}>
              {g.list.map((i, idx) => (
                <View key={i.c.code}>
                  {idx > 0 ? <Divider /> : null}
                  <CourseRow
                    course={i.c}
                    status={i.status}
                    onToggle={() => toggleCompleted(i.c.code)}
                    onPress={() => router.push(`/course/${encodeURIComponent(i.c.code)}`)}
                  />
                </View>
              ))}
            </Glass>
          </View>
        );
      })}
      {visible.length === 0 ? <EmptyState icon="search" title={tr('مفيش مواد', 'No courses')} /> : null}
    </Screen>
  );
}