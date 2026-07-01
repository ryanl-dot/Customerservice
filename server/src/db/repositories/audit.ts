import { getPrisma } from '../client';

export interface AuditRow {
  eventType: string;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  result?: string;
  correlationId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function insertAuditEvent(row: AuditRow): Promise<void> {
  await getPrisma().auditEvent.create({
    data: {
      eventType: row.eventType,
      actorUserId: row.actorUserId ?? null,
      targetType: row.targetType ?? null,
      targetId: row.targetId ?? null,
      result: row.result ?? 'success',
      correlationId: row.correlationId ?? null,
      metadata: (row.metadata ?? undefined) as object | undefined,
    },
  });
}
