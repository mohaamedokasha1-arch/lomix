import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { BackupPanel } from "@/components/admin/backup-panel";
import { listBackupsAction } from "@/app/actions/admin-system";

export const dynamic = "force-dynamic";

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminBackupPage() {
  const backups = await listBackupsAction();

  return (
    <>
      <AdminPageHeader
        title="النسخ الاحتياطي والاستعادة"
        description="نسخة JSON كاملة من بيانات المحتوى والإعدادات. ملفات الصور نفسها لا تُضمَّن: تُنسخ منفصلة من مجلد التخزين (public/uploads محليًا أو مخزن Blob في الإنتاج)."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="إنشاء واستعادة">
          <BackupPanel />
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title="النسخ على الخادم" description={`${backups.length} ملفًا في /backups`}>
            {backups.length === 0 ? (
              <p className="py-4 text-center text-[0.68rem] text-ink-500">لا نسخ محلية بعد.</p>
            ) : (
              <ul className="space-y-1.5">
                {backups.map((backup) => (
                  <li key={backup.filename} className="rounded-md border border-white/8 px-2 py-1.5">
                    <p className="truncate text-[0.6rem] text-ink-300" dir="ltr">
                      {backup.filename}
                    </p>
                    <p className="num mt-0.5 text-[0.55rem] text-ink-500">{sizeLabel(backup.size)}</p>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="قيود مهمة">
            <ul className="space-y-2 text-[0.62rem] leading-5 text-ink-400">
              <li>• على Vercel نظام الملفات مؤقت: النسخة المحلية تختفي بعد إعادة النشر. استخدم «تنزيل JSON» أو خزّنها في تخزين كائنات.</li>
              <li>• الاستعادة لا تعيد ملفات الصور المرفوعة، فقط مساراتها.</li>
              <li>• سجل العمليات نفسه يُستعاد ضمن النسخة — لا يمكن التلاعب به عبر الاستعادة لأنه يُسجَّل بعدها بعملية جديدة.</li>
              <li>• كلمات المرور تُستعاد كتجزئات bcrypt، لا كنص صريح.</li>
            </ul>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
