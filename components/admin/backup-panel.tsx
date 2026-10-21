"use client";

import { useActionState, useState, useTransition } from "react";
import { DatabaseBackup, Download, Loader2, Upload } from "lucide-react";
import { FormBanner } from "@/components/admin/form";
import { backupDownloadDataAction, createBackupAction, restoreBackupAction, type SysState } from "@/app/actions/admin-system";

export function BackupPanel() {
  const [state, formAction] = useActionState<SysState, FormData>(restoreBackupAction, null);
  const [creating, startCreating] = useTransition();
  const [createResult, setCreateResult] = useState<{ ok?: boolean; error?: string; message?: string } | null>(null);

  const create = () => {
    startCreating(() => {
      void createBackupAction().then((result) => {
        setCreateResult(result ?? null);
        if (result?.ok) window.location.reload();
      });
    });
  };

  const download = () => {
    startCreating(() => {
      void backupDownloadDataAction().then((result) => {
        if (!result.json) {
          setCreateResult({ error: result.error ?? "تعذّر توليد الملف." });
          return;
        }
        const blob = new Blob([result.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `loomix-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      });
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ember-400 px-3.5 text-xs font-bold text-[#171006] hover:bg-ember-300 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DatabaseBackup className="h-3.5 w-3.5" />}
          إنشاء نسخة على الخادم
        </button>
        <button
          type="button"
          onClick={download}
          disabled={creating}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3.5 text-xs text-ink-100 hover:border-white/30 disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" /> تنزيل JSON
        </button>
      </div>

      {(createResult?.error || createResult?.message) && (
        <p className={`rounded-lg px-3 py-2 text-[0.68rem] ${createResult.error ? "bg-signal-red/10 text-signal-red" : "bg-signal-green/10 text-signal-green"}`}>
          {createResult.error ?? createResult.message}
        </p>
      )}

      <form action={formAction} className="space-y-3 rounded-lg border border-signal-red/20 bg-signal-red/[0.04] p-3.5">
        <h3 className="text-[0.78rem] font-semibold text-ink-100">استعادة نسخة</h3>
        <p className="text-[0.62rem] leading-5 text-signal-red/90">
          الاستعادة تستبدل كل البيانات الحالية. تُنفَّذ داخل معاملة واحدة: إن فشل أي جدول يُلغى كل شيء. خذ نسخة قبل المتابعة.
        </p>
        <FormBanner state={state} />
        <label className="block text-[0.62rem] text-ink-400" htmlFor="restore-file">
          ملف النسخة الاحتياطية (JSON)
        </label>
        <input
          id="restore-file"
          type="file"
          name="file"
          accept="application/json,.json"
          required
          className="block w-full text-[0.68rem] text-ink-300 file:me-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2.5 file:py-1.5 file:text-[0.64rem] file:text-ink-100"
        />
        <label className="block text-[0.62rem] text-ink-400" htmlFor="restore-confirm">
          للتأكيد اكتب <span dir="ltr" className="font-bold text-signal-red">RESTORE</span>
        </label>
        <input
          id="restore-confirm"
          name="confirm"
          required
          className="field h-8 text-[0.7rem]"
          placeholder="RESTORE"
          dir="ltr"
          autoComplete="off"
        />
        <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 text-[0.68rem] text-signal-red hover:bg-signal-red/20">
          <Upload className="h-3 w-3" /> تنفيذ الاستعادة
        </button>
      </form>
    </div>
  );
}
