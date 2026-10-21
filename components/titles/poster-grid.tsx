import { TitleCard } from "@/components/titles/title-card";
import type { TitleCard as TitleCardData } from "@/lib/queries";

/**
 * شبكة بوسترات كثيفة: 3 أعمدة على الهاتف حتى 8 على الشاشات الكبيرة.
 * كل بطاقة رابط واحد قابل للتركيز بالكيبورد — لا عناصر تفاعلية داخلية.
 */
export function PosterGrid({ items, label }: { items: TitleCardData[]; label: string }) {
  if (!items.length) return null;
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-3 gap-x-2.5 gap-y-5 sm:grid-cols-4 sm:gap-x-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <TitleCard title={item} size="sm" />
        </li>
      ))}
    </ul>
  );
}
