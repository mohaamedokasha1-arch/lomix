"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction, type AuthState } from "@/app/actions/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-xs leading-6 text-signal-red">
          {state.error}
        </p>
      )}

      <Field label="الاسم" id="name" autoComplete="name" error={errors.name} />
      <Field label="البريد الإلكتروني" id="email" type="email" autoComplete="email" error={errors.email} ltr />
      <Field label="كلمة المرور" id="password" type="password" autoComplete="new-password" error={errors.password} hint="8 أحرف على الأقل، وتشمل حروفًا وأرقامًا." />
      <Field label="تأكيد كلمة المرور" id="confirm" type="password" autoComplete="new-password" error={errors.confirm} />

      <div>
        <label className="flex items-start gap-2 text-[0.72rem] leading-6 text-ink-300">
          <input type="checkbox" name="accept" className="mt-1 h-3.5 w-3.5 rounded border-white/20 bg-ink-900 accent-brass-400" />
          <span>
            أوافق على{" "}
            <Link href="/terms" className="text-brass-300 underline-offset-4 hover:underline">شروط الاستخدام</Link>{" "}
            و{" "}
            <Link href="/privacy-policy" className="text-brass-300 underline-offset-4 hover:underline">سياسة الخصوصية</Link>.
          </span>
        </label>
        {errors.accept && <p className="mt-1 text-[0.7rem] text-signal-red">{errors.accept}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brass-400 text-sm font-bold text-[#171006] transition hover:bg-brass-300 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        إنشاء الحساب
      </button>

      <p className="text-center text-[0.72rem] text-ink-400">
        لديك حساب؟{" "}
        <Link href="/login" className="text-brass-300 underline-offset-4 hover:underline">تسجيل الدخول</Link>
      </p>
    </form>
  );
}

function Field({
  label,
  id,
  type = "text",
  autoComplete,
  error,
  hint,
  ltr,
}: {
  label: string;
  id: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-200">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        dir={ltr ? "ltr" : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`field ${ltr ? "text-left" : ""}`}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-[0.65rem] text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-[0.7rem] text-signal-red">{error}</p>}
    </div>
  );
}
