"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // التفاصيل التقنية تبقى في سجل الخادم فقط؛ لا تُعرض للمستخدم.
    console.error("[loomix:error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-signal-amber/25 bg-signal-amber/[0.07] text-signal-amber">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="display text-2xl font-bold text-ink-50 md:text-3xl">تعذّر تحميل هذه الصفحة</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-ink-400">
        حدث خطأ غير متوقع من جانبنا. جرّب إعادة المحاولة، وإذا تكرر الأمر فأبلغنا عبر صفحة التواصل.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brass-400 px-5 text-sm font-bold text-[#171006] transition hover:bg-brass-300"
        >
          <RotateCcw className="h-4 w-4" /> إعادة المحاولة
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-white/15 px-5 text-sm text-ink-100 transition hover:border-white/30">
          الرئيسية
        </Link>
        <Link href="/contact" className="inline-flex h-11 items-center rounded-xl px-4 text-sm text-ink-300 transition hover:text-ink-50">
          الإبلاغ عن المشكلة
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-[0.65rem] text-ink-600">معرّف الخطأ: {error.digest}</p>}
    </div>
  );
}
