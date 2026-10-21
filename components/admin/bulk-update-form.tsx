"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Field, FormBanner, Select, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { bulkUpdateTitlesAction, type BulkUpdateResult } from "@/app/actions/admin";

type TitleOption = { id: string; titleAr: string; type: string; state: string };

export function BulkUpdateForm({ titles }: { titles: TitleOption[] }) {
  const [state, formAction] = useActionState<BulkUpdateResult | null, FormData>(bulkUpdateTitlesAction, null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return (q ? titles.filter((title) => title.titleAr.includes(q)) : titles).slice(0, 200);
  }, [titles, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((title) => selected.includes(title.id));

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      {selected.map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}

      <section className="rounded-xl border border-white/8 bg-ink-900/50">
        <div className="border-b border-white/6 p-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث في الأعمال…"
            className="field h-9 text-xs"
            aria-label="بحث في الأعمال"
          />
          <div className="mt-2 flex items-center justify-between text-[0.62rem] text-ink-500">
            <button
              type="button"
              onClick={() => setSelected(allVisibleSelected ? [] : filtered.map((title) => title.id))}
              className="rounded border border-white/12 px-2 py-0.5 text-ink-300 hover:border-white/30"
            >
              {allVisibleSelected ? "إلغاء تحديد المعروض" : "تحديد كل المعروض"}
            </button>
            <span className="num">{selected.length} محدد</span>
          </div>
        </div>
        <ul className="max-h-[520px] divide-y divide-white/5 overflow-auto">
          {filtered.map((title) => (
            <li key={title.id} className="flex items-center gap-2 px-3 py-2">
              <input
                type="checkbox"
                checked={selected.includes(title.id)}
                onChange={() => toggle(title.id)}
                className="h-3.5 w-3.5 accent-ember-400"
                aria-label={`تحديد ${title.titleAr}`}
              />
              <span className="min-w-0 flex-1 truncate text-[0.72rem] text-ink-200">{title.titleAr}</span>
              <span className="text-[0.58rem] text-ink-500">{title.state === "PUBLISHED" ? "منشور" : "مسودة"}</span>
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-8 text-center text-[0.68rem] text-ink-500">لا نتائج.</li>}
        </ul>
      </section>

      <div className="space-y-3">
        <section className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">التغييرات</h2>
          <FormBanner state={state} />

          <div className="space-y-3">
            <Field label="حالة النشر" optional>
              <Select name="state" defaultValue="">
                <option value="">— بدون تغيير —</option>
                <option value="PUBLISHED">نشر</option>
                <option value="DRAFT">تحويل إلى مسودة</option>
              </Select>
            </Field>
            <Field label="حالة الإصدار" optional>
              <Select name="status" defaultValue="">
                <option value="">— بدون تغيير —</option>
                <option value="RELEASED">صدر</option>
                <option value="ONGOING">مستمر</option>
                <option value="UPCOMING">قادم</option>
                <option value="ENDED">انتهى</option>
                <option value="CANCELLED">أُلغي</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="رمز الدولة" optional>
                <TextInput name="countryCode" maxLength={3} dir="ltr" placeholder="EG" />
              </Field>
              <Field label="اللغة" optional>
                <TextInput name="language" maxLength={60} placeholder="العربية" />
              </Field>
            </div>
            <Field label="سبب التحديث" required hint="يُسجَّل في سجل العمليات مع كل تغيير">
              <TextArea name="reason" rows={2} required minLength={6} maxLength={300} placeholder="مثال: توحيد رمز الدولة بعد مراجعة المصدر" />
            </Field>
            <label className="flex items-start gap-2 rounded-lg border border-white/8 bg-ink-950/40 p-2.5 text-[0.65rem] leading-5 text-ink-300">
              <input type="checkbox" name="protectManual" defaultChecked className="mt-0.5 h-3.5 w-3.5 accent-ember-400" />
              <span>
                حماية التعديلات اليدوية — تخطَّ أي عمل يحمل ملاحظة تحريرية مسجّلة.
                <span className="mt-0.5 block text-[0.6rem] text-ink-500">هذا يمنع الكتابة فوق مراجعة بشرية سابقة.</span>
              </span>
            </label>
          </div>

          <div className="mt-4">
            <SubmitButton>تطبيق التحديث الجماعي</SubmitButton>
          </div>
        </section>

        {state?.updated && state.updated.length > 0 && (
          <section className="rounded-xl border border-signal-green/25 bg-signal-green/[0.05] p-3">
            <p className="mb-2 flex items-center gap-1 text-[0.7rem] font-semibold text-signal-green">
              <CheckCircle2 className="h-3.5 w-3.5" /> سجل التغييرات
            </p>
            <ul className="space-y-1.5">
              {state.updated.map((item) => (
                <li key={item.titleAr} className="text-[0.6rem] leading-4 text-ink-300">
                  <span className="text-ink-100">{item.titleAr}:</span> {item.changes.join(" · ")}
                </li>
              ))}
            </ul>
          </section>
        )}

        {state?.skipped && state.skipped.length > 0 && (
          <section className="rounded-xl border border-signal-amber/25 bg-signal-amber/[0.05] p-3">
            <p className="mb-2 flex items-center gap-1 text-[0.7rem] font-semibold text-signal-amber">
              <AlertTriangle className="h-3.5 w-3.5" /> لم تُعدَّل
            </p>
            <ul className="space-y-1">
              {state.skipped.map((item) => (
                <li key={item.titleAr} className="text-[0.6rem] text-ink-400">
                  {item.titleAr} — {item.reason}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </form>
  );
}
