"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Info, Pause, Play, VolumeX, X } from "lucide-react";
import { TRAILER_KIND_LABEL, cn } from "@/lib/utils";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";

export type TrailerLike = {
  id?: string;
  youtubeId: string;
  nameAr: string;
  kind: string;
  health?: string;
};

/**
 * مشغّل التريلر:
 * - يعرض تضمين يوتيوب الرسمي (youtube-nocookie) عند وجود معرّف حقيقي.
 * - يعرض «معاينة بصرية مولّدة» عندما يكون المعرّف مولّدًا داخليًا (demo-*)،
 *   مع توضيح صريح أن هذه ليست تريلرًا حقيقيًا.
 * - لا تشغيل تلقائي مع صوت في أي صفحة؛ التشغيل يبدأ بقرار المستخدم فقط.
 */
export function TrailerDialog({
  open,
  onClose,
  trailer,
  titleAr,
  backdropPath,
  detailsHref,
}: {
  open: boolean;
  onClose: () => void;
  trailer: TrailerLike | null;
  titleAr: string;
  backdropPath?: string | null;
  detailsHref?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open && !!trailer, dialogRef);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setPlaying(true);
  }, [open, trailer?.id]);

  if (!open || !trailer) return null;

  const isDemo = trailer.youtubeId.startsWith("demo-");
  const isBroken = trailer.health === "BROKEN";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6" dir="rtl">
      <button
        type="button"
        aria-label="إغلاق المشغّل"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/92 backdrop-blur-md"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`تريلر ${titleAr}`}
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/12 bg-ink-900 shadow-[0_50px_140px_-40px_rgba(0,0,0,0.95)] rise"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-50">{trailer.nameAr}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[0.68rem] text-ink-400">
              <span className="rounded border border-white/12 px-1.5 py-0.5 text-ink-300">
                {TRAILER_KIND_LABEL[trailer.kind] ?? trailer.kind}
              </span>
              {isDemo && <span className="text-ember-300/80">معاينة بصرية مولّدة</span>}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            autoFocus
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-300 transition hover:bg-white/6 hover:text-ink-50"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-video w-full bg-black">
          {isBroken ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="rounded-full border border-signal-amber/30 bg-signal-amber/10 px-3 py-1 text-xs text-signal-amber">
                التريلر غير متاح حاليًا
              </span>
              <p className="max-w-sm text-sm leading-7 text-ink-300">
                تعذّر عرض هذا التريلر لأن رابطه لم يعد متاحًا عند المصدر. تم تنبيه الإدارة لمراجعته.
              </p>
            </div>
          ) : isDemo ? (
            <div className="relative h-full w-full overflow-hidden">
              {backdropPath && (
                <Image
                  src={backdropPath}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className={cn("object-cover transition-transform duration-[14000ms] ease-linear", playing ? "scale-110" : "scale-100")}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <p className="mb-3 text-[0.62rem] font-semibold tracking-[0.35em] text-ember-300/80">LOOMIX PREVIEW</p>
                <h3 className="display max-w-2xl text-balance text-3xl font-bold text-ink-50 md:text-5xl">{titleAr}</h3>
                <p className="mt-4 max-w-md text-xs leading-6 text-ink-300">
                  هذه معاينة بصرية أصلية من لوميكس فيلم، وليست مقطع فيديو حقيقيًا. يُضاف التريلر الرسمي عبر رابط يوتيوب من لوحة التحكم.
                </p>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/15">
                  <span
                    className="absolute inset-y-0 start-0 rounded-full bg-ember-400"
                    style={{
                      width: playing ? "100%" : "42%",
                      transition: playing ? "width 14s linear" : "none",
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPlaying((v) => !v)}
                    className="flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 text-xs text-ink-100 backdrop-blur transition hover:bg-black/60"
                  >
                    {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    {playing ? "إيقاف المعاينة" : "استكمال المعاينة"}
                  </button>
                  <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[0.65rem] text-ink-300 backdrop-blur">
                    <VolumeX className="h-3 w-3" /> بلا صوت
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              key={trailer.id ?? trailer.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${trailer.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={`تريلر ${titleAr}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full border-0"
            />
          )}
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[0.7rem] leading-6 text-ink-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {isDemo
                ? "المعاينة مولّدة داخل المشروع. لا يستضيف لوميكس فيلم أي فيديو محمي، والتضمين الرسمي هو الطريق الوحيد لعرض التريلرات."
                : "يُعرض التريلر عبر تضمين رسمي من المنصة المصدر، ولا يُعاد استضافته على خوادم لوميكس فيلم."}
            </span>
          </p>
          {detailsHref && (
            <Link
              href={detailsHref}
              className="shrink-0 rounded-lg border border-white/12 px-3 py-1.5 text-center text-xs text-ink-200 transition hover:border-ember-400/40 hover:text-ember-200"
            >
              صفحة العمل
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
