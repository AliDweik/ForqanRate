import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "gold" | "success" | "muted";
  hint?: string;
};

export function StatCard({ label, value, icon: Icon, tone = "primary", hint }: Props) {
  const bg = {
    primary: "bg-primary-soft text-primary",
    gold: "bg-accent text-gold-foreground",
    success: "bg-success/10 text-success",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <div className="card-elev group relative overflow-hidden p-5 transition-shadow hover:shadow-elev">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-bold text-foreground">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", bg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
