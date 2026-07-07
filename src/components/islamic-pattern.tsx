import { cn } from "@/lib/utils";

export function IslamicPatternBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 pattern-islamic opacity-60",
        className,
      )}
    />
  );
}

/** Ornate Islamic arch svg used across knight cards, hero, etc. */
export function ArchOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden>
      <defs>
        <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.88 0.11 90)" />
          <stop offset="1" stopColor="oklch(0.65 0.15 70)" />
        </linearGradient>
      </defs>
      <path
        d="M10 150 L10 60 Q10 10 60 10 Q110 10 110 60 L110 150 Z"
        fill="none"
        stroke="url(#gold)"
        strokeWidth="3"
      />
      <path
        d="M20 150 L20 62 Q20 20 60 20 Q100 20 100 62 L100 150"
        fill="none"
        stroke="url(#gold)"
        strokeWidth="1"
        opacity="0.5"
      />
      <g stroke="url(#gold)" strokeWidth="1.2" fill="none" opacity="0.85">
        <circle cx="60" cy="80" r="22" />
        <path d="M60 58 L66 74 L82 74 L69 84 L74 100 L60 90 L46 100 L51 84 L38 74 L54 74 Z" />
      </g>
    </svg>
  );
}
