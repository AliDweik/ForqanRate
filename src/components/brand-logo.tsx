import { cn } from "@/lib/utils";

export function BrandLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-11 w-11 shrink-0 rounded-xl teal-gradient p-1.5 shadow-soft">
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path
            d="M20 4 L28 12 L28 32 L12 32 L12 12 Z"
            fill="none"
            stroke="oklch(0.88 0.11 90)"
            strokeWidth="1.8"
          />
          <path
            d="M20 14 L23 20 L29 20 L24 24 L26 30 L20 26 L14 30 L16 24 L11 20 L17 20 Z"
            fill="oklch(0.95 0.02 200)"
            opacity="0.9"
          />
        </svg>
      </div>
      {showText && (
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-lg font-bold text-primary">
            مركز الفرقان القرآني
          </div>
          <div className="truncate text-[10px] font-medium tracking-wide text-gold">
            بوابة للخير
          </div>
        </div>
      )}
    </div>
  );
}
