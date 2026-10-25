import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import type { CurriculumCourse } from '@/data/curriculum';
import type { CourseStatus } from '@/data/curriculum-helpers';
import { tap } from '@/lib/haptics';
import { alpha } from '@/lib/theme';

type Props = {
  course: CurriculumCourse;
  status: CourseStatus;
  onPress?: () => void;
  onToggle?: () => void;
  right?: ReactNode;
};

export function CourseRow({ course, status, onPress, onToggle, right }: Props) {
  const { palette, row, tr } = useApp();
  const color = status === 'completed' ? palette.success : status === 'available' ? palette.accent : palette.faint;
  const icon = status === 'completed' ? 'checkmark-circle' : status === 'available' ? 'ellipse-outline' : 'lock-closed';
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({ flexDirection: row, alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: pressed ? alpha(palette.primary, 0.1) : 'transparent' })}>
      <Pressable
        hitSlop={10}
        disabled={!onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: status === 'completed' }}
        accessibilityLabel={tr('خلصت المادة دي', 'Completed')}
        onPress={() => {
          tap();
          onToggle?.();
        }}>
        <Ionicons name={icon} size={24} color={color} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Txt variant="label" numberOfLines={2}>
          {course.title}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {course.code}
        </Txt>
      </View>
      {right ?? (
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: alpha(color === palette.faint ? palette.primary : color, 0.15) }}>
          <Txt variant="caption" weight="700">
            {course.credits} {tr('س', 'cr')}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}