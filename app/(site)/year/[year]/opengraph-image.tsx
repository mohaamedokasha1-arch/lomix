import { OG_SIZE, renderCollectionOg } from "@/lib/og-image";

export const alt = "بطاقة سنة على لوميكس";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ year: string }> };

export default async function OpengraphImage({ params }: Props) {
  const { year } = await params;
  const label = /^\d{4}$/.test(year) ? year : "كل السنوات";
  return renderCollectionOg(label, "سنة الإصدار", "أعمال صدرت في هذه السنة");
}
