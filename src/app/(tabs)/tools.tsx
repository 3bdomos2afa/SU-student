import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';

import { CourseRow } from '@/components/course-row';
import { Button, Chip, Divider, EmptyState, Field, Glass, Header, ProgressBar, Screen, Segmented, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { curriculumCourses } from '@/data/curriculum';
import { GRADE_SCALE, LOAD_REFERENCES, courseByCode, courseStatus, earnedCredits, unlocksOf } from '@/data/curriculum-helpers';
import { success } from '@/lib/haptics';

type Tab = 'planner' | 'gpa';

function num(v: string) {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export default function Tools() {
  const { tr, palette, row, completed, draft, toggleDraft, setDraft, grades, setGrade, gpaBase, setGpaBase, session } = useApp();
  const [tab, setTab] = useState<Tab>('planner');
  const [load, setLoad] = useState<number>(18);
  const earned = earnedCredits(completed);

  const draftCourses = draft.map((c) => courseByCode.get(c)).filter((c): c is NonNullable<typeof c> => !!c);
  const draftHours = draftCourses.reduce((s, c) => s + c.credits, 0);
  const lockedInDraft = draftCourses.filter((c) => courseStatus(c, completed, earned).status === 'locked');

  const suggest = () => {
    const ranked = curriculumCourses
      .filter((c) => courseStatus(c, completed, earned).status === 'available')
      .sort((a, b) => a.level - b.level || unlocksOf(b.code).length - unlocksOf(a.code).length || a.semester - b.semester);
    const picked: string[] = [];
    let hours = 0;
    for (const c of ranked) {
      if (hours + c.credits <= load) {
        picked.push(c.code);
        hours += c.credits;
      }
    }
    setDraft(picked);
    success();
  };

  const shareDraft = () => {
    const lines = draftCourses.map((c) => `• ${c.code} — ${c.title} (${c.credits})`);
    Share.share({
      message: `${tr('مسودة تسجيلي', 'My registration draft')} — ${session?.name ?? ''}\n${lines.join('\n')}\n${tr('الإجمالي', 'Total')}: ${draftHours} ${tr('ساعة', 'credits')}`,
    }).catch(() => {});
  };

  // GPA projection (estimate on a 4.0 scale).
  const baseG = num(gpaBase.cgpa);
  const baseH = num(gpaBase.hours);
  const target = num(gpaBase.target);
  const graded = draftCourses.filter((c) => c.credits > 0 && grades[c.code]);
  const termH = graded.reduce((s, c) => s + c.credits, 0);
  const termPts = graded.reduce((s, c) => s + c.credits * (GRADE_SCALE.find((g) => g.grade === grades[c.code])?.points ?? 0), 0);
  const termGpa = termH ? termPts / termH : NaN;
  const haveBase = Number.isFinite(baseG) && Number.isFinite(baseH) && baseH >= 0 && baseG >= 0 && baseG <= 4;
  const projected = haveBase && termH ? (baseG * baseH + termPts) / (baseH + termH) : NaN;
  const creditDraftH = draftCourses.reduce((s, c) => s + c.credits, 0);
  const needed = haveBase && Number.isFinite(target) && creditDraftH ? (target * (baseH + creditDraftH) - baseG * baseH) / creditDraftH : NaN;

  return (
    <Screen>
      <Header title={tr('الأدوات الذكية', 'Smart tools')} subtitle={tr('خطّط ترمك واحسب معدلك المتوقع', 'Plan your term and project your GPA')} />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'planner', label: tr('مخطط التسجيل', 'Planner'), icon: 'clipboard' },
          { value: 'gpa', label: tr('حاسبة المعدل', 'GPA calculator'), icon: 'calculator' },
        ]}
      />

      {tab === 'planner' ? (
        <>
          <Glass padding={16}>
            <Txt variant="h3">{tr('اقتراح ذكي', 'Smart suggestion')}</Txt>
            <Txt variant="caption" style={{ marginTop: 4 }}>
              {tr('بيختار المواد المتاحة ليك، ويقدّم المواد اللي بتفتح مواد أكتر بعدها عشان متتأخرش.', 'Picks courses you can take, prioritising the ones that unlock the most later courses.')}
            </Txt>
            <View style={{ flexDirection: row, gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {LOAD_REFERENCES.map((l) => (
                <Chip key={l} label={`${l} ${tr('ساعة', 'cr')}`} active={load === l} onPress={() => setLoad(l)} />
              ))}
            </View>
            <Button title={tr('اقترحلي مسودة', 'Suggest a draft')} icon="sparkles" onPress={suggest} style={{ marginTop: 14 }} />
          </Glass>

          <Glass padding={16}>
            <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt variant="h3">{tr('المسودة', 'Draft')}</Txt>
              <Txt variant="label" color={draftHours > load ? palette.danger : palette.accent}>
                {draftHours} / {load} {tr('ساعة', 'cr')}
              </Txt>
            </View>
            <View style={{ marginTop: 10 }}>
              <ProgressBar value={load ? draftHours / load : 0} color={draftHours > load ? palette.danger : undefined} />
            </View>
            {lockedInDraft.length ? (
              <Txt variant="caption" color={palette.warn} style={{ marginTop: 8 }}>
                {tr('⚠️ فيه مواد متطلباتها لسه مخلصتش: ', '⚠️ Prerequisites missing for: ')}
                {lockedInDraft.map((c) => c.code).join('، ')}
              </Txt>
            ) : null}
            <Txt variant="caption" style={{ marginTop: 6 }}>
              {tr('المسودة تخطيط بس — التسجيل الفعلي بيتم من نظام الجامعة.', 'Planning only — actual registration happens in the university system.')}
            </Txt>
          </Glass>

          {draftCourses.length ? (
            <Glass padding={4}>
              {draftCourses.map((c, i) => (
                <View key={c.code}>
                  {i > 0 ? <Divider /> : null}
                  <CourseRow
                    course={c}
                    status={courseStatus(c, completed, earned).status}
                    onPress={() => router.push(`/course/${encodeURIComponent(c.code)}`)}
                    right={
                      <Pressable hitSlop={10} onPress={() => toggleDraft(c.code)} accessibilityLabel={tr('شيل', 'Remove')}>
                        <Ionicons name="remove-circle" size={24} color={palette.danger} />
                      </Pressable>
                    }
                  />
                </View>
              ))}
            </Glass>
          ) : (
            <Glass>
              <EmptyState icon="clipboard-outline" title={tr('المسودة فاضية', 'Draft is empty')} text={tr('اضغط "اقترحلي مسودة" أو ضيف مواد من الخطة', 'Tap "Suggest a draft" or add courses from the plan')} />
            </Glass>
          )}
          {draftCourses.length ? (
            <View style={{ flexDirection: row, gap: 10 }}>
              <Button title={tr('مشاركة', 'Share')} icon="share-social" variant="glass" onPress={shareDraft} style={{ flex: 1 }} />
              <Button title={tr('مسح', 'Clear')} icon="trash" variant="danger" onPress={() => setDraft([])} style={{ flex: 1 }} />
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Glass padding={16}>
            <Txt variant="h3">{tr('وضعك الحالي', 'Current standing')}</Txt>
            <View style={{ gap: 10, marginTop: 12 }}>
              <Field icon="stats-chart" placeholder={tr('المعدل التراكمي الحالي (مثال 3.12)', 'Current CGPA (e.g. 3.12)')} keyboardType="decimal-pad" value={gpaBase.cgpa} onChangeText={(v) => setGpaBase({ ...gpaBase, cgpa: v })} />
              <Field icon="time" placeholder={tr('الساعات اللي اتحسبت في المعدل', 'Credits counted in CGPA')} keyboardType="number-pad" value={gpaBase.hours} onChangeText={(v) => setGpaBase({ ...gpaBase, hours: v })} />
              <Field icon="flag" placeholder={tr('المعدل اللي عاوز توصله (اختياري)', 'Target CGPA (optional)')} keyboardType="decimal-pad" value={gpaBase.target} onChangeText={(v) => setGpaBase({ ...gpaBase, target: v })} />
            </View>
            {!gpaBase.hours && earned ? (
              <Txt variant="caption" style={{ marginTop: 8 }}>
                {tr(`حسب خطتك خلصت ${earned} ساعة.`, `Your plan shows ${earned} completed credits.`)}
              </Txt>
            ) : null}
          </Glass>

          <Glass padding={16}>
            <Txt variant="h3">{tr('توقّع درجات الترم', 'Expected grades')}</Txt>
            <Txt variant="caption" style={{ marginTop: 4 }}>
              {tr('المواد جاية من مسودة التسجيل.', 'Courses come from your registration draft.')}
            </Txt>
            {draftCourses.filter((c) => c.credits > 0).map((c) => (
              <View key={c.code} style={{ marginTop: 12, gap: 6 }}>
                <Txt variant="label">
                  {c.code} · {c.credits} {tr('س', 'cr')}
                </Txt>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {GRADE_SCALE.map((g) => (
                    <Chip key={g.grade} label={g.grade} active={grades[c.code] === g.grade} onPress={() => setGrade(c.code, g.grade)} />
                  ))}
                </ScrollView>
              </View>
            ))}
            {draftCourses.length === 0 ? <Button small variant="glass" title={tr('اعمل مسودة الأول', 'Build a draft first')} icon="clipboard" onPress={() => setTab('planner')} style={{ marginTop: 12 }} /> : null}
          </Glass>

          <Glass padding={16}>
            <View style={{ flexDirection: row, gap: 12 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Txt variant="caption" center>{tr('معدل الترم', 'Term GPA')}</Txt>
                <Txt variant="h1" center color={palette.accent}>{Number.isFinite(termGpa) ? termGpa.toFixed(2) : '—'}</Txt>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Txt variant="caption" center>{tr('التراكمي المتوقع', 'Projected CGPA')}</Txt>
                <Txt variant="h1" center color={palette.pink}>{Number.isFinite(projected) ? projected.toFixed(2) : '—'}</Txt>
              </View>
            </View>
            {Number.isFinite(needed) ? (
              <Txt variant="sub" center style={{ marginTop: 10 }} color={needed > 4 ? palette.danger : palette.text}>
                {needed > 4
                  ? tr('الهدف ده صعب توصله الترم ده لوحده — محتاج أكتر من 4.0', 'Not reachable this term alone — needs more than 4.0')
                  : tr(`محتاج متوسط ${Math.max(0, needed).toFixed(2)} في مواد المسودة عشان توصل ${target}`, `You need an average of ${Math.max(0, needed).toFixed(2)} in your draft to reach ${target}`)}
              </Txt>
            ) : null}
            <Txt variant="caption" center style={{ marginTop: 8 }}>
              {tr('تقدير على مقياس 4.0 — المعدل الرسمي من نظام الجامعة.', 'Estimate on a 4.0 scale — the official GPA comes from the university system.')}
            </Txt>
          </Glass>
        </>
      )}
    </Screen>
  );
}