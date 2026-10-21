import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TitleDetailView } from "@/components/titles/title-detail-view";
import { loadTitlePage } from "@/lib/title-page";
import { buildTitleMetadata, robotsFor } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadTitlePage(slug, ["MOVIE"]);
  if (!data) return { title: "الفيلم غير موجود", robots: { index: false } };
  const metadata = buildTitleMetadata(data.title);
  const robots = await robotsFor("seo_index_titles");
  return robots ? { ...metadata, robots } : metadata;
}

export default async function MoviePage({ params }: Props) {
  const { slug } = await params;
  const data = await loadTitlePage(slug, ["MOVIE"]);
  if (!data) notFound();

  return (
    <TitleDetailView
      title={data.title}
      related={data.related}
      saved={data.saved}
      isAuthenticated={Boolean(data.user)}
    />
  );
}
