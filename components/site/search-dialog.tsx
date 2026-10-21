"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
import { TITLE_TYPE_LABEL, cn } from "@/lib/utils";

type Suggestion = {
  slug: string;
  titleAr: string;
  titleEn: string | null;
  type: keyof typeof TITLE_TYPE_LABEL;
  releaseYear: number | null;
  posterPath: string | null;
  ratingValue: number | null;
  ratingSource?: string | null;
};

const TYPE_ROUTE: Record<string, string> = {
  MOVIE: "/movie",
  SERIES: "/series",
  ANIME: "/anime",
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(false);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("bad response");
        const data = (await res.json()) as { results: Suggestion[] };
        setResults(data.results);
        setActive(0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const goTo = useCallback(
    (path: string) => {
      onClose();
      router.push(path);
    },
    [onClose, router],
  );

  const submit = () => {
    const term = query.trim();
    if (!term) return;
    const target = results[active];
    if (target) return goTo(`${TYPE_ROUTE[target.type] ?? "/movie"}/${target.slug}`);
    goTo(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]" dir="rtl">
      <button
        type="button"
        aria-label="إغلاق البحث"
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="البحث في لوميكس"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 bg-ink-850/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] rise"
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-brass-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ابحث عن فيلم أو مسلسل أو أنمي…"
            aria-label="كلمة البحث"
            className="w-full bg-transparent text-base text-ink-50 outline-none placeholder:text-ink-400"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-300" aria-label="جارٍ البحث" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white/5 hover:text-ink-100"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {query.trim().length < 2 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-ink-300">اكتب حرفين على الأقل للبحث بالعربية أو الإنجليزية.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {["دراما", "أنمي", "غموض", "خيال علمي"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-ink-200 transition hover:border-brass-400/40 hover:text-brass-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && !error && (
            <div className="px-4 py-8 text-center text-sm text-ink-300">
              لا توجد نتائج مطابقة لـ «{query.trim()}». جرّب كلمة أقصر أو تهجئة مختلفة.
            </div>
          )}

          {error && (
            <div className="px-4 py-8 text-center text-sm text-signal-red">
              تعذر تحميل الاقتراحات الآن. يمكنك المتابعة بالضغط على Enter لصفحة النتائج.
            </div>
          )}

          <ul role="listbox" aria-label="نتائج البحث">
            {results.map((item, index) => (
              <li key={item.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => goTo(`${TYPE_ROUTE[item.type] ?? "/movie"}/${item.slug}`)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition",
                    index === active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                  )}
                >
                  <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-ink-800">
                    {item.posterPath && (
                      <Image src={item.posterPath} alt="" fill sizes="44px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-50">{item.titleAr}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-300">
                      <span>{TITLE_TYPE_LABEL[item.type]}</span>
                      {item.releaseYear && <span className="num">{item.releaseYear}</span>}
                      {item.ratingValue != null && item.ratingSource && (
                        <span className="num text-brass-300">★ {item.ratingValue.toFixed(1)}</span>
                      )}
                    </span>
                  </span>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          {query.trim().length >= 2 && results.length > 0 && (
            <button
              type="button"
              onClick={() => goTo(`/search?q=${encodeURIComponent(query.trim())}`)}
              className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-ink-300 transition hover:bg-white/[0.04] hover:text-ink-100"
            >
              <span>عرض كل النتائج</span>
              <span className="num rounded border border-white/10 px-1.5 py-0.5 text-[0.65rem]">Enter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
