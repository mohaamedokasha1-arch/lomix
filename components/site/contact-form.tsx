"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitMessageAction, type ContactState } from "@/app/actions/contact";

export function ContactForm({ kind = "CONTACT" }: { kind?: "CONTACT" | "DMCA" }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitMessageAction, null);
  const errors = state?.fieldErrors ?? {};

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-signal-green/25 bg-signal-green/[0.07] px-6 py-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-signal-green" />
        <p className="display text-lg font-semibold text-ink-50">وصلت رسالتك</p>
        <p className="max-w-sm text-sm leading-7 text-ink-300">
          سُجّلت الرسالة برقم في سجل الإدارة، وسيتم الرد على البريد الذي أدخلته. لا نُرسل رسائل تلقائية.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="kind" value={kind} />
      {/* مصيدة بوتات: مخفية عن المستخدم */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">الموقع</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-xs leading-6 text-signal-red">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-ink-200">الاسم</label>
          <input id="name" name="name" className="field" required maxLength={80} autoComplete="name" />
          {errors.name && <p className="mt-1 text-[0.7rem] text-signal-red">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-200">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" dir="ltr" className="field text-left" required autoComplete="email" />
          {errors.email && <p className="mt-1 text-[0.7rem] text-signal-red">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-xs font-medium text-ink-200">
          {kind === "DMCA" ? "العمل أو المحتوى المعني" : "الموضوع"}
        </label>
        <input id="subject" name="subject" className="field" required maxLength={140} />
        {errors.subject && <p className="mt-1 text-[0.7rem] text-signal-red">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-ink-200">
          {kind === "DMCA" ? "تفاصيل الطلب وروابط المحتوى" : "رسالتك"}
        </label>
        <textarea
          id="message"
          name="message"
          className="field"
          required
          minLength={20}
          maxLength={4000}
          rows={7}
          placeholder={
            kind === "DMCA"
              ? "اذكر رابط الصفحة على لوميكس، وصف المحتوى، وسندك في حقوق الملكية، وبيانات التواصل القانونية."
              : "اكتب تفاصيل استفسارك أو اقتراحك…"
          }
        />
        {errors.message && <p className="mt-1 text-[0.7rem] text-signal-red">{errors.message}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-[0.65rem] leading-5 text-ink-500">
          بإرسالك الرسالة توافق على معالجة بياناتك للغرض المذكور فقط وفق سياسة الخصوصية.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brass-400 px-5 text-sm font-bold text-[#171006] transition hover:bg-brass-300 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          إرسال
        </button>
      </div>
    </form>
  );
}
