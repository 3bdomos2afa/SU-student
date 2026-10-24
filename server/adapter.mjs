// The only university-specific file. University IT implements these two functions
// using the internal SIS database / internal service (never a public, unauthenticated route).

/** Return the student that owns this verified Google email, or null. */
export async function findStudentByEmail(email) {
  // Example (SQL Server):
  //   SELECT StudentID, FirstNameEN, LastNameEN FROM Students WHERE LOWER(UniversityEmail) = @email
  throw new Error('ADAPTER_NOT_CONFIGURED: implement findStudentByEmail in server/adapter.mjs');
}

/**
 * Create a normal UnicodeSIS session for that student, exactly like a successful
 * username/password login does, and return { Token, StudentID, FirstNameEN, LastNameEN }.
 */
export async function issuePortalSession(student) {
  throw new Error('ADAPTER_NOT_CONFIGURED: implement issuePortalSession in server/adapter.mjs');
}