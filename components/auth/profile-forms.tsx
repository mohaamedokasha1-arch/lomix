"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { changePasswordAction, updateProfileAction, type ProfileState } from "@/app/actions/auth";

export function ProfileNameForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfileAction, null);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="profile-name" className="mb-1.5 block text-xs font-medium text-ink-200">الاسم الظاهر</label>
        <input id="profile-name" name="name" defaultValue={defaultName} className="field" required minLength={2} maxLength={80} />
        {state?.fieldErrors?.name && <p className="mt-1 text-[0.7rem] text-signal-red">{state.fieldErrors.name}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-ember-400 px-4 text-xs font-bold text-[#171006] transition hover:bg-ember-300 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          حفظ الاسم
        </button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-signal-green">
            <Check className="h-3.5 w-3.5" /> حُفظ
          </span>
        )}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ProfileState, FormData>(changePasswordAction, null);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="current" className="mb-1.5 block text-xs font-medium text-ink-200">كلمة المرور الحالية</label>
        <input id="current" name="current" type="password" autoComplete="current-password" className="field" required />
        {state?.fieldErrors?.current && <p className="mt-1 text-[0.7rem] text-signal-red">{state.fieldErrors.current}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="next" className="mb-1.5 block text-xs font-medium text-ink-200">كلمة المرور الجديدة</label>
          <input id="next" name="next" type="password" autoComplete="new-password" className="field" required minLength={8} />
          {state?.fieldErrors?.next && <p className="mt-1 text-[0.7rem] text-signal-red">{state.fieldErrors.next}</p>}
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-ink-200">تأكيد الجديدة</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="field" required minLength={8} />
          {state?.fieldErrors?.confirm && <p className="mt-1 text-[0.7rem] text-signal-red">{state.fieldErrors.confirm}</p>}
        </div>
      </div>
      <p className="text-[0.68rem] leading-6 text-ink-500">
        بعد تغيير كلمة المرور تُنهى جميع الجلسات الحالية على كل الأجهزة، ويُطلب تسجيل الدخول من جديد.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-4 text-xs font-semibold text-ink-100 transition hover:border-white/30 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        تحديث كلمة المرور
      </button>
    </form>
  );
}
