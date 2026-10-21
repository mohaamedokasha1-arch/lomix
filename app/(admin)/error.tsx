"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * حدّ خطأ داخل اللوحة.
 *
 * `app/error.tsx` يقع فوق `(admin)/layout.tsx`، فكان أي خطأ في صفحة إدارة يستبدل
 * الشريط الجانبي كله بصفحة خطأ كاملة العرض. هذا الحدّ يعيش داخل التخطيط، فيبقى
 * التنقل متاحًا ويستطيع المستخدم الانتقال إلى قسم آخر بدل فقدان مكانه.
 *
 * التفاصيل التقنية تبقى في سجل الخادم؛ لا تُعرض رسالة الاستثناء ولا stack.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[loomix:admin-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="rounded-xl border border-signal-amber/25 bg-signal-amber/[0.04] p-6 text-center sm:p-10">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-signal-amber/25 bg-signal-amber/[0.07] text-signal-amber">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="display text-xl font-bold text-ink-50">تعذّر تحميل هذه الصفحة</h1>
      <p className="mx-auto mt-2 max-w-md text-[0.78rem] leading-6 text-ink-400">
        حدث خطأ أثناء جلب البيانات. أعد المحاولة، وإن تكرر الأمر فانتقل إلى قسم آخر وأبلغنا بالمعرّف أدناه.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ember-400 px-3.5 text-[0.72rem] font-bold text-[#171006] transition hover:bg-ember-300"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> إعادة المحاولة
        </button>
        <Link
          href="/admin"
          className="inline-flex h-9 items-center rounded-lg border border-white/12 px-3.5 text-[0.72rem] text-ink-100 transition hover:border-white/25"
        >
          لوحة المعلومات
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-9 items-center rounded-lg px-3 text-[0.72rem] text-ink-300 transition hover:text-ink-50"
        >
          الإبلاغ عن المشكلة
        </Link>
      </div>
      {error.digest && <p className="mt-5 text-[0.62rem] text-ink-500">معرّف الخطأ: {error.digest}</p>}
    </div>
  );
}
