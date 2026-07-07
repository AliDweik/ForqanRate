import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteStandard,
  saveStandard,
  type Standard,
  useFirestoreData,
} from "@/lib/firestore-data";
import { Plus, Trash2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/standards")({
  head: () => ({ meta: [{ title: "معايير التميّز — الإدارة" }] }),
  component: StandardsPage,
});

function StandardsPage() {
  const { standards: initial } = useFirestoreData();
  const [list, setList] = useState<Standard[]>(initial);
  useEffect(() => setList(initial), [initial]);

  const update = (i: number, patch: Partial<Standard>) => {
    setList((l) => l.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const remove = (i: number) => setList((l) => l.filter((_, idx) => idx !== i));
  const add = () =>
    setList((l) => [
      ...l,
      { id: `new-${Date.now()}`, name: "معيار جديد", description: "", weight: 1 },
    ]);
  const save = async () => {
    try {
      const removed = initial.filter((s) => !list.some((item) => item.id === s.id));
      await Promise.all([...list.map(saveStandard), ...removed.map((s) => deleteStandard(s.id))]);
      toast.success("تم الحفظ");
    } catch {
      toast.error("تعذر حفظ المعايير");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-primary sm:text-3xl">معايير التميّز</h1>
          <p className="text-sm text-muted-foreground">تعديل معايير تقييم الطلاب اليومي</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}>
            <Plus className="ml-2 h-4 w-4" /> إضافة
          </Button>
          <Button onClick={save}>
            <Save className="ml-2 h-4 w-4" /> حفظ التغييرات
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {list.map((s, i) => (
          <Card key={s.id} className="p-5">
            <div className="grid gap-4 md:grid-cols-[auto_1fr_1fr_auto_auto] md:items-end">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <Label>اسم المعيار</Label>
                <Input value={s.name} onChange={(e) => update(i, { name: e.target.value })} />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  rows={1}
                  value={s.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </div>
              <div>
                <Label>الوزن</Label>
                <Input
                  type="number"
                  step="1"
                  min={1}
                  max={100}
                  value={s.weight}
                  onChange={(e) =>
                    update(i, {
                      weight: Math.max(1, Math.min(100, Math.round(+e.target.value || 1))),
                    })
                  }
                  className="w-24"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
