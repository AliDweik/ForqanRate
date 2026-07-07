import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { classesOfTeacher, studentsOfClass } from "@/lib/firestore-data";
import { useAuthSession } from "@/lib/auth-session";
import { School, ClipboardCheck, Clock, Trophy, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "لوحة المعلم — مركز الفرقان" }] }),
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const session = useAuthSession();
  const cls = session.teacher ? classesOfTeacher(session.teacher.id) : [];
  const total = cls.reduce((a, c) => a + c.studentCount, 0);
  const done = Math.round(total * 0.6);
  const pending = total - done;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-primary sm:text-3xl">
          أهلاً، {session.teacher?.name ?? "الشيخ"}
        </h1>
        <p className="text-sm text-muted-foreground">
          لديك {cls.length} شعب و{total} طالبًا
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="شعبي اليوم" value={cls.length} icon={School} tone="primary" />
        <StatCard label="تقييمات معلّقة" value={pending} icon={Clock} tone="muted" />
        <StatCard label="تقييمات مكتملة" value={done} icon={ClipboardCheck} tone="success" />
        <StatCard label="فرسان هذا الأسبوع" value={cls.length} icon={Trophy} tone="gold" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cls.map((c) => {
          const list = studentsOfClass(c.id);
          const doneCount = Math.round(list.length * 0.6);
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary">{c.level}</Badge>
                  <h3 className="mt-2 font-display text-xl text-primary">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{list.length} طالب</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
                  <School className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">التقييم اليوم</span>
                  <span className="font-bold">
                    {doneCount}/{list.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full teal-gradient"
                    style={{ width: `${(doneCount / Math.max(list.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
              <Button asChild className="mt-4 w-full" size="sm">
                <Link to="/teacher/class/$id" params={{ id: c.id }}>
                  فتح الشعبة <ArrowLeft className="mr-2 h-3 w-3" />
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
