/** Read-only adapter derived from the public university web client. No passwords. */
export const PORTAL_ORIGIN = 'http://unicodesis.su.edu.eg';
export const PORTAL_LOGIN = `${PORTAL_ORIGIN}/login`;
const API = `${PORTAL_ORIGIN}:150///api/`;
export type Session = { studentId: string; name: string; token: string; signedInAt: string };
export type PortalRecord = Record<string, unknown>;

export function isPortalURL(url: string) {
  try { const u = new URL(url); return u.origin === PORTAL_ORIGIN; } catch { return false; }
}
export function parseSession(value: unknown): Session | null {
  if (!value || typeof value !== 'object') return null;
  const u = value as Record<string, unknown>;
  const token = u.Token ?? u.token;
  const studentId = u.StudentID;
  if (typeof token !== 'string' || token.length < 10 || token.length > 16000 ||
      !['string', 'number'].includes(typeof studentId) || !/^[a-zA-Z0-9_-]{1,80}$/.test(String(studentId))) return null;
  return {
    studentId: String(studentId), token,
    name: [u.FirstNameEN, u.LastNameEN].filter(v => typeof v === 'string').join(' ').slice(0, 120) || String(studentId),
    signedInAt: new Date().toISOString(),
  };
}
// Only the authenticated user's StudentID is used. No registration/payment writes.
export const endpoints: Record<string, { path: string; idKey?: string; method?: 'POST'; extra?: string }> = {
  SEC_PROFILE: { path: 'AR_StudentInfo/GetStudentData' },
  SEC_PERSONAL: { path: 'AR_StudentInfo/GetPersonalData' },
  SEC_CURRENT: { path: 'StudentSchedule/StudentBasicCourses', idKey: 'StudentId' },
  SEC_SCHEDULE: { path: 'StudentSchedule/StudentSchedule' },
  SEC_TIMETABLE: { path:'StudentSchedule/GetStudentSchedule' },
  SEC_SUMMARY: { path:'__summary' },
  SEC_ATTENDANCE: { path: 'StudentAttendance/GetAbsencePercentage' },
  SEC_WARNINGS: { path: 'StudentAttendance/GetAbsenceWarnings' },
  SEC_TRANSCRIPT: { path: 'Transcript/SelectStudentTranscriptBySemester', method: 'POST', extra: '&SemesterYearId=0' },
  SEC_YEARS: { path: 'AcademicYear_SemesterAPI/ARG_SelectAcademicYearByStudent' },
  SEC_REGISTRATION: { path: 'StudentRegistration/GetRegistrationPeriodSelect', idKey: 'StudentId' },
  SEC_ADVISING: { path: 'AcademicAdvising/GetAcademicAdvice' },
  SEC_MILITARY: { path: 'MilitaryEducation/GetStudentReservationInfo', idKey: 'StudentId' },
};
const PRIORITY = ['SEC_PROFILE','SEC_TIMETABLE','SEC_TRANSCRIPT','SEC_ATTENDANCE','SEC_SUMMARY','SEC_SCHEDULE','SEC_WARNINGS','SEC_CURRENT'];
export const SYNC_ORDER: string[] = [...PRIORITY.filter(k => k in endpoints), ...Object.keys(endpoints).filter(k => !PRIORITY.includes(k))];
// Transcript and schedule are needed by several services; share one request per sync.
const shared = new Map<string, { at: number; p: Promise<unknown> }>();
function sharedRequest(key: string, run: () => Promise<unknown>) {
  const hit = shared.get(key);
  if (hit && Date.now() - hit.at < 20000) return hit.p;
  const p = run(); shared.set(key, { at: Date.now(), p });
  p.catch(() => shared.delete(key));
  return p;
}
export class PortalError extends Error {
  constructor(public code: 'expired'|'network'|'unsupported'|'invalid') { super(code); }
}
export async function requestPortal(action: string, session: Session): Promise<unknown> {
  if(action==='SEC_SUMMARY'){
    const transcript=await requestPortal('SEC_TRANSCRIPT',session);
    const first=recordsOf(transcript)[0];
    if(!first||first.EnrollmentStudentID===undefined||first.StudentTransferID===undefined)return [];
    const qs=new URLSearchParams({EnrollmentStudentId:String(first.EnrollmentStudentID),StudentTransferDetails:String(first.StudentTransferID)});
    return fetchPortalData(`${API}Transcript/SelectSTudentSemesterSummery?${qs}`,session,'POST');
  }
  if(action.startsWith('GRADES:')){
    const code=action.slice(7).replace(/\s/g,'').toUpperCase();
    const ownCourses=recordsOf(await requestPortal('SEC_SCHEDULE',session));
    const course=ownCourses.find(r=>String(r.CourseCode??'').replace(/\s/g,'').toUpperCase()===code);
    if(!course||course.CourseID===undefined)throw new PortalError('unsupported');
    const qs=new URLSearchParams({StudentID:session.studentId,CourseID:String(course.CourseID),RoleReviewID:'2'});
    return fetchPortalData(`${API}StudentGrading/GetStudentActivityGrading?${qs}`,session);
  }
  const endpoint = endpoints[action];
  if (!endpoint) throw new PortalError('unsupported');
  if (action === 'SEC_TRANSCRIPT' || action === 'SEC_SCHEDULE') {
    const ep = endpoint;
    return sharedRequest(`${session.studentId}:${session.token.slice(-16)}:${action}`, () => fetchPortalData(`${API}${ep.path}?${ep.idKey ?? 'StudentID'}=${encodeURIComponent(session.studentId)}${ep.extra ?? ''}`, session, ep.method ?? 'GET'));
  }
  return fetchPortalData(`${API}${endpoint.path}?${endpoint.idKey ?? 'StudentID'}=${encodeURIComponent(session.studentId)}${endpoint.extra ?? ''}`,session,endpoint.method??'GET');
}
async function fetchPortalData(url:string,session:Session,method='GET'):Promise<unknown>{
  try { return await fetchOnce(url,session,method); }
  catch (e) { if (e instanceof PortalError && e.code==='network') return fetchOnce(url,session,method); throw e; }
}
async function fetchOnce(url:string,session:Session,method:string):Promise<unknown>{
  const abort=new AbortController();
  const timer=setTimeout(()=>abort.abort(),12000);
  try {
    const response=await fetch(url,{
      method,redirect:'error',
      headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      signal: abort.signal,
    });
    if ([401,403].includes(response.status)) throw new PortalError('expired');
    if (!response.ok) throw new PortalError('network');
    const text = await response.text();
    if (text.length > 3_000_000 || /^\s*</.test(text)) throw new PortalError('invalid');
    let data: unknown;
    try { data=JSON.parse(text); } catch { throw new PortalError('invalid'); }
    if (data === null || (typeof data !== 'object')) throw new PortalError('invalid');
    return stripSecrets(data);
  } catch (e) {
    if (e instanceof PortalError) throw e;
    throw new PortalError('network');
  } finally { clearTimeout(timer); }
}
export function stripSecrets(value: unknown, depth = 0): unknown {
  if (depth > 12) return null;
  if (Array.isArray(value)) return value.map(v => stripSecrets(v, depth+1));
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).filter(([k]) => !/password|token|secret|authorization/i.test(k))
      .map(([k,v]) => [k, stripSecrets(v, depth+1)])
  );
  return value;
}
export function recordsOf(data: unknown): PortalRecord[] {
  if (Array.isArray(data)) return data.filter(v => v && typeof v === 'object' && !Array.isArray(v)) as PortalRecord[];
  if (data && typeof data === 'object') {
    const obj = data as PortalRecord;
    for (const key of ['data','Data','result','Result','Table']) if (Array.isArray(obj[key])) return recordsOf(obj[key]);
    return [obj];
  }
  return [];
}