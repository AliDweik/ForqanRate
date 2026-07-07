import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { Countdown } from "@/components/countdown";
import {
  getClass,
  standards,
  scoreToPercent,
  evalWindowState,
  evaluationDeadline,
  evaluationStart,
  formatTime12h,
  saveStudentScores,
  useFirestoreData,
} from "@/lib/firestore-data";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  CloudUpload,
  Lock,
  Clock,
  CalendarX,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/evaluate/$classId")({
  head: () => ({ meta: [{ title: "التقييم اليومي — مركز الفرقان" }] }),
  component: EvaluatePage,
});

function EvaluatePage() {
  const { classId } = Route.useParams();
  const { students } = useFirestoreData();
  const cls = getClass(classId);
  const roster = useMemo(() => students.filter((s) => s.classId === classId), [classId, students]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState<null | "saving" | "saved">(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setScores(Object.fromEntries(roster.map((s) => [s.id, { ...s.todayScores }])));
    setIdx((current) => Math.min(current, Math.max(roster.length - 1, 0)));
  }, [classId, roster]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const win = evalWindowState(classId, now);
  const canRate = win.state === "open";

  const student = roster[idx];
  const myScores = student ? (scores[student.id] ?? {}) : {};
  const completeCount = roster.filter(
    (s) => Object.keys(scores[s.id] ?? {}).length === standards.length,
  ).length;
  const completePct = roster.length === 0 ? 0 : Math.round((completeCount / roster.length) * 100);

  const setScore = (sid: string, v: number) => {
    if (!canRate) return;
    const nextScores = { ...(scores[student.id] ?? {}), [sid]: v };
    setScores((prev) => ({ ...prev, [student.id]: nextScores }));
    setSaving("saving");
    saveStudentScores(student.id, nextScores)
      .then(() => {
        setSaving("saved");
        setTimeout(() => setSaving(null), 1400);
      })
      .catch((error: unknown) => {
        setSaving(null);
        console.error(error);
        const message =
          error instanceof Error && error.message ? error.message : "تعذر حفظ التقييم";
        toast.error(message);
      });
  };

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(roster.length - 1, i + 1));

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!canRate) return;
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
      const n = Number(e.key);
      if (n >= 1 && n <= 5) {
        const nextStd = standards.find((s) => !myScores[s.id]) ?? standards[0];
        setScore(nextStd.id, n);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, myScores, canRate]);

  if (!cls) return <div className="p-8">الشعبة غير موجودة</div>;
  if (!student) return <div className="p-8">لا يوجد طلاب في هذه الشعبة</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">التقييم اليومي</div>
          <h1 className="font-display text-2xl text-primary">{cls.name}</h1>
          <div className="mt-1 text-xs text-muted-foreground">
            نافذة التقييم: من ٢:٠٠ م حتى {formatTime12h(cls.closeTime)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            {win.state === "open" ? "الإغلاق بعد" : win.state === "before" ? "الفتح بعد" : ""}
          </div>
          {win.state === "open" && <Countdown compact target={evaluationDeadline(now, classId)} />}
          {win.state === "before" && <Countdown compact target={evaluationStart(classId, now)} />}
        </div>
      </div>

      {win.state === "vacation" && (
        <Card className="border-muted-foreground/40 bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            <CalendarX className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-bold">اليوم إجازة لهذه الفئة — لا يوجد تقييم</div>
          </div>
        </Card>
      )}
      {win.state === "before" && (
        <Card className="border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div className="text-sm font-bold text-primary">
              لم تبدأ نافذة التقييم بعد — تبدأ الساعة ٢:٠٠ م
            </div>
          </div>
        </Card>
      )}
      {win.state === "closed" && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-destructive" />
            <div className="text-sm font-bold text-destructive">تم إغلاق التقييم لهذا اليوم</div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">اكتمال التقييم</span>
              <span className="font-bold">
                {completeCount}/{roster.length} • {completePct}٪
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full teal-gradient transition-all"
                style={{ width: `${completePct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {saving === "saving" && (
              <>
                <CloudUpload className="h-4 w-4 animate-pulse text-primary" /> جارٍ الحفظ…
              </>
            )}
            {saving === "saved" && (
              <>
                <Check className="h-4 w-4 text-success" /> تم الحفظ تلقائيًا
              </>
            )}
            {saving === null && (
              <span className="text-muted-foreground">حفظ تلقائي بعد كل تغيير</span>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-gradient-to-br from-[oklch(0.88_0.11_90)] to-[oklch(0.65_0.15_70)] p-1">
              <img
                src={student.photo}
                className="h-28 w-28 rounded-full bg-card object-cover"
                alt=""
              />
            </div>
            <div className="text-center">
              <div className="font-bold">{student.name}</div>
              <div className="text-xs text-muted-foreground">{scoreToPercent(myScores)}٪ اليوم</div>
            </div>
          </div>

          <div className="space-y-3">
            {standards.map((s) => (
              <div key={s.id} className="rounded-xl border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.description}</div>
                  </div>
                </div>
                <StarRating
                  value={myScores[s.id] ?? 0}
                  onChange={(v) => setScore(s.id, v)}
                  disabled={!canRate}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={prev} disabled={idx === 0}>
          <ChevronRight className="ml-1 h-4 w-4" /> السابق
        </Button>
        <div className="text-sm text-muted-foreground">
          طالب {idx + 1} من {roster.length}
        </div>
        <Button
          disabled={idx === roster.length - 1 ? !canRate : false}
          onClick={idx === roster.length - 1 ? () => toast.success("تم إنهاء التقييم") : next}
        >
          {idx === roster.length - 1 ? "إنهاء" : "التالي"} <ChevronLeft className="mr-1 h-4 w-4" />
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex gap-2 overflow-x-auto">
          {roster.map((s, i) => {
            const filled = Object.keys(scores[s.id] ?? {}).length === standards.length;
            return (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                className={
                  "relative h-10 w-10 shrink-0 rounded-full ring-2 transition-all " +
                  (i === idx ? "ring-primary scale-110" : "ring-transparent") +
                  (filled ? " opacity-100" : " opacity-60")
                }
                title={s.name}
              >
                <img src={s.photo} className="h-full w-full rounded-full object-cover" alt="" />
                {filled && (
                  <span className="absolute -bottom-0.5 -left-0.5 grid h-4 w-4 place-items-center rounded-full bg-success text-success-foreground">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/teacher/class/$id" params={{ id: classId }}>
            العودة للشعبة
          </Link>
        </Button>
      </div>
    </div>
  );
}
