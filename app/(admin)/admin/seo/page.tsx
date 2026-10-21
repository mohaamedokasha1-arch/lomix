import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { SeoSettingsForm } from "@/components/admin/seo-settings-form";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const settings = await getAllSettings();

  return (
    <>
      <AdminPageHeader
        title="إعدادات SEO"
        description="قوالب العناوين والأوصاف، والتحكم في الفهرسة. كل ما يظهر في نتائج البحث يجب أن يكون من بيانات حقيقية."
        actions={
          <>
            <Link href="/sitemap.xml" target="_blank" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
              sitemap.xml
            </Link>
            <Link href="/robots.txt" target="_blank" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
              robots.txt
            </Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AdminCard title="القوالب والفهرسة">
          <SeoSettingsForm settings={settings} />
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title="ما يفعله النظام تلقائيًا">
            <ul className="space-y-2 text-[0.66rem] leading-5 text-ink-400">
              <li>• عنوان ووصف فريد لكل عمل، مع canonical ثابت.</li>
              <li>• sitemap ديناميكي يشمل الأعمال المنشورة فقط.</li>
              <li>• robots.txt يمنع /admin و/api و/search و/watchlist و/profile.</li>
              <li>• Schema.org يُبنى من الحقول الفعلية: الاسم، السنة، التقييم عند وجود مصدر، المخرجون، التصنيفات.</li>
              <li>• روابط OG وTwitter تُولَّد من البوستر/الخلفية الفعليين.</li>
              <li>• المسودات لا تدخل sitemap ولا تُفهرس.</li>
            </ul>
          </AdminCard>

          <AdminCard title="تنبيه">
            <p className="text-[0.66rem] leading-6 text-ink-400">
              لا تُضِف كلمات مفتاحية مكرّرة أو نصًا مخفيًا. الصفحات التي لا تحتوي بيانات كافية (مثل عمل بلا وصف) تبقى
              مسودة حتى تكتمل، لأن الصفحات الفقيرة تضرّ الفهرسة أكثر مما تنفع.
            </p>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
