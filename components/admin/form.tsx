"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  name,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: {
  label: string;
  name?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className} data-field={name}>
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1 text-[0.72rem] font-medium text-ink-200">
          {label}
          {required && <span className="text-signal-red" aria-hidden="true">*</span>}
          {optional && !required && <span className="text-[0.6rem] font-normal text-ink-500">(اختياري)</span>}
        </span>
        {children}
      </label>
      {hint && !error && <p className="mt-1 text-[0.65rem] leading-5 text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-[0.65rem] text-signal-red">{error}</p>}
    </div>
  );
}

export function TextInput(props: ComponentProps<"input"> & { error?: string }) {
  const { error, className, ...rest } = props;
  return <input {...rest} aria-invalid={Boolean(error)} className={cn("field", className)} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn("field", props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cn("field", props.className)} />;
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold transition disabled:opacity-60",
        variant === "primary" && "bg-ember-400 text-[#171006] hover:bg-ember-300",
        variant === "secondary" && "border border-white/15 text-ink-100 hover:border-white/30",
        variant === "danger" && "border border-signal-red/30 bg-signal-red/10 text-signal-red hover:bg-signal-red/20",
        className,
      )}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function FormBanner({ state }: { state: { ok?: boolean; error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-[0.72rem] leading-6 text-signal-red">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-signal-green/30 bg-signal-green/10 px-3 py-2 text-[0.72rem] leading-6 text-signal-green">
        <Check className="h-3.5 w-3.5 shrink-0" /> {state.message ?? "تم الحفظ بنجاح."}
      </p>
    );
  }
  return null;
}

export function DangerSubmit({ children, message, className }: { children: ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 text-xs font-semibold text-signal-red transition hover:bg-signal-red/20 disabled:opacity-60",
        className,
      )}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}
