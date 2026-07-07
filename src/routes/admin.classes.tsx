import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  classes as initial,
  teachers,
  classLevels,
  studentsOfClass,
  getTeacher,
  saveClassRoom,
  type ClassRoom,
  type ClassLevel,
} from "@/lib/firestore-data";
import { Plus, Users, ChevronDown, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/classes")({
  head: () => ({ meta: [{ title: "الشعب — الإدارة" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const list = initial;
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [form, setForm] = useState<{ name: string; level: ClassLevel; teacherId: string }>({
    name: "",
    level: "الفئة الوسطى",
    teacherId: "",
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () => (levelFilter === "all" ? list : list.filter((c) => c.level === levelFilter)),
    [list, levelFilter],
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", level: "الفئة الوسطى", teacherId: "" });
    setOpen(true);
  };
  const openEdit = (c: ClassRoom) => {
    setEditing(c);
    setForm({ name: c.name, level: c.level, teacherId: c.teacherId ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("اسم الشعبة مطلوب");
    try {
      if (editing) {
        await saveClassRoom({
          ...editing,
          name: form.name,
          level: form.level,
          teacherId: form.teacherId || null,
        });
        toast.success("تم تعديل الشعبة");
      } else {
        await saveClassRoom({
          id: `c${Date.now()}`,
          name: form.name,
          level: form.level,
          teacherId: form.teacherId || null,
          studentCount: 0,
          closeTime: "20:00",
        });
        toast.success("تم إضافة الشعبة");
      }
      setOpen(false);
    } catch {
      toast.error("تعذر حفظ الشعبة");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-primary sm:text-3xl">الشعب</h1>
          <p className="text-sm text-muted-foreground">جميع شعب المركز</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-48">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
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
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="ml-2 h-4 w-4" /> إضافة شعبة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "تعديل الشعبة" : "إضافة شعبة جديدة"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>الفئة</Label>
                  <Select
                    value={form.level}
                    onValueChange={(v) => setForm({ ...form, level: v as ClassLevel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classLevels.map((lv) => (
                        <SelectItem key={lv} value={lv}>
                          {lv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>اسم الشعبة</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="شعبة النور..."
                  />
                </div>
                <div>
                  <Label>
                    المعلم <span className="text-xs text-muted-foreground">(اختياري)</span>
                  </Label>
                  <Select
                    value={form.teacherId || "none"}
                    onValueChange={(v) => setForm({ ...form, teacherId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المعلم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— بدون معلم —</SelectItem>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const stuList = studentsOfClass(c.id);
          const isOpen = expanded === c.id;
          return (
            <Card
              key={c.id}
              className="group relative overflow-hidden p-5 transition-shadow hover:shadow-elev"
            >
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-primary-soft/60" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary">{c.level}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="mt-2 font-display text-xl text-primary">{c.name}</h3>
                <div className="mt-1 text-sm text-muted-foreground">
                  {getTeacher(c.teacherId)?.name ?? "— بدون معلم —"}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{stuList.length} طالب</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                  >
                    عرض الطلاب{" "}
                    <ChevronDown
                      className={`mr-1 h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>
                {isOpen && (
                  <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto rounded-lg bg-muted/40 p-2">
                    {stuList.length === 0 && (
                      <div className="p-2 text-center text-xs text-muted-foreground">
                        لا يوجد طلاب
                      </div>
                    )}
                    {stuList.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-md bg-card p-2 text-sm"
                      >
                        <img src={s.photo} className="h-7 w-7 rounded-full bg-muted" alt="" />
                        <div className="min-w-0 flex-1 truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.grade}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
