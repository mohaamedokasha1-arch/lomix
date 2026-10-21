import { CatalogSkeleton } from "@/components/titles/catalog-skeleton";

export default function Loading() {
  return <CatalogSkeleton cards={8} filters={false} />;
}
