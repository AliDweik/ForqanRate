import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
};

export function StarRating({ value, onChange, size = "md", disabled }: Props) {
  const px = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  return (
    <div className="flex flex-row-reverse items-center gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={disabled}
            onClick={() => onChange?.(n)}
            className={cn(
              "rounded-md p-0.5 transition-transform",
              !disabled && "hover:scale-110 active:scale-95",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <Star
              className={cn(
                px,
                "transition-colors",
                active ? "fill-gold stroke-gold" : "fill-transparent stroke-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
