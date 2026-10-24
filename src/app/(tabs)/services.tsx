import { endpoints } from '@/lib/portal';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Chip, EmptyState, Field, Glass, Header, IconBadge, PressScale, Screen, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { academicServices, type ServiceGroup } from '@/data/services';
import { timeAgo } from '@/lib/format';

export default function Services() {
  const { tr, lang, palette, row, cache, refreshAll, refreshing } = useApp();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<ServiceGroup | 'all'>('all');
  const query = q.trim().toLowerCase();
  const list = academicServices.filter(
    (s) =>
      (group === 'all' || s.group === group) &&
      (!query || `${s.title.ar} ${s.title.en} ${s.desc.ar} ${s.desc.en}`.toLowerCase().includes(query)),
  );
  const groups: { id: ServiceGroup | 'all'; label: string }[] = [
    { id: 'all', label: tr('الكل', 'All') },
    { id: 'records', label: tr('بياناتي ونتائجي', 'Records') },
    { id: 'learning', label: tr('الدراسة', 'Learning') },
    { id: 'registration', label: tr('التسجيل', 'Registration') },
  ];

  return (
    <Screen refreshing={refreshing} onRefresh={refreshAll}>
      <Header title={tr('الخدمات', 'Services')} subtitle={tr('الخدمات المدعومة بتتحفظ أوفلاين، والباقي من الموقع الرسمي', 'Supported records are saved offline; other services open on the official site')} />
      <Field icon="search" placeholder={tr('دوّر على خدمة…', 'Search services…')} value={q} onChangeText={setQ} />
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
        {groups.map((g) => (
          <Chip key={g.id} label={g.label} active={group === g.id} onPress={() => setGroup(g.id)} />
        ))}
      </View>
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 12 }}>
        {list.map((s) => {
          const c = cache[s.action];
          return (
            <PressScale key={s.action} onPress={() => router.push(s.action==='ACADEMIC_ANALYSIS'?'/tools':`/service/${s.action}`)} style={{ width: '47%', flexGrow: 1 }} label={s.title[lang]}>
              <Glass padding={14} style={{ minHeight: 150 }}>
                <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <IconBadge icon={s.icon} color={palette[s.color]} />
                  {c ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: palette.success, marginTop: 4 }} /> : null}
                </View>
                <Txt variant="label" style={{ marginTop: 10 }} numberOfLines={1}>
                  {s.title[lang]}
                </Txt>
                <Txt variant="caption" numberOfLines={2}>
                  {s.desc[lang]}
                </Txt>
                <Txt variant="caption" color={c ? palette.success : palette.faint} style={{ marginTop: 4 }} numberOfLines={1}>
                  {c ? `${tr('محفوظ', 'Saved')} · ${timeAgo(c.at, lang)}` : endpoints[s.action] ? tr('جاهزة للمزامنة', 'Ready to sync') : tr('من الموقع الرسمي', 'Official site only')}
                </Txt>
              </Glass>
            </PressScale>
          );
        })}
      </View>
      {list.length === 0 ? <EmptyState icon="search" title={tr('مفيش نتايج', 'No results')} text={tr('جرّب كلمة تانية', 'Try another word')} /> : null}
    </Screen>
  );
}