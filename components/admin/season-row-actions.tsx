import { deleteSeasonAction } from "@/app/actions/admin";
import { RowActionForm, RowSubmit } from "./row-action-form";

/**
 * حذف موسم من صفّه — يعمل بلا JavaScript.
 * التأكيد يظهر عند توفّر JS فقط؛ وبدونه يُنفَّذ الحذف مباشرة بعد زر صريح.
 */
export function SeasonRowActions({ id, titleId, label, episodeCount }: { id: string; titleId: string; label: string; episodeCount: number }) {
  const message = episodeCount
    ? `حذف «${label}» و${episodeCount} حلقة مرتبطة به؟ لا يمكن التراجع.`
    : `حذف «${label}»؟ لا يمكن التراجع.`;

  return (
    <RowActionForm action={deleteSeasonAction} fields={{ id, titleId }} confirm={message}>
      <RowSubmit variant="icon" ariaLabel={`حذف ${label}`} />
    </RowActionForm>
  );
}
