"use client";

import { useActionState } from "react";
import { Field, FormBanner, Select, SubmitButton, TextInput } from "@/components/admin/form";
import { createUserAction } from "@/app/actions/admin-system";
import type { SysState } from "@/app/actions/admin-system";

export function UserForm() {
  const [state, formAction] = useActionState<SysState, FormData>(createUserAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <FormBanner state={state} />
      <Field label="الاسم" required>
        <TextInput name="name" required maxLength={80} />
      </Field>
      <Field label="البريد الإلكتروني" required>
        <TextInput name="email" type="email" required dir="ltr" />
      </Field>
      <Field label="الدور" required>
        <Select name="role" defaultValue="EDITOR">
          <option value="EDITOR">محرر — إدارة المحتوى</option>
          <option value="ADMIN">مدير — كل الصلاحيات</option>
          <option value="VIEWER">مشاهد — لوحة القراءة فقط (لا يصل للوحة)</option>
        </Select>
      </Field>
      <Field label="كلمة المرور" required hint="8 أحرف على الأقل — تُخزَّن مشفّرة bcrypt">
        <TextInput name="password" type="password" required minLength={8} dir="ltr" autoComplete="new-password" />
      </Field>
      <SubmitButton>إنشاء الحساب</SubmitButton>
    </form>
  );
}
