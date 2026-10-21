import { deletePersonAction } from "@/app/actions/admin";
import { RowActionForm, RowSubmit } from "./row-action-form";

/** حذف شخص — يعمل بلا JavaScript، مع تحذير عدد الأعمال المرتبطة. */
export function PersonDeleteButton({ id, nameAr, creditCount }: { id: string; nameAr: string; creditCount: number }) {
  const message = creditCount
    ? `«${nameAr}» مرتبط بـ${creditCount} عملًا. سيُحذف من طاقم كل هذه الأعمال. المتابعة؟`
    : `حذف «${nameAr}»؟`;

  return (
    <RowActionForm action={deletePersonAction} fields={{ id }} confirm={message}>
      <RowSubmit variant="icon" ariaLabel={`حذف ${nameAr}`} />
    </RowActionForm>
  );
}
