import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-300 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ember-400 text-[#171006] hover:bg-ember-300 active:bg-ember-500 shadow-[0_10px_30px_-12px_rgba(255,127,80,0.6)]",
  secondary:
    "border border-white/20 bg-white/[0.04] text-ink-50 hover:bg-white/[0.1] hover:border-white/35 backdrop-blur-sm",
  ghost: "text-ink-100 hover:text-ink-50 hover:bg-white/[0.06]",
  danger: "bg-signal-red/15 text-signal-red border border-signal-red/30 hover:bg-signal-red/25",
  subtle: "bg-ink-700 text-ink-50 hover:bg-ink-600 border border-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.9375rem]",
};

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ className, variant = "primary", size = "md", loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
  prefetch,
  ...props
}: {
  href: string;
  className?: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  prefetch?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} prefetch={prefetch} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
