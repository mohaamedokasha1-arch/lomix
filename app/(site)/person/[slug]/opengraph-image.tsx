import { cachedPerson } from "@/lib/queries";
import { OG_SIZE, renderBrandOg, renderCollectionOg } from "@/lib/og-image";

export const alt = "بطاقة شخص على لوميكس";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function OpengraphImage({ params }: Props) {
  const { slug } = await params;
  const data = await cachedPerson(slug).catch(() => null);
  if (!data) return renderBrandOg("اكتشاف سينمائي عربي");
  return renderCollectionOg(data.person.nameAr, "من الأعمال", data.person.nameEn ?? null);
}
