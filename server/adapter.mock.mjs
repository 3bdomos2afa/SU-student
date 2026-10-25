// Local testing only: maps emails to fake sessions from students.mock.json. Refuses to run in production.
import { readFileSync } from 'node:fs';
if (process.env.NODE_ENV === 'production') throw new Error('adapter.mock.mjs must not be used in production');
const data = JSON.parse(readFileSync(new URL('./students.mock.json', import.meta.url)));
export async function findStudentByEmail(email) { return data[email] ?? null; }
export async function issuePortalSession(student) {
  return { Token: 'mock-token-' + student.StudentID + '-0000000000', StudentID: student.StudentID, FirstNameEN: student.FirstNameEN, LastNameEN: student.LastNameEN };
}