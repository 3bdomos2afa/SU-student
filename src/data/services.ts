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
  route?: string;
};

export const academicServices: AcademicService[] = [
  { action:'SEC_PERSONAL', group:'records', icon:'person-outline', color:'primary', title:{ar:'البيانات الشخصية',en:'Personal details'}, desc:{ar:'بيانات الطالب المسجلة بالجامعة',en:'Student details held by the university'} },
  { action: 'SEC_PROFILE', group: 'records', icon: 'person-circle', color: 'primary', title: { ar: 'الملف الأكاديمي', en: 'Academic profile' }, desc: { ar: 'بياناتك الأساسية من نظام الجامعة', en: 'Your core details from the university system' } },
  { action: 'SEC_SUMMARY', group: 'records', icon: 'stats-chart', color: 'accent', title: { ar: 'المعدل والتقدم', en: 'GPA & progress' }, desc: { ar: 'المعدل (GPA) والتراكمي (CGPA) والساعات', en: 'GPA, CGPA and credit hours' }, route: '/progress' },
  { action: 'SEC_TRANSCRIPT', group: 'records', icon: 'document-text', color: 'primary', title: { ar: 'السجل الدراسي', en: 'Transcript' }, desc: { ar: 'المواد والنتائج عبر الترمات', en: 'Courses and results across terms' }, route: '/transcript' },
  { action: 'SEC_GRADING', group: 'records', icon: 'ribbon', color: 'pink', title: { ar: 'الدرجات والأنشطة', en: 'Grades & coursework' }, desc: { ar: 'التقييمات وأعمال الترم', en: 'Assessments and coursework' }, route: '/grades' },
  { action: 'SEC_MILITARY', group: 'records', icon: 'shield-checkmark', color: 'success', title: { ar: 'التربية العسكرية', en: 'Military education' }, desc: { ar: 'الحالة والمتطلبات', en: 'Status and requirements' } },
  { action: 'SEC_CURRENT', group: 'learning', icon: 'book', color: 'primary', title: { ar: 'المواد الحالية', en: 'Current courses' }, desc: { ar: 'مواد الترم ده', en: 'This term’s courses' }, route: '/courses' },
  { action: 'SEC_SCHEDULE', group: 'learning', icon: 'calendar', color: 'accent', title: { ar: 'الجدول الدراسي', en: 'Timetable' }, desc: { ar: 'المحاضرات والقاعات', en: 'Lectures and rooms' }, route: '/timetable' },
  { action: 'SEC_ABSENCE', group: 'learning', icon: 'time', color: 'warn', title: { ar: 'الغياب', en: 'Absence' }, desc: { ar: 'كل مرة غبت فيها بالتاريخ', en: 'Every absence with its date' }, route: '/absence' },
  { action: 'SEC_WARNINGS', group: 'learning', icon: 'warning', color: 'danger', title: { ar: 'إنذارات الغياب', en: 'Absence warnings' }, desc: { ar: 'تنبيهات محتاجة متابعة', en: 'Warnings that need attention' }, route: '/warnings' },
  { action: 'KMOODLE', group: 'learning', icon: 'school', color: 'pink', title: { ar: 'Moodle والأنشطة', en: 'Moodle & activities' }, desc: { ar: 'أنشطة ومواعيد Moodle', en: 'Moodle activities and deadlines' }, route: '/moodle' },
  { action: 'SEC_REGISTRATION', group: 'registration', icon: 'create', color: 'primary', title: { ar: 'حالة التسجيل', en: 'Registration status' }, desc: { ar: 'الفترة والساعات المسموحة', en: 'Window and allowed hours' }, route: '/registration' },
  { action: 'PLANNER', group: 'registration', icon: 'clipboard', color: 'accent', title: { ar: 'تخطيط التسجيل', en: 'Registration planner' }, desc: { ar: 'اختار 9 أو 12 أو 18 أو 20 أو 21 ساعة', en: 'Pick 9, 12, 18, 20 or 21 credits' }, route: '/tools?tab=planner' },
  { action: 'GPA_CALC', group: 'registration', icon: 'calculator', color: 'pink', title: { ar: 'حاسبة المعدل', en: 'GPA calculator' }, desc: { ar: 'موادك الحالية ومعدّلك متضافين لوحدهم', en: 'Your current courses and CGPA, filled in' }, route: '/tools?tab=gpa' },
  { action: 'NOTEBOOK', group: 'learning', icon: 'book-outline', color: 'pink', title: { ar: 'كشكولك', en: 'Notebook' }, desc: { ar: 'كشكول لكل مادة: اكتب وارسم', en: 'A notebook per course: write and draw' }, route: '/notebook' },
];

export const quickActions = ['SEC_SCHEDULE', 'SEC_TRANSCRIPT', 'SEC_ABSENCE', 'SEC_CURRENT'] as const;

export function serviceByAction(action: string) {
  return academicServices.find((s) => s.action === action);
}