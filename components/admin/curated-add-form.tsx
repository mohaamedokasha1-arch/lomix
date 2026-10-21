"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { FormBanner } from "@/components/admin/form";
import { addCuratedAction, type SysState } from "@/app/actions/admin-system";

export function CuratedAddForm({ listKey, titles }: { listKey: string; titles: { id: string; titleAr: string; state: string }[] }) {
  const [state, formAction] = useActionState<SysState, FormData>(addCuratedAction, null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");

  const options = useMemo(() => {
    const q = query.trim();
    return (q ? titles.filter((title) => title.titleAr.includes(q)) : titles).slice(0, 50);
  }, [titles, query]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="listKey" value={listKey} />
      <FormBanner state={state} />
      <div className="flex gap-1.5">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="تصفية…"
          className="field h-8 w-24 shrink-0 text-[0.68rem]"
          aria-label="تصفية الأعمال"
        />
        <select name="titleId" value={selected} onChange={(event) => setSelected(event.target.value)} className="field h-8 min-w-0 flex-1 text-[0.68rem]" required aria-label="العمل">
          <option value="">— اختر عملًا —</option>
          {options.map((title) => (
            <option key={title.id} value={title.id}>
              {title.titleAr}
              {title.state === "DRAFT" ? " (مسودة)" : ""}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!selected}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-ember-400 px-2.5 text-[0.68rem] font-bold text-[#171006] hover:bg-ember-300 disabled:opacity-40"
        >
          <Plus className="h-3 w-3" /> إضافة
        </button>
      </div>
    </form>
  );
}
