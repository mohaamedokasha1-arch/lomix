import { setMessageStatusAction } from "@/app/actions/admin-system";
import { RowActionForm, RowSubmit } from "./row-action-form";

const OPTIONS = [
  { value: "NEW", label: "جديد" },
  { value: "IN_PROGRESS", label: "قيد المعالجة" },
  { value: "RESOLVED", label: "مغلق" },
];

/** تغيير حالة الرسالة — نماذج خادم تعمل بلا JavaScript. */
export function MessageActions({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {OPTIONS.filter((option) => option.value !== status).map((option) => (
        <RowActionForm key={option.value} action={setMessageStatusAction} fields={{ id, status: option.value }}>
          <RowSubmit variant="chip" label={option.label} ariaLabel={`تعيين الحالة: ${option.label}`} />
        </RowActionForm>
      ))}
    </div>
  );
}
