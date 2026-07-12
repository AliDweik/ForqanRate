import { Injectable, computed, signal } from '@angular/core';
import { collection, deleteDoc, doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

export type ClassLevel = 'الفئة الكبرى' | 'الفئة الوسطى' | 'الفئة الصغرى';

export type Standard = {
  id: string;
  name: string;
  description: string;
  weight: number;
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

export type Student = {
  id: string;
  name: string;
  grade: string;
  nationalId: string;
  classId: string;
  photo: string;
  photoPath: string;
  todayScores: Record<string, number>;
  weeklyAverage: number;
  overallPercent: number;
};

export type RatingKind = 'day' | 'week';

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

export type KnightResult = {
  student: Student;
  percent: number;
  day: Date;
};

export type PublishedKnightMode = 'day' | 'week';

export type PublishedKnight = {
  id: string;
  classId: string;
  mode: PublishedKnightMode;
  studentId: string;
  studentName: string;
  studentPhoto: string;
  studentPhotoPath: string;
  studentGrade: string;
  percent: number;
  scores: Record<string, number>;
  dayKey: string;
  weekKey: string;
  publishedAt: string;
};

const DEFAULT_VACATION_DOW = [2, 5, 6];
const EVAL_START_HM = '14:00';
export const classLevels: ClassLevel[] = ['الفئة الكبرى', 'الفئة الوسطى', 'الفئة الصغرى'];
export const defaultStandards: Standard[] = [
  { id: 'quran', name: 'الحفظ والتلاوة', description: 'إتقان الحفظ وجودة التلاوة', weight: 2 },
  { id: 'behavior', name: 'الأدب والسلوك', description: 'الالتزام والخلق داخل الحلقة', weight: 1 },
  { id: 'attendance', name: 'الحضور والانضباط', description: 'الحضور في الوقت والجاهزية', weight: 1 },
  { id: 'participation', name: 'المشاركة', description: 'التفاعل والمبادرة أثناء الدرس', weight: 1 },
];

@Injectable({ providedIn: 'root' })
export class ForqanDataService {
  private readonly app = getFirebaseApp();
  private readonly db = getFirestore(this.app);
  private readonly storage = getStorage(this.app);

  readonly classes = signal<ClassRoom[]>([]);
  readonly teachers = signal<Teacher[]>([]);
  readonly students = signal<Student[]>([]);
  readonly ratings = signal<Rating[]>([]);
  readonly standards = signal<Standard[]>([]);
  readonly publishedKnights = signal<PublishedKnight[]>([]);
  readonly error = signal<string | null>(null);
  readonly loaded = signal(new Set<string>());
  readonly ready = computed(() => this.loaded().size >= 6);
  private readonly publishTimer = window.setInterval(() => void this.refreshPublishedKnights(), 60000);
  private publishInFlight = false;

  constructor() {
    this.bindClasses();
    this.bindTeachers();
    this.bindStudents();
    this.bindRatings();
    this.bindStandards();
    this.bindPublishedKnights();
  }

  classById(id: string) {
    return this.classes().find((item) => item.id === id);
  }

  teacherById(id: string | null | undefined) {
    return id ? this.teachers().find((item) => item.id === id) : undefined;
  }

  studentsOfClass(classId: string) {
    return this.students().filter((student) => student.classId === classId);
  }

  classesOfTeacher(teacherId: string) {
    return this.classes().filter((classRoom) => classRoom.teacherId === teacherId);
  }

  standardsForScoring() {
    return this.standards().length > 0 ? this.standards() : defaultStandards;
  }

  studentNameExists(name: string, exceptId?: string) {
    const normalized = name.trim();
    return this.students().some((student) => student.id !== exceptId && student.name.trim() === normalized);
  }

  async saveTeacher(teacher: Teacher) {
    await setDoc(doc(this.db, 'teachers', teacher.id), teacher);
  }

  async deleteTeacher(id: string) {
    await deleteDoc(doc(this.db, 'teachers', id));
  }

  async saveClassRoom(classRoom: ClassRoom) {
    await setDoc(doc(this.db, 'classes', classRoom.id), classRoom);
  }

  async saveStudent(student: Student) {
    await setDoc(doc(this.db, 'students', student.id), student);
  }

  async uploadStudentPhoto(studentId: string, file: File) {
    const extension = extensionFromFile(file);
    const path = `students/${studentId}/profile-${Date.now()}${extension}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
    const url = await getDownloadURL(storageRef);
    return { path, url };
  }

  async deleteStudent(id: string) {
    await deleteDoc(doc(this.db, 'students', id));
  }

  async saveStandard(standard: Standard) {
    await setDoc(doc(this.db, 'standards', standard.id), standard);
  }

  async deleteStandard(id: string) {
    await deleteDoc(doc(this.db, 'standards', id));
  }

  async saveStudentScores(studentId: string, scores: Record<string, number>, now = new Date()) {
    const student = this.students().find((item) => item.id === studentId);
    if (!student) throw new Error('student-not-found');

    const percent = this.scoreToPercent(scores);
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    const rating: Rating = {
      id: ratingDocId(student.classId, day, student.id),
      classId: student.classId,
      studentId: student.id,
      studentName: student.name,
      kind: 'day',
      dayKey: dayKey(day),
      weekKey: weekKeyForDate(day, now),
      percent,
      scores,
    };

    await setDoc(doc(this.db, 'ratings', rating.id), rating);

    const updatedRatings = this.ratings().filter((item) => item.id !== rating.id).concat(rating);
    const weeklyRatings = updatedRatings.filter(
      (item) =>
        item.classId === student.classId && item.weekKey === rating.weekKey && item.kind === 'day',
    );
    const weeklyAverage = average(
      weeklyRatings.filter((item) => item.studentId === student.id).map((item) => item.percent),
    );

    await this.saveStudent({
      ...student,
      todayScores: scores,
      overallPercent: percent,
      weeklyAverage: weeklyAverage / 20,
    });
  }

  scoreToPercent(scores: Record<string, number>) {
    const standards = this.standardsForScoring();
    const totalWeight = standards.reduce((sum, standard) => sum + standard.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = standards.reduce(
      (sum, standard) => sum + (scores[standard.id] ?? 0) * standard.weight,
      0,
    );
    return Math.round((weighted / (totalWeight * 5)) * 100);
  }

  publishedKnight(classId: string, mode: PublishedKnightMode): KnightResult | null {
    const record = this.publishedKnights().find(
      (item) => item.classId === classId && item.mode === mode,
    );
    if (!record) return null;

    const storedStudent = this.students().find((student) => student.id === record.studentId);
    const student: Student = {
      id: record.studentId,
      name: record.studentName,
      grade: storedStudent?.grade ?? record.studentGrade,
      nationalId: storedStudent?.nationalId ?? '',
      classId: record.classId,
      photo: storedStudent?.photo ?? record.studentPhoto,
      photoPath: storedStudent?.photoPath ?? record.studentPhotoPath,
      todayScores: record.scores,
      weeklyAverage: storedStudent?.weeklyAverage ?? 0,
      overallPercent: record.percent,
    };

    return {
      student,
      percent: record.percent,
      day: dateFromDayKey(record.dayKey),
    };
  }

  currentPublishedKnight(classId: string, now = new Date()): KnightResult | null {
    const day = this.lastPublishedKnightDate(classId, now);
    if (!day) return null;

    const dayRatings = this.ratings().filter(
      (rating) =>
        rating.classId === classId && rating.dayKey === dayKey(day) && rating.kind === 'day',
    );
    const fromRatings = this.winnerFromRatings(dayRatings);
    if (fromRatings) return { ...fromRatings, day };

    const fallback = this.knightForClassOnDate(classId, day);
    return fallback ? { ...fallback, day } : null;
  }

  currentWeeklyKnight(classId: string, now = new Date()): KnightResult | null {
    const day = this.lastWeeklyKnightDate(classId, now);
    if (!day) return null;

    const weeklyRatings = this.ratings().filter(
      (rating) =>
        rating.classId === classId && rating.weekKey === weekKeyForDate(day, now) && rating.kind === 'day',
    );
    const fromRatings = this.weeklyWinnerFromRatings(weeklyRatings);
    if (fromRatings) return { ...fromRatings, day };

    const fallback = this.knightForClassOnDate(classId, day);
    return fallback ? { ...fallback, day } : null;
  }

  evalWindowState(classId: string, now = new Date()) {
    const start = parseHM(EVAL_START_HM, now);
    const end = this.evaluationDeadline(classId, now);
    if (this.isVacationForClass(classId, now)) return { state: 'vacation', start, end };
    if (now < start) return { state: 'before', start, end };
    if (now >= end) return { state: 'closed', start, end };
    return { state: 'open', start, end };
  }

  evaluationDeadline(classId: string, now = new Date()) {
    const close = this.classById(classId)?.closeTime ?? '20:00';
    return parseHM(close, now);
  }

  formatTime12h(hm: string) {
    const [hRaw, mRaw] = hm.split(':');
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (Number.isNaN(h) || Number.isNaN(m)) return hm;
    const period = h >= 12 ? 'PM' : 'AM';
    const normalizedHour = ((h + 11) % 12) + 1;
    return `${String(normalizedHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  formatArabicDate(d: Date) {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  isThursday(d = new Date()) {
    return d.getDay() === 4;
  }

  private bindClasses() {
    onSnapshot(
      collection(this.db, 'classes'),
      (snapshot) => {
        this.markLoaded('classes');
        this.classes.set(
          snapshot.docs
            .map((item) => normalizeClassRoom(item.id, item.data()))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
        );
      },
      (error) => this.fail('classes', error.message),
    );
  }

  private bindTeachers() {
    onSnapshot(
      collection(this.db, 'teachers'),
      (snapshot) => {
        this.markLoaded('teachers');
        this.teachers.set(
          snapshot.docs
            .map((item) => normalizeTeacher(item.id, item.data()))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
        );
      },
      (error) => this.fail('teachers', error.message),
    );
  }

  private bindStudents() {
    onSnapshot(
      collection(this.db, 'students'),
      (snapshot) => {
        this.markLoaded('students');
        this.students.set(
          snapshot.docs
            .map((item) => normalizeStudent(item.id, item.data()))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
        );
      },
      (error) => this.fail('students', error.message),
    );
  }

  private bindRatings() {
    onSnapshot(
      collection(this.db, 'ratings'),
      (snapshot) => {
        this.markLoaded('ratings');
        this.ratings.set(snapshot.docs.map((item) => normalizeRating(item.id, item.data())));
      },
      (error) => this.fail('ratings', error.message),
    );
  }

  private bindStandards() {
    onSnapshot(
      collection(this.db, 'standards'),
      (snapshot) => {
        this.markLoaded('standards');
        this.standards.set(
          snapshot.docs
            .map((item) => normalizeStandard(item.id, item.data()))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
        );
      },
      (error) => this.fail('standards', error.message),
    );
  }

  private bindPublishedKnights() {
    onSnapshot(
      collection(this.db, 'publishedKnights'),
      (snapshot) => {
        this.markLoaded('publishedKnights');
        this.publishedKnights.set(snapshot.docs.map((item) => normalizePublishedKnight(item.id, item.data())));
      },
      (error) => this.fail('publishedKnights', error.message),
    );
  }

  private markLoaded(collectionName: string) {
    this.error.set(null);
    const next = new Set(this.loaded());
    next.add(collectionName);
    this.loaded.set(next);
    if (next.size >= 6) void this.refreshPublishedKnights();
  }

  private fail(collectionName: string, message: string) {
    const next = new Set(this.loaded());
    next.add(collectionName);
    this.loaded.set(next);
    this.error.set(message);
  }

  private isVacationForClass(classId: string, d = new Date()) {
    const classRoom = this.classById(classId);
    if (!classRoom) return false;
    return DEFAULT_VACATION_DOW.includes(d.getDay());
  }

  private lastPublishedKnightDate(classId: string, now = new Date()) {
    const d = new Date(now);
    d.setSeconds(0, 0);
    const close = this.evaluationDeadline(classId, now);
    if (!this.isVacationForClass(classId, d) && now >= close) {
      const today = new Date(d);
      today.setHours(0, 0, 0, 0);
      return today;
    }
    for (let i = 1; i <= 30; i++) {
      const cand = new Date(d);
      cand.setDate(d.getDate() - i);
      cand.setHours(0, 0, 0, 0);
      if (!this.isVacationForClass(classId, cand)) return cand;
    }
    return null;
  }

  private lastWeeklyKnightDate(classId: string, now = new Date()) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const close = this.evaluationDeadline(classId, now);
    if (d.getDay() === 4 && !this.isVacationForClass(classId, d) && now >= close) return d;
    for (let i = 1; i <= 35; i++) {
      const cand = new Date(d);
      cand.setDate(d.getDate() - i);
      if (cand.getDay() === 4 && !this.isVacationForClass(classId, cand)) return cand;
    }
    return null;
  }

  private knightForClassOnDate(classId: string, d: Date) {
    const roster = this.studentsOfClass(classId);
    if (roster.length === 0) return null;
    const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate() + classId.length * 13;
    const idx = Math.floor(seededRandom(seed) * roster.length);
    const student = roster[idx];
    return { student, percent: student.overallPercent || scoreToPercent(student.todayScores) };
  }

  private winnerFromRatings(list: Rating[]) {
    if (list.length === 0) return null;
    const winner = [...list].sort(
      (a, b) => b.percent - a.percent || a.studentName.localeCompare(b.studentName, 'ar'),
    )[0];
    const student = this.students().find((item) => item.id === winner.studentId);
    return student ? { student, percent: winner.percent } : null;
  }

  private weeklyWinnerFromRatings(list: Rating[]) {
    if (list.length === 0) return null;
    const byStudent = new Map<string, Rating[]>();
    for (const rating of list) {
      const current = byStudent.get(rating.studentId) ?? [];
      current.push(rating);
      byStudent.set(rating.studentId, current);
    }
    const winner = [...byStudent.entries()]
      .map(([studentId, items]) => ({
        studentId,
        percent: Math.round(average(items.map((item) => item.percent))),
      }))
      .sort((a, b) => b.percent - a.percent || a.studentId.localeCompare(b.studentId, 'ar'))[0];
    const student = this.students().find((item) => item.id === winner.studentId);
    return student ? { student, percent: winner.percent } : null;
  }

  private async refreshPublishedKnights(now = new Date()) {
    if (this.publishInFlight || this.loaded().size < 6) return;
    this.publishInFlight = true;

    try {
      await Promise.all(this.classes().flatMap((classRoom) => this.publishedKnightWritesForClass(classRoom, now)));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'publish-knights-failed');
    } finally {
      this.publishInFlight = false;
    }
  }

  private publishedKnightWritesForClass(classRoom: ClassRoom, now: Date) {
    const state = this.evalWindowState(classRoom.id, now);
    if (state.state !== 'closed') return [];

    const writes: Promise<void>[] = [];
    const dayKnight = this.currentPublishedKnight(classRoom.id, now);
    if (dayKnight) {
      writes.push(this.savePublishedKnight(classRoom.id, 'day', dayKnight, now));
    }

    if (this.isThursday(now)) {
      const weekKnight = this.currentWeeklyKnight(classRoom.id, now);
      if (weekKnight) {
        writes.push(this.savePublishedKnight(classRoom.id, 'week', weekKnight, now));
      }
    }

    return writes;
  }

  private async savePublishedKnight(
    classId: string,
    mode: PublishedKnightMode,
    knight: KnightResult,
    now: Date,
  ) {
    const recordDayKey = dayKey(knight.day);
    const weekKey = weekKeyForDate(knight.day, now);
    const current = this.publishedKnights().find((item) => item.classId === classId && item.mode === mode);
    if (
      current &&
      current.studentId === knight.student.id &&
      current.percent === knight.percent &&
      current.dayKey === recordDayKey &&
      current.weekKey === weekKey
    ) {
      return;
    }

    const record: PublishedKnight = {
      id: publishedKnightDocId(classId, mode),
      classId,
      mode,
      studentId: knight.student.id,
      studentName: knight.student.name,
      studentPhoto: knight.student.photo,
      studentPhotoPath: knight.student.photoPath,
      studentGrade: knight.student.grade,
      percent: knight.percent,
      scores: knight.student.todayScores,
      dayKey: recordDayKey,
      weekKey,
      publishedAt: now.toISOString(),
    };

    await setDoc(doc(this.db, 'publishedKnights', record.id), record);
  }
}

function normalizeTeacher(id: string, data: Record<string, unknown>): Teacher {
  return {
    id,
    name: String(data['name'] ?? ''),
    phone: String(data['phone'] ?? ''),
    classIds: Array.isArray(data['classIds']) ? data['classIds'].map(String) : [],
    photo: String(data['photo'] ?? ''),
    email: String(data['email'] ?? ''),
    authUid: typeof data['authUid'] === 'string' ? data['authUid'] : null,
  };
}

function normalizeStandard(id: string, data: Record<string, unknown>): Standard {
  return {
    id,
    name: String(data['name'] ?? ''),
    description: String(data['description'] ?? ''),
    weight: Number(data['weight'] ?? 1),
  };
}

function normalizeClassRoom(id: string, data: Record<string, unknown>): ClassRoom {
  return {
    id,
    name: String(data['name'] ?? ''),
    teacherId: typeof data['teacherId'] === 'string' ? data['teacherId'] : null,
    level: String(data['level'] ?? 'الفئة الوسطى') as ClassLevel,
    studentCount: Number(data['studentCount'] ?? 0),
    closeTime: String(data['closeTime'] ?? '20:00'),
  };
}

function normalizeStudent(id: string, data: Record<string, unknown>): Student {
  return {
    id,
    name: String(data['name'] ?? ''),
    grade: String(data['grade'] ?? ''),
    nationalId: String(data['nationalId'] ?? ''),
    classId: String(data['classId'] ?? ''),
    photo: String(data['photo'] ?? ''),
    photoPath: String(data['photoPath'] ?? ''),
    todayScores: isRecord(data['todayScores']) ? (data['todayScores'] as Record<string, number>) : {},
    weeklyAverage: Number(data['weeklyAverage'] ?? 0),
    overallPercent: Number(data['overallPercent'] ?? 0),
  };
}

function normalizeRating(id: string, data: Record<string, unknown>): Rating {
  return {
    id,
    classId: String(data['classId'] ?? ''),
    studentId: String(data['studentId'] ?? ''),
    studentName: String(data['studentName'] ?? ''),
    kind: String(data['kind'] ?? 'day') as RatingKind,
    dayKey: String(data['dayKey'] ?? ''),
    weekKey: String(data['weekKey'] ?? ''),
    percent: Number(data['percent'] ?? 0),
    scores: isRecord(data['scores']) ? (data['scores'] as Record<string, number>) : {},
  };
}

function normalizePublishedKnight(id: string, data: Record<string, unknown>): PublishedKnight {
  return {
    id,
    classId: String(data['classId'] ?? ''),
    mode: data['mode'] === 'week' ? 'week' : 'day',
    studentId: String(data['studentId'] ?? ''),
    studentName: String(data['studentName'] ?? ''),
    studentPhoto: String(data['studentPhoto'] ?? ''),
    studentPhotoPath: String(data['studentPhotoPath'] ?? ''),
    studentGrade: String(data['studentGrade'] ?? ''),
    percent: Number(data['percent'] ?? 0),
    scores: isRecord(data['scores']) ? (data['scores'] as Record<string, number>) : {},
    dayKey: String(data['dayKey'] ?? ''),
    weekKey: String(data['weekKey'] ?? ''),
    publishedAt: String(data['publishedAt'] ?? ''),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseHM(hm: string, base: Date) {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateFromDayKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date();
  date.setFullYear(year || date.getFullYear(), (month || 1) - 1, day || 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTermStart(now = new Date()) {
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

function weekKeyForDate(d: Date, now = new Date()) {
  const start = getTermStart(now);
  const diff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return `${dayKey(start)}|w${Math.floor(diff / 7) + 1}`;
}

function ratingDocId(classId: string, d: Date, studentId: string) {
  return `${classId}_${dayKey(d)}_${studentId}`;
}

function publishedKnightDocId(classId: string, mode: PublishedKnightMode) {
  return `${classId}_${mode}`;
}

function extensionFromFile(file: File) {
  const fromName = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0]?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === 'image/png') return '.png';
  if (file.type === 'image/webp') return '.webp';
  return '.jpg';
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreToPercent(scores: Record<string, number>) {
  const values = Object.values(scores).map(Number).filter((value) => Number.isFinite(value));
  if (values.length === 0) return 0;
  return Math.round((average(values) / 5) * 100);
}
