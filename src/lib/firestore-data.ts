import { useSyncExternalStore } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  closeTime: string;
};

export type Teacher = {
  id: string;
  name: string;
  phone: string;
  classIds: string[];
  photo: string;
  email: string;
  authUid: string | null;
};

export type RatingKind = "day" | "week";

export type Rating = {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  kind: RatingKind;
  dayKey: string;
  weekKey: string;
  percent: number;
  scores: Record<string, number>;
};

export const classLevels: ClassLevel[] = ["الفئة الكبرى", "الفئة الوسطى", "الفئة الصغرى"];

export let standards: Standard[] = [];
export let teachers: Teacher[] = [];
export let classes: ClassRoom[] = [];
export let students: Student[] = [];
export let ratings: Rating[] = [];

type FirestoreDataSnapshot = {
  standards: Standard[];
  teachers: Teacher[];
  classes: ClassRoom[];
  students: Student[];
  ratings: Rating[];
  ready: boolean;
  error: FirestoreError | null;
};

let subscribeStarted = false;
let lastError: FirestoreError | null = null;
const loadedCollections = new Set<string>();
const listeners = new Set<() => void>();
let currentSnapshot: FirestoreDataSnapshot = {
  standards,
  teachers,
  classes,
  students,
  ratings,
  ready: false,
  error: lastError,
};

function refreshSnapshot() {
  currentSnapshot = {
    standards,
    teachers,
    classes,
    students,
    ratings,
    ready: loadedCollections.size === 5,
    error: lastError,
  };
}

function emit() {
  refreshSnapshot();
  listeners.forEach((listener) => listener());
}

function byName<T extends { name?: string }>(a: T, b: T) {
  return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ar");
}

function normalizeStandard(id: string, data: Partial<Standard>): Standard {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    weight: Number(data.weight ?? 1),
  };
}

function normalizeTeacher(id: string, data: Partial<Teacher>): Teacher {
  return {
    id,
    name: data.name ?? "",
    phone: data.phone ?? "",
    classIds: Array.isArray(data.classIds) ? data.classIds : [],
    photo: data.photo ?? "",
    email: data.email ?? "",
    authUid: data.authUid ?? null,
  };
}

function normalizeClassRoom(id: string, data: Partial<ClassRoom>): ClassRoom {
  return {
    id,
    name: data.name ?? "",
    teacherId: data.teacherId ?? null,
    level: (data.level ?? "الفئة الوسطى") as ClassLevel,
    studentCount: Number(data.studentCount ?? 0),
    closeTime: data.closeTime ?? "20:00",
  };
}

function normalizeStudent(id: string, data: Partial<Student>): Student {
  return {
    id,
    name: data.name ?? "",
    grade: data.grade ?? "",
    nationalId: data.nationalId ?? "",
    classId: data.classId ?? "",
    photo: data.photo ?? "",
    todayScores: data.todayScores ?? {},
    weeklyAverage: Number(data.weeklyAverage ?? 0),
    overallPercent: Number(data.overallPercent ?? 0),
  };
}

function normalizeRating(id: string, data: Partial<Rating>): Rating {
  return {
    id,
    classId: String(data.classId ?? ""),
    studentId: String(data.studentId ?? ""),
    studentName: String(data.studentName ?? ""),
    kind: (data.kind ?? "day") as RatingKind,
    dayKey: String(data.dayKey ?? ""),
    weekKey: String(data.weekKey ?? ""),
    percent: Number(data.percent ?? 0),
    scores: (data.scores ?? {}) as Record<string, number>,
  };
}

export function startFirestoreData() {
  if (subscribeStarted || typeof window === "undefined") return;
  subscribeStarted = true;

  const bind = <T>(
    collectionName: string,
    assign: (next: T[]) => void,
    normalize: (id: string, data: Record<string, unknown>) => T,
    sort: (a: T, b: T) => number = () => 0,
  ) => {
    onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        lastError = null;
        loadedCollections.add(collectionName);
        assign(snapshot.docs.map((item) => normalize(item.id, item.data())).sort(sort));
        emit();
      },
      (error) => {
        lastError = error;
        loadedCollections.add(collectionName);
        emit();
      },
    );
  };

  bind(
    "standards",
    (next) => {
      standards = next;
    },
    normalizeStandard,
    byName,
  );
  bind(
    "teachers",
    (next) => {
      teachers = next;
    },
    normalizeTeacher,
    byName,
  );
  bind(
    "classes",
    (next) => {
      classes = next;
    },
    normalizeClassRoom,
    byName,
  );
  bind(
    "students",
    (next) => {
      students = next;
    },
    normalizeStudent,
    byName,
  );
  bind(
    "ratings",
    (next) => {
      ratings = next;
    },
    normalizeRating,
  );

  window.setTimeout(() => {
    if (loadedCollections.size === 5) return;
    ["standards", "teachers", "classes", "students", "ratings"].forEach((name) =>
      loadedCollections.add(name),
    );
    emit();
  }, 10_000);
}

export function useFirestoreData() {
  startFirestoreData();
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentSnapshot,
    () => currentSnapshot,
  );
}

export function normalizeStudentName(name: string) {
  return name.trim().toLowerCase();
}

export function studentNameExists(name: string, excludeId?: string) {
  const normalized = normalizeStudentName(name);
  if (!normalized) return false;
  return students.some(
    (student) => student.id !== excludeId && normalizeStudentName(student.name) === normalized,
  );
}

function weekKeyForDate(d: Date, now = new Date()) {
  return `${dayKey(getTermStart(now))}|w${weekOfDate(d, now)}`;
}

function ratingDocId(classId: string, day: Date, studentId: string) {
  return `${classId}_${dayKey(day)}_${studentId}`;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function winnerFromRatings(list: Rating[]) {
  if (list.length === 0) return null;
  const sorted = [...list].sort(
    (a, b) => b.percent - a.percent || a.studentName.localeCompare(b.studentName, "ar"),
  );
  const winner = sorted[0];
  const student = getStudent(winner.studentId);
  if (!student) return null;
  return { s: student, pct: winner.percent };
}

function weeklyWinnerFromRatings(list: Rating[]) {
  if (list.length === 0) return null;
  const byStudent = new Map<string, Rating[]>();
  for (const rating of list) {
    const current = byStudent.get(rating.studentId) ?? [];
    current.push(rating);
    byStudent.set(rating.studentId, current);
  }
  const aggregated = [...byStudent.entries()]
    .map(([studentId, items]) => ({
      studentId,
      avg: average(items.map((item) => item.percent)),
    }))
    .sort((a, b) => b.avg - a.avg || a.studentId.localeCompare(b.studentId, "ar"));
  const winner = aggregated[0];
  const student = getStudent(winner.studentId);
  if (!student) return null;
  return { s: student, pct: Math.round(winner.avg) };
}

export async function saveRatingForStudent(
  student: Student,
  scores: Record<string, number>,
  now = new Date(),
) {
  const percent = scoreToPercent(scores);
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  const weekKey = weekKeyForDate(day, now);
  const kind: RatingKind = "day";
  const rating: Rating = {
    id: ratingDocId(student.classId, day, student.id),
    classId: student.classId,
    studentId: student.id,
    studentName: student.name,
    kind,
    dayKey: dayKey(day),
    weekKey,
    percent,
    scores,
  };

  await setDoc(doc(db, "ratings", rating.id), rating);

  const updatedRatings = ratings.filter((item) => item.id !== rating.id).concat(rating);
  const dailyRatings = updatedRatings.filter(
    (item) =>
      item.classId === student.classId && item.dayKey === rating.dayKey && item.kind === "day",
  );
  const weeklyRatings = updatedRatings.filter(
    (item) =>
      item.classId === student.classId && item.weekKey === rating.weekKey && item.kind === "day",
  );
  const weeklyAverage = average(
    weeklyRatings.filter((item) => item.studentId === student.id).map((item) => item.percent),
  );

  await saveStudent({
    ...student,
    todayScores: scores,
    overallPercent: percent,
    weeklyAverage: weeklyAverage / 20,
  });

  const dailyWinner = winnerFromRatings(dailyRatings);
  const weeklyWinner = weeklyWinnerFromRatings(weeklyRatings);
  return { dailyWinner, weeklyWinner };
}

export async function saveStandard(standard: Standard) {
  await setDoc(doc(db, "standards", standard.id), standard);
}

export async function deleteStandard(id: string) {
  await deleteDoc(doc(db, "standards", id));
}

export async function saveTeacher(teacher: Teacher) {
  await setDoc(doc(db, "teachers", teacher.id), teacher);
}

export async function deleteTeacher(id: string) {
  await deleteDoc(doc(db, "teachers", id));
}

export async function saveClassRoom(classRoom: ClassRoom) {
  await setDoc(doc(db, "classes", classRoom.id), classRoom);
}

export async function saveStudent(student: Student) {
  await setDoc(doc(db, "students", student.id), student);
}

export async function deleteStudent(id: string) {
  await deleteDoc(doc(db, "students", id));
}

export async function saveStudentScores(studentId: string, todayScores: Record<string, number>) {
  const student = getStudent(studentId);
  if (!student) return;
  await saveRatingForStudent(student, todayScores);
}

export function getStudent(id: string) {
  return students.find((s) => s.id === id);
}
export function getClass(id: string) {
  return classes.find((c) => c.id === id);
}
export function getTeacher(id: string | null | undefined) {
  return id ? teachers.find((t) => t.id === id) : undefined;
}

export function getTeacherByEmail(email: string | null | undefined) {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return undefined;
  return teachers.find((t) => t.email.toLowerCase() === normalized);
}
export function studentsOfClass(classId: string) {
  return students.filter((s) => s.classId === classId);
}
export function classesOfTeacher(teacherId: string) {
  return classes.filter((c) => c.teacherId === teacherId);
}

export function scoreToPercent(scores: Record<string, number>) {
  const totalWeight = standards.reduce((a, s) => a + s.weight, 0);
  if (totalWeight === 0) return 0;
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

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function weeklyTrend(studentId: string) {
  const s = getStudent(studentId);
  if (!s) return [];
  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  return days.map((day, i) => ({
    day,
    percent: Math.max(
      50,
      Math.min(100, s.overallPercent - 15 + Math.round(seededRandom(i + studentId.length) * 30)),
    ),
  }));
}

export const TOTAL_WEEKS = 5;
export const CURRENT_WEEK = 2;
export const DEFAULT_VACATION_DOW = [2, 5, 6];

export function getTermStart(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const daysSinceSat = (dow + 1) % 7;
  const week2Sat = new Date(d);
  week2Sat.setDate(d.getDate() - daysSinceSat);
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

const STORAGE_KEY = "furqan_calendar_overrides_v1";
type OverrideMap = Record<string, "vacation" | "fine">;

function loadOverrides(): OverrideMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
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
  const close = classId ? (getClass(classId)?.closeTime ?? "20:00") : "20:00";
  return parseHM(close, now);
}
export function isAfterDeadline(now = new Date(), classId?: string) {
  return now >= evaluationDeadline(now, classId);
}
export function isBeforeEvalStart(now = new Date()) {
  return now < parseHM(EVAL_START_HM, now);
}
export function evalWindowState(
  classId: string,
  now = new Date(),
): { state: "vacation" | "before" | "open" | "closed"; start: Date; end: Date } {
  const start = evaluationStart(classId, now);
  const end = evaluationDeadline(now, classId);
  if (isVacationForClass(classId, now)) return { state: "vacation", start, end };
  if (now < start) return { state: "before", start, end };
  if (now >= end) return { state: "closed", start, end };
  return { state: "open", start, end };
}

export function isCountedDay(d = new Date()) {
  return !DEFAULT_VACATION_DOW.includes(d.getDay());
}

export function isThursday(d = new Date()) {
  return d.getDay() === 4;
}

export function knightForClassOnDate(classId: string, d: Date) {
  const roster = studentsOfClass(classId);
  if (roster.length === 0) return null;
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate() + classId.length * 13;
  const idx = Math.floor(seededRandom(seed) * roster.length);
  const s = roster[idx];
  return { s, pct: scoreToPercent(s.todayScores) };
}

export function lastPublishedKnightDate(classId: string, now = new Date()): Date | null {
  const d = new Date(now);
  d.setSeconds(0, 0);
  const close = evaluationDeadline(now, classId);
  if (!isVacationForClass(classId, d) && now >= close) {
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    return t;
  }
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
  const dayRatings = ratings.filter(
    (rating) =>
      rating.classId === classId && rating.dayKey === dayKey(day) && rating.kind === "day",
  );
  const fromRatings = winnerFromRatings(dayRatings);
  if (fromRatings) return { ...fromRatings, day };
  const k = knightForClassOnDate(classId, day);
  return k ? { ...k, day } : null;
}

export function lastWeeklyKnightDate(classId: string, now = new Date()): Date | null {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const close = evaluationDeadline(now, classId);
  const isThu = d.getDay() === 4;
  if (isThu && !isVacationForClass(classId, d) && now >= close) return d;
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
  const key = weekKeyForDate(day, now);
  const weeklyRatings = ratings.filter(
    (rating) => rating.classId === classId && rating.weekKey === key && rating.kind === "day",
  );
  const fromRatings = weeklyWinnerFromRatings(weeklyRatings);
  if (fromRatings) return { ...fromRatings, day };
  const k = knightForClassOnDate(classId, day);
  return k ? { ...k, day } : null;
}

const AR_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export function arabicDayName(d: Date) {
  return AR_DAYS[d.getDay()];
}
export function formatArabicDate(d: Date) {
  return `${arabicDayName(d)} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function formatTime12h(hm: string) {
  const [hRaw, mRaw] = hm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return hm;
  const period = h >= 12 ? "PM" : "AM";
  const normalizedHour = ((h + 11) % 12) + 1;
  return `${String(normalizedHour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}
