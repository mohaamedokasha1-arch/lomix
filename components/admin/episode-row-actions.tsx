import { deleteEpisodeAction } from "@/app/actions/admin";
import { RowActionForm, RowSubmit } from "./row-action-form";

/** حذف حلقة من صفّها — يعمل بلا JavaScript. */
export function EpisodeRowActions({ id, titleId, label }: { id: string; titleId: string; label: string }) {
  return (
    <RowActionForm
      action={deleteEpisodeAction}
      fields={{ id, titleId }}
      confirm={`حذف «${label}»؟ لا يمكن التراجع.`}
    >
      <RowSubmit variant="icon" ariaLabel={`حذف ${label}`} />
    </RowActionForm>
  );
}
