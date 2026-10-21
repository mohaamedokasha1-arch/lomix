"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";

/**
 * حقل صورة: رفع مباشر (يُنتج أحجامًا متعددة) أو إدخال مسار يدوي.
 * الحد الأقصى 6MB وأنواع الصور فقط — ويُعاد التحقق خادميًا.
 */
export function MediaField({
  label,
  name,
  defaultValue,
  aspect = "poster",
  hint,
  optional,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  aspect?: "poster" | "wide";
  hint?: string;
  optional?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !data.path) throw new Error(data.error ?? "فشل الرفع");
      setValue(data.path);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1 text-[0.72rem] font-medium text-ink-200">
        {label}
        {!optional && <span className="text-signal-red">*</span>}
      </p>
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-3">
        <div
          className={`relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink-800 ${
            aspect === "poster" ? "h-28 w-[74px]" : "h-24 w-40"
          }`}
        >
          {value ? (
            <Image src={value} alt="" fill sizes="160px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[0.6rem] text-ink-600">لا صورة</span>
          )}
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-950/80 text-ink-300 hover:text-signal-red"
              aria-label="إزالة الصورة"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-[0.68rem] text-ink-100 transition hover:border-white/30 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {uploading ? "جارٍ الرفع…" : "رفع صورة"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </div>
          <input
            dir="ltr"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="/uploads/… أو https://…"
            className="field h-8 text-[0.7rem]"
            aria-label={`مسار ${label}`}
          />
          {hint && <p className="text-[0.62rem] leading-4 text-ink-500">{hint}</p>}
          {error && <p className="text-[0.62rem] text-signal-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}
