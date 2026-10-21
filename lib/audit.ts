import { getDb, schema } from "@/db";
import { desc, eq, sql } from "drizzle-orm";

export type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
};

/**
 * سجل عمليات دائم. لا يُسمح بحذفه من واجهة المحرر العادي،
 * ولا يوجد أي إجراء في اللوحة يحذف سجلاته.
 */
export async function logAudit(input: AuditInput) {
  try {
    const db = await getDb();
    await db.insert(schema.auditLogs).values({
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      details: input.details ?? null,
      ip: input.ip ?? null,
    });
  } catch (error) {
    // فشل التسجيل لا يجب أن يُسقط العملية الأصلية، لكنه يُحفظ في سجل الخادم.
    console.error("[loomix:audit]", error);
  }
}

export async function recentAudit(limit = 20) {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.auditLogs.id,
      action: schema.auditLogs.action,
      entity: schema.auditLogs.entity,
      entityId: schema.auditLogs.entityId,
      details: schema.auditLogs.details,
      createdAt: schema.auditLogs.createdAt,
      userName: schema.users.name,
      userRole: schema.users.role,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit);
  return rows;
}

export async function auditCount() {
  const db = await getDb();
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.auditLogs);
  return row?.count ?? 0;
}
