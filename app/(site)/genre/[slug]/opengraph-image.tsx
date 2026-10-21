import { getGenreBySlug } from "@/lib/queries";
import { OG_SIZE, renderBrandOg, renderCollectionOg } from "@/lib/og-image";

export const alt = "بطاقة تصنيف على لوميكس فيلم";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function OpengraphImage({ params }: Props) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug).catch(() => null);
  if (!genre) return renderBrandOg("اكتشاف سينمائي عربي");
  return renderCollectionOg(genre.nameAr, "تصنيف", `أفلام ومسلسلات ${genre.nameAr}`);
}
