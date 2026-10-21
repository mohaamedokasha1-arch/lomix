import { cn } from "@/lib/utils";

/**
 * علامة لوميكس فيلم — «البكرة الجمرية»:
 * ثلاث أقواس تمثل بكرة فيلم دوّارة، في مركزها مثلث التشغيل، وشعاع ضوء
 * يخرج من الزاوية العلوية. تُرسم بالكامل بـ SVG (بلا صور، حادّة في كل المقاسات).
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
  const ember = `${uid}-ember`;
  const beam = `${uid}-beam`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={ember} x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC2A6" />
          <stop offset="0.5" stopColor="#FF7F50" />
          <stop offset="1" stopColor="#C94A22" />
        </linearGradient>
        <linearGradient id={beam} x1="27" y1="13" x2="36" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE2D4" />
          <stop offset="1" stopColor="#FF7F50" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#0B0D13" stroke={`url(#${ember})`} strokeOpacity="0.5" />
      {/* ثلاث أقواس = البكرة (فجوات 20° بينها) */}
      <path d="M15.55 7.78 A13 13 0 0 1 32.8 17.74" stroke={`url(#${ember})`} strokeWidth="3" strokeLinecap="round" />
      <path d="M32.8 22.26 A13 13 0 0 1 15.55 32.22" stroke={`url(#${ember})`} strokeWidth="3" strokeLinecap="round" opacity="0.72" />
      <path d="M11.64 29.96 A13 13 0 0 1 11.64 10.04" stroke={`url(#${ember})`} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      {/* مثلث التشغيل */}
      <path d="M17.2 15.4 L24.6 20 L17.2 24.6 Z" fill={`url(#${ember})`} strokeLinejoin="round" />
      {/* شعاع الضوء */}
      <path d="M27.5 12.5 L35.5 4.5" stroke={`url(#${beam})`} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="36" cy="4" r="1.3" fill="#FFE2D4" />
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
          className="font-[family-name:var(--font-latin)] text-[1.3rem] font-extrabold tracking-[-0.02em] text-ink-50"
          dir="ltr"
        >
          loomix <span className="text-ember-300">film</span>
        </span>
        {showArabic && (
          <span className="mt-1 text-[0.62rem] font-medium tracking-[0.28em] text-ink-300">لوميكس فيلم</span>
        )}
      </span>
    </span>
  );
}
