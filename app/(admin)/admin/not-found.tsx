import Link from "next/link";
import { FileQuestion } from "lucide-react";

/**
 * 404 داخل اللوحة: يُستخدم عندما يستدعي إجراءٌ `notFound()` (مثل معرّف عمل محذوف).
 * بلا هذا الملف يسقط الخطأ على 404 العام خارج تخطيط اللوحة فيفقد المستخدم الشريط الجانبي.
 */
export default function AdminNotFound() {
  return (
    <div className="rounded-xl border border-white/8 bg-ink-900/50 p-8 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-ink-400">
        <FileQuestion className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="display text-xl font-bold text-ink-50">هذا العنصر غير موجود</h1>
      <p className="mx-auto mt-2 max-w-md text-[0.78rem] leading-6 text-ink-400">
        قد يكون محذوفًا أو أن الرابط غير صحيح. يمكنك العودة إلى القوائم ومتابعة العمل.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/admin/titles"
          className="inline-flex h-9 items-center rounded-lg bg-ember-400 px-3.5 text-[0.72rem] font-bold text-[#171006] transition hover:bg-ember-300"
        >
          كل الأعمال
        </Link>
        <Link
          href="/admin"
          className="inline-flex h-9 items-center rounded-lg border border-white/12 px-3.5 text-[0.72rem] text-ink-100 transition hover:border-white/25"
        >
          لوحة المعلومات
        </Link>
      </div>
    </div>
  );
}
