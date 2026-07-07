import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { Countdown } from "@/components/countdown";
import { KnightCard } from "@/components/knight-card";
import { IslamicPatternBg, ArchOrnament } from "@/components/islamic-pattern";
import {
  getClass,
  isThursday,
  evalWindowState,
  currentPublishedKnight,
  currentWeeklyKnight,
  evaluationDeadline,
  formatArabicDate,
  formatTime12h,
} from "@/lib/firestore-data";
import { ArrowRight, Sparkles } from "lucide-react";

const searchSchema = z.object({ classId: z.string() });

export const Route = createFileRoute("/parent/reveal")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "إعلان فارس اليوم — مركز الفرقان القرآني" }] }),
  component: RevealPage,
});

function RevealPage() {
  const { classId } = Route.useSearch();
  const cls = getClass(classId);
  const now = new Date();
  const thursday = isThursday();
  const win = evalWindowState(classId, now);
  const publishing = win.state === "open" || win.state === "before"; // waiting for today's close
  const isTodayVacation = win.state === "vacation";

  const knight = thursday
    ? currentWeeklyKnight(classId, now)
    : currentPublishedKnight(classId, now);

  return (
    <div className="relative min-h-screen overflow-hidden pattern-islamic">
      <IslamicPatternBg />
      <ArchOrnament className="pointer-events-none absolute -right-24 top-10 h-96 w-96 opacity-25" />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between p-4 sm:p-6">
        <BrandLogo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowRight className="ml-2 h-4 w-4" /> رجوع
          </Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-soft">
            <Sparkles className="h-3 w-3 text-gold" />
            {cls?.name}
          </div>
          <h1 className="mt-3 font-display text-3xl text-primary sm:text-4xl">
            {thursday ? "فارس الأسبوع" : "فارس اليوم"}
          </h1>
        </div>

        {/* Show current knight (last published) always, plus a small banner
            telling users about today's status. */}
        {knight ? (
          <>
            <div className="animate-fade-in mb-6 flex justify-center">
              <KnightCard
                student={knight.s}
                title={thursday ? "فارس الأسبوع" : "فارس اليوم"}
                variant="gold"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              يوم التتويج: {formatArabicDate(knight.day)}
            </p>
          </>
        ) : (
          <Card className="mx-auto max-w-lg p-8 text-center shadow-elev">
            <h2 className="text-xl font-bold">لا يوجد فارس منشور بعد</h2>
            <p className="mt-2 text-muted-foreground">
              سيتم إعلان أول فارس بعد انتهاء أول يوم دراسي.
            </p>
          </Card>
        )}

        {isTodayVacation && (
          <Card className="mx-auto mt-6 max-w-xl p-5 text-center">
            <p className="text-sm text-muted-foreground">
              اليوم إجازة لهذه الفئة — سيُعلن الفارس الجديد بعد انتهاء أول يوم دراسي قادم.
            </p>
          </Card>
        )}

        {publishing && !isTodayVacation && (
          <Card className="relative mx-auto mt-6 max-w-xl overflow-hidden p-6 text-center shadow-soft">
            <div className="absolute inset-0 pattern-islamic opacity-20" />
            <div className="relative">
              <p className="text-sm text-muted-foreground">
                سيتم تحديث {thursday ? "فارس الأسبوع" : "فارس اليوم"} بعد إغلاق تقييم اليوم (الساعة{" "}
                {cls?.closeTime ? formatTime12h(cls.closeTime) : ""})
              </p>
              <div className="mt-4">
                <Countdown target={evaluationDeadline(now, classId)} />
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
