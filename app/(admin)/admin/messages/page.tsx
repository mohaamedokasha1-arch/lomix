import Link from "next/link";
import { Mail, ShieldAlert } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { MessageActions } from "@/components/admin/message-actions";
import { getMessagesAdmin } from "@/lib/admin-queries";
import { MESSAGE_STATUS_LABEL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  CONTACT: "تواصل",
  DMCA: "إشعار حقوق",
};

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const messages = await getMessagesAdmin(params.status);
  const newCount = messages.filter((message) => message.status === "NEW").length;

  return (
    <>
      <AdminPageHeader
        title="الرسائل والبلاغات"
        description="صندوق موحّد للتواصل وإشعارات حقوق الملكية (DMCA). الأولوية لإشعارات الحقوق."
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-white/8 bg-ink-900/40 p-1 text-[0.7rem]">
        {[
          { value: "", label: "الكل" },
          { value: "NEW", label: "جديد" },
          { value: "IN_PROGRESS", label: "قيد المعالجة" },
          { value: "RESOLVED", label: "مغلق" },
        ].map((tab) => {
          const active = (params.status ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/messages${tab.value ? `?status=${tab.value}` : ""}`}
              className={`rounded-md px-3 py-1.5 ${active ? "bg-white/10 text-ink-50" : "text-ink-400 hover:text-ink-100"}`}
            >
              {tab.label}
              {tab.value === "NEW" && newCount > 0 && <span className="num ms-1 text-signal-teal">{newCount}</span>}
            </Link>
          );
        })}
      </div>

      {messages.length === 0 ? (
        <AdminCard>
          <p className="py-12 text-center text-[0.72rem] text-ink-500">لا رسائل في هذا التصنيف.</p>
        </AdminCard>
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => {
            const isDmca = message.kind === "DMCA";
            return (
              <li key={message.id} className={`rounded-xl border p-3.5 ${isDmca ? "border-signal-red/25 bg-signal-red/[0.04]" : "border-white/8 bg-ink-900/50"}`}>
                <div className="flex flex-wrap items-start gap-2">
                  {isDmca ? <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-signal-red" /> : <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8rem] font-medium text-ink-100">{message.subject ?? "(بدون عنوان)"}</p>
                    <p className="mt-0.5 text-[0.6rem] text-ink-500">
                      {KIND_LABEL[message.kind] ?? message.kind} · {message.name} ·{" "}
                      <span dir="ltr">{message.email}</span> · {formatDate(message.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.58rem] ${
                      message.status === "NEW"
                        ? "bg-signal-teal/12 text-signal-teal"
                        : message.status === "IN_PROGRESS"
                          ? "bg-signal-amber/12 text-signal-amber"
                          : "bg-white/8 text-ink-500"
                    }`}
                  >
                    {MESSAGE_STATUS_LABEL[message.status] ?? message.status}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-ink-950/50 p-2.5 text-[0.72rem] leading-6 text-ink-300">
                  {message.message}
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <MessageActions id={message.id} status={message.status} />
                  <a href={`mailto:${message.email}?subject=${encodeURIComponent(`رد Loomix: ${message.subject ?? ""}`)}`} className="text-[0.62rem] text-brass-200 underline">
                    رد عبر البريد
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
