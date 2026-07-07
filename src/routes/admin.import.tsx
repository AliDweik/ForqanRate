import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useFirestoreData,
  saveStudent,
  type Student,
  studentNameExists,
  normalizeStudentName,
} from "@/lib/firestore-data";
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/import")({
  head: () => ({ meta: [{ title: "استيراد الطلاب — الإدارة" }] }),
  component: ImportWizard,
});

const steps = [
  { t: "تنزيل القالب", icon: Download },
  { t: "رفع الملف", icon: Upload },
  { t: "التحقق", icon: AlertTriangle },
  { t: "المعاينة", icon: FileSpreadsheet },
  { t: "الاستيراد", icon: CheckCircle2 },
];

type ImportRow = {
  row: number;
  name: string;
  classId: string;
  grade: string;
  error?: string;
};

function ImportWizard() {
  const { classes } = useFirestoreData();
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const classIds = useMemo(() => new Set(classes.map((c) => c.id)), [classes]);
  const validRows = rows.filter((r) => !r.error);
  const invalidRows = rows.filter((r) => r.error);

  const downloadTemplate = () => {
    const data = [
      ["name", "classId", "grade"],
      ["أحمد محمد", "c1", "الرابع"],
      ["محمد علي", "c2", "الخامس"],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "students");
    const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students-template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error("no_sheet");

    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: "",
      raw: false,
    });

    const seenNames = new Set<string>();
    const nextRows = json.map((item, index) => {
      const name = String(item.name ?? item.Name ?? "").trim();
      const classId = String(item.classId ?? item.classID ?? item.class_id ?? "").trim();
      const grade = String(item.grade ?? item.Grade ?? "").trim();
      const normalizedName = normalizeStudentName(name);
      let error: string | undefined;

      if (!name) error = "الاسم مفقود";
      else if (!classId) error = "الشعبة مفقودة";
      else if (!classIds.has(classId)) error = `classId غير صحيح: ${classId}`;
      else if (!grade) error = "الصف مفقود";
      else if (seenNames.has(normalizedName) || studentNameExists(name)) error = "الاسم مكرر";

      if (!error) seenNames.add(normalizedName);

      return {
        row: index + 2,
        name,
        classId,
        grade,
        error,
      };
    });

    setRows(nextRows);
    setStep(nextRows.length > 0 ? 2 : 1);
  };

  const onUploadClick = () => fileInputRef.current?.click();

  const importRows = async () => {
    if (validRows.length === 0) return toast.error("لا توجد صفوف صالحة للاستيراد");
    setImporting(true);
    try {
      await Promise.all(
        validRows.map((r) =>
          saveStudent({
            id: `st-${Date.now()}-${r.row}-${Math.random().toString(36).slice(2, 8)}`,
            name: r.name,
            grade: r.grade,
            classId: r.classId,
            photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(r.name)}&backgroundColor=b6e3f4`,
            nationalId: "",
            todayScores: {},
            weeklyAverage: 0,
            overallPercent: 0,
          } satisfies Student),
        ),
      );
      setStep(4);
      toast.success(`تم استيراد ${validRows.length} طالبًا`);
    } catch {
      toast.error("تعذر استيراد بعض الصفوف");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-primary sm:text-3xl">استيراد الطلاب</h1>
        <p className="text-sm text-muted-foreground">
          حمّل القالب، املأ الاسم والشعبة والصف، ثم ارفع الملف لنراجع `classId` فقط ونضيف الطلاب
          الصالحين.
        </p>
      </div>

      <div className="relative flex items-center justify-between gap-1 overflow-x-auto rounded-2xl bg-card p-4 shadow-soft">
        {steps.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-primary bg-primary text-primary-foreground shadow-elev",
                  !active && !done && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <div className="hidden text-xs sm:block">
                <div className="text-muted-foreground">الخطوة {i + 1}</div>
                <div className="font-bold">{s.t}</div>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1", done ? "bg-success" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          parseFile(file).catch(() => toast.error("تعذر قراءة الملف"));
          e.currentTarget.value = "";
        }}
      />

      <Card className="min-h-[400px] p-6">
        {step === 0 && (
          <div className="text-center">
            <FileSpreadsheet className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-4 text-xl font-bold">تنزيل قالب Excel</h2>
            <p className="mt-2 text-muted-foreground">
              الأعمدة المطلوبة: `name`، `classId`، `grade`
            </p>
            <Button className="mt-6" size="lg" onClick={downloadTemplate}>
              <Download className="ml-2 h-4 w-4" /> تنزيل القالب
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold">ارفع ملف Excel</h2>
            <div className="mt-6 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-medium">اسحب الملف هنا، أو انقر للتصفح</p>
              <p className="mt-1 text-xs text-muted-foreground">.xlsx أو .xls</p>
              <Button variant="outline" className="mt-4" onClick={onUploadClick}>
                تصفح الملفات
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-bold">التحقق من الصفوف</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-success/10 p-4">
                <div className="text-3xl font-bold text-success">{validRows.length}</div>
                <div className="text-xs">صفوف صالحة</div>
              </div>
              <div className="rounded-xl bg-destructive/10 p-4">
                <div className="text-3xl font-bold text-destructive">{invalidRows.length}</div>
                <div className="text-xs">صفوف غير صالحة</div>
              </div>
              <div className="rounded-xl bg-accent p-4">
                <div className="text-3xl font-bold text-gold-foreground">{rows.length}</div>
                <div className="text-xs">إجمالي الصفوف</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs">
                  <tr>
                    <th className="p-3 text-right">السطر</th>
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">classId</th>
                    <th className="p-3 text-right">الصف</th>
                    <th className="p-3 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.row} className="border-t">
                      <td className="p-3 font-mono" dir="ltr">
                        {r.row}
                      </td>
                      <td className="p-3">{r.name || "—"}</td>
                      <td className="p-3 font-mono" dir="ltr">
                        {r.classId || "—"}
                      </td>
                      <td className="p-3">{r.grade || "—"}</td>
                      <td className="p-3">
                        {r.error ? (
                          <Badge variant="destructive">{r.error}</Badge>
                        ) : (
                          <Badge variant="secondary">صالح</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">معاينة البيانات</h2>
            <p className="text-sm text-muted-foreground">
              سيتم استيراد {validRows.length} طالبًا صالحًا، مع تجاهل {invalidRows.length} صفوف غير
              صحيحة.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-success/10 p-4">
                <div className="text-3xl font-bold text-success">{validRows.length}</div>
                <div className="text-xs">جاهزة للاستيراد</div>
              </div>
              <div className="rounded-xl bg-destructive/10 p-4">
                <div className="text-3xl font-bold text-destructive">{invalidRows.length}</div>
                <div className="text-xs">مرفوضة</div>
              </div>
              <div className="rounded-xl bg-accent p-4">
                <div className="text-3xl font-bold text-gold-foreground">{classes.length}</div>
                <div className="text-xs">الشعب المتاحة</div>
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              الاستيراد سيضيف الطلاب الصالحين فقط، ويعتمد على `name` و`classId` و`grade`.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-success/10">
              <CheckCircle2 className="h-14 w-14 text-success animate-scale-in" />
            </div>
            <h2 className="mt-4 font-display text-2xl text-primary">تم الاستيراد بنجاح</h2>
            <p className="mt-2 text-muted-foreground">أُضيف {validRows.length} طالبًا إلى النظام</p>
            <Button className="mt-6" asChild>
              <Link to="/admin/students">
                <Sparkles className="ml-2 h-4 w-4" /> عرض الطلاب
              </Link>
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={step === 0 || importing}
          onClick={() => setStep((s) => s - 1)}
        >
          <ArrowRight className="ml-2 h-4 w-4" /> السابق
        </Button>
        {step < 3 ? (
          <Button
            disabled={(step === 1 && rows.length === 0) || importing}
            onClick={() => setStep((s) => s + 1)}
          >
            التالي <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        ) : step === 3 ? (
          <Button disabled={importing || validRows.length === 0} onClick={importRows}>
            {importing ? "جارٍ الاستيراد..." : "استيراد الطلاب"}
          </Button>
        ) : (
          <Button asChild>
            <Link to="/admin/students">الانتقال إلى الطلاب</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
