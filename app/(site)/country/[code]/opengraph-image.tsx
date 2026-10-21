import { cachedFacets } from "@/lib/queries";
import { OG_SIZE, renderCollectionOg } from "@/lib/og-image";

export const alt = "بطاقة دولة على لوميكس";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ code: string }> };

export default async function OpengraphImage({ params }: Props) {
  const { code } = await params;
  const facets = await cachedFacets().catch(() => null);
  const country = facets?.countries.find((item) => item.code.toLowerCase() === code.toLowerCase());
  return renderCollectionOg(country?.name ?? code.toUpperCase(), "الدولة", "أعمال من هذه الدولة");
}
