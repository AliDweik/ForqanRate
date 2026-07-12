import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { IslamicPatternBg, ArchOrnament } from "@/components/islamic-pattern";
import { useFirestoreData } from "@/lib/firestore-data";
import { ArrowLeft, LogIn, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مركز الفرقان القرآني — فارس اليوم" },
      { name: "description", content: "اختر الشعبة لمتابعة إعلان فارس اليوم." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const { classes } = useFirestoreData();
  const [classId, setClassId] = useState<string | undefined>();

  return (
    <div className="relative min-h-screen overflow-hidden pattern-islamic">
      <IslamicPatternBg />
      <ArchOrnament className="pointer-events-none absolute -right-24 top-10 h-96 w-96 opacity-30" />
      <ArchOrnament className="pointer-events-none absolute -left-24 bottom-10 h-96 w-96 rotate-180 opacity-25" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between p-4 sm:p-6">
        <BrandLogo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/login">
            <LogIn className="ml-2 h-4 w-4" /> دخول المعلم / الإدارة
          </Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-16">
        <section className="text-center lg:text-right">
          <h1 className="mt-4 font-display text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
            فارس اليوم <span className="text-gold">وفارس الأسبوع</span>
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            نظامٌ يوميّ لتكريم أبنائكم في مركز الفرقان القرآني، بناءً على معايير التميّز. اختر شعبة
            ابنك وتابع إعلان فارس اليوم بعد الساعة الثامنة مساءً.
          </p>
          <blockquote className="mt-6 rounded-2xl border-r-4 border-gold bg-card p-4 font-display text-lg text-foreground/80 shadow-soft sm:text-xl">
            ﴿ ثُمَّ أَوْرَثْنَا الْكِتَابَ الَّذِينَ اصْطَفَيْنَا مِنْ عِبَادِنَا ﴾
          </blockquote>
        </section>

        <Card className="relative overflow-hidden border-0 p-6 shadow-elev sm:p-8">
          <div className="pointer-events-none absolute inset-0 pattern-islamic opacity-40" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">اختر لعرض فارس اليوم</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">الشعبة</label>
                <select
                  value={classId ?? ""}
                  onChange={(event) => setClassId(event.target.value || undefined)}
                  className="flex h-10 w-full cursor-pointer appearance-auto rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    اختر الشعبة
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.level}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="mt-2 w-full"
                size="lg"
                disabled={!classId}
                onClick={() => classId && navigate({ to: "/parent/reveal", search: { classId } })}
              >
                عرض فارس اليوم
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <footer className="relative z-10 border-t bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 p-4 text-xs text-muted-foreground sm:flex-row sm:p-6">
          <div>© مركز الفرقان القرآني — مرج الحمام، عمّان</div>
          <div>
            للتواصل: <span dir="ltr">0799456785</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
