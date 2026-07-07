import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { saveClassRoom, useFirestoreData } from "@/lib/firestore-data";
import { Save, ImageUp, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — الإدارة" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { classes: initialClasses } = useFirestoreData();
  const [times, setTimes] = useState<Record<string, string>>(
    Object.fromEntries(initialClasses.map((c) => [c.id, c.closeTime])),
  );
  useEffect(() => {
    setTimes(Object.fromEntries(initialClasses.map((c) => [c.id, c.closeTime])));
  }, [initialClasses]);
  const save = async () => {
    try {
      await Promise.all(
        initialClasses.map((c) => saveClassRoom({ ...c, closeTime: times[c.id] ?? c.closeTime })),
      );
      toast.success("تم حفظ الإعدادات");
    } catch {
      toast.error("تعذر حفظ الإعدادات");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-primary sm:text-3xl">الإعدادات</h1>
          <p className="text-sm text-muted-foreground">إعدادات المركز والنظام</p>
        </div>
        <Button onClick={save}>
          <Save className="ml-2 h-4 w-4" /> حفظ
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-bold">معلومات المركز</h3>
          <div className="space-y-3">
            <div>
              <Label>اسم المركز</Label>
              <Input defaultValue="مركز الفرقان القرآني" />
            </div>
            <div>
              <Label>الشعار الفرعي</Label>
              <Input defaultValue="بوابة للخير" />
            </div>
            <div>
              <Label>العنوان</Label>
              <Input defaultValue="مرج الحمام — عمّان" />
            </div>
            <div>
              <Label>رقم التواصل</Label>
              <Input defaultValue="0799456785" dir="ltr" />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input defaultValue="forqancentre@yahoo.com" dir="ltr" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-bold">شعار المركز</h3>
          <div className="rounded-2xl border-2 border-dashed p-8 text-center">
            <ImageUp className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">ارفع شعار المركز</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG أو SVG، حد أقصى ١ ميغابايت</p>
            <Button variant="outline" size="sm" className="mt-4">
              اختيار ملف
            </Button>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-bold">مواعيد إغلاق التقييم — لكل شعبة</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {initialClasses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{c.name}</div>
                  <Badge variant="secondary" className="mt-1">
                    {c.level}
                  </Badge>
                </div>
                <Input
                  type="time"
                  dir="ltr"
                  className="w-32"
                  value={times[c.id]}
                  onChange={(e) => setTimes((t) => ({ ...t, [c.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-bold">التقييم</h3>
          <div className="space-y-3">
            <div>
              <Label>اللغة الافتراضية</Label>
              <Select defaultValue="ar">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-bold">القالب والمظهر</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>الزخارف الإسلامية</Label>
                <p className="text-xs text-muted-foreground">إظهار الأنماط الهندسية في الخلفيات</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>حركات الانتقال</Label>
                <p className="text-xs text-muted-foreground">تفعيل الرسوم المتحركة الناعمة</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
