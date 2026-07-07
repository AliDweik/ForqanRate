// Mock data for the Al-Furqan Quranic Center prototype.
// Arabic placeholder content. Replace with real API/DB later.

export type Standard = {
  id: string;
  name: string;
  description: string;
  weight: number;
};

export type ClassLevel = "الفئة الكبرى" | "الفئة الوسطى" | "الفئة الصغرى";

export type Student = {
  id: string;
  name: string;
  grade: string;
  nationalId: string;
  classId: string;
  photo: string;
  todayScores: Record<string, number>;
  weeklyAverage: number;
  overallPercent: number;
};

export type ClassRoom = {
  id: string;
  name: string;
  teacherId: string | null;
  level: ClassLevel;
  studentCount: number;
  closeTime: string; // HH:MM
};

export type Teacher = {
  id: string;
  name: string;
  phone: string;
  classIds: string[];
  photo: string;
};

export const classLevels: ClassLevel[] = ["الفئة الكبرى", "الفئة الوسطى", "الفئة الصغرى"];

export const standards: Standard[] = [
  { id: "s1", name: "الحضور والانضباط", description: "الالتزام بمواعيد الحضور والهدوء داخل الشعبة", weight: 1 },
  { id: "s2", name: "حفظ الورد اليومي", description: "إتقان حفظ المقرر اليومي من القرآن الكريم", weight: 2 },
  { id: "s3", name: "التجويد والأداء", description: "تطبيق أحكام التجويد وحسن الأداء", weight: 2 },
  { id: "s4", name: "المراجعة", description: "مراجعة ما سبق حفظه بإتقان", weight: 2 },
  { id: "s5", name: "الأخلاق والسلوك", description: "حسن التعامل مع المعلم والزملاء", weight: 1 },
];

export const teachers: Teacher[] = [
  { id: "t1", name: "الشيخ عبد الله المصري", phone: "0799456785", classIds: ["c1", "c2"], photo: "https://api.dicebear.com/7.x/initials/svg?seed=AM&backgroundColor=127a86" },
  { id: "t2", name: "الشيخ محمد الحسيني", phone: "0799112233", classIds: ["c3"], photo: "https://api.dicebear.com/7.x/initials/svg?seed=MH&backgroundColor=127a86" },
  { id: "t3", name: "الشيخ يوسف القرشي", phone: "0799887766", classIds: ["c4", "c5"], photo: "https://api.dicebear.com/7.x/initials/svg?seed=YQ&backgroundColor=127a86" },
];

export const classes: ClassRoom[] = [
  { id: "c1", name: "شعبة النور", teacherId: "t1", level: "الفئة الصغرى", studentCount: 18, closeTime: "20:00" },
  { id: "c2", name: "شعبة الهدى", teacherId: "t1", level: "الفئة الوسطى", studentCount: 22, closeTime: "20:00" },
  { id: "c3", name: "شعبة الفرقان", teacherId: "t2", level: "الفئة الكبرى", studentCount: 15, closeTime: "20:00" },
  { id: "c4", name: "شعبة الصدّيق", teacherId: "t3", level: "الفئة الصغرى", studentCount: 20, closeTime: "20:00" },
  { id: "c5", name: "شعبة الفاروق", teacherId: "t3", level: "الفئة الوسطى", studentCount: 19, closeTime: "19:30" },
];

const arabicNames = [
  "أحمد محمد الخطيب", "عمر يوسف السالم", "خالد إبراهيم النجار", "زيد سليمان الحوراني",
  "معاذ فادي العلي", "أنس بلال الشامي", "بلال حمزة الكردي", "يزن مصطفى الزيدي",
  "أسيد وسيم العمري", "حمزة طارق البستاني", "عبد الرحمن ياسر", "سلمان فهد الأحمد",
  "مصعب راشد التميمي", "عبد الله كريم", "معتز نبيل الجابري", "براء سامر الحلبي",
  "أيمن عصام الخزرجي", "طلحة نضال الشيخ", "سعد فراس الأنصاري", "الزبير هاني",
];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const students: Student[] = arabicNames.map((name, i) => {
  const classId = classes[i % classes.length].id;
  const scores: Record<string, number> = {};
  standards.forEach((s, si) => {
    const r = seededRandom(i * 7 + si);
    scores[s.id] = Math.max(1, Math.round(r * 5));
  });
  return {
    id: `st${i + 1}`,
    name,
    grade: ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"][i % 6],
    nationalId: `99${(1000000 + i).toString()}`,
    classId,
    photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`,
    todayScores: scores,
    weeklyAverage: 3.2 + seededRandom(i) * 1.7,
    overallPercent: Math.round(60 + seededRandom(i * 3) * 38),
  };
});

export function getStudent(id: string) { return students.find((s) => s.id === id); }
export function getClass(id: string) { return classes.find((c) => c.id === id); }
export function getTeacher(id: string | null | undefined) {
  return id ? teachers.find((t) => t.id === id) : undefined;
}
export function studentsOfClass(classId: string) { return students.filter((s) => s.classId === classId); }
export function classesOfTeacher(teacherId: string) { return classes.filter((c) => c.teacherId === teacherId); }

export function scoreToPercent(scores: Record<string, number>) {
  const totalWeight = standards.reduce((a, s) => a + s.weight, 0);
  const weighted = standards.reduce((a, s) => a + (scores[s.id] ?? 0) * s.weight, 0);
  return Math.round((weighted / (totalWeight * 5)) * 100);
}

export function knightOfClass(classId: string) {
  const list = studentsOfClass(classId)
    .map((s) => ({ s, pct: scoreToPercent(s.todayScores) }))
    .sort((a, b) => b.pct - a.pct);
  return list[0];
}

export function topOfClass(classId: string, limit = 10) {
  return studentsOfClass(classId)
    .map((s) => ({ s, pct: scoreToPercent(s.todayScores) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, limit);
}

export function weeklyTrend(studentId: string) {
  const s = getStudent(studentId);
  if (!s) return [];
  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  return days.map((day, i) => ({
    day,
    percent: Math.max(50, Math.min(100, s.overallPercent - 15 + Math.round(seededRandom(i + studentId.length) * 30))),
  }));
}

/* ============================================================
 * Term calendar — 5 weeks, week 1 past, currently mid-week 2.
 * Weeks start on Saturday. Default vacations: Tuesday, Friday, Saturday.
 * Admin can override per class level.
 * ============================================================ */

export const TOTAL_WEEKS = 5;
export const CURRENT_WEEK = 2;

// Default weekly vacation days (0=Sunday .. 6=Saturday)
export const DEFAULT_VACATION_DOW = [2, 5, 6]; // Tue, Fri, Sat

// Term start = Saturday of week 1. Compute so today falls mid week 2.
export function getTermStart(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // day of week: 0..6 (Sun..Sat). We want most recent Saturday.
  const dow = d.getDay();
  const daysSinceSat = (dow + 1) % 7; // Sat->0, Sun->1, ..., Fri->6
  const week2Sat = new Date(d);
  week2Sat.setDate(d.getDate() - daysSinceSat);
  // term started one week before
  const start = new Date(week2Sat);
  start.setDate(week2Sat.getDate() - 7);
  return start;
}

export function getTermDays(now = new Date()): Date[] {
  const start = getTermStart(now);
  const days: Date[] = [];
  for (let i = 0; i < TOTAL_WEEKS * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function weekOfDate(d: Date, now = new Date()) {
  const start = getTermStart(now);
  const diff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diff / 7) + 1;
}

// Per-level overrides. key: `${level}|${dayKey}` -> "vacation" | "fine"
const STORAGE_KEY = "furqan_calendar_overrides_v1";
type OverrideMap = Record<string, "vacation" | "fine">;

function loadOverrides(): OverrideMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveOverrides(m: OverrideMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

export function getOverride(level: ClassLevel, d: Date): "vacation" | "fine" | undefined {
  return loadOverrides()[`${level}|${dayKey(d)}`];
}
export function setOverride(level: ClassLevel, d: Date, value: "vacation" | "fine") {
  const m = loadOverrides();
  m[`${level}|${dayKey(d)}`] = value;
  saveOverrides(m);
}
export function clearOverride(level: ClassLevel, d: Date) {
  const m = loadOverrides();
  delete m[`${level}|${dayKey(d)}`];
  saveOverrides(m);
}

// Is this a vacation for a given class level?
export function isVacationForLevel(level: ClassLevel, d = new Date()) {
  const override = getOverride(level, d);
  if (override) return override === "vacation";
  return DEFAULT_VACATION_DOW.includes(d.getDay());
}

export function isVacationForClass(classId: string, d = new Date()) {
  const cls = getClass(classId);
  if (!cls) return false;
  return isVacationForLevel(cls.level, d);
}

/* ============================================================
 * Evaluation window: [14:00, closeTime)
 * ============================================================ */

function parseHM(hm: string, base: Date) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export const EVAL_START_HM = "14:00";

export function evaluationStart(classId: string, now = new Date()) {
  return parseHM(EVAL_START_HM, now);
}
export function evaluationDeadline(now = new Date(), classId?: string) {
  const close = classId ? getClass(classId)?.closeTime ?? "20:00" : "20:00";
  return parseHM(close, now);
}
export function isAfterDeadline(now = new Date(), classId?: string) {
  return now >= evaluationDeadline(now, classId);
}
export function isBeforeEvalStart(now = new Date()) {
  return now < parseHM(EVAL_START_HM, now);
}
export function evalWindowState(classId: string, now = new Date()):
  { state: "vacation" | "before" | "open" | "closed"; start: Date; end: Date } {
  const start = evaluationStart(classId, now);
  const end = evaluationDeadline(now, classId);
  if (isVacationForClass(classId, now)) return { state: "vacation", start, end };
  if (now < start) return { state: "before", start, end };
  if (now >= end) return { state: "closed", start, end };
  return { state: "open", start, end };
}

// Legacy: today counted?
export function isCountedDay(d = new Date()) {
  return !DEFAULT_VACATION_DOW.includes(d.getDay());
}

export function isThursday(d = new Date()) { return d.getDay() === 4; }

/* ============================================================
 * Guests reveal logic:
 *  - After close time on a non-vacation day, show today's knight.
 *  - Before close time (or vacation), show the LAST published knight.
 * ============================================================ */

// Deterministic mock: pick a knight based on a date seed so the "last knight"
// is stable per (class, date).
export function knightForClassOnDate(classId: string, d: Date) {
  const roster = studentsOfClass(classId);
  if (roster.length === 0) return null;
  const seed = (d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) + classId.length * 13;
  const idx = Math.floor(seededRandom(seed) * roster.length);
  const s = roster[idx];
  return { s, pct: scoreToPercent(s.todayScores) };
}

// Most recent non-vacation day for that class whose close time has passed.
export function lastPublishedKnightDate(classId: string, now = new Date()): Date | null {
  const d = new Date(now);
  d.setSeconds(0, 0);
  const close = evaluationDeadline(now, classId);
  // If today is non-vacation AND we're past close time, today counts.
  if (!isVacationForClass(classId, d) && now >= close) {
    const t = new Date(d); t.setHours(0, 0, 0, 0);
    return t;
  }
  // Otherwise walk backwards up to 30 days to find a non-vacation day.
  for (let i = 1; i <= 30; i++) {
    const cand = new Date(d);
    cand.setDate(d.getDate() - i);
    cand.setHours(0, 0, 0, 0);
    if (!isVacationForClass(classId, cand)) return cand;
  }
  return null;
}

export function currentPublishedKnight(classId: string, now = new Date()) {
  const day = lastPublishedKnightDate(classId, now);
  if (!day) return null;
  const k = knightForClassOnDate(classId, day);
  return k ? { ...k, day } : null;
}

// Weekly knight is the last knight of the most recent completed Thursday
// where the day has closed. Fallback: previous Thursday.
export function lastWeeklyKnightDate(classId: string, now = new Date()): Date | null {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const close = evaluationDeadline(now, classId);
  const isThu = d.getDay() === 4;
  if (isThu && !isVacationForClass(classId, d) && now >= close) return d;
  // walk back to previous Thursday (non-vacation)
  for (let i = 1; i <= 35; i++) {
    const cand = new Date(d);
    cand.setDate(d.getDate() - i);
    if (cand.getDay() === 4 && !isVacationForClass(classId, cand)) return cand;
  }
  return null;
}

export function currentWeeklyKnight(classId: string, now = new Date()) {
  const day = lastWeeklyKnightDate(classId, now);
  if (!day) return null;
  const k = knightForClassOnDate(classId, day);
  return k ? { ...k, day } : null;
}

// Arabic day name
const AR_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export function arabicDayName(d: Date) { return AR_DAYS[d.getDay()]; }
export function formatArabicDate(d: Date) {
  return `${arabicDayName(d)} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
