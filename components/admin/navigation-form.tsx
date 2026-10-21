"use client";

import { useActionState, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { FormBanner, SubmitButton, TextInput } from "@/components/admin/form";
import { saveNavigationAction, type SysState } from "@/app/actions/admin-system";

type NavItem = { key: string; href: string; label: string; visible: boolean };
type FooterLink = { label: string; href: string };

export function NavigationForm({ nav, footerLinks }: { nav: NavItem[]; footerLinks: FooterLink[] }) {
  const [state, formAction] = useActionState<SysState, FormData>(saveNavigationAction, null);
  const [links, setLinks] = useState<FooterLink[]>(footerLinks);

  const update = (index: number, patch: Partial<FooterLink>) =>
    setLinks((current) => current.map((link, i) => (i === index ? { ...link, ...patch } : link)));

  const move = (index: number, direction: -1 | 1) =>
    setLinks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  return (
    <form action={formAction} className="space-y-6">
      <FormBanner state={state} />

      <section className="rounded-xl border border-white/8 bg-ink-900/50">
        <div className="border-b border-white/6 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-100">التنقل الرئيسي</h2>
          <p className="mt-0.5 text-[0.62rem] text-ink-500">
            المسارات ثابتة لأنها صفحات موجودة فعلًا — يمكنك تغيير العنوان وإظهار/إخفاء الرابط فقط.
          </p>
        </div>
        <ul className="divide-y divide-white/5">
          {nav.map((item) => (
            <li key={item.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <code dir="ltr" className="num w-24 shrink-0 text-[0.65rem] text-ink-500">
                {item.href}
              </code>
              <div className="min-w-0 flex-1">
                <TextInput
                  name={`label:${item.key}`}
                  defaultValue={item.label}
                  maxLength={24}
                  aria-label={`عنوان رابط ${item.href}`}
                  className="h-8 max-w-[220px] text-[0.72rem]"
                />
              </div>
              <label className="flex shrink-0 items-center gap-2 text-[0.65rem] text-ink-300">
                <input type="checkbox" name={`visible:${item.key}`} defaultChecked={item.visible} className="h-3.5 w-3.5 accent-brass-400" />
                ظاهر
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-white/8 bg-ink-900/50">
        <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink-100">روابط التذييل</h2>
            <p className="mt-0.5 text-[0.62rem] text-ink-500">عمود «أقسام». مسارات داخلية فقط، بحد أقصى 10 روابط.</p>
          </div>
          <button
            type="button"
            onClick={() => setLinks((current) => [...current, { label: "", href: "/" }])}
            disabled={links.length >= 10}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/15 px-2.5 text-[0.66rem] text-ink-100 hover:border-white/30 disabled:opacity-40"
          >
            <Plus className="h-3 w-3" /> رابط
          </button>
        </div>

        {links.length === 0 ? (
          <p className="px-4 py-8 text-center text-[0.7rem] text-ink-500">لا روابط — سيظهر التذييل بدون عمود «أقسام».</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {links.map((link, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-600" aria-hidden="true" />
                <TextInput
                  name="footerLabel"
                  value={link.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder="العنوان"
                  maxLength={40}
                  aria-label={`عنوان الرابط ${index + 1}`}
                  className="h-8 min-w-0 flex-1 text-[0.72rem]"
                />
                <TextInput
                  name="footerHref"
                  value={link.href}
                  onChange={(event) => update(index, { href: event.target.value })}
                  placeholder="/latest"
                  dir="ltr"
                  maxLength={120}
                  aria-label={`مسار الرابط ${index + 1}`}
                  className="h-8 w-40 shrink-0 text-[0.72rem]"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-white/8 disabled:opacity-25"
                    aria-label="أعلى"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === links.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-white/8 disabled:opacity-25"
                    aria-label="أسفل"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinks((current) => current.filter((_, i) => i !== index))}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-signal-red/10 hover:text-signal-red"
                    aria-label="حذف الرابط"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton>حفظ التنقل والتذييل</SubmitButton>
        <span className="text-[0.6rem] text-ink-500">يُسجَّل التغيير في سجل العمليات، ويُبثّ فورًا لكل الصفحات.</span>
      </div>
    </form>
  );
}
