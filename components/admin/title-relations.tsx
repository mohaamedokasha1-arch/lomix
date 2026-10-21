"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteTitleAction, toggleTitleStateAction } from "@/app/actions/admin";

export function TitleRelations({ id, titleAr }: { id: string; titleAr: string; type?: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <form
        action={(formData) => {
          startTransition(() => {
            void toggleTitleStateAction(formData).then(() => router.refresh());
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 text-[0.68rem] text-ink-200 hover:border-white/30 disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          تبديل حالة النشر
        </button>
      </form>

      <form
        action={(formData) => {
          if (!window.confirm(`حذف «${titleAr}» نهائيًا مع كل المواسم والتريلرات؟ لا يمكن التراجع.`)) return;
          startTransition(() => {
            void deleteTitleAction(formData);
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-signal-red/30 bg-signal-red/[0.06] text-[0.68rem] text-signal-red hover:bg-signal-red/10 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" /> حذف العمل
        </button>
      </form>
      <p className="text-[0.6rem] leading-4 text-ink-500">الحذف يزيل المواسم والحلقات والتريلرات والارتباطات المرتبطة.</p>
    </div>
  );
}
