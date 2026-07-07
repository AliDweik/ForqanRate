import { useEffect, useState } from "react";
import { evaluationDeadline } from "@/lib/firestore-data";
import { cn } from "@/lib/utils";

function useNow(interval = 1000) {
  const [n, s] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => s(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return n;
}

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
function toArabic(n: number) {
  return String(n).padStart(2, "0").replace(/\d/g, (d) => arabicDigits[+d]);
}

export function Countdown({ compact, target }: { compact?: boolean; target?: Date }) {
  const now = useNow();
  const deadline = target ?? evaluationDeadline(now);
  const diff = Math.max(0, deadline.getTime() - now.getTime());
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const done = diff <= 0;

  if (compact) {
    return (
      <span className={cn("font-mono text-sm font-semibold", done ? "text-success" : "text-primary")} dir="ltr">
        {done ? "٠٠:٠٠:٠٠" : `${toArabic(h)}:${toArabic(m)}:${toArabic(s)}`}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4" dir="ltr">
      {[
        { v: h, l: "ساعة" },
        { v: m, l: "دقيقة" },
        { v: s, l: "ثانية" },
      ].map((seg, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="min-w-16 rounded-2xl teal-gradient px-4 py-3 text-center font-mono text-3xl font-bold text-primary-foreground shadow-elev sm:min-w-20 sm:text-4xl">
            {toArabic(seg.v)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground" dir="rtl">{seg.l}</div>
        </div>
      ))}
    </div>
  );
}
