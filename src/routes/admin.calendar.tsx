import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  classLevels, getTermDays, weekOfDate, isVacationForLevel,
  setOverride, clearOverride, arabicDayName, dayKey, getOverride,
  TOTAL_WEEKS, CURRENT_WEEK, type ClassLevel,
} from "@/lib/firestore-data";
import { CalendarDays, Sun, Moon, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/calendar")({
  head: () => ({ meta: [{ title: "التقويم الدراسي — الإدارة" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const [level, setLevel] = useState<ClassLevel>(classLevels[0]);
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);
  const days = useMemo(() => getTermDays(), []);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const weeks = useMemo(() => {
    const w: Date[][] = Array.from({ length: TOTAL_WEEKS }, () => []);
    days.forEach((d) => w[weekOfDate(d) - 1].push(d));
    return w;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, tick]);

  const toggle = (d: Date) => {
    const override = getOverride(level, d);
    const isVac = isVacationForLevel(level, d);
    // Cycle: default -> opposite override -> clear
    if (override === undefined) {
      setOverride(level, d, isVac ? "fine" : "vacation");
      toast.success(isVac ? "تم تعيين اليوم كيوم دراسي" : "تم تعيين اليوم كإجازة");
    } else {
      clearOverride(level, d);
      toast("تمت العودة للإعداد الافتراضي");
    }
    bump();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-primary sm:text-3xl">التقويم الدراسي</h1>
          <p className="text-sm text-muted-foreground">
            الفصل مؤلف من {toArabic(TOTAL_WEEKS)} أسابيع — نحن في الأسبوع {toArabic(CURRENT_WEEK)}.
            الافتراضي: الثلاثاء والجمعة والسبت إجازة. يمكنك تعديل أي يوم لكل فئة.
          </p>
        </div>
      </div>

      <Tabs value={level} onValueChange={(v) => setLevel(v as ClassLevel)}>
        <TabsList>
          {classLevels.map((l) => (
            <TabsTrigger key={l} value={l}>{l}</TabsTrigger>
          ))}
        </TabsList>

        {classLevels.map((l) => (
          <TabsContent key={l} value={l} className="mt-4 space-y-4">
            <Card className="p-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-success" />
                  يوم دراسي
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/40" />
                  إجازة
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full ring-2 ring-primary" />
                  اليوم
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RotateCcw className="h-3 w-3" /> اضغط اليوم للتبديل، اضغط مجددًا للعودة للافتراضي
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {weeks.map((week, wi) => (
                <Card key={wi} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <h3 className="font-bold">الأسبوع {toArabic(wi + 1)}</h3>
                      {wi + 1 < CURRENT_WEEK && <Badge variant="secondary">منتهٍ</Badge>}
                      {wi + 1 === CURRENT_WEEK && <Badge className="bg-primary text-primary-foreground">الحالي</Badge>}
                      {wi + 1 > CURRENT_WEEK && <Badge variant="outline">قادم</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {week.map((d) => {
                      const vac = isVacationForLevel(l, d);
                      const override = getOverride(l, d);
                      const isToday = d.getTime() === today.getTime();
                      return (
                        <button
                          key={dayKey(d)}
                          onClick={() => toggle(d)}
                          className={
                            "group relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all hover:scale-[1.02] " +
                            (vac
                              ? "border-muted-foreground/20 bg-muted/40 text-muted-foreground"
                              : "border-success/30 bg-success/10 text-success-foreground") +
                            (isToday ? " ring-2 ring-primary" : "")
                          }
                          title={override ? "تم تعديله يدويًا" : "افتراضي"}
                        >
                          <div className="text-[10px] font-medium">{arabicDayName(d)}</div>
                          <div className="text-lg font-bold text-foreground">{toArabic(d.getDate())}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {toArabic(d.getMonth() + 1)}/{toArabic(d.getFullYear() % 100)}
                          </div>
                          {vac ? (
                            <Moon className="h-3 w-3 opacity-60" />
                          ) : (
                            <Sun className="h-3 w-3 text-gold" />
                          )}
                          {override && (
                            <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
function toArabic(n: number) {
  return String(n).replace(/\d/g, (d) => arabicDigits[+d]);
}
