import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { School, Users, GraduationCap, ClipboardCheck, Clock } from "lucide-react";
import { classes, teachers, students, standards } from "@/lib/firestore-data";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "لوحة التحكم — الإدارة" }] }),
  component: AdminDashboard,
});

const weekly = [
  { d: "السبت", v: 78 },
  { d: "الأحد", v: 82 },
  { d: "الاثنين", v: 85 },
  { d: "الثلاثاء", v: 80 },
  { d: "الأربعاء", v: 88 },
  { d: "الخميس", v: 91 },
];

function AdminDashboard() {
  const byClass = classes.map((c, i) => ({ name: c.name, average: 70 + ((i * 7) % 25) }));
  const done = Math.round(students.length * 0.68);
  const pending = students.length - done;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-primary sm:text-3xl">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground">نظرة عامة على أداء المركز اليوم</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="عدد الشعب" value={classes.length} icon={School} tone="primary" />
        <StatCard label="عدد المعلمين" value={teachers.length} icon={Users} tone="primary" />
        <StatCard label="عدد الطلاب" value={students.length} icon={GraduationCap} tone="primary" />
        <StatCard label="تقييمات اليوم" value={done} icon={ClipboardCheck} tone="success" />
        <StatCard
          label="متبقٍ من التقييم"
          value={pending}
          icon={Clock}
          tone="muted"
          hint="حتى ٨:٠٠ م"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-bold">متوسط الأداء الأسبوعي</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 210)" />
                <XAxis dataKey="d" reversed tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="oklch(0.48 0.08 200)"
                  strokeWidth={3}
                  dot={{ fill: "oklch(0.80 0.14 85)", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-bold">متوسط أداء الشعب</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byClass}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 210)" />
                <XAxis dataKey="name" reversed tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="average" fill="oklch(0.48 0.08 200)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-bold">معايير التميّز المعتمدة</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {standards.map((s) => (
            <div key={s.id} className="rounded-xl border bg-secondary/40 p-3">
              <div className="text-sm font-bold">{s.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>
              <div className="mt-2 text-xs text-primary">الوزن: {s.weight}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
