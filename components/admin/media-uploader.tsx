"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";

type Variant = { path: string; width: number; height: number; size: number };

export function MediaUploader() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Variant[]>([]);
  const [alt, setAlt] = useState("");

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setUploads([]);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { variants?: Variant[]; error?: string };
      if (!response.ok || !data.variants) throw new Error(data.error ?? "فشل الرفع");
      setUploads(data.variants);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-ink-950/40 px-4 py-8 text-center transition hover:border-ember-400/40">
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-ember-300" /> : <Upload className="h-5 w-5 text-ink-400" />}
        <span className="text-[0.72rem] text-ink-200">{busy ? "جارٍ المعالجة…" : "اختر صورة أو أفلتها هنا"}</span>
        <span className="text-[0.6rem] text-ink-500">تُنشأ نسخ 400 / 900 / 1600 بكسل تلقائيًا</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
      </label>

      <div>
        <label className="mb-1 block text-[0.65rem] text-ink-400" htmlFor="media-alt">
          نص بديل (alt) — مطلوب عند استخدام الصورة في محتوى منشور
        </label>
        <input id="media-alt" value={alt} onChange={(event) => setAlt(event.target.value)} className="field h-8 text-[0.7rem]" placeholder="وصف موجز للصورة" />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-signal-red/30 bg-signal-red/10 px-2.5 py-2 text-[0.65rem] text-signal-red">
          {error}
        </p>
      )}

      {uploads.length > 0 && (
        <div>
          <p className="mb-2 text-[0.65rem] text-signal-teal">تم الرفع — انسخ المسار لاستخدامه:</p>
          <ul className="space-y-1.5">
            {uploads.map((variant) => (
              <li key={variant.path} className="flex items-center gap-2">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-ink-800">
                  <Image src={variant.path} alt="" fill sizes="36px" className="object-cover" />
                </div>
                <code dir="ltr" className="min-w-0 flex-1 truncate text-[0.6rem] text-ink-300">
                  {variant.path}
                </code>
                <span className="num text-[0.55rem] text-ink-500">{variant.width}px</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(variant.path)}
                  className="rounded border border-white/12 px-1.5 py-0.5 text-[0.55rem] text-ink-300 hover:border-white/30"
                >
                  نسخ
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
