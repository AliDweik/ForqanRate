import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  standards,
  classes,
  teachers,
  classLevels,
  getTermDays,
  isVacationForLevel,
  TOTAL_WEEKS,
} from "@/lib/firestore-data";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "التقارير — الإدارة" }] }),
  component: ReportsPage,
});

const daily = ["الأحد", "الاثنين", "الأربعاء", "الخميس"].map((d, i) => ({
  d,
  حضور: 85 + i * 2,
  حفظ: 78 + i * 1.5,
  تجويد: 80 + i,
}));
const improvement = Array.from({ length: 8 }, (_, i) => ({
  w: `أ${i + 1}`,
  v: 65 + i * 3 + ((i * 7) % 5),
}));

function ReportsPage() {
  const teacherPerf = teachers.map((t, i) => ({
    name: t.name.replace("الشيخ ", ""),
    score: 78 + ((i * 11) % 20),
  }));
  const radarData = standards.map((s, i) => ({ subject: s.name, A: 60 + ((i * 17) % 35) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-primary sm:text-3xl">التقارير والإحصائيات</h1>
        <p className="text-sm text-muted-foreground">تحليلات شاملة لأداء المركز</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">الإحصائيات اليومية حسب المعيار</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" reversed />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="حضور" stroke="oklch(0.48 0.08 200)" strokeWidth={2} />
                <Line dataKey="حفظ" stroke="oklch(0.80 0.14 85)" strokeWidth={2} />
                <Line dataKey="تجويد" stroke="oklch(0.62 0.14 155)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-bold">أداء المعلمين</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={teacherPerf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" reversed />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="oklch(0.48 0.08 200)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-bold">توزيع المعايير</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis />
                <Radar
                  name="متوسط"
                  dataKey="A"
                  stroke="oklch(0.48 0.08 200)"
                  fill="oklch(0.48 0.08 200)"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-bold">تحسّن الطلاب</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={improvement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="w" reversed />
                <YAxis />
                <Tooltip />
                <Line
                  dataKey="v"
                  stroke="oklch(0.80 0.14 85)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "oklch(0.48 0.08 200)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 font-bold">متوسط أداء الشعب</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, i) => {
            const p = 70 + ((i * 7) % 25);
            return (
              <div key={c.id} className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-primary">{p}٪</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full teal-gradient" style={{ width: `${p}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 font-bold">أيام الفصل — {TOTAL_WEEKS} أسابيع</h3>
        <p className="mb-4 text-xs text-muted-foreground">توزيع أيام الدراسة والإجازات لكل فئة</p>
        <div className="grid gap-3 lg:grid-cols-3">
          {classLevels.map((lvl) => {
            const days = getTermDays();
            const vacs = days.filter((d) => isVacationForLevel(lvl, d)).length;
            const study = days.length - vacs;
            return (
              <div key={lvl} className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 font-bold">{lvl}</div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-success/20 text-success-foreground">دراسة {study}</Badge>
                  <Badge variant="secondary">إجازات {vacs}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
