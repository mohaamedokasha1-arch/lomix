import Link from "next/link";
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { TrailerForm } from "@/components/admin/trailer-form";
import { TrailerDeleteButton, TrailerHealthControls, TrailerPrimaryButton } from "@/components/admin/trailer-actions";
import { getAllTrailers, getTitleOptions } from "@/lib/admin-queries";
import { TRAILER_KIND_LABEL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTrailersPage({
  searchParams,
}: {
  searchParams: Promise<{ health?: string; titleId?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const [allTrailers, titles] = await Promise.all([getAllTrailers(), getTitleOptions()]);

  let trailers = allTrailers;
  if (params.health && ["OK", "BROKEN", "UNVERIFIED"].includes(params.health)) {
    trailers = trailers.filter((trailer) => trailer.health === params.health);
  }
  if (params.titleId) trailers = trailers.filter((trailer) => trailer.titleId === params.titleId);

  const editing = params.edit ? allTrailers.find((trailer) => trailer.id === params.edit) : null;
  const counts = {
    all: allTrailers.length,
    OK: allTrailers.filter((t) => t.health === "OK").length,
    BROKEN: allTrailers.filter((t) => t.health === "BROKEN").length,
    UNVERIFIED: allTrailers.filter((t) => t.health === "UNVERIFIED").length,
  };

  return (
    <>
      <AdminPageHeader
        title="التريلرات"
        description="تضمين رسمي فقط (يوتيوب). أي رابط يُوسم «معطل» يختفي زر التشغيل ويظهر بدله إشعار واضح."
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-white/8 bg-ink-900/40 p-1 text-[0.7rem]">
        {[
          { value: "", label: `الكل (${counts.all})` },
          { value: "OK", label: `سليم (${counts.OK})` },
          { value: "UNVERIFIED", label: `لم يُفحص (${counts.UNVERIFIED})` },
          { value: "BROKEN", label: `معطل (${counts.BROKEN})` },
        ].map((tab) => {
          const active = (params.health ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/trailers${tab.value ? `?health=${tab.value}` : ""}`}
              className={`rounded-md px-3 py-1.5 ${active ? "bg-white/10 text-ink-50" : "text-ink-400 hover:text-ink-100"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="القائمة" description={`${trailers.length} تريلرًا معروضًا`}>
          {trailers.length === 0 ? (
            <p className="py-8 text-center text-[0.72rem] text-ink-500">لا تريلرات مطابقة.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {trailers.map((trailer) => (
                <li key={trailer.id} className="py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {trailer.health === "BROKEN" ? (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-signal-amber" aria-label="رابط معطل" />
                    ) : trailer.health === "OK" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-signal-teal" aria-label="رابط سليم" />
                    ) : (
                      <HelpCircle className="h-3.5 w-3.5 shrink-0 text-ink-500" aria-label="لم يُفحص" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.76rem] text-ink-100">{trailer.nameAr}</p>
                      <p className="truncate text-[0.6rem] text-ink-500">
                        {trailer.titleAr} · {TRAILER_KIND_LABEL[trailer.kind]} ·{" "}
                        <span dir="ltr">{trailer.youtubeId}</span>
                      </p>
                    </div>
                    <TrailerPrimaryButton id={trailer.id} titleId={trailer.titleId} isPrimary={trailer.isPrimary} />
                    <Link href={`/admin/trailers?edit=${trailer.id}`} className="text-[0.6rem] text-ink-300 underline hover:text-brass-200">
                      تعديل
                    </Link>
                    <TrailerDeleteButton id={trailer.id} nameAr={trailer.nameAr} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 ps-5">
                    <TrailerHealthControls id={trailer.id} health={trailer.health} />
                    <span className="text-[0.58rem] text-ink-600">{trailer.lastCheckedAt ? `فُحص ${formatDate(trailer.lastCheckedAt)}` : "لم يُفحص بعد"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title={editing ? "تعديل التريلر" : "إضافة تريلر"}>
          <TrailerForm
            key={editing?.id ?? "new"}
            titles={titles}
            values={
              editing
                ? {
                    id: editing.id,
                    titleId: editing.titleId,
                    youtubeId: editing.youtubeId,
                    nameAr: editing.nameAr,
                    kind: editing.kind,
                    language: "ar",
                    isPrimary: editing.isPrimary,
                  }
                : { titleId: params.titleId ?? "", youtubeId: "", nameAr: "", kind: "OFFICIAL", language: "ar", isPrimary: false }
            }
          />
        </AdminCard>
      </div>
    </>
  );
}
