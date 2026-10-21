"use client";

import { useEffect } from "react";

/**
 * صفحة 500 الجذرية.
 *
 * `app/error.tsx` يعمل داخل تخطيط الموقع، لكن أي خطأ في التخطيط الجذري نفسه
 * (الوسوم، الخطوط، المزوّدات) يتجاوزها فيعرض Next صفحته الافتراضية الإنجليزية.
 * هذا الملف يستبدل التخطيط الجذري كاملًا، لذا يجب أن يحمل `<html>` و`<body>` بنفسه،
 * وألا يعتمد على Tailwind (قد لا تُحمَّل الأنماط) — لذلك كل شيء هنا أنماط سطرية.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // التفاصيل التقنية في سجل الخادم فقط، والمعرّف وحده يظهر للمستخدم.
    console.error("[loomix:global-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0f",
          color: "#f7f7fa",
          fontFamily: "'IBM Plex Sans Arabic', system-ui, -apple-system, 'Segoe UI', sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              border: "1px solid rgba(242,112,122,0.28)",
              background: "rgba(242,112,122,0.08)",
              color: "#f2707a",
              fontSize: 26,
              lineHeight: 1,
            }}
          >
            !
          </div>

          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.4 }}>تعذّر تشغيل الصفحة</h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.9, color: "#9a9aa8" }}>
            حدث خلل في تحميل الموقع الأساسي. أعد المحاولة بعد لحظات، وإذا تكرر الأمر فأبلغنا عبر صفحة التواصل.
          </p>

          <div style={{ marginTop: 28, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                height: 44,
                padding: "0 22px",
                borderRadius: 12,
                border: "none",
                background: "#d9a441",
                color: "#171006",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              إعادة المحاولة
            </button>
            <a
              href="/"
              style={{
                height: 44,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 20px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                color: "#f7f7fa",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              الرئيسية
            </a>
          </div>

          {error.digest ? (
            <p style={{ marginTop: 24, fontSize: 11, color: "#6b6b7a", direction: "ltr" }}>
              error id: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
