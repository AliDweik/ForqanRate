import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  teachers as initial,
  classes,
  saveTeacher,
  deleteTeacher,
  type Teacher,
} from "@/lib/firestore-data";
import { createTeacherAuthAccount } from "@/lib/auth-session";
import { Plus, Phone, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/teachers")({
  head: () => ({ meta: [{ title: "المعلمون — الإدارة" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const list = initial;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", classId: "", email: "", password: "" });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", classId: "", email: "", password: "" });
    setOpen(true);
  };
  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      name: t.name,
      phone: t.phone,
      classId: t.classIds[0] ?? "",
      email: t.email,
      password: "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("الاسم مطلوب");
    try {
      if (editing) {
        await saveTeacher({
          ...editing,
          name: form.name,
          phone: form.phone,
          classIds: form.classId ? [form.classId] : [],
          email: form.email.trim().toLowerCase(),
        });
        toast.success("تم تعديل بيانات المعلم");
      } else {
        const id = `t${Date.now()}`;
        if (!form.email.trim() || !form.password.trim())
          return toast.error("البريد الإلكتروني وكلمة المرور مطلوبان");
        const authUid = await createTeacherAuthAccount(
          form.email.trim().toLowerCase(),
          form.password,
        );
        await saveTeacher({
          id,
          name: form.name,
          phone: form.phone,
          classIds: form.classId ? [form.classId] : [],
          photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name)}&backgroundColor=127a86`,
          email: form.email.trim().toLowerCase(),
          authUid,
        });
        toast.success("تم إضافة المعلم");
      }
      setOpen(false);
    } catch {
      toast.error("تعذر حفظ بيانات المعلم");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTeacher(id);
      toast.success("تم حذف المعلم");
    } catch {
      toast.error("تعذر حذف المعلم");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-primary sm:text-3xl">المعلمون</h1>
          <p className="text-sm text-muted-foreground">إدارة معلمي المركز</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="ml-2 h-4 w-4" /> إضافة معلم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "تعديل معلم" : "إضافة معلم جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>الاسم</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="الشيخ فلان..."
                />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="07XXXXXXXX"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="teacher@example.com"
                  dir="ltr"
                  disabled={Boolean(editing)}
                />
              </div>
              {!editing && (
                <div>
                  <Label>كلمة المرور</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              )}
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
                        {c.name}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => {
          const cls = classes.find((c) => t.classIds.includes(c.id));
          return (
            <Card key={t.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{t.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span dir="ltr">{t.phone}</span>
                  </div>
                  <div className="mt-3">
                    {cls ? (
                      <Badge variant="secondary">{cls.name}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">— بدون شعبة —</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
