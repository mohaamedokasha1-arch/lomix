"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TitleCard } from "@/components/titles/title-card";
import type { TitleCard as TitleCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function TitleRow({
  items,
  moreHref,
  size = "md",
  showRank = false,
  className,
}: {
  items: TitleCardData[];
  moreHref?: string;
  size?: "sm" | "md" | "lg";
  showRank?: boolean;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 4) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const rtl = getComputedStyle(el).direction === "rtl";
    const offset = Math.abs(el.scrollLeft);
    setCanPrev(offset > 8);
    setCanNext(offset < max - 8);
    void rtl;
  }, []);

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * el.clientWidth * 0.82 * (rtl ? -1 : 1), behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <div className={cn("group/row relative", className)}>
      <div
        ref={scroller}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-1 pb-2 pt-1 md:gap-4"
        tabIndex={0}
        role="region"
        aria-label="قائمة أعمال قابلة للتمرير"
      >
        {items.map((item, index) => (
          <div key={item.id} className="w-[43%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-[18.5%] xl:w-[16%]">
            {/* الأشرطة أفقية وأسفل الطية دائمًا: لا preload لأي بوستر هنا.
                كان `priority={index < 5}` يطلب 5 نسخ كبيرة مسبقًا فتنافس صورة LCP. */}
            <TitleCard title={item} size={size} showRank={showRank ? index + 1 : undefined} />
          </div>
        ))}

        {moreHref && (
          <Link
            href={moreHref}
            className="flex w-[43%] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/12 bg-ink-900/40 text-sm text-ink-300 transition hover:border-ember-400/35 hover:text-ember-200 sm:w-[30%] md:w-[23%] lg:w-[18.5%] xl:w-[16%]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12">
              <ArrowLeft className="h-4 w-4" />
            </span>
            عرض الكل
          </Link>
        )}
      </div>

      <div className="pointer-events-none absolute inset-y-0 -start-2 hidden items-center md:flex">
        {canPrev && (
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            aria-label="السابق"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-ink-900/90 text-ink-100 shadow-lg backdrop-blur transition hover:border-ember-400/40 hover:text-ember-200"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="pointer-events-none absolute inset-y-0 -end-2 hidden items-center md:flex">
        {canNext && (
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            aria-label="التالي"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-ink-900/90 text-ink-100 shadow-lg backdrop-blur transition hover:border-ember-400/40 hover:text-ember-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
