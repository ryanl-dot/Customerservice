// Integration-ready audit logging. In production, ship these structured events to a
// durable, tamper-evident sink (e.g. CloudWatch, Datadog, a SIEM). NEVER log
// passwords, tokens, session cookies, or full customer records — only identifiers
// and the action taken.

export type AuditEvent =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'unauthorized_route'
  | 'role_change'
  | 'customer_record_access'
  | 'export'
  | 'data_modification'
  | 'ticket_status_change'
  | 'reimbursement_update'
  | 'admin_config_change';

export interface AuditContext {
  actorId?: string;
  role?: string;
  target?: string;      // resource id, e.g. "case:C-1001" — NOT customer PII
  outcome?: 'success' | 'denied' | 'error';
  ip?: string;
  detail?: string;      // short, non-sensitive
}

export function audit(event: AuditEvent, ctx: AuditContext = {}): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    actorId: ctx.actorId ?? 'anonymous',
    role: ctx.role ?? 'none',
    target: ctx.target,
    outcome: ctx.outcome ?? 'success',
    ip: ctx.ip,
    detail: ctx.detail,
  };
  // Single structured line — easy to forward to a log aggregator.
  console.log(`[audit] ${JSON.stringify(entry)}`);
}
