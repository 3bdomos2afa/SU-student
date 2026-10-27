export type CurriculumLevel = 1 | 2 | 3 | 4;
export type CurriculumSemester = 1 | 2;

export type CurriculumCourse = {
  code: string;
  title: string;
  level: CurriculumLevel;
  semester: CurriculumSemester;
  credits: number;
  prerequisites: string[];
};

export const curriculumCourses: CurriculumCourse[] = [
  { code: "HU 100", title: "Sinai History", level: 1, semester: 1, credits: 0, prerequisites: [] },
  { code: "HU 110", title: "English Language", level: 1, semester: 1, credits: 3, prerequisites: [] },
  { code: "CSW 110", title: "Introduction to Computer & Internet Technology", level: 1, semester: 1, credits: 3, prerequisites: [] },
  { code: "ST 120", title: "Statistics & Probability", level: 1, semester: 1, credits: 4, prerequisites: [] },
  { code: "MA 111", title: "Calculus", level: 1, semester: 1, credits: 4, prerequisites: [] },
  { code: "INT 110", title: "Introduction to Electronics", level: 1, semester: 1, credits: 3, prerequisites: [] },
  { code: "ISD 100", title: "Introduction to Systems & Informatics", level: 1, semester: 2, credits: 3, prerequisites: [] },
  { code: "CSW 232", title: "Computer Programming (1)", level: 1, semester: 2, credits: 4, prerequisites: ["CSW 110"] },
  { code: "CSW 121", title: "Logic Design", level: 1, semester: 2, credits: 3, prerequisites: ["INT 110"] },
  { code: "HU 230", title: "Communication Skills", level: 1, semester: 2, credits: 1, prerequisites: [] },
  { code: "MA 110", title: "Linear Algebra", level: 1, semester: 2, credits: 3, prerequisites: [] },
  { code: "HU 111", title: "Composition + Technical Writing", level: 1, semester: 2, credits: 3, prerequisites: [] },
  { code: "HU 194", title: "Human Rights", level: 1, semester: 2, credits: 0, prerequisites: [] },
  { code: "CSW 221", title: "Data Structures", level: 2, semester: 1, credits: 3, prerequisites: ["MA 110"] },
  { code: "CSW 241", title: "File Organization & Processing", level: 2, semester: 1, credits: 3, prerequisites: ["CSW 110"] },
  { code: "CSW 263", title: "Software Engineering", level: 2, semester: 1, credits: 3, prerequisites: ["CSW 232"] },
  { code: "CSW 234", title: "Computer Programming (2)", level: 2, semester: 1, credits: 4, prerequisites: ["CSW 232"] },
  { code: "MA 212", title: "Discrete Mathematics", level: 2, semester: 1, credits: 4, prerequisites: ["MA 110"] },
  { code: "HU 213", title: "Creative Thinking", level: 2, semester: 1, credits: 3, prerequisites: [] },
  { code: "CSW 242", title: "Operating Systems (1)", level: 2, semester: 2, credits: 3, prerequisites: ["CSW 241"] },
  { code: "ISD 220", title: "Introduction to Operations Research", level: 2, semester: 2, credits: 4, prerequisites: ["MA 110", "ST 120"] },
  { code: "INT 232", title: "Computer Networks", level: 2, semester: 2, credits: 3, prerequisites: ["MA 110"] },
  { code: "HU 212", title: "Reading & Presentation Skills", level: 2, semester: 2, credits: 2, prerequisites: [] },
  { code: "ISD 242", title: "Database Systems", level: 2, semester: 2, credits: 3, prerequisites: ["CSW 221"] },
  { code: "CSW 225", title: "Computer Architecture", level: 2, semester: 2, credits: 3, prerequisites: ["CSW 110", "CSW 121"] },
  { code: "CSW 325", title: "Parallel Processing", level: 3, semester: 1, credits: 3, prerequisites: ["CSW 225"] },
  { code: "INT 353", title: "Multimedia", level: 3, semester: 1, credits: 3, prerequisites: ["CSW 225"] },
  { code: "CSW 351", title: "Artificial Intelligence", level: 3, semester: 1, credits: 3, prerequisites: ["CSW 232"] },
  { code: "CSW 323", title: "Operating Systems (2)", level: 3, semester: 1, credits: 3, prerequisites: ["CSW 242"] },
  { code: "INT 341", title: "Web Technology", level: 3, semester: 1, credits: 3, prerequisites: ["CSW 110"] },
  { code: "INT 351", title: "Computer Graphics", level: 3, semester: 1, credits: 3, prerequisites: ["CSW 234"] },
  { code: "INT 343", title: "Website Design & Implementation", level: 3, semester: 2, credits: 3, prerequisites: ["INT 341", "CSW 338"] },
  { code: "INT 338", title: "Network-Based Multimedia", level: 3, semester: 2, credits: 3, prerequisites: ["INT 353", "INT 232"] },
  { code: "CSW 337", title: "Web Client Side Programming", level: 3, semester: 2, credits: 3, prerequisites: ["CSW 234"] },
  { code: "CSW 338", title: "Programming for WWW", level: 3, semester: 2, credits: 3, prerequisites: ["CSW 234"] },
  { code: "INT 349W", title: "WDT Project", level: 3, semester: 2, credits: 3, prerequisites: [] },
  { code: "INT 330", title: "Data Communications", level: 3, semester: 2, credits: 3, prerequisites: ["MA 110", "MA 111"] },
  { code: "INT 421", title: "Digital Signal Processing", level: 4, semester: 1, credits: 3, prerequisites: ["MA 110", "MA 111"] },
  { code: "INT 422", title: "Pattern Recognitions", level: 4, semester: 1, credits: 3, prerequisites: ["MA 110", "MA 111"] },
  { code: "INT 423", title: "Image Processing", level: 4, semester: 1, credits: 3, prerequisites: ["MA 110"] },
  { code: "INT 453", title: "Digital Multimedia", level: 4, semester: 1, credits: 3, prerequisites: ["INT 353"] },
  { code: "INT 461", title: "Information Engineering", level: 4, semester: 1, credits: 3, prerequisites: ["INT 232"] },
  { code: "INT 498", title: "IT Project (1)", level: 4, semester: 1, credits: 3, prerequisites: ["Passing 95 credit hours"] },
  { code: "INT 434", title: "Network Operations & Administration", level: 4, semester: 2, credits: 3, prerequisites: ["INT 232"] },
  { code: "INT 435", title: "Information & Network Security", level: 4, semester: 2, credits: 3, prerequisites: ["INT 232"] },
  { code: "INT 433", title: "Broadband Network & Communication", level: 4, semester: 2, credits: 3, prerequisites: ["INT 232", "INT 330"] },
  { code: "INT 437", title: "Wireless & Mobile Networks", level: 4, semester: 2, credits: 3, prerequisites: ["INT 232"] },
  { code: "INT 489", title: "Selected Topics in IT", level: 4, semester: 2, credits: 3, prerequisites: [] },
  { code: "INT 499", title: "IT Project (2)", level: 4, semester: 2, credits: 3, prerequisites: ["INT 498"] },
];

export const curriculumSummary = {
  program: "Information Technology",
  courseCount: curriculumCourses.length,
  totalCredits: curriculumCourses.reduce((sum, course) => sum + course.credits, 0),
  prerequisiteCourses: curriculumCourses.filter((course) => course.prerequisites.length > 0).length,
  creditBearingCourses: curriculumCourses.filter((course) => course.credits > 0).length,
};

export const curriculumNotes = [
  "الساعات الظاهرة للمقررات العامة بدون ساعات معتمدة محفوظة كما ظهرت في الجدول المرفق.",
  "الساعات والإنجاز الفعلي للطالب يجب أن تأتي من UnicodeSIS عند تشغيل الـ workflow الحقيقي.",
];