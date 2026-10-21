"use client";

import { useActionState } from "react";
import { Field, FormBanner, SubmitButton, TextInput } from "@/components/admin/form";
import { setUserPasswordAction } from "@/app/actions/admin-system";
import type { SysState } from "@/app/actions/admin-system";

/**
 * نموذج إعادة تعيين كلمة المرور — يعمل بـPOST أصلي أيضًا (useActionState),
 * فلا حاجة إلى JavaScript لإتمام العملية.
 */
export function PasswordResetForm({ id, email }: { id: string; email: string }) {
  const [state, formAction] = useActionState<SysState, FormData>(setUserPasswordAction, null);

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <FormBanner state={state} />
      <input type="hidden" name="id" value={id} />
      <Field label="كلمة المرور الجديدة" name="password" required hint="10 أحرف على الأقل — تُخزَّن مشفّرة bcrypt">
        <TextInput name="password" type="password" required minLength={10} dir="ltr" autoComplete="new-password" />
      </Field>
      <Field label="تأكيد كلمة المرور" name="confirm" required>
        <TextInput name="confirm" type="password" required minLength={10} dir="ltr" autoComplete="new-password" />
      </Field>
      <p className="text-[0.62rem] leading-5 text-ink-500">
        سيُنهى كل جلسات <span dir="ltr">{email}</span> بعد الحفظ، ويحتاج صاحبها إلى الدخول بكلمة المرور الجديدة.
      </p>
      <SubmitButton>تعيين كلمة المرور</SubmitButton>
    </form>
  );
}
