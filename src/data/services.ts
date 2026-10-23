import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { Lang } from '../lib/i18n';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type ServiceGroup = 'records' | 'registration' | 'learning';

export type AcademicService = {
  action: string;
  group: ServiceGroup;
  icon: IconName;
  color: 'primary' | 'accent' | 'pink' | 'warn' | 'success' | 'danger';
  title: Record<Lang, string>;
  desc: Record<Lang, string>;
};

export const academicServices: AcademicService[] = [
  { action: 'SEC_PROFILE', group: 'records', icon: 'person-circle', color: 'primary', title: { ar: 'الملف الأكاديمي', en: 'Academic profile' }, desc: { ar: 'بياناتك الأساسية من نظام الجامعة', en: 'Your core details from the university system' } },
  { action: 'SEC_ACADEMIC', group: 'records', icon: 'stats-chart', color: 'accent', title: { ar: 'المعدل والتقدم', en: 'GPA & progress' }, desc: { ar: 'GPA وCGPA والساعات', en: 'GPA, CGPA and credit hours' } },
  { action: 'SEC_TRANSCRIPT', group: 'records', icon: 'document-text', color: 'primary', title: { ar: 'السجل الدراسي', en: 'Transcript' }, desc: { ar: 'المواد والنتائج عبر الترمات', en: 'Courses and results across terms' } },
  { action: 'SEC_GRADING', group: 'records', icon: 'ribbon', color: 'pink', title: { ar: 'درجات الأنشطة', en: 'Coursework grades' }, desc: { ar: 'التقييمات وأعمال الترم', en: 'Assessments and coursework' } },
  { action: 'SEC_YEARS', group: 'records', icon: 'layers', color: 'accent', title: { ar: 'السنوات والترمات', en: 'Years & terms' }, desc: { ar: 'رحلتك الدراسية بالترتيب', en: 'Your academic journey' } },
  { action: 'SEC_MILITARY', group: 'records', icon: 'shield-checkmark', color: 'success', title: { ar: 'التربية العسكرية', en: 'Military education' }, desc: { ar: 'الحالة والمتطلبات', en: 'Status and requirements' } },
  { action: 'SEC_CURRENT', group: 'learning', icon: 'book', color: 'primary', title: { ar: 'المواد الحالية', en: 'Current courses' }, desc: { ar: 'مواد الترم ده', en: 'This term’s courses' } },
  { action: 'SEC_SCHEDULE', group: 'learning', icon: 'calendar', color: 'accent', title: { ar: 'الجدول الدراسي', en: 'Timetable' }, desc: { ar: 'المحاضرات والقاعات', en: 'Lectures and rooms' } },
  { action: 'SEC_ATTENDANCE', group: 'learning', icon: 'checkmark-done-circle', color: 'success', title: { ar: 'الحضور', en: 'Attendance' }, desc: { ar: 'نسب الحضور لكل مادة', en: 'Attendance per course' } },
  { action: 'SEC_ABSENCE', group: 'learning', icon: 'time', color: 'warn', title: { ar: 'تفاصيل الغياب', en: 'Absence details' }, desc: { ar: 'مرات وتفاصيل الغياب', en: 'Absence records' } },
  { action: 'SEC_WARNINGS', group: 'learning', icon: 'warning', color: 'danger', title: { ar: 'إنذارات الغياب', en: 'Absence warnings' }, desc: { ar: 'تنبيهات محتاجة متابعة', en: 'Warnings that need attention' } },
  { action: 'KMOODLE', group: 'learning', icon: 'school', color: 'pink', title: { ar: 'Moodle والأنشطة', en: 'Moodle & activities' }, desc: { ar: 'أنشطة ومواعيد Moodle', en: 'Moodle activities and deadlines' } },
  { action: 'SEC_SURVEY', group: 'learning', icon: 'chatbubbles', color: 'primary', title: { ar: 'الاستبيانات', en: 'Surveys' }, desc: { ar: 'الاستبيانات وحالتها', en: 'Surveys and status' } },
  { action: 'SEC_AVAILABLE', group: 'registration', icon: 'albums', color: 'accent', title: { ar: 'المواد المتاحة', en: 'Available courses' }, desc: { ar: 'المطروح للتسجيل', en: 'Offered for registration' } },
  { action: 'SEC_REGISTRATION', group: 'registration', icon: 'create', color: 'primary', title: { ar: 'حالة التسجيل', en: 'Registration status' }, desc: { ar: 'الفترة والساعات المسموحة', en: 'Window and allowed hours' } },
  { action: 'SEC_ALLOWED', group: 'registration', icon: 'options', color: 'warn', title: { ar: 'ضوابط التسجيل', en: 'Registration rules' }, desc: { ar: 'المسموح والممنوع', en: 'What you can and can’t take' } },
  { action: 'SEC_ADVISING', group: 'registration', icon: 'compass', color: 'success', title: { ar: 'الإرشاد الأكاديمي', en: 'Academic advising' }, desc: { ar: 'ملاحظات وخطوات تالية', en: 'Notes and next steps' } },
  { action: 'ACADEMIC_ANALYSIS', group: 'registration', icon: 'sparkles', color: 'pink', title: { ar: 'التحليل الذكي', en: 'Smart analysis' }, desc: { ar: 'قراءة ذكية لوضعك الأكاديمي', en: 'AI reading of your standing' } },
];

export const quickActions = ['SEC_SCHEDULE', 'SEC_ACADEMIC', 'SEC_ATTENDANCE', 'ACADEMIC_ANALYSIS'] as const;

export function serviceByAction(action: string) {
  return academicServices.find((s) => s.action === action);
}