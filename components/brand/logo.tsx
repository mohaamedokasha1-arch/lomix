import { cn } from "@/lib/utils";

/**
 * هوية Loomix: عدسة مفتوحة + شعاع ضوء.
 * العلامة تُرسم بالكامل بـ SVG (حجم صغير، حِدّة في كل المقاسات، بلا صور).
 *
 * `uid` إلزامي عمليًا عند عرض أكثر من نسخة في الصفحة نفسها: SVG يعرّف
 * <linearGradient> بمعرّف، وتكرار المعرّف في HTML غير صالح وقد يجعل النسخة
 * الثانية ترث تدرّج الأولى.
 */
export function LogoMark({
  className,
  size = 32,
  uid = "brand",
}: {
  className?: string;
  size?: number;
  /** بادئة معرّفات التدرّجات — فريدة لكل نسخة معروضة في الصفحة نفسها. */
  uid?: string;
}) {
  const markId = `${uid}-mark`;
  const beamsId = `${uid}-beams`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={markId} x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3CE8E" />
          <stop offset="0.55" stopColor="#E3B269" />
          <stop offset="1" stopColor="#B07C34" />
        </linearGradient>
        <linearGradient id={beamsId} x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE7BE" stopOpacity="0.95" />
          <stop offset="1" stopColor="#E3B269" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#0B0E15" stroke={`url(#${markId})`} strokeOpacity="0.55" />
      <path d="M20 6.5A13.5 13.5 0 1 0 33.5 20" stroke={`url(#${markId})`} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 12.5A7.5 7.5 0 1 0 27.5 20" stroke={`url(#${markId})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
      <circle cx="20" cy="20" r="3.1" fill={`url(#${markId})`} />
      <path d="M20 3.5 L20 36.5" stroke={`url(#${beamsId})`} strokeWidth="1.1" opacity="0.65" />
      <path d="M23.6 4.6 L33.8 34.2" stroke={`url(#${beamsId})`} strokeWidth="0.9" opacity="0.35" />
      <path d="M16.4 4.6 L6.2 34.2" stroke={`url(#${beamsId})`} strokeWidth="0.9" opacity="0.35" />
    </svg>
  );
}

export function Logo({
  className,
  size = 30,
  showArabic = true,
  uid = "brand",
}: {
  className?: string;
  size?: number;
  showArabic?: boolean;
  uid?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} uid={uid} />
      <span className="flex flex-col leading-none">
        <span
          className="font-[family-name:var(--font-latin)] text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink-50"
          dir="ltr"
        >
          loomix
        </span>
        {showArabic && (
          <span className="mt-1 text-[0.62rem] font-medium tracking-[0.32em] text-ink-300">لوميكس</span>
        )}
      </span>
    </span>
  );
}
