/** Friendly Arabic/English labels and values for university records (verified against real portal responses). */
import { recordsOf } from './portal';
type Lang='ar'|'en';
type Row=Record<string,unknown>;
const L:Record<string,[string,string]>={
 CourseCode:['كود المادة','Course code'],CourseNameEN:['المادة','Course'],CourseName:['المادة','Course'],CourseNameAr:['الدورة','Course'],
 CreditHours:['الساعات','Credit hours'],GradeName:['التقدير','Grade'],QualityPoints:['النقاط','Quality points'],SemesterNameEN:['الترم','Term'],
 TypeNameEN:['النوع','Type'],SectionNumber:['المجموعة','Section'],WeekDay:['اليوم','Day'],StartTime:['من','From'],EndTime:['لحد','To'],
 RoomName:['القاعة','Room'],FloorName:['الدور','Floor'],BuildingName:['المبنى','Building'],InstructorName:['المحاضر','Instructor'],IsOnline:['أونلاين','Online'],
 AbsencePercentage:['نسبة الغياب','Absence rate'],AbcensePercentage:['نسبة الغياب','Absence rate'],TotalSections:['عدد المحاضرات','Sessions'],
 AttenDay:['التاريخ','Date'],AttendanceStatus:['الحالة','Status'],
 CGPA:['المعدل التراكمي','CGPA'],GPA:['معدل الترم','Term GPA'],EarnedCredits:['ساعات مكتسبة في الترم','Term earned credits'],
 CumEarnedCredits:['الساعات المكتسبة كلها','Total earned credits'],CumAttemptCredits:['الساعات المسجّلة كلها','Total attempted credits'],
 CumQualityPoints:['مجموع النقاط','Total quality points'],
 StudentCode:['الرقم الجامعي','Student code'],FacultyName_EN:['الكلية','Faculty'],UniversityName_EN:['الجامعة','University'],UniversityName:['الجامعة','University'],
 GenderName:['النوع','Gender'],NationalityNameEN:['الجنسية','Nationality'],GovernorateNameEN:['المحافظة','Governorate'],CountryNameEN:['الدولة','Country'],
 RegistrationStartDate:['بداية التسجيل','Registration opens'],RegistrationEndDate:['نهاية التسجيل','Registration closes'],IsActive:['التسجيل مفتوح؟','Open now?'],
 Price:['الرسوم','Fee'],IsPaid:['اتدفعت؟','Paid?'],IsSuccess:['نجحت؟','Passed?'],StartDate:['البداية','Starts'],EndDate:['النهاية','Ends'],
 CourseStatusEn:['الحالة','Status'],MilitaryStudentNumber:['رقم الطالب في الدورة','Course number'],StatusNameEN:['الحالة','Status'],
 DecisionText:['القرار','Decision'],DecisionNumber:['رقم القرار','Decision no.'],Year:['السنة','Year'],Percentage:['النسبة','Percentage'],
 Degree:['المجموع','Total'],CertificationNameEN:['الشهادة','Certificate'],SpecializationNameEN:['الشعبة','Track'],CertificateDate:['تاريخ الشهادة','Certificate date'],
};
const V:Record<string,[string,string]>={
 LCTR:['محاضرة','Lecture'],LCLB:['سكشن / عملي','Section / lab'],LCTU:['تمارين','Tutorial'],
 'Unexcused Absent':['غياب بدون عذر','Unexcused absence'],'Excused Absent':['غياب بعذر','Excused absence'],Absent:['غياب','Absent'],Present:['حضور','Present'],
 Finished:['خلصت','Finished'],Fall:['خريف','Fall'],Spring:['ربيع','Spring'],Summer:['صيف','Summer'],
 Saturday:['السبت','Saturday'],Sunday:['الأحد','Sunday'],Monday:['الاتنين','Monday'],Tuesday:['التلات','Tuesday'],Wednesday:['الأربع','Wednesday'],Thursday:['الخميس','Thursday'],Friday:['الجمعة','Friday'],
};
const HIDE=/(^|[a-z_])(ID|Id)$|Serial$|^serial$|^(id|IsSelected|IsConflict|StudentAllowedSerial|CourseSubtype|AvailableSeats|TransferGrade|TermLabelEN|TermLabelAR|Semester_year|SemesterYearserial|DataByApplicantIDList|SectionsList|ScheduleLst|ProfessorLst|Schedule|Name|ParentBirthPlace)$/;
export const hiddenField=(k:string)=>HIDE.test(k);
export function fieldLabel(k:string,lang:Lang){return L[k]?.[lang==='ar'?0:1]??k.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ');}
export function termName(en:string,lang:Lang){return V[en]?.[lang==='ar'?0:1]??en;}
export function formatValue(k:string,v:unknown,lang:Lang):string{
 const ar=lang==='ar';
 if(v===null||v===undefined||v==='')return '—';
 if(typeof v==='boolean'||(k==='IsActive'&&(v===0||v===1)))return v?(ar?'أيوه':'Yes'):(ar?'لأ':'No');
 if(typeof v==='number'&&/Percent/i.test(k))return `${Math.round(v*100)/100}%`;
 if(typeof v==='number'&&/^(CGPA|GPA)$/.test(k))return v.toFixed(2);
 const s=String(v).trim();
 if(/^\d{4}-\d{2}-\d{2}T/.test(s))return s.startsWith('0001')?'—':s.slice(0,10);
 if(/^\d{2}:\d{2}:\d{2}$/.test(s))return s.slice(0,5);
 return V[s]?.[ar?0:1]??s.slice(0,600);
}
export function recordTitle(r:Row){for(const k of ['CourseNameEN','CourseName','CourseNameAr'])if(typeof r[k]==='string'&&r[k])return String(r[k]);return '';}
/** Records shaped for reading: wrapper objects made of several lists (like the profile) become their inner records. */
export function displayRecords(data:unknown):Row[]{
 return recordsOf(data).flatMap(r=>{
  const lists=Object.values(r).filter((v):v is unknown[]=>Array.isArray(v)&&v.some(x=>!!x&&typeof x==='object'));
  const flat=Object.entries(r).filter(([k,v])=>!hiddenField(k)&&v!==null&&v!==undefined&&v!==''&&typeof v!=='object');
  if(lists.length>=2||(lists.length>0&&!flat.length))return lists.sort((a,b)=>Number(JSON.stringify(b).includes('StudentCode'))-Number(JSON.stringify(a).includes('StudentCode'))).flatMap(l=>recordsOf(l));
  return [r];
 });
}
