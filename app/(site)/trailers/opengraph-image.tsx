import { OG_SIZE, renderCollectionOg } from "@/lib/og-image";

export const alt = "بطاقة التريلرات على لوميكس فيلم";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
  return renderCollectionOg("التريلرات", "قناة رسمية", "إعلانات رسمية للأعمال — بلا محتوى كامل");
}
