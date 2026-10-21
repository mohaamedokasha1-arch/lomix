import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "muted" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-white/15 bg-black/50 text-ink-50",
  accent: "border-ember-400/40 bg-ember-400/15 text-ember-200",
  muted: "border-white/10 bg-white/[0.05] text-ink-200",
  success: "border-signal-green/35 bg-signal-green/12 text-signal-green",
  warning: "border-signal-amber/35 bg-signal-amber/12 text-signal-amber",
  danger: "border-signal-red/35 bg-signal-red/12 text-signal-red",
  info: "border-signal-teal/35 bg-signal-teal/12 text-signal-teal",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  glass,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  glass?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide",
        glass && "backdrop-blur-md",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
