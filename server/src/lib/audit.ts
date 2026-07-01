import type { Request } from 'express';
import { userStore, isProduction } from './config';
import { hashMeta } from './sessions';
import { insertAuditEvent } from '../db/repositories/audit';

// Persistent audit logging. Events are written to the audit_events table when the DB
// store is active, and always emitted as a structured console line for log drains.
// STRICTLY excludes passwords, hashes, tokens, session cookies, CSRF tokens, API
// keys, full request bodies, and raw PII. Emails/IPs are stored only as hashes.

export type AuditEventType =
  // implemented now
  | 'login' | 'login_failed' | 'logout' | 'session_revoked' | 'unauthorized_route'
  | 'user_created' | 'user_disabled' | 'role_changed' | 'password_changed'
  | 'admin_created' | 'config_change'
  // reserved for future data-write events
  | 'customer_viewed' | 'customer_changed' | 'ticket_changed' | 'truck_roll_changed'
  | 'rma_changed' | 'reimbursement_changed' | 'export_performed';

export interface AuditContext {
  actorId?: string;
  targetType?: string;
  targetId?: string;
  result?: 'success' | 'denied' | 'error';
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

function dbActive(): boolean {
  return isProduction() || userStore() === 'db';
}

export function audit(event: AuditEventType, ctx: AuditContext = {}): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    actorId: ctx.actorId ?? null,
    targetType: ctx.targetType ?? null,
    targetId: ctx.targetId ?? null,
    result: ctx.result ?? 'success',
    correlationId: ctx.correlationId ?? null,
    metadata: ctx.metadata ?? null,
  };
  // Structured line for log aggregation (safe fields only).
  console.log(`[audit] ${JSON.stringify(entry)}`);
  // Persist (fire-and-forget; never blocks the request, never throws to the caller).
  if (dbActive()) {
    void insertAuditEvent({
      eventType: event,
      actorUserId: ctx.actorId ?? null,
      targetType: ctx.targetType ?? null,
      targetId: ctx.targetId ?? null,
      result: ctx.result ?? 'success',
      correlationId: ctx.correlationId ?? null,
      metadata: ctx.metadata ?? null,
    }).catch(err => console.error(`[audit] persist failed: ${err instanceof Error ? err.name : 'error'}`));
  }
}

// Build audit context from a request: correlation id + hashed IP (never raw).
export function reqAudit(req: Request, event: AuditEventType, ctx: AuditContext = {}): void {
  audit(event, {
    ...ctx,
    correlationId: ctx.correlationId ?? req.requestId,
    metadata: { ...(ctx.metadata ?? {}), ipHash: hashMeta(req.ip) },
  });
}

// Hash an email for audit targets so the raw address is never stored.
export function emailAuditId(email: string): string {
  return `emailhash:${hashMeta(email.trim().toLowerCase()) ?? 'na'}`;
}
