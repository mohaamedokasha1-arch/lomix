"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Play } from "lucide-react";
import { FormBanner, SubmitButton, TextArea } from "@/components/admin/form";
import { commitImportChunkAction, previewImportAction, type ImportPreview, type SysState } from "@/app/actions/admin-system";

type Progress = { processed: number; total: number; succeeded: number; failed: number; done: boolean; errors: string[] };

export function ImportWizard() {
  const [state, formAction] = useActionState<SysState, FormData>(previewImportAction, null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const preview = (state?.data as ImportPreview | undefined) ?? null;

  const runImport = async () => {
    if (!preview?.jobId) return;
    setRunning(true);
    setRunError(null);
    let done = false;
    let guard = 0;
    try {
      while (!done && guard < 60) {
        guard += 1;
        const result = await commitImportChunkAction(preview.jobId);
        if (!result.ok || !result.progress) {
          setRunError(result.error ?? "تعذّر إكمال الاستيراد.");
          break;
        }
        setProgress(result.progress);
        done = result.progress.done;
      }
    } catch (error) {
      setRunError((error as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3 rounded-xl border border-white/8 bg-ink-900/50 p-4">
        <FormBanner state={state} />

        <div>
          <label htmlFor="import-file" className="mb-1.5 block text-[0.72rem] font-medium text-ink-200">
            ملف CSV أو JSON
          </label>
          <input
            id="import-file"
            type="file"
            name="file"
            accept=".csv,text/csv,.json,application/json"
            className="block w-full text-[0.7rem] text-ink-300 file:me-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2.5 file:py-1.5 file:text-[0.66rem] file:text-ink-100"
          />
          <p className="mt-1 text-[0.6rem] text-ink-500">حتى 2MB — يُعالَج أول 500 صف في الدفعة.</p>
        </div>

        <div>
          <label htmlFor="import-text" className="mb-1.5 block text-[0.72rem] font-medium text-ink-200">
            أو الصق البيانات
          </label>
          <TextArea
            id="import-text"
            name="text"
            rows={6}
            dir="ltr"
            className="font-mono text-[0.66rem]"
            placeholder={"titleAr,titleEn,type,year,overview,genres,country,language,rating,ratingSource\nفيلم تجريبي,Demo Film,MOVIE,2024,وصف كامل للعمل هنا…,دراما، إثارة,EG,ar,,"}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>
            <FileSpreadsheet className="h-3.5 w-3.5" /> تحليل الملف
          </SubmitButton>
          <span className="text-[0.6rem] text-ink-500">لن تُضاف أي بيانات قبل مراجعة التقرير والضغط على «بدء الاستيراد».</span>
        </div>
      </form>

      {preview && (
        <section className="rounded-xl border border-white/8 bg-ink-900/50">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-100">تقرير التحليل</h2>
              <p className="mt-0.5 text-[0.62rem] text-ink-500">
                <span className="num">{preview.validCount}</span> صفًا صالحًا ·{" "}
                <span className={`num ${preview.invalidCount ? "text-signal-amber" : ""}`}>{preview.invalidCount}</span> صفًا به أخطاء
              </p>
            </div>
            <button
              type="button"
              onClick={runImport}
              disabled={running || preview.validCount === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ember-400 px-3 text-[0.68rem] font-bold text-[#171006] hover:bg-ember-300 disabled:opacity-40"
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              بدء الاستيراد
            </button>
          </div>

          {progress && (
            <div className="border-b border-white/6 px-4 py-3">
              <div className="mb-1.5 flex items-center justify-between text-[0.62rem] text-ink-400">
                <span>
                  <span className="num">{progress.processed}</span> / <span className="num">{progress.total}</span> صفًا
                </span>
                <span className="num">
                  ✓ {progress.succeeded} · ✕ {progress.failed}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full bg-ember-400 transition-all" style={{ width: `${(progress.processed / Math.max(1, progress.total)) * 100}%` }} />
              </div>
              {progress.done && (
                <p className="mt-2 flex items-center gap-1 text-[0.65rem] text-signal-green">
                  <CheckCircle2 className="h-3 w-3" /> اكتملت الدفعة. أضيف <span className="num">{progress.succeeded}</span> عملًا كمسودات.
                </p>
              )}
            </div>
          )}

          {runError && (
            <p role="alert" className="mx-4 mt-3 rounded-md bg-signal-red/10 p-2 text-[0.65rem] text-signal-red">
              {runError}
            </p>
          )}

          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[620px] text-[0.66rem]">
              <thead className="sticky top-0 bg-ink-900">
                <tr className="border-b border-white/8 text-[0.58rem] text-ink-500">
                  <th className="px-3 py-2 text-start font-medium">سطر</th>
                  <th className="px-3 py-2 text-start font-medium">العمل</th>
                  <th className="px-3 py-2 text-start font-medium">النوع</th>
                  <th className="px-3 py-2 text-start font-medium">السنة</th>
                  <th className="px-3 py-2 text-start font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.line} className="border-b border-white/5 align-top last:border-0">
                    <td className="num px-3 py-1.5 text-ink-500">{row.line}</td>
                    <td className="px-3 py-1.5">
                      <p className="text-ink-200">{row.data.titleAr || "—"}</p>
                      {row.data.titleEn && (
                        <p className="text-[0.55rem] text-ink-500" dir="ltr">
                          {row.data.titleEn}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-ink-400">{row.data.type ?? "—"}</td>
                    <td className="num px-3 py-1.5 text-ink-400">{row.data.year ?? "—"}</td>
                    <td className="px-3 py-1.5">
                      {row.errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[0.6rem] text-signal-green">
                          <CheckCircle2 className="h-3 w-3" /> صالح
                        </span>
                      ) : (
                        <span className="flex items-start gap-1 text-[0.6rem] text-signal-amber">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{row.errors.join(" · ")}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
