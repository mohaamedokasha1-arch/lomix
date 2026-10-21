"use client";

import { deleteUserAction, setUserRoleAction, toggleUserActiveAction } from "@/app/actions/admin-system";
import { RowActionForm, RowSubmit } from "./row-action-form";

const ROLES = [
  { value: "ADMIN", label: "مدير" },
  { value: "EDITOR", label: "محرر" },
  { value: "VIEWER", label: "مشاهد" },
];

/**
 * إجراءات المستخدم — كلها نماذج خادم حقيقية تعمل بلا JavaScript.
 * تغيير الدور يُرسَل تلقائيًا عند توفّر JS، وله زر «تطبيق» ظاهر لمن يعمل بلا سكربتات.
 */
export function UserRowActions({
  id,
  role,
  isActive,
  name,
  isSelf,
}: {
  id: string;
  role: string;
  isActive: boolean;
  name: string;
  isSelf: boolean;
}) {
  if (isSelf) {
    return <span className="text-[0.58rem] text-ink-500">لا يمكنك تعديل حسابك من هنا</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <form action={setUserRoleAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={id} />
        <select
          name="role"
          defaultValue={role}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="h-6 rounded border border-white/12 bg-ink-900 px-1 text-[0.58rem] text-ink-200"
          aria-label={`دور ${name}`}
        >
          {ROLES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <RowSubmit variant="chip" label="تطبيق" ariaLabel={`تطبيق دور ${name}`} />
      </form>

      <form action={toggleUserActiveAction}>
        <input type="hidden" name="id" value={id} />
        <RowSubmit variant="chip" label={isActive ? "إيقاف" : "تفعيل"} ariaLabel={`${isActive ? "إيقاف" : "تفعيل"} ${name}`} />
      </form>

      <RowActionForm action={deleteUserAction} fields={{ id }} confirm={`حذف حساب «${name}» وكل جلساته؟`}>
        <RowSubmit variant="icon" ariaLabel={`حذف ${name}`} />
      </RowActionForm>
    </div>
  );
}
