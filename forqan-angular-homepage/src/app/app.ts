import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import {
  classLevels,
  type ClassLevel,
  type ClassRoom,
  ForqanDataService,
  type Standard,
  type Student,
  type Teacher,
} from './forqan-data.service';

type ImportRow = {
  row: number;
  name: string;
  classId: string;
  grade: string;
  error?: string;
};

type StudentForm = {
  name: string;
  grade: string;
  classId: string;
  photo: string;
  photoPath: string;
  photoFile: File | null;
  photoPreview: string;
};

type TeacherStudentForm = Omit<StudentForm, 'classId'>;

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected selectedClassId = '';
  protected selectedKnightMode: 'day' | 'week' = 'day';
  protected loginLoading = false;
  protected loginError = '';
  protected readonly classLevels = classLevels;

  protected adminNotice = '';
  protected adminError = '';
  protected teacherFormOpen = false;
  protected classFormOpen = false;
  protected studentFormOpen = false;
  protected importRows: ImportRow[] = [];
  protected importStep = 0;
  protected importBusy = false;
  protected standardsDraft: Standard[] = [];
  protected standardsDirty = false;
  protected editingTeacher: Teacher | null = null;
  protected editingClass: ClassRoom | null = null;
  protected editingStudent: Student | null = null;
  protected teacherForm = this.emptyTeacherForm();
  protected classForm = this.emptyClassForm();
  protected studentForm = this.emptyStudentForm();
  protected classLevelFilter = 'all';
  protected studentLevelFilter = 'all';
  protected studentClassFilter = 'all';
  protected studentQuery = '';
  protected expandedClassId = '';
  protected teacherStudentFormOpen = false;
  protected editingTeacherStudent: Student | null = null;
  protected teacherStudentForm = this.emptyTeacherStudentForm();
  protected evalIndex = 0;
  protected evalScores: Record<string, Record<string, number>> = {};
  protected evalSaving: 'saving' | 'saved' | null = null;
  protected teacherNotice = '';
  protected teacherError = '';
  protected now = new Date();
  private readonly clock = window.setInterval(() => {
    this.now = new Date();
  }, 1000);

  constructor(
    protected readonly data: ForqanDataService,
    protected readonly auth: AuthService,
  ) {}

  protected get basePath() {
    const firstSegment = window.location.pathname.split('/').filter(Boolean)[0];
    return firstSegment === 'ForqanRate' ? '/ForqanRate' : '';
  }

  protected get currentPath() {
    const path = window.location.pathname;
    return this.basePath && path.startsWith(this.basePath)
      ? path.slice(this.basePath.length) || '/'
      : path;
  }

  protected appUrl(path: string) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.basePath}${normalized}`;
  }

  protected get isRevealPage() {
    return this.currentPath.endsWith('/parent/reveal');
  }

  protected get isLoginPage() {
    return this.currentPath.endsWith('/login');
  }

  protected get isAdminPage() {
    return this.currentPath.startsWith('/admin');
  }

  protected get isTeacherPage() {
    return this.currentPath.startsWith('/teacher');
  }

  protected get isProtectedPage() {
    return this.isAdminPage || this.isTeacherPage;
  }

  protected get revealClassId() {
    return new URLSearchParams(window.location.search).get('classId') ?? '';
  }

  protected get revealMode(): 'day' | 'week' {
    return new URLSearchParams(window.location.search).get('mode') === 'week' ? 'week' : 'day';
  }

  protected get revealTitle() {
    return this.revealMode === 'week' ? 'فارس الأسبوع' : 'فارس اليوم';
  }

  protected get revealClass() {
    return this.data.classById(this.revealClassId);
  }

  protected get isThursday() {
    return this.data.isThursday();
  }

  protected get revealKnight() {
    return this.data.publishedKnight(this.revealClassId, this.revealMode);
  }

  protected get revealWindowState() {
    return this.data.evalWindowState(this.revealClassId);
  }

  protected get adminPage() {
    const parts = this.currentPath.split('/').filter(Boolean);
    return parts[0] === 'admin' ? parts[1] ?? 'dashboard' : '';
  }

  protected get teacherPage() {
    const parts = this.currentPath.split('/').filter(Boolean);
    if (parts[0] !== 'teacher') return '';
    if (parts[1] === 'class') return 'class';
    if (parts[1] === 'evaluate') return 'evaluate';
    return 'dashboard';
  }

  protected get teacherRouteClassId() {
    const parts = this.currentPath.split('/').filter(Boolean);
    return parts[0] === 'teacher' && (parts[1] === 'class' || parts[1] === 'evaluate') ? parts[2] ?? '' : '';
  }

  protected get teacherClasses() {
    const teacher = this.auth.session().teacher;
    if (!teacher) return [];
    const byTeacherId = this.data.classesOfTeacher(teacher.id);
    const assignedIds = new Set(teacher.classIds);
    const bySessionIds = this.data.classes().filter((classRoom) => assignedIds.has(classRoom.id));
    const merged = new Map([...byTeacherId, ...bySessionIds].map((classRoom) => [classRoom.id, classRoom]));
    return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }

  protected get teacherClass() {
    return this.data.classById(this.teacherRouteClassId);
  }

  protected get teacherClassStudents() {
    return this.teacherRouteClassId ? this.data.studentsOfClass(this.teacherRouteClassId) : [];
  }

  protected get teacherStats() {
    const total = this.teacherClasses.reduce((sum, classRoom) => sum + this.data.studentsOfClass(classRoom.id).length, 0);
    const completed = this.teacherClasses.reduce((sum, classRoom) => sum + this.completedRatingsForClass(classRoom.id), 0);
    return {
      classes: this.teacherClasses.length,
      students: total,
      completed,
      pending: Math.max(total - completed, 0),
    };
  }

  protected get evalRoster() {
    return this.teacherClassStudents;
  }

  protected get evalStudent() {
    return this.evalRoster[this.evalIndex];
  }

  protected get evalWindowStateForClass() {
    return this.data.evalWindowState(this.teacherRouteClassId, this.now);
  }

  protected get canEvaluate() {
    return this.evalWindowStateForClass.state === 'open';
  }

  protected get evalCompleteCount() {
    const standardCount = this.data.standardsForScoring().length;
    return this.evalRoster.filter((student) => Object.keys(this.evalScores[student.id] ?? {}).length === standardCount).length;
  }

  protected get evalCompletePercent() {
    return this.evalRoster.length === 0 ? 0 : Math.round((this.evalCompleteCount / this.evalRoster.length) * 100);
  }

  protected get adminTitle() {
    return (
      this.adminNav.find((item) => item.page === this.adminPage)?.label ??
      this.adminNav[0].label
    );
  }

  protected get adminNav() {
    return [
      { page: 'dashboard', href: '/admin', label: 'لوحة التحكم' },
      { page: 'teachers', href: '/admin/teachers', label: 'المعلمون' },
      { page: 'classes', href: '/admin/classes', label: 'الشعب' },
      { page: 'students', href: '/admin/students', label: 'الطلاب' },
      { page: 'standards', href: '/admin/standards', label: 'معايير التميّز' },
      { page: 'import', href: '/admin/import', label: 'استيراد الطلاب' },
      { page: 'reports', href: '/admin/reports', label: 'التقارير' },
      { page: 'settings', href: '/admin/settings', label: 'الإعدادات' },
    ];
  }

  protected get adminStats() {
    const ratedToday = new Set(this.data.ratings().filter((rating) => rating.kind === 'day').map((rating) => rating.studentId));
    return {
      classes: this.data.classes().length,
      teachers: this.data.teachers().length,
      students: this.data.students().length,
      rated: ratedToday.size,
      pending: Math.max(this.data.students().length - ratedToday.size, 0),
    };
  }

  protected get filteredClasses() {
    const list = this.data.classes();
    return this.classLevelFilter === 'all'
      ? list
      : list.filter((classRoom) => classRoom.level === this.classLevelFilter);
  }

  protected get filteredStudentClasses() {
    const list = this.data.classes();
    return this.studentLevelFilter === 'all'
      ? list
      : list.filter((classRoom) => classRoom.level === this.studentLevelFilter);
  }

  protected get filteredStudents() {
    const q = this.studentQuery.trim();
    return this.data.students().filter((student) => {
      if (q && !student.name.includes(q)) return false;
      if (this.studentClassFilter !== 'all' && student.classId !== this.studentClassFilter) return false;
      if (this.studentLevelFilter !== 'all') {
        const classRoom = this.data.classById(student.classId);
        if (!classRoom || classRoom.level !== this.studentLevelFilter) return false;
      }
      return true;
    });
  }

  protected get validImportRows() {
    return this.importRows.filter((row) => !row.error);
  }

  protected get invalidImportRows() {
    return this.importRows.filter((row) => row.error);
  }

  protected get importSteps() {
    return ['تنزيل القالب', 'رفع الملف', 'التحقق', 'المعاينة', 'الاستيراد'];
  }

  protected get isPublishing() {
    const state = this.revealWindowState.state;
    return state === 'open' || state === 'before';
  }

  protected get standardsFormList() {
    if (this.standardsDirty) return this.standardsDraft;
    return this.data.standardsForScoring();
  }

  protected get reportOverview() {
    const ratedStudents = new Set(this.data.ratings().map((rating) => rating.studentId));
    const average = this.average(this.data.ratings().map((rating) => rating.percent));
    return {
      average,
      coverage: this.data.students().length === 0 ? 0 : Math.round((ratedStudents.size / this.data.students().length) * 100),
      ratings: this.data.ratings().length,
      published: this.data.publishedKnights().length,
    };
  }

  protected get classProgressReports() {
    return this.data.classes().map((classRoom) => {
      const students = this.data.studentsOfClass(classRoom.id);
      const ratings = this.data.ratings().filter((rating) => rating.classId === classRoom.id);
      const ratedStudents = new Set(ratings.map((rating) => rating.studentId));
      return {
        classRoom,
        studentCount: students.length,
        average: this.average(ratings.map((rating) => rating.percent)),
        coverage: students.length === 0 ? 0 : Math.round((ratedStudents.size / students.length) * 100),
        completed: this.completedRatingsForClass(classRoom.id),
      };
    }).sort((a, b) => b.average - a.average);
  }

  protected get teacherProgressReports() {
    return this.data.teachers().map((teacher) => {
      const classes = this.data.classes().filter(
        (classRoom) => classRoom.teacherId === teacher.id || teacher.classIds.includes(classRoom.id),
      );
      const classIds = new Set(classes.map((classRoom) => classRoom.id));
      const students = this.data.students().filter((student) => classIds.has(student.classId));
      const ratings = this.data.ratings().filter((rating) => classIds.has(rating.classId));
      const ratedStudents = new Set(ratings.map((rating) => rating.studentId));
      return {
        teacher,
        classCount: classes.length,
        studentCount: students.length,
        average: this.average(ratings.map((rating) => rating.percent)),
        coverage: students.length === 0 ? 0 : Math.round((ratedStudents.size / students.length) * 100),
      };
    }).sort((a, b) => b.coverage - a.coverage || b.average - a.average);
  }

  protected get standardProgressReports() {
    return this.data.standardsForScoring().map((standard) => {
      const values = this.data.ratings()
        .map((rating) => rating.scores[standard.id])
        .filter((value) => Number.isFinite(value));
      return {
        standard,
        averageScore: this.average(values),
        percent: Math.round((this.average(values) / 5) * 100),
        count: values.length,
      };
    }).sort((a, b) => b.percent - a.percent);
  }

  protected get topStudentReports() {
    return this.data.students()
      .map((student) => {
        const ratings = this.data.ratings().filter((rating) => rating.studentId === student.id);
        return {
          student,
          classRoom: this.data.classById(student.classId),
          average: this.average(ratings.map((rating) => rating.percent)) || student.overallPercent,
          ratings: ratings.length,
        };
      })
      .filter((item) => item.average > 0)
      .sort((a, b) => b.average - a.average)
      .slice(0, 8);
  }

  protected get recentRatingReports() {
    return [...this.data.ratings()]
      .sort((a, b) => b.dayKey.localeCompare(a.dayKey))
      .slice(0, 8)
      .map((rating) => ({
        rating,
        classRoom: this.data.classById(rating.classId),
      }));
  }

  protected ngOnDestroy() {
    window.clearInterval(this.clock);
  }

  protected openReveal() {
    if (!this.selectedClassId) return;
    window.location.href = this.appUrl(`/parent/reveal?classId=${encodeURIComponent(this.selectedClassId)}&mode=${this.selectedKnightMode}`);
  }

  protected async submitLogin(event: Event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    this.loginLoading = true;
    this.loginError = '';

    try {
      const resolved = await this.auth.login(email, password);
      window.location.href = this.appUrl(resolved.role === 'admin' ? '/admin' : '/teacher');
    } catch {
      this.loginError = 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو لا توجد صلاحية لهذا الحساب.';
    } finally {
      this.loginLoading = false;
    }
  }

  protected async logout() {
    await this.auth.logout();
    window.location.href = this.appUrl('/login');
  }

  protected goToDashboard() {
    const role = this.auth.session().role;
    if (!role) return;
    window.location.href = this.appUrl(role === 'admin' ? '/admin' : '/teacher');
  }

  protected openTeacherForm(teacher?: Teacher) {
    this.editingTeacher = teacher ?? null;
    this.teacherForm = teacher
      ? {
          name: teacher.name,
          phone: teacher.phone,
          email: teacher.email,
          password: '',
          classId: teacher.classIds[0] ?? '',
        }
      : this.emptyTeacherForm();
    this.teacherFormOpen = true;
    this.clearAdminMessages();
  }

  protected async saveTeacher(event: Event) {
    event.preventDefault();
    const name = this.teacherForm.name.trim();
    const email = this.teacherForm.email.trim().toLowerCase();
    if (!name || !email) return this.showAdminError('اسم المعلم والبريد الإلكتروني مطلوبان.');
    if (!this.editingTeacher && !this.teacherForm.password.trim()) {
      return this.showAdminError('كلمة المرور مطلوبة عند إضافة معلم جديد.');
    }

    const id = this.editingTeacher?.id ?? `t${Date.now()}`;
    let authUid = this.editingTeacher?.authUid ?? null;

    try {
      if (!this.editingTeacher) {
        authUid = await this.auth.createTeacherAuthAccount(email, this.teacherForm.password);
      }
    } catch {
      return this.showAdminError('تعذر إنشاء حساب الدخول للمعلم. تحقق من البريد أو كلمة المرور.');
    }

    const teacher: Teacher = {
      id,
      name,
      phone: this.teacherForm.phone.trim(),
      classIds: this.teacherForm.classId ? [this.teacherForm.classId] : [],
      photo:
        this.editingTeacher?.photo ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=127a86`,
      email,
      authUid,
    };

    try {
      await this.data.saveTeacher(teacher);
      this.teacherFormOpen = false;
      this.showAdminNotice(this.editingTeacher ? 'تم تعديل بيانات المعلم.' : 'تم إضافة المعلم.');
    } catch {
      this.showAdminError('تعذر حفظ بيانات المعلم. تحقق من الصلاحيات.');
    }
  }

  protected async deleteTeacher(id: string) {
    if (!window.confirm('هل تريد حذف هذا المعلم؟')) return;
    try {
      await this.data.deleteTeacher(id);
      this.showAdminNotice('تم حذف المعلم.');
    } catch {
      this.showAdminError('تعذر حذف المعلم.');
    }
  }

  protected openClassForm(classRoom?: ClassRoom) {
    this.editingClass = classRoom ?? null;
    this.classForm = classRoom
      ? { name: classRoom.name, level: classRoom.level, teacherId: classRoom.teacherId ?? '', closeTime: classRoom.closeTime }
      : this.emptyClassForm();
    this.classFormOpen = true;
    this.clearAdminMessages();
  }

  protected async saveClassRoom(event: Event) {
    event.preventDefault();
    const name = this.classForm.name.trim();
    if (!name) return this.showAdminError('اسم الشعبة مطلوب.');

    const id = this.editingClass?.id ?? `c${Date.now()}`;
    const classRoom: ClassRoom = {
      id,
      name,
      level: this.classForm.level,
      teacherId: this.classForm.teacherId || null,
      closeTime: this.classForm.closeTime || '20:00',
      studentCount: this.data.studentsOfClass(id).length,
    };

    try {
      await this.data.saveClassRoom(classRoom);
      this.classFormOpen = false;
      this.showAdminNotice(this.editingClass ? 'تم تعديل الشعبة.' : 'تم إضافة الشعبة.');
    } catch {
      this.showAdminError('تعذر حفظ الشعبة.');
    }
  }

  protected openStudentForm(student?: Student) {
    this.editingStudent = student ?? null;
    this.studentForm = student
      ? {
          name: student.name,
          grade: student.grade,
          classId: student.classId,
          photo: student.photo,
          photoPath: student.photoPath,
          photoFile: null,
          photoPreview: student.photo,
        }
      : this.emptyStudentForm();
    this.studentFormOpen = true;
    this.clearAdminMessages();
  }

  protected pickStudentImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (this.studentForm.photoPreview.startsWith('blob:')) URL.revokeObjectURL(this.studentForm.photoPreview);
    this.studentForm = { ...this.studentForm, photoFile: file, photoPreview: URL.createObjectURL(file) };
  }

  protected async saveStudent(event: Event) {
    event.preventDefault();
    const name = this.studentForm.name.trim();
    if (!name || !this.studentForm.classId) return this.showAdminError('اسم الطالب والشعبة مطلوبان.');
    if (this.data.studentNameExists(name, this.editingStudent?.id)) {
      return this.showAdminError('يوجد طالب بنفس الاسم.');
    }

    const id = this.editingStudent?.id ?? `st${Date.now()}`;
    let photo =
      this.studentForm.photo ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    let photoPath = this.studentForm.photoPath;
    if (this.studentForm.photoFile) {
      const uploaded = await this.data.uploadStudentPhoto(id, this.studentForm.photoFile);
      photo = uploaded.url;
      photoPath = uploaded.path;
    }
    const student: Student = {
      id,
      name,
      grade: this.studentForm.grade.trim(),
      classId: this.studentForm.classId,
      photo,
      photoPath,
      nationalId: this.editingStudent?.nationalId ?? '',
      todayScores: this.editingStudent?.todayScores ?? {},
      weeklyAverage: this.editingStudent?.weeklyAverage ?? 0,
      overallPercent: this.editingStudent?.overallPercent ?? 0,
    };

    try {
      await this.data.saveStudent(student);
      this.studentFormOpen = false;
      this.showAdminNotice(this.editingStudent ? 'تم تعديل بيانات الطالب.' : 'تم إضافة الطالب.');
    } catch {
      this.showAdminError('تعذر حفظ بيانات الطالب.');
    }
  }

  protected async deleteStudent(id: string) {
    if (!window.confirm('هل تريد حذف هذا الطالب؟')) return;
    try {
      await this.data.deleteStudent(id);
      this.showAdminNotice('تم حذف الطالب.');
    } catch {
      this.showAdminError('تعذر حذف الطالب.');
    }
  }

  protected startStandardsEdit() {
    if (this.standardsDirty) return;
    this.standardsDraft = this.data.standardsForScoring().map((standard) => ({ ...standard }));
    this.standardsDirty = true;
  }

  protected updateStandard(index: number, patch: Partial<Standard>) {
    this.startStandardsEdit();
    this.standardsDraft = this.standardsDraft.map((standard, idx) =>
      idx === index ? { ...standard, ...patch } : standard,
    );
  }

  protected addStandard() {
    this.startStandardsEdit();
    this.standardsDraft = [
      ...this.standardsDraft,
      { id: `new-${Date.now()}`, name: 'معيار جديد', description: '', weight: 1 },
    ];
  }

  protected removeStandard(index: number) {
    this.startStandardsEdit();
    this.standardsDraft = this.standardsDraft.filter((_, idx) => idx !== index);
  }

  protected async saveStandards() {
    this.startStandardsEdit();
    try {
      const current = this.data.standards();
      const removed = current.filter((standard) => !this.standardsDraft.some((item) => item.id === standard.id));
      const cleaned = this.standardsDraft.map((standard) => ({
        ...standard,
        name: standard.name.trim() || 'معيار جديد',
        description: standard.description.trim(),
        weight: Math.max(1, Math.min(100, Math.round(Number(standard.weight) || 1))),
      }));
      await Promise.all([
        ...cleaned.map((standard) => this.data.saveStandard(standard)),
        ...removed.map((standard) => this.data.deleteStandard(standard.id)),
      ]);
      this.standardsDraft = cleaned;
      this.standardsDirty = false;
      this.showAdminNotice('تم حفظ معايير التميّز.');
    } catch {
      this.showAdminError('تعذر حفظ المعايير.');
    }
  }

  protected openTeacherStudentForm(student?: Student) {
    this.editingTeacherStudent = student ?? null;
    this.teacherStudentForm = student
      ? {
          name: student.name,
          grade: student.grade,
          photo: student.photo,
          photoPath: student.photoPath,
          photoFile: null,
          photoPreview: student.photo,
        }
      : this.emptyTeacherStudentForm();
    this.teacherStudentFormOpen = true;
    this.clearTeacherMessages();
  }

  protected pickTeacherStudentImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (this.teacherStudentForm.photoPreview.startsWith('blob:')) URL.revokeObjectURL(this.teacherStudentForm.photoPreview);
    this.teacherStudentForm = { ...this.teacherStudentForm, photoFile: file, photoPreview: URL.createObjectURL(file) };
  }

  protected async saveTeacherStudent(event: Event) {
    event.preventDefault();
    const name = this.teacherStudentForm.name.trim();
    if (!name || !this.teacherRouteClassId) return this.showTeacherError('اسم الطالب مطلوب.');
    if (this.data.studentNameExists(name, this.editingTeacherStudent?.id)) {
      return this.showTeacherError('يوجد طالب بنفس الاسم.');
    }

    const id = this.editingTeacherStudent?.id ?? `st${Date.now()}`;
    let photo =
      this.teacherStudentForm.photo ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    let photoPath = this.teacherStudentForm.photoPath;
    if (this.teacherStudentForm.photoFile) {
      const uploaded = await this.data.uploadStudentPhoto(id, this.teacherStudentForm.photoFile);
      photo = uploaded.url;
      photoPath = uploaded.path;
    }
    const student: Student = this.editingTeacherStudent
      ? {
          ...this.editingTeacherStudent,
          name,
          grade: this.teacherStudentForm.grade.trim(),
          photo,
          photoPath,
        }
      : {
          id,
          name,
          grade: this.teacherStudentForm.grade.trim(),
          classId: this.teacherRouteClassId,
          photo,
          photoPath,
          nationalId: '',
          todayScores: {},
          weeklyAverage: 0,
          overallPercent: 0,
        };

    try {
      await this.data.saveStudent(student);
      this.teacherStudentFormOpen = false;
      this.showTeacherNotice(this.editingTeacherStudent ? 'تم تعديل الطالب.' : 'تم إضافة الطالب.');
    } catch {
      this.showTeacherError('تعذر حفظ بيانات الطالب.');
    }
  }

  protected initializeEvaluation() {
    this.evalScores = Object.fromEntries(
      this.evalRoster.map((student) => [student.id, { ...student.todayScores }]),
    );
    this.evalIndex = Math.min(this.evalIndex, Math.max(this.evalRoster.length - 1, 0));
  }

  protected async setEvaluationScore(standardId: string, score: number) {
    const student = this.evalStudent;
    if (!student || !this.canEvaluate) return;
    const nextScores = { ...(this.evalScores[student.id] ?? {}), [standardId]: score };
    this.evalScores = { ...this.evalScores, [student.id]: nextScores };
    this.evalSaving = 'saving';
    try {
      await this.data.saveStudentScores(student.id, nextScores, this.now);
      this.evalSaving = 'saved';
      window.setTimeout(() => {
        if (this.evalSaving === 'saved') this.evalSaving = null;
      }, 1400);
    } catch {
      this.evalSaving = null;
      this.showTeacherError('تعذر حفظ التقييم.');
    }
  }

  protected previousEvalStudent() {
    this.evalIndex = Math.max(0, this.evalIndex - 1);
  }

  protected nextEvalStudent() {
    if (this.evalIndex >= this.evalRoster.length - 1) {
      this.showTeacherNotice('تم إنهاء التقييم.');
      return;
    }
    this.evalIndex += 1;
  }

  protected completedRatingsForClass(classId: string) {
    return this.data.studentsOfClass(classId).filter((student) => {
      const scores = student.todayScores ?? {};
      return Object.keys(scores).length >= this.data.standardsForScoring().length;
    }).length;
  }

  protected timeUntil(target: Date) {
    const diff = Math.max(target.getTime() - this.now.getTime(), 0);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  protected scoreStars(score: number) {
    return [1, 2, 3, 4, 5].map((value) => ({ value, filled: value <= score }));
  }

  protected standardScorePercent(scores: Record<string, number>, standardId: string) {
    return ((scores[standardId] ?? 0) / 5) * 100;
  }

  protected arabicNumber(value: number | string) {
    const digits = '٠١٢٣٤٥٦٧٨٩';
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
  }

  protected reportBarWidth(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  protected evalStudentComplete(student: Student) {
    return Object.keys(this.evalScores[student.id] || student.todayScores || {}).length === this.data.standardsForScoring().length;
  }

  protected async downloadStudentTemplate() {
    const XLSX = await import('xlsx');
    const rows = [
      ['name', 'classId', 'grade'],
      ['أحمد محمد', this.data.classes()[0]?.id ?? 'c1', 'الرابع'],
      ['محمد علي', this.data.classes()[1]?.id ?? this.data.classes()[0]?.id ?? 'c2', 'الخامس'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'students');
    const buffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students-template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async parseImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error('no-sheet');

      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: '',
        raw: false,
      });
      const classIds = new Set(this.data.classes().map((classRoom) => classRoom.id));
      const seenNames = new Set<string>();

      this.importRows = json.map((item, index) => {
        const name = String(item['name'] ?? item['Name'] ?? '').trim();
        const classId = String(item['classId'] ?? item['classID'] ?? item['class_id'] ?? '').trim();
        const grade = String(item['grade'] ?? item['Grade'] ?? '').trim();
        const normalizedName = this.normalizeStudentName(name);
        let error: string | undefined;

        if (!name) error = 'الاسم مفقود';
        else if (!classId) error = 'الشعبة مفقودة';
        else if (!classIds.has(classId)) error = `معرف الشعبة غير صحيح: ${classId}`;
        else if (!grade) error = 'الصف مفقود';
        else if (seenNames.has(normalizedName) || this.data.studentNameExists(name)) error = 'الاسم مكرر';

        if (!error) seenNames.add(normalizedName);
        return { row: index + 2, name, classId, grade, error };
      });
      this.importStep = this.importRows.length > 0 ? 2 : 1;
      this.showAdminNotice(`تمت قراءة ${this.importRows.length} صف.`);
    } catch {
      this.importRows = [];
      this.showAdminError('تعذر قراءة ملف Excel. تأكد من صيغة الملف والأعمدة المطلوبة.');
    } finally {
      input.value = '';
    }
  }

  protected async importValidRows() {
    if (this.validImportRows.length === 0) return this.showAdminError('لا توجد صفوف صالحة للاستيراد.');
    this.importBusy = true;
    this.clearAdminMessages();

    try {
      await Promise.all(
        this.validImportRows.map((row) =>
          this.data.saveStudent({
            id: `st-${Date.now()}-${row.row}-${Math.random().toString(36).slice(2, 8)}`,
            name: row.name,
            grade: row.grade,
            classId: row.classId,
            photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(row.name)}&backgroundColor=b6e3f4`,
            photoPath: '',
            nationalId: '',
            todayScores: {},
            weeklyAverage: 0,
            overallPercent: 0,
          }),
        ),
      );
      const count = this.validImportRows.length;
      this.importStep = 4;
      this.showAdminNotice(`تم استيراد ${count} طالب.`);
      window.setTimeout(() => {
        window.location.href = this.appUrl('/admin/students');
      }, 1400);
    } catch {
      this.showAdminError('تعذر استيراد بعض الصفوف.');
    } finally {
      this.importBusy = false;
    }
  }

  protected classStudentCount(classId: string) {
    return this.data.studentsOfClass(classId).length;
  }

  protected previousImportStep() {
    if (this.importStep === 0 || this.importBusy) return;
    this.importStep -= 1;
  }

  protected nextImportStep() {
    if (this.importBusy) return;
    if (this.importStep === 1 && this.importRows.length === 0) {
      this.showAdminError('ارفع ملف Excel أولاً.');
      return;
    }
    if (this.importStep < 3) {
      this.importStep += 1;
      this.clearAdminMessages();
    }
  }

  protected resetImportWizard() {
    this.importRows = [];
    this.importStep = 0;
    this.clearAdminMessages();
  }

  private emptyTeacherForm() {
    return { name: '', phone: '', email: '', password: '', classId: '' };
  }

  private emptyClassForm(): { name: string; level: ClassLevel; teacherId: string; closeTime: string } {
    return { name: '', level: 'الفئة الوسطى', teacherId: '', closeTime: '20:00' };
  }

  private emptyStudentForm(): StudentForm {
    return { name: '', grade: '', classId: '', photo: '', photoPath: '', photoFile: null, photoPreview: '' };
  }

  private emptyTeacherStudentForm(): TeacherStudentForm {
    return { name: '', grade: '', photo: '', photoPath: '', photoFile: null, photoPreview: '' };
  }

  private clearAdminMessages() {
    this.adminNotice = '';
    this.adminError = '';
  }

  private showAdminNotice(message: string) {
    this.adminNotice = message;
    this.adminError = '';
  }

  private showAdminError(message: string) {
    this.adminError = message;
    this.adminNotice = '';
  }

  private clearTeacherMessages() {
    this.teacherNotice = '';
    this.teacherError = '';
  }

  private showTeacherNotice(message: string) {
    this.teacherNotice = message;
    this.teacherError = '';
  }

  private showTeacherError(message: string) {
    this.teacherError = message;
    this.teacherNotice = '';
  }

  private normalizeStudentName(name: string) {
    return name
      .trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private average(values: number[]) {
    const finite = values.map(Number).filter((value) => Number.isFinite(value));
    if (finite.length === 0) return 0;
    return Math.round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
  }
}
