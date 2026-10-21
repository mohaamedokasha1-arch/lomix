"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAction, setUserRoleAction, toggleUserActiveAction } from "@/app/actions/admin-system";

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
  const [pending, startTransition] = useTransition();

  const run = (action: (formData: FormData) => Promise<void>) => (formData: FormData) => {
    startTransition(() => {
      void action(formData);
    });
  };

  if (isSelf) {
    return <span className="text-[0.58rem] text-ink-500">لا يمكنك تعديل حسابك من هنا</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <form action={run(setUserRoleAction)}>
        <input type="hidden" name="id" value={id} />
        <select
          name="role"
          defaultValue={role}
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (form) form.requestSubmit();
          }}
          className="h-6 rounded border border-white/12 bg-ink-900 px-1 text-[0.58rem] text-ink-200"
          aria-label={`دور ${name}`}
          disabled={pending}
        >
          <option value="ADMIN">مدير</option>
          <option value="EDITOR">محرر</option>
          <option value="VIEWER">مشاهد</option>
        </select>
      </form>

      <form action={run(toggleUserActiveAction)}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-white/12 px-1.5 py-0.5 text-[0.58rem] text-ink-300 hover:border-white/30 disabled:opacity-50"
        >
          {isActive ? "إيقاف" : "تفعيل"}
        </button>
      </form>

      <form
        action={(formData) => {
          if (!window.confirm(`حذف حساب «${name}» وكل جلساته؟`)) return;
          startTransition(() => {
            void deleteUserAction(formData);
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          aria-label={`حذف ${name}`}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-signal-red/10 hover:text-signal-red disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
