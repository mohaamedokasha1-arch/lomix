"use client";

import { useEffect } from "react";

/**
 * يسجّل مشاهدة حقيقية لصفحة العمل (مرة واحدة كل 12 ساعة لكل زائر/عمل).
 * يعتمد عليه عدّاد «الأكثر مشاهدة» — لا أرقام تقديرية.
 */
export function ViewTracker({ titleId }: { titleId: string }) {
  useEffect(() => {
    const key = `loomix:view:${titleId}`;
    try {
      const last = Number(localStorage.getItem(key) ?? 0);
      if (Date.now() - last < 1000 * 60 * 60 * 12) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      // التخزين المحلي قد يكون معطّلًا — نسجّل على أي حال.
    }
    const controller = new AbortController();
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId }),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [titleId]);

  return null;
}
