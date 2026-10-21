/**
 * فحص مصدر صور المشاركة (OG) — بلا قاعدة بيانات وبلا شبكة.
 *
 * بطاقات المشاركة تُبنى على الخادم، فقائمة المصادر المسموح بها حدّ أمني لا تجميلي:
 * مسارات داخل `public` أو روابط Vercel Blob فقط. هذا الفحص يثبّت الحالات الحدّية
 * (اجتياز المسار، بروتوكول آخر، نطاق مُنتحل، بيانات اعتماد داخل الرابط…).
 *
 * التشغيل: npm run check:art
 */
import { blobArtUrl, localArtFile } from "../lib/art-source";

type Expected = "local" | "blob" | "reject";

const cases: [string, Expected][] = [
  ["/art/poster-1.svg", "local"],
  ["/uploads/abc-400.webp", "local"],
  ["/media/x.jpg", "local"],
  ["/uploads/../art/x.svg", "local"],
  ["/uploads/../../etc/passwd", "reject"],
  ["//evil.example.com/x.png", "reject"],
  ["/etc/passwd", "reject"],
  ["uploads/x.webp", "reject"],
  ["https://abc123.public.blob.vercel-storage.com/uploads/x.webp", "blob"],
  ["https://blob.vercel-storage.com/x.webp", "blob"],
  ["https://evil.example.com/x.webp", "reject"],
  ["http://abc123.public.blob.vercel-storage.com/x.webp", "reject"],
  ["https://abc.public.blob.vercel-storage.com.evil.com/x.webp", "reject"],
  ["https://user:pass@abc.public.blob.vercel-storage.com/x.webp", "reject"],
  ["javascript:alert(1)", "reject"],
];

let failed = 0;
for (const [input, expected] of cases) {
  const actual: Expected = localArtFile(input) ? "local" : blobArtUrl(input) ? "blob" : "reject";
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "✓" : "✖"} ${expected.padEnd(6)} ← ${input}  (${actual})`);
}

console.log(
  failed === 0
    ? `\n✓ مصادر صور المشاركة سليمة (${cases.length} حالة).\n`
    : `\n✖ ${failed} حالة فاشلة من ${cases.length}.\n`,
);
process.exit(failed === 0 ? 0 : 1);
