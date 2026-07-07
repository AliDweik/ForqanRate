import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getStudent,
  getClass,
  getTeacher,
  scoreToPercent,
  weeklyTrend,
  useFirestoreData,
} from "@/lib/firestore-data";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/student/$id")({
  head: () => ({ meta: [{ title: "ملف الطالب — مركز الفرقان" }] }),
  component: StudentProfile,
  notFoundComponent: () => <div className="p-8">الطالب غير موجود</div>,
});

function StudentProfile() {
  const { id } = Route.useParams();
  const { students, classes, teachers, standards } = useFirestoreData();
  const s = getStudent(id) ?? students.find((item) => item.id === id);
  if (!s) return <div className="p-8">الطالب غير موجود</div>;
  const cls = getClass(s.classId) ?? classes.find((item) => item.id === s.classId);
  const teacher = cls
    ? (getTeacher(cls.teacherId) ?? teachers.find((item) => item.id === cls.teacherId))
    : null;
  const trend = weeklyTrend(id);
  const todayPct = scoreToPercent(s.todayScores);
  const radar = standards.map((st) => ({ name: st.name, v: (s.todayScores[st.id] ?? 0) * 20 }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/students">
            <ArrowRight className="ml-2 h-4 w-4" /> العودة
          </Link>
        </Button>
      </div>

      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 pattern-islamic opacity-30" />
        <div className="relative grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="rounded-full bg-gradient-to-br from-[oklch(0.88_0.11_90)] to-[oklch(0.65_0.15_70)] p-1">
            <img
              src={s.photo}
              className="h-28 w-28 rounded-full bg-card object-cover"
              alt={s.name}
            />
          </div>
          <div>
            <h1 className="font-display text-3xl text-primary">{s.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{cls?.name}</Badge>
              <Badge variant="outline">{teacher?.name}</Badge>
              <Badge variant="outline" className="font-mono" dir="ltr">
                {s.nationalId}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:text-right">
            <div>
              <div className="text-xs text-muted-foreground">تقييم اليوم</div>
              <div className="text-2xl font-bold text-primary">{todayPct}٪</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">المعدّل الأسبوعي</div>
              <div className="text-2xl font-bold">{s.weeklyAverage.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">النسبة الكلية</div>
              <div className="text-2xl font-bold text-gold-foreground">{s.overallPercent}٪</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">تطور الأداء الأسبوعي</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" reversed />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="oklch(0.48 0.08 200)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "oklch(0.80 0.14 85)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-bold">توزيع المعايير اليوم</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <Radar
                  dataKey="v"
                  stroke="oklch(0.48 0.08 200)"
                  fill="oklch(0.80 0.14 85)"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 font-bold">تفصيل تقييم اليوم</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {standards.map((st) => {
            const v = s.todayScores[st.id] ?? 0;
            return (
              <div key={st.id} className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">{st.name}</div>
                  <div className="text-primary">{v}/٥</div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full gold-gradient" style={{ width: `${(v / 5) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-bold">سجل التقييمات</h3>
        <div className="space-y-2">
          {trend.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border bg-muted/30 p-2 text-sm"
            >
              <span>{d.day}</span>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full teal-gradient" style={{ width: `${d.percent}%` }} />
                </div>
                <span className="font-mono">{d.percent}٪</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
