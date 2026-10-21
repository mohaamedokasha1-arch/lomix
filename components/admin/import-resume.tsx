"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Play } from "lucide-react";
import { commitImportChunkAction } from "@/app/actions/admin-system";

export function ImportResume({ jobId, processed, total }: { jobId: string; processed: number; total: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(processed);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    let position = current;
    let guard = 0;
    try {
      while (position < total && guard < 60) {
        guard += 1;
        const result = await commitImportChunkAction(jobId);
        if (!result.ok || !result.progress) {
          setError(result.error ?? "تعذّر إكمال المهمة.");
          break;
        }
        position = result.progress.processed;
        setCurrent(position);
        if (result.progress.done) break;
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[0.65rem] text-ink-400">
        <span>
          <span className="num">{current}</span> / <span className="num">{total}</span>
        </span>
        <span className="num">{Math.round((current / Math.max(1, total)) * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full bg-ember-400 transition-all" style={{ width: `${(current / Math.max(1, total)) * 100}%` }} />
      </div>
      <button
        type="button"
        onClick={run}
        disabled={running || current >= total}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ember-400 px-3 text-[0.68rem] font-bold text-[#171006] hover:bg-ember-300 disabled:opacity-40"
      >
        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        متابعة الدفعات المتبقية
      </button>
      {current >= total && !running && (
        <p className="flex items-center gap-1 text-[0.62rem] text-signal-teal">
          <CheckCircle2 className="h-3 w-3" /> اكتملت المعالجة.
        </p>
      )}
      {error && <p className="text-[0.62rem] text-signal-red">{error}</p>}
    </div>
  );
}
