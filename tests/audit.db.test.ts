import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { HAS_DB } from './helpers/testDb';
import { getPrisma, disconnectPrisma } from '../server/src/db/client';
import { insertAuditEvent } from '../server/src/db/repositories/audit';
import { emailAuditId } from '../server/src/lib/audit';

process.env.USER_STORE = 'db';

describe('Audit — no PII/secrets in identifiers', () => {
  it('emailAuditId hashes the address and never contains the raw email', () => {
    const id = emailAuditId('User@Example.com');
    expect(id.startsWith('emailhash:')).toBe(true);
    expect(id.toLowerCase()).not.toContain('user@example.com');
  });
});

describe.skipIf(!HAS_DB)('Persistent audit events', () => {
  beforeEach(async () => { await getPrisma().auditEvent.deleteMany({}); });
  afterAll(async () => { await getPrisma().auditEvent.deleteMany({}); await disconnectPrisma(); });

  it('persists a structured audit row', async () => {
    await insertAuditEvent({
      eventType: 'login', actorUserId: 'u-1', result: 'success',
      correlationId: 'req-123', metadata: { ipHash: 'abc123' },
    });
    const rows = await getPrisma().auditEvent.findMany({ where: { eventType: 'login' } });
    expect(rows).toHaveLength(1);
    expect(rows[0].actorUserId).toBe('u-1');
    expect(rows[0].correlationId).toBe('req-123');
    // Never store secrets — the row must not contain a password/token/cookie field.
    const serialized = JSON.stringify(rows[0]);
    expect(serialized).not.toMatch(/password|passwordHash|csrf|cookie|secret/i);
  });

  it('records denied results for unauthorized events', async () => {
    await insertAuditEvent({ eventType: 'unauthorized_route', actorUserId: 'u-2', targetType: 'page', targetId: 'kpi', result: 'denied' });
    const rows = await getPrisma().auditEvent.findMany({ where: { eventType: 'unauthorized_route' } });
    expect(rows[0].result).toBe('denied');
    expect(rows[0].targetId).toBe('kpi');
  });
});
