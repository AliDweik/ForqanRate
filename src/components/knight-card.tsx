import { forwardRef } from "react";
import { Download, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { standards, type Student, scoreToPercent, getClass } from "@/lib/firestore-data";
import { BrandLogo } from "@/components/brand-logo";
import { ArchOrnament } from "@/components/islamic-pattern";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  student: Student;
  title?: string;
  variant?: "gold" | "silver" | "bronze";
  showActions?: boolean;
};

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const toAr = (n: number | string) => String(n).replace(/\d/g, (d) => arabicDigits[+d]);

export const KnightCard = forwardRef<HTMLDivElement, Props>(function KnightCard(
  { student, title = "فارس اليوم", variant = "gold", showActions = true },
  _ref,
) {
  const cls = getClass(student.classId);
  const pct = scoreToPercent(student.todayScores);
  const date = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  let rimClass = "from-[oklch(0.72_0.10_55)] to-[oklch(0.50_0.10_50)]";
  if (variant === "gold") {
    rimClass = "from-[oklch(0.88_0.11_90)] to-[oklch(0.65_0.15_70)]";
  } else if (variant === "silver") {
    rimClass = "from-[oklch(0.90_0.01_250)] to-[oklch(0.70_0.01_250)]";
  }

  const cardId = `knight-card-${student.id}`;

  const handleDownload = async () => {
    const node = document.getElementById(cardId);
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `فارس-${student.name}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("تم تنزيل البطاقة");
    } catch {
      toast.error("تعذر تنزيل البطاقة");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title}: ${student.name}`, url: location.href });
      } catch {
        // ignore
      }
    } else {
      await navigator.clipboard.writeText(location.href);
      toast.success("تم نسخ الرابط");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={cardId}
        className={cn(
          "relative w-full max-w-sm overflow-hidden rounded-[2rem] p-1 shadow-elev",
          "bg-gradient-to-br",
          rimClass,
        )}
      >
        <div className="relative overflow-hidden rounded-[1.8rem] bg-[oklch(0.22_0.03_220)] p-6 text-primary-foreground">
          {/* pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] pattern-islamic" />
          <ArchOrnament className="pointer-events-none absolute -left-6 -top-6 h-40 w-40 opacity-30" />
          <ArchOrnament className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 rotate-180 opacity-30" />

          {/* header */}
          <div className="relative flex items-start justify-between">
            <BrandLogo
              showText={false}
              className="[&_div:first-child]:bg-white/10 [&_div:first-child]:backdrop-blur"
            />
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-gold drop-shadow">{title}</div>
              <div className="text-[10px] text-primary-foreground/60">{toAr(date)}</div>
            </div>
          </div>

          {/* photo */}
          <div className="relative mt-5 flex justify-center">
            <div className={cn("rounded-full p-1 bg-gradient-to-br", rimClass)}>
              <div className="relative h-32 w-32 overflow-hidden rounded-full bg-white/10 ring-4 ring-black/20">
                <img
                  src={student.photo}
                  alt={student.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full gold-gradient px-4 py-1 text-xs font-bold text-gold-foreground shadow-gold">
              {toAr(pct)}٪
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-xl font-bold">{student.name}</div>
            <div className="mt-1 text-xs text-primary-foreground/70">{cls?.name}</div>
          </div>

          {/* stat bars */}
          <div className="mt-5 space-y-2">
            {standards.map((s) => {
              const v = student.todayScores[s.id] ?? 0;
              const p = (v / 5) * 100;
              return (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-primary-foreground/80">
                    <span>{s.name}</span>
                    <span className="font-mono">{toAr(v)}/٥</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full gold-gradient" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-primary-foreground/60">
            <span>مركز الفرقان القرآني</span>
            <span>•</span>
            <span>بوابة للخير</span>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="default" size="sm">
            <Download className="ml-2 h-4 w-4" /> تنزيل البطاقة
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="ml-2 h-4 w-4" /> مشاركة
          </Button>
        </div>
      )}
    </div>
  );
});
