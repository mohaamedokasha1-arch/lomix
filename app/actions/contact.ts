"use server";

import { headers } from "next/headers";
import { getDb, schema } from "@/db";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitMessageAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const kind = formData.get("kind") === "DMCA" ? "DMCA" : "CONTACT";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? ""); // حقل مصيدة للبوتات

  if (website) return { ok: true }; // لا نخبر البوت بأنه اكتُشف

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > 80) fieldErrors.name = "أدخل اسمًا صحيحًا (2–80 حرفًا).";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "أدخل بريدًا إلكترونيًا صحيحًا.";
  if (subject.length < 4 || subject.length > 140) fieldErrors.subject = "الموضوع بين 4 و140 حرفًا.";
  if (message.length < 20 || message.length > 4000) fieldErrors.message = "الرسالة بين 20 و4000 حرف.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limit = await rateLimit(`contact:${ip}`, 5, 60 * 60);
  if (!limit.ok) return { error: "تم إرسال رسائل كثيرة من هذا الجهاز. حاول بعد قليل." };

  const db = await getDb();
  const [row] = await db
    .insert(schema.contactMessages)
    .values({ kind, name, email, subject, message, ip })
    .returning({ id: schema.contactMessages.id });

  await logAudit({
    action: kind === "DMCA" ? "DMCA_RECEIVED" : "CONTACT_RECEIVED",
    entity: "message",
    entityId: row.id,
    ip,
  });

  return { ok: true };
}
