import { academic, canonical } from '@/lib/academic';
import { curriculumCourses } from '@/data/curriculum';
import { CourseEvidence } from '@/components/course-evidence';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { CourseRow } from '@/components/course-row';
import { Button, Chip, Divider, Glass, Screen, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { courseByCode, courseStatus, creditCondition, earnedCredits, unlocksOf } from '@/data/curriculum-helpers';

export default function CourseScreen() {
  const { code = '' } = useLocalSearchParams<{ code: string }>();
  const { tr, palette, row, completed:manualCompleted, cache, toggleCompleted, draft, toggleDraft } = useApp();
  const official=academic(cache);
  const completed=new Set([...manualCompleted,...curriculumCourses.filter(c=>official.passed.has(canonical(c.code))).map(c=>c.code)]);
  const course = courseByCode.get(code) ?? courseByCode.get(code.replace(/%20/g,' '));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/plan'));

  if (!course) {
    return (
      <Screen padBottom={false}>
        <Txt variant="h2">{code}</Txt><Txt variant="sub">{tr('مش ضمن خريطة IT المرفقة','Not in the included IT curriculum')}</Txt><CourseEvidence code={code}/>
        <Button title={tr('رجوع', 'Back')} onPress={close} />
      </Screen>
    );
  }

  const earned = official.earned??earnedCredits(completed);
  const { status, missing } = courseStatus(course, completed, earned);
  const unlocks = unlocksOf(course.code);
  const inDraft = draft.includes(course.code);
  const statusColor = status === 'completed' ? palette.success : status === 'available' ? palette.accent : palette.warn;
  const statusLabel = status === 'completed' ? (official.passed.has(canonical(course.code))?tr('ناجح في السجل','Passed in transcript'):tr('نجاح يدوي','Manual pass')) : status === 'available' ? tr('متاحة ليك', 'Available') : tr('مقفولة', 'Locked');

  return (
    <Screen padBottom={false}>
      <Pressable onPress={close} hitSlop={12} accessibilityLabel={tr('رجوع', 'Close')}>
        <Ionicons name="close-circle" size={32} color={palette.sub} />
      </Pressable>
      <View style={{ gap: 6 }}>
        <Txt variant="h1">{course.title}</Txt>
        <Txt variant="sub" color={palette.sub}>{course.code}</Txt>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          <Chip label={statusLabel} color={statusColor} active />
          <Chip label={tr(`المستوى ${course.level}`, `Level ${course.level}`)} icon="layers" />
          <Chip label={tr(`الترم ${course.semester}`, `Term ${course.semester}`)} icon="calendar" />
          <Chip label={`${course.credits} ${tr('ساعة', 'credits')}`} icon="time" />
        </View>
      </View>

      <CourseEvidence code={course.code}/>
      <Glass padding={16}>
        <Txt variant="h3">{tr('المتطلبات السابقة', 'Prerequisites')}</Txt>
        {course.prerequisites.length === 0 ? (
          <Txt variant="sub" style={{ marginTop: 6 }}>{tr('مفيش — تقدر تاخدها في أي وقت', 'None — open to take any time')}</Txt>
        ) : (
          course.prerequisites.map((p) => {
            const hours = creditCondition(p);
            const pre = courseByCode.get(p);
            const ok = !missing.includes(p);
            if (hours !== null || !pre) {
              return (
                <View key={p} style={{ flexDirection: row, alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'hourglass'} size={22} color={ok ? palette.success : palette.warn} />
                  <Txt variant="sub" style={{ flex: 1 }}>
                    {hours !== null ? tr(`تخلّص ${hours} ساعة (معاك ${earned})`, `Pass ${hours} credits (you have ${earned})`) : p}
                  </Txt>
                </View>
              );
            }
            return <CourseRow key={p} course={pre} status={courseStatus(pre, completed, earned).status} onToggle={() => toggleCompleted(pre.code)} onPress={() => router.push(`/course/${encodeURIComponent(pre.code)}`)} />;
          })
        )}
      </Glass>

      <Glass padding={16}>
        <Txt variant="h3">{tr(`بتفتحلك ${unlocks.length} مادة`, `Unlocks ${unlocks.length} courses`)}</Txt>
        {unlocks.length === 0 ? (
          <Txt variant="sub" style={{ marginTop: 6 }}>{tr('مش متطلب لمواد تانية', 'Not a prerequisite for other courses')}</Txt>
        ) : (
          unlocks.map((u, i) => (
            <View key={u.code}>
              {i > 0 ? <Divider /> : null}
              <CourseRow course={u} status={courseStatus(u, completed, earned).status} onPress={() => router.push(`/course/${encodeURIComponent(u.code)}`)} />
            </View>
          ))
        )}
      </Glass>

      <View style={{ flexDirection: row, gap: 10 }}>
        <Button
          disabled={official.passed.has(canonical(course.code))}
          title={official.passed.has(canonical(course.code))?tr('ناجح حسب السجل','Pass confirmed in transcript'):status === 'completed' ? tr('إلغاء "خلصت"', 'Unmark') : tr('علّمها ناجح', 'Mark passed manually')}
          icon={status === 'completed' ? 'close-circle' : 'checkmark-circle'}
          variant={status === 'completed' ? 'glass' : 'primary'}
          onPress={() => toggleCompleted(course.code)}
          style={{ flex: 1 }}
        />
        {status !== 'completed' ? (
          <Button
            title={inDraft ? tr('شيل من المسودة', 'Remove from draft') : tr('ضيف للمسودة', 'Add to draft')}
            icon={inDraft ? 'remove-circle' : 'add-circle'}
            variant="glass"
            onPress={() => toggleDraft(course.code)}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>
      <Txt variant="caption" center>
        {tr('نظام الجامعة هو اللي بيحدد في الآخر إذا كنت تقدر تسجل.', 'Final registration eligibility is decided by the university system.')}
      </Txt>
    </Screen>
  );
}