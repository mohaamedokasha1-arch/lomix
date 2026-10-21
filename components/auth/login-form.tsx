"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, type AuthState } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, null);
  const [visible, setVisible] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {state?.error && (
        <p role="alert" className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-xs leading-6 text-signal-red">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-200">البريد الإلكتروني</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          aria-invalid={Boolean(state?.fieldErrors?.email)}
          className="field text-left"
          placeholder="you@example.com"
        />
        {state?.fieldErrors?.email && <p className="mt-1 text-[0.7rem] text-signal-red">{state.fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-200">كلمة المرور</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            required
            autoComplete="current-password"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            className="field pe-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-400 hover:text-ink-100"
            aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {state?.fieldErrors?.password && <p className="mt-1 text-[0.7rem] text-signal-red">{state.fieldErrors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brass-400 text-sm font-bold text-[#171006] transition hover:bg-brass-300 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        تسجيل الدخول
      </button>

      <p className="text-center text-[0.72rem] text-ink-400">
        لا تملك حسابًا؟{" "}
        <Link href="/register" className="text-brass-300 underline-offset-4 hover:underline">إنشاء حساب</Link>
      </p>
    </form>
  );
}
