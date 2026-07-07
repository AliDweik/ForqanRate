import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  classLevels,
  getClass,
  type Student,
  saveStudent,
  deleteStudent,
  useFirestoreData,
  studentNameExists,
} from "@/lib/firestore-data";
import { Search, Eye, Plus, Pencil, Trash2, ImageUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "الطلاب — الإدارة" }] }),
  component: StudentsPage,
});

type Form = { name: string; grade: string; classId: string; photo: string };
const emptyForm: Form = { name: "", grade: "", classId: "", photo: "" };

function StudentsPage() {
  const { students: list, classes } = useFirestoreData();
  const [q, setQ] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const filteredClasses = useMemo(
    () => (levelFilter === "all" ? classes : classes.filter((c) => c.level === levelFilter)),
    [classes, levelFilter],
  );

  const filtered = useMemo(
    () =>
      list.filter((s) => {
        if (q && !s.name.includes(q)) return false;
        if (classFilter !== "all" && s.classId !== classFilter) return false;
        if (levelFilter !== "all") {
          const cls = getClass(s.classId);
          if (!cls || cls.level !== levelFilter) return false;
        }
        return true;
      }),
    [list, q, classFilter, levelFilter],
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ name: s.name, grade: s.grade, classId: s.classId, photo: s.photo });
    setOpen(true);
  };

  const onPickImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name.trim() || !form.classId) return toast.error("الاسم والشعبة مطلوبان");
    if (studentNameExists(form.name, editing?.id ?? undefined)) {
      return toast.error("يوجد طالب بنفس الاسم");
    }
    const photo =
      form.photo ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(form.name)}`;
    try {
      if (editing) {
        await saveStudent({ ...editing, ...form, photo });
        toast.success("تم تعديل بيانات الطالب");
      } else {
        await saveStudent({
          id: `st${Date.now()}`,
          name: form.name,
          grade: form.grade,
          classId: form.classId,
          photo,
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

  const remove = async (id: string) => {
    try {
      await deleteStudent(id);
      toast.success("تم حذف الطالب");
    } catch {
      toast.error("تعذر حذف الطالب");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-primary sm:text-3xl">الطلاب</h1>
          <p className="text-sm text-muted-foreground">{list.length} طالب في المركز</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
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
              <div>
                <Label>الشعبة</Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) => setForm({ ...form, classId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشعبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم…"
              className="pr-9"
            />
          </div>
          <Select
            value={levelFilter}
            onValueChange={(v) => {
              setLevelFilter(v);
              setClassFilter("all");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="تصفية بالفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفئات</SelectItem>
              {classLevels.map((lv) => (
                <SelectItem key={lv} value={lv}>
                  {lv}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية بالشعبة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الشعب</SelectItem>
              {filteredClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الطالب</TableHead>
              <TableHead className="text-right">الصف</TableHead>
              <TableHead className="text-right">الشعبة</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 30).map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img src={s.photo} className="h-8 w-8 rounded-full bg-muted" alt="" />
                    <span className="font-medium">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell>{s.grade}</TableCell>
                <TableCell>{getClass(s.classId)?.name}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/student/$id" params={{ id: s.id }}>
                        <Eye className="ml-1 h-3 w-3" /> عرض
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
