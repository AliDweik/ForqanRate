import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Countdown } from "@/components/countdown";
import { IslamicPatternBg } from "@/components/islamic-pattern";
import {
  getClass,
  getTeacher,
  studentsOfClass,
  isAfterDeadline,
  isCountedDay,
  formatTime12h,
  saveStudent,
  studentNameExists,
  type Student,
} from "@/lib/firestore-data";
import { PlayCircle, Users, Trophy, Lock, Plus, Pencil, ImageUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/class/$id")({
  head: () => ({ meta: [{ title: "الشعبة — مركز الفرقان" }] }),
  component: ClassPage,
  notFoundComponent: () => <div className="p-8">الشعبة غير موجودة</div>,
});

function ClassPage() {
  const { id } = Route.useParams();
  const cls = getClass(id);
  const teacher = getTeacher(cls?.teacherId);
  const list = studentsOfClass(id);
  const done = Math.round(list.length * 0.6);
  const locked = isAfterDeadline();
  const counted = isCountedDay();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: "", grade: "", photo: "" });

  if (!cls) return <div className="p-8">الشعبة غير موجودة</div>;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", grade: "", photo: "" });
    setOpen(true);
  };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ name: s.name, grade: s.grade, photo: s.photo });
    setOpen(true);
  };

  const onPickImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("الاسم مطلوب");
    if (studentNameExists(form.name, editing?.id ?? undefined)) {
      return toast.error("يوجد طالب بنفس الاسم");
    }
    const photo =
      form.photo ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(form.name)}`;
    try {
      if (editing) {
        await saveStudent({ ...editing, name: form.name, grade: form.grade, photo });
        toast.success("تم التعديل");
      } else {
        await saveStudent({
          id: `st${Date.now()}`,
          name: form.name,
          grade: form.grade,
          photo,
          classId: id,
          nationalId: "",
          todayScores: {},
          weeklyAverage: 0,
          overallPercent: 0,
        });
        toast.success("تم إضافة الطالب");
      }
      setOpen(false);
    } catch {
      toast.error("تعذر حفظ بيانات الطالب");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary">{cls.name}</h1>
        <p className="text-sm text-muted-foreground">
          {teacher?.name ?? "—"} • {cls.level}
        </p>
      </div>

      <Card className="relative overflow-hidden p-6 sm:p-8">
        <IslamicPatternBg className="opacity-40" />
        <div className="relative grid gap-6 lg:grid-cols-3 lg:items-center">
          <div>
            <div className="text-sm text-muted-foreground">حالة اليوم</div>
            <div className="mt-1 text-2xl font-bold text-primary">
              {!counted ? "غير محتسب" : locked ? "مُغلق" : "جارٍ التقييم"}
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-primary" />
                {list.length} طالب
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-gold" />
                {done} مقيَّم
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 text-center text-xs text-muted-foreground">
              {locked ? "انتهى وقت التقييم" : `الوقت المتبقي حتى ${formatTime12h(cls.closeTime)}`}
            </div>
            <Countdown />
          </div>
          <div className="flex flex-col gap-2">
            {locked ? (
              <Button size="lg" disabled variant="outline">
                <Lock className="ml-2 h-4 w-4" /> تم إغلاق التقييم لهذا اليوم
              </Button>
            ) : (
              <Button asChild size="lg" className="animate-glow">
                <Link to="/teacher/evaluate/$classId" params={{ classId: id }}>
                  <PlayCircle className="ml-2 h-5 w-5" /> ابدأ تقييم اليوم
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">طلاب الشعبة</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openAdd}>
                <Plus className="ml-2 h-4 w-4" /> إضافة طالب
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "تعديل الطالب" : "إضافة طالب جديد"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                    {form.photo && (
                      <img src={form.photo} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickImage(e.target.files?.[0])}
                    />
                    <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                      <ImageUp className="h-4 w-4" /> صورة (اختياري)
                    </span>
                  </label>
                </div>
                <div>
                  <Label>الاسم</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>الصف</Label>
                  <Input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    placeholder="مثال: الرابع"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={save}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <img src={s.photo} className="h-10 w-10 rounded-full bg-muted" alt="" />
              <Link
                to="/student/$id"
                params={{ id: s.id }}
                className="min-w-0 flex-1 truncate hover:text-primary"
              >
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.grade || `${s.overallPercent}٪ إجمالي`}
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
