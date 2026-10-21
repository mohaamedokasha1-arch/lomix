import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toggleTitleStateAction } from "@/app/actions/admin";

/**
 * إجراءات صف العمل.
 *
 * `action={serverAction}` على نموذج عادي يُصدر Next له معرّف إجراء داخل HTML،
 * فيعمل الزر بلا JavaScript عبر POST أصلي. الحذف لا يُنفَّذ من الصف مباشرة:
 * يذهب إلى صفحة تأكيد تعرض ما سيُحذف معه (مواسم/حلقات/تريلرات) — أفضل للإتاحة
 * وأمانًا من `confirm()` الذي لا يعمل أصلًا بلا JS.
 */
export function TitleRowActions({ id, state, titleAr }: { id: string; state: string; titleAr: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <form action={toggleTitleStateAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label={`${state === "PUBLISHED" ? "إلغاء نشر" : "نشر"} ${titleAr}`}
          className="rounded border border-white/12 px-2 py-1 text-[0.62rem] text-ink-200 transition hover:border-white/30"
        >
          {state === "PUBLISHED" ? "إلغاء النشر" : "نشر"}
        </button>
      </form>
      <Link
        href={`/admin/titles/${id}/delete`}
        aria-label={`حذف ${titleAr}`}
        title={`حذف ${titleAr}`}
        className="flex h-6 w-6 items-center justify-center rounded text-ink-500 transition hover:bg-signal-red/10 hover:text-signal-red"
      >
        <Trash2 className="h-3 w-3" />
      </Link>
    </div>
  );
}
