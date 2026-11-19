import "server-only";
import { getDb, schema } from "@/db";

/**
 * Records one admin mutation. Store *what* happened, never the data itself
 * (lead messages and notes may contain health information).
 */
export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string | number,
) {
  await getDb()
    .insert(schema.auditLog)
    .values({ userId, action, entity, entityId: entityId == null ? null : String(entityId) });
}
