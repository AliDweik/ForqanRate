import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClass, getTeacher, topOfClass } from "@/lib/firestore-data";
import { IslamicPatternBg } from "@/components/islamic-pattern";
import { Trophy, Medal, Award, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard/$classId")({
  head: () => ({ meta: [{ title: "لوحة الشرف — مركز الفرقان" }] }),
  component: Leaderboard,
});

function Leaderboard() {
  const { classId } = Route.useParams();
  const cls = getClass(classId);
  if (!cls) return <div className="p-8">الشعبة غير موجودة</div>;
  const teacher = getTeacher(cls.teacherId);
  const top = topOfClass(classId, 20);
  const podium = top.slice(0, 3);
  const rest = top.slice(3);

  const heights = ["h-40 sm:h-48", "h-32 sm:h-40", "h-28 sm:h-36"];
  const medals = [
    { icon: Trophy, cls: "text-gold bg-accent" },
    { icon: Medal, cls: "text-[oklch(0.55_0.01_250)] bg-[oklch(0.94_0.005_250)]" },
    { icon: Award, cls: "text-bronze bg-[oklch(0.94_0.03_60)]" },
  ];
  const order = [1, 0, 2]; // silver, gold, bronze visual order

  return (
    <div className="relative min-h-screen p-4 pattern-islamic sm:p-6">
      <IslamicPatternBg />
      <div className="relative mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-primary">لوحة الشرف</h1>
            <p className="text-sm text-muted-foreground">
              {cls.name} • {teacher?.name}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/teacher/class/$id" params={{ id: classId }}>
              <ArrowRight className="ml-2 h-4 w-4" /> رجوع
            </Link>
          </Button>
        </div>

        {/* Podium */}
        <Card className="relative overflow-hidden p-6 sm:p-10">
          <div className="absolute inset-0 pattern-islamic opacity-30" />
          <div className="relative grid grid-cols-3 items-end gap-3 sm:gap-6">
            {order.map((rankIdx, i) => {
              const p = podium[rankIdx];
              if (!p) return <div key={i} />;
              const rank = rankIdx + 1;
              const M = medals[rankIdx];
              return (
                <div key={rankIdx} className="flex flex-col items-center gap-2">
                  <div className={cn("grid h-8 w-8 place-items-center rounded-full", M.cls)}>
                    <M.icon className="h-4 w-4" />
                  </div>
                  <div
                    className={cn("rounded-full p-1", rank === 1 ? "gold-gradient" : "bg-border")}
                  >
                    <img
                      src={p.s.photo}
                      className={cn(
                        "rounded-full bg-card object-cover",
                        rank === 1 ? "h-24 w-24 sm:h-28 sm:w-28" : "h-20 w-20 sm:h-24 sm:w-24",
                      )}
                      alt=""
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold">{p.s.name}</div>
                    <div className="text-xs text-primary">{p.pct}٪</div>
                  </div>
                  <div
                    className={cn(
                      "w-full rounded-t-2xl bg-gradient-to-t from-primary/20 to-primary/5",
                      heights[rankIdx],
                      rank === 1 && "from-gold/30 to-gold/10",
                    )}
                  >
                    <div className="pt-3 text-center font-display text-2xl text-primary sm:text-3xl">
                      {rank}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Rest */}
        <Card className="p-4">
          <div className="space-y-2">
            {rest.map((p, i) => (
              <Link
                key={p.s.id}
                to="/student/$id"
                params={{ id: p.s.id }}
                className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-accent"
              >
                <div className="w-6 text-center font-bold text-muted-foreground">{i + 4}</div>
                <img src={p.s.photo} className="h-10 w-10 rounded-full bg-muted" alt="" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.s.name}</div>
                </div>
                <div className="flex items-center gap-2 sm:w-40">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full teal-gradient transition-all"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <div className="w-10 text-xs font-bold text-primary">{p.pct}٪</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
