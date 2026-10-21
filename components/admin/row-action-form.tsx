"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

type RowAction = (formData: FormData) => void | Promise<void>;

/**
 * نموذج إجراء صفّي يعمل **بلا JavaScript**.
 *
 * `action={serverAction}` (مرجع خادم حقيقي، لا دالة مغلقة) يجعل Next يُصدر
 * `$ACTION_ID_...` داخل HTML، فيعمل النموذج بـPOST أصلي. وحين يتوفّر JS
 * يبقى التنفيذ عبر React، ويُضاف تأكيد قبل الإجراءات المدمِّرة.
 */
export function RowActionForm({
  action,
  fields,
  confirm,
  className,
  children,
}: {
  action: RowAction;
  fields: Record<string, string>;
  confirm?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
    </form>
  );
}

const ICON_CLASS = "flex h-6 w-6 items-center justify-center rounded text-ink-500 transition hover:bg-signal-red/10 hover:text-signal-red disabled:opacity-50";
const CHIP_CLASS =
  "rounded border border-white/12 px-2 py-1 text-[0.6rem] text-ink-200 transition hover:border-white/30 disabled:opacity-50";
const LINK_CLASS = "text-[0.6rem] text-ink-400 underline hover:text-ember-200 disabled:opacity-50";

/** زر إرسال يعرض حالة الانتظار عبر useFormStatus (يعمل أيضًا مع POST الأصلي). */
export function RowSubmit({
  label,
  ariaLabel,
  title,
  variant = "chip",
  className,
}: {
  label?: string;
  ariaLabel?: string;
  title?: string;
  variant?: "icon" | "chip" | "link";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const base = variant === "icon" ? ICON_CLASS : variant === "link" ? LINK_CLASS : CHIP_CLASS;

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel ?? label}
      title={title ?? ariaLabel ?? label}
      className={className ?? base}
    >
      {variant === "icon" ? (
        pending ? <span className="text-[0.55rem]">…</span> : <Trash2 className="h-3.5 w-3.5" />
      ) : (
        label
      )}
    </button>
  );
}
