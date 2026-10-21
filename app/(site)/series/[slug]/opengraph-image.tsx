import { getTitleBySlug } from "@/lib/queries";
import { OG_SIZE, renderBrandOg, renderTitleOg, titleOgInput } from "@/lib/og-image";

export const alt = "بطاقة عمل على لوميكس";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function OpengraphImage({ params }: Props) {
  const { slug } = await params;
  const title = await getTitleBySlug(slug).catch(() => null);
  if (!title) return renderBrandOg("اكتشاف سينمائي عربي");
  return renderTitleOg(titleOgInput(title));
}
